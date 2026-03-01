package routes

import (
	"ares-ai-backend/internal/handlers"

	"github.com/gofiber/fiber/v2"
)

func SetupHealthRoutes(api fiber.Router) {
	api.Get("/health", handlers.GetHealth)
}
