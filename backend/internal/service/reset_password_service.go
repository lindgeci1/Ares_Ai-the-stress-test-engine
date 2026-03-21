package service

import (
	"crypto/rand"
	"fmt"
	"math/big"
	"strings"
	"time"

	"ares-ai-backend/internal/models"
	"ares-ai-backend/internal/repository"

	"golang.org/x/crypto/bcrypt"
)

// ResetPasswordService handles forgot/reset password workflows.
type ResetPasswordService struct {
	resetRepo    *repository.ResetPasswordRepository
	userRepo     *repository.UserRepository
	emailService *EmailService
}

// NewResetPasswordService creates a new ResetPasswordService.
func NewResetPasswordService(
	resetRepo *repository.ResetPasswordRepository,
	userRepo *repository.UserRepository,
	emailService *EmailService,
) *ResetPasswordService {
	return &ResetPasswordService{
		resetRepo:    resetRepo,
		userRepo:     userRepo,
		emailService: emailService,
	}
}

// RequestReset creates a short-lived reset code and emails it to the user.
func (s *ResetPasswordService) RequestReset(email string) error {
	email = strings.TrimSpace(strings.ToLower(email))
	if email == "" {
		return nil
	}

	user, err := s.userRepo.GetByEmail(email)
	if err != nil {
		if strings.Contains(strings.ToLower(err.Error()), "user not found") {
			return nil
		}
		return fmt.Errorf("find user by email: %w", err)
	}

	if err := s.resetRepo.DeleteExpired(); err != nil {
		return fmt.Errorf("cleanup expired reset codes: %w", err)
	}

	if err := s.resetRepo.MarkAllPendingAsUsed(user.ID); err != nil {
		return fmt.Errorf("invalidate existing pending reset codes: %w", err)
	}

	code, err := generateResetCode()
	if err != nil {
		return fmt.Errorf("generate reset code: %w", err)
	}

	reset := &models.ResetPassword{
		UserID:    user.ID,
		Code:      code,
		Status:    "pending",
		ExpiresAt: time.Now().Add(5 * time.Minute),
	}
	if err := s.resetRepo.Create(reset); err != nil {
		return fmt.Errorf("create reset request: %w", err)
	}

	if err := s.emailService.SendResetCode(user.Email, code); err != nil {
		return fmt.Errorf("send reset code: %w", err)
	}

	return nil
}

// ResetPassword validates a code and updates the user's password.
func (s *ResetPasswordService) ResetPassword(code string, newPassword string) error {
	code = strings.TrimSpace(code)
	if code == "" || len(newPassword) < 6 {
		return fmt.Errorf("invalid reset code or password")
	}

	reset, err := s.resetRepo.FindByCode(code)
	if err != nil {
		return fmt.Errorf("invalid reset code or password")
	}

	if reset.Status != "pending" || time.Now().After(reset.ExpiresAt) {
		return fmt.Errorf("invalid reset code or password")
	}

	if err := bcrypt.CompareHashAndPassword([]byte(reset.User.PasswordHash), []byte(newPassword)); err == nil {
		return fmt.Errorf("New password cannot be the same as your current password")
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(newPassword), bcrypt.DefaultCost)
	if err != nil {
		return fmt.Errorf("hash password: %w", err)
	}

	if err := s.userRepo.UpdatePasswordHash(reset.UserID, string(hashedPassword)); err != nil {
		return fmt.Errorf("update password: %w", err)
	}

	if err := s.resetRepo.MarkAsUsed(reset.ID); err != nil {
		return fmt.Errorf("mark reset code as used: %w", err)
	}

	return nil
}

// ValidateCode verifies that a reset code exists, is pending, and not expired.
func (s *ResetPasswordService) ValidateCode(code string) error {
	code = strings.TrimSpace(code)
	if code == "" {
		return fmt.Errorf("invalid code")
	}

	reset, err := s.resetRepo.FindByCode(code)
	if err != nil {
		return fmt.Errorf("invalid code")
	}

	if reset.Status != "pending" || !time.Now().Before(reset.ExpiresAt) {
		return fmt.Errorf("invalid code")
	}

	return nil
}

func generateResetCode() (string, error) {
	var builder strings.Builder
	for i := 0; i < 6; i++ {
		n, err := rand.Int(rand.Reader, big.NewInt(10))
		if err != nil {
			return "", err
		}
		builder.WriteString(n.String())
	}
	return builder.String(), nil
}
