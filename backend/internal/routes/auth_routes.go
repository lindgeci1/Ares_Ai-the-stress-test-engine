package routes

import (
	"ares-ai-backend/internal/handlers"
	"ares-ai-backend/internal/middleware"

	"github.com/gofiber/fiber/v2"
)

func SetupAuthRoutes(api fiber.Router, userHandler *handlers.UserHandler, resetPasswordHandler *handlers.ResetPasswordHandler) {
	auth := api.Group("/auth")

	// Public routes - no role required
	auth.Post("/login", userHandler.Login)
	auth.Post("/logout", userHandler.Logout)
	auth.Post("/register", userHandler.Register)
	auth.Post("/refresh", userHandler.Refresh) // No auth required - validates refresh token from cookie
	auth.Post("/forgot-password", resetPasswordHandler.ForgotPassword)
	auth.Post("/validate-code", resetPasswordHandler.ValidateCode)
	auth.Post("/reset-password", resetPasswordHandler.ResetPassword)

	// Protected route - requires authentication (Admin and User)
	auth.Get("/me", middleware.RequireAuth(), userHandler.GetMe)
}
