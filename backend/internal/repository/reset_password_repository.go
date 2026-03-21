package repository

import (
	"fmt"
	"time"

	"ares-ai-backend/internal/models"

	"gorm.io/gorm"
)

// ResetPasswordRepository handles persistence for password-reset codes.
type ResetPasswordRepository struct {
	db *gorm.DB
}

// NewResetPasswordRepository creates a new ResetPasswordRepository.
func NewResetPasswordRepository(db *gorm.DB) *ResetPasswordRepository {
	return &ResetPasswordRepository{db: db}
}

// Create inserts a new password reset code.
func (r *ResetPasswordRepository) Create(reset *models.ResetPassword) error {
	if err := r.db.Create(reset).Error; err != nil {
		return fmt.Errorf("create reset password: %w", err)
	}
	return nil
}

// FindByCode returns a reset code record with associated user.
func (r *ResetPasswordRepository) FindByCode(code string) (*models.ResetPassword, error) {
	var reset models.ResetPassword
	if err := r.db.Preload("User").Where("code = ?", code).First(&reset).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, fmt.Errorf("reset code not found")
		}
		return nil, fmt.Errorf("find reset password by code: %w", err)
	}
	return &reset, nil
}

// MarkAsUsed marks a reset code as used.
func (r *ResetPasswordRepository) MarkAsUsed(id uint) error {
	if err := r.db.Model(&models.ResetPassword{}).Where("id = ?", id).Update("status", "used").Error; err != nil {
		return fmt.Errorf("mark reset password as used: %w", err)
	}
	return nil
}

// MarkAllPendingAsUsed marks all pending reset codes as used for a specific user.
func (r *ResetPasswordRepository) MarkAllPendingAsUsed(userID uint) error {
	if err := r.db.Model(&models.ResetPassword{}).
		Where("user_id = ? AND status = ?", userID, "pending").
		Update("status", "used").Error; err != nil {
		return fmt.Errorf("mark all pending reset passwords as used: %w", err)
	}
	return nil
}

// DeleteExpired removes expired reset codes.
func (r *ResetPasswordRepository) DeleteExpired() error {
	if err := r.db.Where("expires_at < ?", time.Now()).Delete(&models.ResetPassword{}).Error; err != nil {
		return fmt.Errorf("delete expired reset passwords: %w", err)
	}
	return nil
}
