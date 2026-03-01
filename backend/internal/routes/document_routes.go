package routes

import (
	"ares-ai-backend/internal/handlers"
	"ares-ai-backend/internal/middleware"

	"github.com/gofiber/fiber/v2"
)

func SetupDocumentRoutes(api fiber.Router, docHandler *handlers.DocumentHandler) {
	documents := api.Group("/documents")

	// Document routes require User role
	documents.Post("", middleware.RequireRole("User"), docHandler.CreateDocument)
	documents.Get("", middleware.RequireRole("User"), docHandler.GetAllDocuments)
	documents.Get("/:id", middleware.RequireRole("User"), docHandler.GetDocumentByID)
	documents.Get("/user/:userId", middleware.RequireRole("User"), docHandler.GetUserDocuments)
	documents.Put("/:id", middleware.RequireRole("User"), docHandler.UpdateDocument)
	documents.Delete("/:id", middleware.RequireRole("User"), docHandler.DeleteDocument)
}
