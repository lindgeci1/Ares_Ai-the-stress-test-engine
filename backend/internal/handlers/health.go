package handlers

import (
	"github.com/gofiber/fiber/v2"
)

// HealthResponse represents the health check response
type HealthResponse struct {
	Status  string `json:"status" example:"ok"`
	Message string `json:"message" example:"Service is running"`
}

// GetHealth godoc
// @Summary Health check endpoint
// @Description Check if the API service is running
// @Tags Health
// @Accept json
// @Produce json
// @Success 200 {object} HealthResponse
// @Router /health [get]
func GetHealth(c *fiber.Ctx) error {
	return c.Status(fiber.StatusOK).JSON(HealthResponse{
		Status:  "ok",
		Message: "🚀 Ares AI Backend is running",
	})
}
