package handlers

import (
	"ares-ai-backend/internal/service"
	"strings"

	"github.com/gofiber/fiber/v2"
)

type forgotPasswordRequest struct {
	Email string `json:"email"`
}

type resetPasswordRequest struct {
	Code        string `json:"code"`
	NewPassword string `json:"new_password"`
}

type validateCodeRequest struct {
	Code string `json:"code"`
}

// ResetPasswordHandler handles unauthenticated password reset routes.
type ResetPasswordHandler struct {
	service *service.ResetPasswordService
}

// NewResetPasswordHandler creates a new ResetPasswordHandler.
func NewResetPasswordHandler(service *service.ResetPasswordService) *ResetPasswordHandler {
	return &ResetPasswordHandler{service: service}
}

// ForgotPassword requests a reset code.
func (h *ResetPasswordHandler) ForgotPassword(c *fiber.Ctx) error {
	var req forgotPasswordRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	_ = h.service.RequestReset(req.Email)

	return c.JSON(fiber.Map{
		"message": "If this email exists a reset code has been sent",
	})
}

// ResetPassword validates a reset code and updates the user password.
func (h *ResetPasswordHandler) ResetPassword(c *fiber.Ctx) error {
	var req resetPasswordRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	if err := h.service.ResetPassword(req.Code, req.NewPassword); err != nil {
		if strings.Contains(err.Error(), "New password cannot be the same as your current password") {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "New password cannot be the same as your current password",
			})
		}
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid reset code or password",
		})
	}

	return c.JSON(fiber.Map{
		"message": "Password reset successful",
	})
}

// ValidateCode checks whether a reset code exists and is still valid.
func (h *ResetPasswordHandler) ValidateCode(c *fiber.Ctx) error {
	var req validateCodeRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	if err := h.service.ValidateCode(req.Code); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid or expired code",
		})
	}

	return c.JSON(fiber.Map{
		"valid": true,
	})
}
