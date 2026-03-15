package repository

import (
	"fmt"

	"ares-ai-backend/internal/models"

	"gorm.io/gorm"
)

// PaymentRepository handles database operations for payments
type PaymentRepository struct {
	db *gorm.DB
}

// NewPaymentRepository creates a new PaymentRepository
func NewPaymentRepository(db *gorm.DB) *PaymentRepository {
	return &PaymentRepository{db: db}
}

// Create inserts a new payment record
func (r *PaymentRepository) Create(payment *models.Payment) error {
	if err := r.db.Create(payment).Error; err != nil {
		return fmt.Errorf("create payment: %w", err)
	}
	return nil
}

// GetByUserID retrieves all payments for a specific user, preloading Offer
func (r *PaymentRepository) GetByUserID(userID uint) ([]models.Payment, error) {
	var payments []models.Payment
	if err := r.db.Preload("Offer").Where("user_id = ?", userID).Order("created_at DESC").Find(&payments).Error; err != nil {
		return nil, fmt.Errorf("get payments by user: %w", err)
	}
	return payments, nil
}

// GetAll retrieves all payments for admin, preloading User and Offer
func (r *PaymentRepository) GetAll() ([]models.Payment, error) {
	var payments []models.Payment
	if err := r.db.Preload("User").Preload("Offer").Order("created_at DESC").Find(&payments).Error; err != nil {
		return nil, fmt.Errorf("get all payments: %w", err)
	}
	return payments, nil
}

// UpdateStatus updates the status of a payment by its Stripe session/payment-intent ID
func (r *PaymentRepository) UpdateStatus(stripeSessionID string, status string) error {
	if err := r.db.Model(&models.Payment{}).Where("stripe_session_id = ?", stripeSessionID).Update("status", status).Error; err != nil {
		return fmt.Errorf("update payment status: %w", err)
	}
	return nil
}
