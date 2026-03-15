package routes

import (
	"ares-ai-backend/internal/handlers"
	"ares-ai-backend/internal/middleware"

	"github.com/gofiber/fiber/v2"
)

func SetupOfferRoutes(api fiber.Router, offerHandler *handlers.OfferHandler) {
	// Public route — returns only active offers (used on billing page)
	api.Get("/offers", offerHandler.GetActiveOffers)

	// Admin-only routes
	admin := api.Group("/admin", middleware.RequireRole("Admin"))
	admin.Get("/offers", offerHandler.GetAllOffers)
	admin.Put("/offers/:id/toggle", offerHandler.ToggleOffer)
}
