package routes

import (
	"ares-ai-backend/internal/handlers"
	"ares-ai-backend/internal/middleware"

	"github.com/gofiber/fiber/v2"
)

func SetupAuthRoutes(api fiber.Router, userHandler *handlers.UserHandler) {
	auth := api.Group("/auth")

	// Public routes - no role required
	auth.Post("/login", userHandler.Login)
	auth.Post("/logout", userHandler.Logout)
	auth.Post("/register", userHandler.Register)
	auth.Post("/refresh", userHandler.Refresh) // No auth required - validates refresh token from cookie

	// Protected route - requires authentication (Admin and User)
	auth.Get("/me", middleware.RequireAuth(), userHandler.GetMe)
}
