package routes

import (
	"ares-ai-backend/internal/handlers"
	"ares-ai-backend/internal/middleware"

	"github.com/gofiber/fiber/v2"
)

func SetupUserRoutes(api fiber.Router, userHandler *handlers.UserHandler) {
	users := api.Group("/users")

	// All user routes are Admin only
	users.Get("", middleware.RequireRole("Admin"), userHandler.GetAllUsers)
	users.Post("/temp", middleware.RequireRole("Admin"), userHandler.GenerateTempUser)
	users.Get("/sessions", middleware.RequireRole("Admin"), userHandler.GetAllSessions)
	users.Delete("/sessions/expired", middleware.RequireRole("Admin"), userHandler.ClearExpiredSessions)
	users.Get("/:id", middleware.RequireRole("Admin"), userHandler.GetUserByID)
	users.Put("/:id", middleware.RequireRole("Admin"), userHandler.UpdateUser)
	users.Delete("/:id", middleware.RequireRole("Admin"), userHandler.DeleteUser)
}
