package handlers

import (
	"ares-ai-backend/internal/service"
	"strconv"

	"github.com/gofiber/fiber/v2"
)

// OfferHandler handles HTTP requests for offer endpoints
type OfferHandler struct {
	service *service.OfferService
}

// NewOfferHandler creates a new offer handler
func NewOfferHandler(service *service.OfferService) *OfferHandler {
	return &OfferHandler{service: service}
}

// GetActiveOffers returns only active offers for users
// @Summary Get active offers
// @Description Get all currently active subscription offers
// @Tags Offers
// @Produce json
// @Success 200 {array} models.Offer
// @Failure 500 {object} map[string]string
// @Router /offers [get]
func (h *OfferHandler) GetActiveOffers(c *fiber.Ctx) error {
	offers, err := h.service.GetActive()
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}
	return c.JSON(offers)
}

// GetAllOffers returns all offers for admin
// @Summary Get all offers (Admin)
// @Description Get all subscription offers including disabled ones
// @Tags Offers
// @Produce json
// @Success 200 {array} models.Offer
// @Failure 500 {object} map[string]string
// @Router /admin/offers [get]
func (h *OfferHandler) GetAllOffers(c *fiber.Ctx) error {
	offers, err := h.service.GetAll()
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}
	return c.JSON(offers)
}

// ToggleOffer enables or disables an offer
// @Summary Toggle offer status (Admin)
// @Description Enable or disable a subscription offer
// @Tags Offers
// @Produce json
// @Param id path int true "Offer ID"
// @Success 200 {object} models.Offer
// @Failure 400 {object} map[string]string
// @Failure 404 {object} map[string]string
// @Router /admin/offers/{id}/toggle [put]
func (h *OfferHandler) ToggleOffer(c *fiber.Ctx) error {
	idParam := c.Params("id")
	idInt, err := strconv.ParseUint(idParam, 10, 32)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid offer ID",
		})
	}

	offer, err := h.service.Toggle(uint(idInt))
	if err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": err.Error(),
		})
	}
	return c.JSON(offer)
}
