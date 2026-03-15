package routes

import (
	"ares-ai-backend/internal/handlers"
	"ares-ai-backend/internal/middleware"

	"github.com/gofiber/fiber/v2"
)

// SetupPaymentRoutes registers all payment-related routes
func SetupPaymentRoutes(api fiber.Router, paymentHandler *handlers.PaymentHandler) {
	// Authenticated user routes
	payments := api.Group("/payments", middleware.RequireAuth())
	payments.Post("/intent", paymentHandler.CreatePaymentIntent)
	payments.Post("/confirm", paymentHandler.ConfirmPayment)
	payments.Get("/history", paymentHandler.GetMyPayments)

	// Admin-only routes
	admin := api.Group("/admin", middleware.RequireRole("Admin"))
	admin.Get("/payments", paymentHandler.GetAllPayments)
}
