package service

import (
	crand "crypto/rand"
	"encoding/base64"
	"fmt"
	"math/big"
	"os"
	"strings"
	"time"

	"ares-ai-backend/internal/models"
	"ares-ai-backend/internal/repository"

	"github.com/golang-jwt/jwt/v5"

	"golang.org/x/crypto/bcrypt"
)

// UserService handles business logic for users
type UserService struct {
	repo         *repository.UserRepository
	emailService *EmailService
}

// NewUserService creates a new user service
func NewUserService(repo *repository.UserRepository, emailService *EmailService) *UserService {
	return &UserService{repo: repo, emailService: emailService}
}

// Register creates a new user account with role assignment (first user = admin)
func (s *UserService) Register(email, password, operatorName string) (*models.User, error) {
	// Validate input
	email = strings.TrimSpace(strings.ToLower(email))
	if email == "" {
		return nil, fmt.Errorf("email is required")
	}
	if len(password) < 6 {
		return nil, fmt.Errorf("password must be at least 6 characters")
	}
	if operatorName == "" {
		return nil, fmt.Errorf("operator name is required")
	}

	// Hash password using bcrypt
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return nil, fmt.Errorf("hash password: %w", err)
	}

	// Register user (transaction handles role assignment and usage creation)
	user, err := s.repo.RegisterUser(email, string(hashedPassword), operatorName)
	if err != nil {
		return nil, err
	}

	return user, nil
}

// Login authenticates a user and creates access/refresh tokens
func (s *UserService) Login(email, password, accessKey string) (*models.User, string, string, time.Time, error) {
	// Validate input
	email = strings.TrimSpace(strings.ToLower(email))
	if email == "" {
		return nil, "", "", time.Time{}, fmt.Errorf("email is required")
	}

	// Get user by email with roles
	user, err := s.repo.GetByEmail(email)
	if err != nil {
		return nil, "", "", time.Time{}, fmt.Errorf("invalid email or password")
	}

	if strings.TrimSpace(accessKey) != "" {
		if !user.IsTemp {
			return nil, "", "", time.Time{}, fmt.Errorf("invalid credentials")
		}
		if user.AccessKey == nil || *user.AccessKey != accessKey {
			return nil, "", "", time.Time{}, fmt.Errorf("invalid access key")
		}
		if user.ExpiresAt != nil && user.ExpiresAt.Before(time.Now()) {
			return nil, "", "", time.Time{}, fmt.Errorf("access key expired")
		}
	} else {
		if password == "" {
			return nil, "", "", time.Time{}, fmt.Errorf("password is required")
		}

		// Verify password using bcrypt
		if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(password)); err != nil {
			return nil, "", "", time.Time{}, fmt.Errorf("invalid email or password")
		}
	}

	accessToken, err := s.generateAccessToken(user)
	if err != nil {
		return nil, "", "", time.Time{}, fmt.Errorf("generate access token: %w", err)
	}

	refreshToken, err := s.generateRefreshToken()
	if err != nil {
		return nil, "", "", time.Time{}, fmt.Errorf("generate refresh token: %w", err)
	}

	refreshExpiry := time.Now().Add(7 * 24 * time.Hour)
	if err := s.repo.CreateRefreshToken(user.ID, refreshToken, refreshExpiry); err != nil {
		return nil, "", "", time.Time{}, fmt.Errorf("store refresh token: %w", err)
	}

	return user, accessToken, refreshToken, refreshExpiry, nil
}

// GenerateTempUser creates a temporary user account and emails credentials.
func (s *UserService) GenerateTempUser(operatorName, email string, expiresAt time.Time) (*models.User, string, error) {
	email = strings.TrimSpace(strings.ToLower(email))
	operatorName = strings.TrimSpace(operatorName)

	if email == "" {
		return nil, "", fmt.Errorf("email is required")
	}
	if operatorName == "" {
		return nil, "", fmt.Errorf("operator name is required")
	}

	accessKey, err := generateAccessKey()
	if err != nil {
		return nil, "", fmt.Errorf("generate access key: %w", err)
	}

	tempSecret, err := generateRandomToken(32)
	if err != nil {
		return nil, "", fmt.Errorf("generate temp password: %w", err)
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(tempSecret), bcrypt.DefaultCost)
	if err != nil {
		return nil, "", fmt.Errorf("hash temp password: %w", err)
	}

	user, err := s.repo.CreateTempUser(email, string(hashedPassword), operatorName, accessKey, expiresAt)
	if err != nil {
		return nil, "", err
	}

	if s.emailService != nil {
		if err := s.emailService.SendTempUserCredentials(email, operatorName, accessKey, expiresAt.Format(time.RFC3339)); err != nil {
			return nil, "", err
		}
	}

	return user, accessKey, nil
}

