package repository

import (
	"ares-ai-backend/internal/models"
	"fmt"

	"gorm.io/gorm"
)

// OfferRepository handles database operations for offers
type OfferRepository struct {
	db *gorm.DB
}

// NewOfferRepository creates a new offer repository
func NewOfferRepository(db *gorm.DB) *OfferRepository {
	return &OfferRepository{db: db}
}

// GetAll returns all offers ordered by sort_order
func (r *OfferRepository) GetAll() ([]models.Offer, error) {
	var offers []models.Offer
	if err := r.db.Order("sort_order ASC").Find(&offers).Error; err != nil {
		return nil, fmt.Errorf("get all offers: %w", err)
	}
	return offers, nil
}

// GetActive returns only active offers ordered by sort_order
func (r *OfferRepository) GetActive() ([]models.Offer, error) {
	var offers []models.Offer
	if err := r.db.Where("is_active = ?", true).Order("sort_order ASC").Find(&offers).Error; err != nil {
		return nil, fmt.Errorf("get active offers: %w", err)
	}
	return offers, nil
}

// GetByID returns a single offer by ID
func (r *OfferRepository) GetByID(id uint) (*models.Offer, error) {
	var offer models.Offer
	if err := r.db.First(&offer, id).Error; err != nil {
		return nil, fmt.Errorf("get offer by id: %w", err)
	}
	return &offer, nil
}

// Toggle flips the is_active field of an offer and returns the updated record
func (r *OfferRepository) Toggle(id uint) (*models.Offer, error) {
	offer, err := r.GetByID(id)
	if err != nil {
		return nil, err
	}

	offer.IsActive = !offer.IsActive
	if err := r.db.Save(offer).Error; err != nil {
		return nil, fmt.Errorf("toggle offer: %w", err)
	}

	return offer, nil
}
