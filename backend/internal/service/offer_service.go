package service

import (
	"ares-ai-backend/internal/models"
	"ares-ai-backend/internal/repository"
	"fmt"
)

// OfferService handles business logic for offers
type OfferService struct {
	repo *repository.OfferRepository
}

// NewOfferService creates a new offer service
func NewOfferService(repo *repository.OfferRepository) *OfferService {
	return &OfferService{repo: repo}
}

// GetAll returns all offers (admin use)
func (s *OfferService) GetAll() ([]models.Offer, error) {
	offers, err := s.repo.GetAll()
	if err != nil {
		return nil, fmt.Errorf("get all offers: %w", err)
	}
	return offers, nil
}

// GetActive returns only active offers (user-facing)
func (s *OfferService) GetActive() ([]models.Offer, error) {
	offers, err := s.repo.GetActive()
	if err != nil {
		return nil, fmt.Errorf("get active offers: %w", err)
	}
	return offers, nil
}

// Toggle flips the is_active status of an offer
func (s *OfferService) Toggle(id uint) (*models.Offer, error) {
	offer, err := s.repo.Toggle(id)
	if err != nil {
		return nil, fmt.Errorf("toggle offer: %w", err)
	}
	return offer, nil
}