// GetUser retrieves a user by ID
func (s *UserService) GetUser(id uint) (*models.User, error) {
	user, err := s.repo.GetByID(id)
	if err != nil {
		return nil, fmt.Errorf("get user: %w", err)
	}
	return user, nil
}

// GetAllUsers retrieves all users
func (s *UserService) GetAllUsers() ([]models.User, error) {
	users, err := s.repo.GetAll()
	if err != nil {
		return nil, fmt.Errorf("get all users: %w", err)
	}
	return users, nil
}

// UpdateUser updates a user's information (email, subscription tier, and/or status)
func (s *UserService) UpdateUser(id uint, email *string, subscriptionTier *string, status *string) (*models.User, error) {
	// Validate email if provided
	if email != nil && *email != "" {
		*email = strings.TrimSpace(strings.ToLower(*email))
		// Check if email is already taken by another user
		existingUser, _ := s.repo.GetByEmail(*email)
		if existingUser != nil && existingUser.ID != id {
			return nil, fmt.Errorf("email already in use")
		}
	}

	user, err := s.repo.Update(id, email, subscriptionTier, status)
	if err != nil {
		return nil, fmt.Errorf("update user: %w", err)
	}

	return user, nil
}

// DeleteUser deletes a user by ID
func (s *UserService) DeleteUser(id uint) error {
	if err := s.repo.Delete(id); err != nil {
		return fmt.Errorf("delete user: %w", err)
	}
	return nil
}

// Logout ends a session by deleting the refresh token
func (s *UserService) Logout(refreshToken string) error {
	if strings.TrimSpace(refreshToken) == "" {
		return nil
	}

	if err := s.repo.DeleteRefreshToken(refreshToken); err != nil {
		return fmt.Errorf("logout: %w", err)
	}

	return nil
}

// Refresh validates a refresh token and generates a new access token with same payload
func (s *UserService) Refresh(refreshToken string) (string, error) {
	if strings.TrimSpace(refreshToken) == "" {
		return "", fmt.Errorf("refresh token is required")
	}

	// Get refresh token and user from database
	_, user, err := s.repo.GetRefreshToken(refreshToken)
	if err != nil {
		return "", err
	}

	// Generate new access token with same claims
	accessToken, err := s.generateAccessToken(user)
	if err != nil {
		return "", fmt.Errorf("generate access token: %w", err)
	}

	return accessToken, nil
}

// GetAllSessions retrieves all refresh-token sessions for admin inspection.
func (s *UserService) GetAllSessions() ([]models.RefreshToken, error) {
	tokens, err := s.repo.GetAllRefreshTokens()
	if err != nil {
		return nil, fmt.Errorf("get all sessions: %w", err)
	}

	return tokens, nil
}

// ClearExpiredSessions deletes all expired refresh-token sessions and returns deleted count.
func (s *UserService) ClearExpiredSessions() (int64, error) {
	deleted, err := s.repo.DeleteExpiredRefreshTokens()
	if err != nil {
		return 0, fmt.Errorf("clear expired sessions: %w", err)
	}

	return deleted, nil
}

func (s *UserService) generateAccessToken(user *models.User) (string, error) {
	role := "User"
	if len(user.Roles) > 0 && strings.TrimSpace(user.Roles[0].Name) != "" {
		role = user.Roles[0].Name
	}

	claims := jwt.MapClaims{
		"user_id": user.ID,
		"role":    role,
		"is_temp": user.IsTemp,
		"exp":     time.Now().Add(15 * time.Minute).Unix(),
		"iat":     time.Now().Unix(),
	}

	jwtSecret := os.Getenv("JWT_SECRET")
	if jwtSecret == "" {
		jwtSecret = "change-this-secret-in-production"
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	signed, err := token.SignedString([]byte(jwtSecret))
	if err != nil {
		return "", err
	}

	return signed, nil
}

func (s *UserService) generateRefreshToken() (string, error) {
	b := make([]byte, 32)
	if _, err := crand.Read(b); err != nil {
		return "", err
	}

	return base64.RawURLEncoding.EncodeToString(b), nil
}

func generateAccessKey() (string, error) {
	const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
	seg1, err := randomString(6, chars)
	if err != nil {
		return "", err
	}
	seg2, err := randomString(6, chars)
	if err != nil {
		return "", err
	}

	return fmt.Sprintf("ARES-%s-%s-ENT", seg1, seg2), nil
}

func randomString(n int, chars string) (string, error) {
	b := make([]byte, n)
	for i := range b {
		idx, err := crand.Int(crand.Reader, big.NewInt(int64(len(chars))))
		if err != nil {
			return "", err
		}
		b[i] = chars[idx.Int64()]
	}

	return string(b), nil
}

func generateRandomToken(byteLength int) (string, error) {
	b := make([]byte, byteLength)
	if _, err := crand.Read(b); err != nil {
		return "", err
	}

	return base64.RawURLEncoding.EncodeToString(b), nil
}
