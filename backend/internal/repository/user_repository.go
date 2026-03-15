package repository

import (
	"fmt"
	"strings"
	"time"

	"ares-ai-backend/internal/models"

	"gorm.io/gorm"
)

// UserRepository handles database operations for users
type UserRepository struct {
	db *gorm.DB
}

// NewUserRepository creates a new user repository
func NewUserRepository(db *gorm.DB) *UserRepository {
	return &UserRepository{db: db}
}

// RegisterUser creates a new user with role assignment and usage tracking in a transaction
func (r *UserRepository) RegisterUser(email string, passwordHash string, operatorName string) (*models.User, error) {
	var user *models.User

	// Check if email already exists before starting transaction
	var existingUser models.User
	if err := r.db.Where("email = ?", strings.ToLower(strings.TrimSpace(email))).First(&existingUser).Error; err == nil {
		return nil, fmt.Errorf("Email already registered")
	}

	// Start a transaction
	err := r.db.Transaction(func(tx *gorm.DB) error {
		// Step 1: Check if this is the first user
		var count int64
		if err := tx.Model(&models.User{}).Count(&count).Error; err != nil {
			return fmt.Errorf("count users: %w", err)
		}

		// Step 2: Create the user
		newUser := &models.User{
			Email:            strings.ToLower(strings.TrimSpace(email)),
			PasswordHash:     passwordHash,
			OperatorName:     operatorName,
			SubscriptionTier: "Free",
		}

		if err := tx.Create(newUser).Error; err != nil {
			return fmt.Errorf("create user: %w", err)
		}

		// Step 3: Assign role via junction table
		roleID := 2 // Default role for non-first users
		if count == 0 {
			roleID = 1 // First user gets Admin role
		}

		userRole := &models.UserRole{
			UserID: newUser.ID,
			RoleID: roleID,
		}

		if err := tx.Create(userRole).Error; err != nil {
			return fmt.Errorf("assign role: %w", err)
		}

		// Step 4: Create user usage tracking
		userUsage := &models.UserUsage{
			UserID:          newUser.ID,
			AuditsPerformed: 0,
			AuditLimit:      10,
		}

		if err := tx.Create(userUsage).Error; err != nil {
			return fmt.Errorf("create usage: %w", err)
		}

		user = newUser
		return nil
	})

	if err != nil {
		return nil, err
	}

	// Fetch the user with preloaded roles
	if err := r.db.Preload("Roles").First(user, "id = ?", user.ID).Error; err != nil {
		return nil, fmt.Errorf("fetch user with roles: %w", err)
	}

	return user, nil
}

// GetByID retrieves a user by ID with preloaded roles
func (r *UserRepository) GetByID(id uint) (*models.User, error) {
	var user models.User
	if err := r.db.Preload("Roles").First(&user, "id = ?", id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, fmt.Errorf("user not found")
		}
		return nil, fmt.Errorf("get user: %w", err)
	}
	return &user, nil
}

// GetByEmail retrieves a user by email with preloaded roles
func (r *UserRepository) GetByEmail(email string) (*models.User, error) {
	var user models.User
	if err := r.db.Preload("Roles").First(&user, "email = ?", strings.ToLower(strings.TrimSpace(email))).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, fmt.Errorf("user not found")
		}
		return nil, fmt.Errorf("get user by email: %w", err)
	}
	return &user, nil
}

// GetAll retrieves all users with preloaded roles
func (r *UserRepository) GetAll() ([]models.User, error) {
	var users []models.User
	if err := r.db.Preload("Roles").Find(&users).Error; err != nil {
		return nil, fmt.Errorf("get all users: %w", err)
	}
	return users, nil
}

// Update updates a user with email, subscription tier, and/or status
func (r *UserRepository) Update(id uint, email *string, subscriptionTier *string, status *string) (*models.User, error) {
	updates := map[string]interface{}{}
	if email != nil && *email != "" {
		updates["email"] = strings.ToLower(strings.TrimSpace(*email))
	}
	if subscriptionTier != nil && *subscriptionTier != "" {
		updates["subscription_tier"] = *subscriptionTier
	}
	if status != nil && *status != "" {
		updates["status"] = *status
	}

	if len(updates) == 0 {
		return r.GetByID(id)
	}

	if err := r.db.Model(&models.User{}).Where("id = ?", id).Updates(updates).Error; err != nil {
		return nil, fmt.Errorf("update user: %w", err)
	}

	return r.GetByID(id)
}

// UpdateSubscriptionTier updates the subscription tier for a user
func (r *UserRepository) UpdateSubscriptionTier(userID uint, tier string) error {
	if err := r.db.Model(&models.User{}).Where("id = ?", userID).Update("subscription_tier", tier).Error; err != nil {
		return fmt.Errorf("update subscription tier: %w", err)
	}
	return nil
}

// Delete deletes a user by ID and clears associations
func (r *UserRepository) Delete(id uint) error {
	// Use Select to delete associations (user_roles will be cleared by GORM)
	// CASCADE on other tables (user_usages, documents, payments) handles the rest
	if err := r.db.Select("Roles").Delete(&models.User{ID: id}).Error; err != nil {
		return fmt.Errorf("delete user: %w", err)
	}
	return nil
}

// CreateRefreshToken stores a refresh token for a user
func (r *UserRepository) CreateRefreshToken(userID uint, token string, expiresAt time.Time) error {
	refreshToken := &models.RefreshToken{
		UserID:    userID,
		Token:     token,
		ExpiresAt: expiresAt,
	}

	if err := r.db.Create(refreshToken).Error; err != nil {
		return fmt.Errorf("create refresh token: %w", err)
	}

	return nil
}

// DeleteRefreshToken deletes a refresh token by its value
func (r *UserRepository) DeleteRefreshToken(token string) error {
	if err := r.db.Where("token = ?", token).Delete(&models.RefreshToken{}).Error; err != nil {
		return fmt.Errorf("delete refresh token: %w", err)
	}

	return nil
}

// GetRefreshToken retrieves a refresh token by its value with associated user and roles
func (r *UserRepository) GetRefreshToken(token string) (*models.RefreshToken, *models.User, error) {
	var refreshToken models.RefreshToken
	if err := r.db.Where("token = ?", token).First(&refreshToken).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil, fmt.Errorf("refresh token not found")
		}
		return nil, nil, fmt.Errorf("get refresh token: %w", err)
	}

	// Check if refresh token is expired
	if time.Now().After(refreshToken.ExpiresAt) {
		return nil, nil, fmt.Errorf("refresh token expired")
	}

	// Get the user with roles
	user, err := r.GetByID(refreshToken.UserID)
	if err != nil {
		return nil, nil, fmt.Errorf("get user for refresh token: %w", err)
	}

	return &refreshToken, user, nil
}
