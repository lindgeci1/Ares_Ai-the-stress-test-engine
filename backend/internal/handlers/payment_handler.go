package handlers

import (
	"ares-ai-backend/internal/service"

	"github.com/gofiber/fiber/v2"
	"github.com/golang-jwt/jwt/v5"
)

// PaymentHandler handles HTTP requests related to payments
type PaymentHandler struct {
	service *service.PaymentService
}

// NewPaymentHandler creates a new PaymentHandler
func NewPaymentHandler(service *service.PaymentService) *PaymentHandler {
	return &PaymentHandler{service: service}
}

// getUserIDFromClaims extracts the user ID from JWT claims stored in fiber context
func getUserIDFromClaims(c *fiber.Ctx) (uint, error) {
	raw := c.Locals("jwt_claims")
	if raw == nil {
		return 0, fiber.NewError(fiber.StatusUnauthorized, "missing claims")
	}
	claims, ok := raw.(jwt.MapClaims)
	if !ok {
		return 0, fiber.NewError(fiber.StatusUnauthorized, "invalid claims type")
	}
	idFloat, ok := claims["user_id"].(float64)
	if !ok {
		return 0, fiber.NewError(fiber.StatusUnauthorized, "invalid user_id in token")
	}
	return uint(idFloat), nil
}

// CreatePaymentIntent creates a Stripe PaymentIntent for an offer
// POST /api/v1/payments/intent
func (h *PaymentHandler) CreatePaymentIntent(c *fiber.Ctx) error {
	userID, err := getUserIDFromClaims(c)
	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": err.Error()})
	}

	var req struct {
		OfferID uint `json:"offer_id"`
	}
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid request body"})
	}
	if req.OfferID == 0 {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "offer_id is required"})
	}

	result, err := h.service.CreatePaymentIntent(req.OfferID, userID)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(result)
}

// ConfirmPayment records the payment in the DB after Stripe confirms it on the client
// POST /api/v1/payments/confirm
func (h *PaymentHandler) ConfirmPayment(c *fiber.Ctx) error {
	userID, err := getUserIDFromClaims(c)
	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": err.Error()})
	}

	var req struct {
		OfferID         uint   `json:"offer_id"`
		PaymentIntentID string `json:"payment_intent_id"`
	}
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid request body"})
	}
	if req.OfferID == 0 || req.PaymentIntentID == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "offer_id and payment_intent_id are required"})
	}

	payment, err := h.service.ConfirmPayment(userID, req.OfferID, req.PaymentIntentID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	return c.Status(fiber.StatusCreated).JSON(payment)
}

// GetMyPayments returns the payment history for the authenticated user
// GET /api/v1/payments/history
func (h *PaymentHandler) GetMyPayments(c *fiber.Ctx) error {
	userID, err := getUserIDFromClaims(c)
	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": err.Error()})
	}

	payments, err := h.service.GetUserPayments(userID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(payments)
}

// GetAllPayments returns all payments for admin view
// GET /api/v1/admin/payments
func (h *PaymentHandler) GetAllPayments(c *fiber.Ctx) error {
	payments, err := h.service.GetAllPayments()
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(payments)
}
