package service

import (
	"fmt"

	"ares-ai-backend/internal/models"
	"ares-ai-backend/internal/repository"

	"github.com/stripe/stripe-go/v82"
	"github.com/stripe/stripe-go/v82/paymentintent"
)

// PaymentService handles business logic for payments
type PaymentService struct {
	paymentRepo *repository.PaymentRepository
	offerRepo   *repository.OfferRepository
	userRepo    *repository.UserRepository
}

// NewPaymentService creates a new PaymentService
func NewPaymentService(
	paymentRepo *repository.PaymentRepository,
	offerRepo *repository.OfferRepository,
	userRepo *repository.UserRepository,
) *PaymentService {
	return &PaymentService{
		paymentRepo: paymentRepo,
		offerRepo:   offerRepo,
		userRepo:    userRepo,
	}
}

// CreateIntentResult holds the response for a newly created PaymentIntent
type CreateIntentResult struct {
	ClientSecret    string  `json:"client_secret"`
	PaymentIntentID string  `json:"payment_intent_id"`
	AmountCents     int64   `json:"amount_cents"`
	Currency        string  `json:"currency"`
	OfferName       string  `json:"offer_name"`
	AmountDisplay   float64 `json:"amount_display"`
}

// CreatePaymentIntent creates a Stripe PaymentIntent for the given offer
func (s *PaymentService) CreatePaymentIntent(offerID uint, userID uint) (*CreateIntentResult, error) {
	offer, err := s.offerRepo.GetByID(offerID)
	if err != nil {
		return nil, fmt.Errorf("offer not found: %w", err)
	}

	if offer.Price <= 0 {
		return nil, fmt.Errorf("offer is free — no payment required")
	}

	amountCents := int64(offer.Price * 100)

	params := &stripe.PaymentIntentParams{
		Amount:   stripe.Int64(amountCents),
		Currency: stripe.String(string(stripe.CurrencyUSD)),
		Metadata: map[string]string{
			"offer_id": fmt.Sprintf("%d", offerID),
			"user_id":  fmt.Sprintf("%d", userID),
		},
	}

	pi, err := paymentintent.New(params)
	if err != nil {
		return nil, fmt.Errorf("create stripe payment intent: %w", err)
	}

	return &CreateIntentResult{
		ClientSecret:    pi.ClientSecret,
		PaymentIntentID: pi.ID,
		AmountCents:     amountCents,
		Currency:        string(stripe.CurrencyUSD),
		OfferName:       offer.Name,
		AmountDisplay:   offer.Price,
	}, nil
}

// ConfirmPayment records the payment in the DB and updates the user's subscription tier
func (s *PaymentService) ConfirmPayment(userID uint, offerID uint, paymentIntentID string) (*models.Payment, error) {
	offer, err := s.offerRepo.GetByID(offerID)
	if err != nil {
		return nil, fmt.Errorf("offer not found: %w", err)
	}

	payment := &models.Payment{
		UserID:          userID,
		OfferID:         &offerID,
		StripeSessionID: paymentIntentID,
		AmountPaid:      offer.Price,
		Status:          "succeeded",
	}

	if err := s.paymentRepo.Create(payment); err != nil {
		return nil, fmt.Errorf("save payment: %w", err)
	}

	// Update the user's subscription tier to the offer name
	if err := s.userRepo.UpdateSubscriptionTier(userID, offer.Name); err != nil {
		return nil, fmt.Errorf("update subscription tier: %w", err)
	}

	return payment, nil
}

// GetUserPayments returns all payments for a specific user
func (s *PaymentService) GetUserPayments(userID uint) ([]models.Payment, error) {
	return s.paymentRepo.GetByUserID(userID)
}

// GetAllPayments returns all payments (admin)
func (s *PaymentService) GetAllPayments() ([]models.Payment, error) {
	return s.paymentRepo.GetAll()
}
