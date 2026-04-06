package handlers

import (
	"strconv"
	"time"

	"ares-ai-backend/internal/models"
	"ares-ai-backend/internal/service"

	"github.com/gofiber/fiber/v2"
	"github.com/golang-jwt/jwt/v5"
)

// UserHandler handles HTTP requests for user-related endpoints
type UserHandler struct {
	service *service.UserService
}

type GenerateTempUserRequest struct {
	OperatorName string `json:"operator_name" validate:"required"`
	Email        string `json:"email" validate:"required,email"`
	ExpiresAt    string `json:"expires_at" validate:"required"`
}

type GenerateTempUserResponse struct {
	User      models.User `json:"user"`
	AccessKey string      `json:"access_key"`
}

// NewUserHandler creates a new user handler
func NewUserHandler(service *service.UserService) *UserHandler {
	return &UserHandler{service: service}
}

// Register handles user registration
// @Summary Register a new user
// @Description Create a new user account. First user gets Admin role, subsequent users get User role.
// @Tags Auth
// @Accept json
// @Produce json
// @Param request body models.RegisterRequest true "Registration details"
// @Success 201 {object} map[string]string
// @Failure 400 {object} map[string]string
// @Failure 409 {object} map[string]string
// @Router /auth/register [post]
func (h *UserHandler) Register(c *fiber.Ctx) error {
	var req models.RegisterRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	_, err := h.service.Register(req.Email, req.Password, req.OperatorName)
	if err != nil {
		// Check if it's a duplicate email error
		if err.Error() == "Email already registered" {
			return c.Status(fiber.StatusConflict).JSON(fiber.Map{
				"error": "Email already registered",
			})
		}
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"message": "User registered successfully. Please log in.",
	})
}

// Login handles user authentication
// @Summary Login user
// @Description Authenticate user with email and password
// @Tags Auth
// @Accept json
// @Produce json
// @Param request body models.LoginRequest true "Login credentials"
// @Success 200 {object} models.LoginResponse
// @Failure 400 {object} map[string]string
// @Failure 401 {object} map[string]string
// @Router /auth/login [post]
func (h *UserHandler) Login(c *fiber.Ctx) error {
	var req models.LoginRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	user, accessToken, refreshToken, refreshExpiry, err := h.service.Login(req.Email, req.Password, req.AccessKey)
	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	c.Cookie(&fiber.Cookie{
		Name:     "refresh_token",
		Value:    refreshToken,
		HTTPOnly: true,
		Secure:   true,
		SameSite: "Lax",
		Path:     "/",
		Expires:  refreshExpiry,
	})

	return c.JSON(models.LoginResponse{
		User:    *user,
		Token:   accessToken,
		Message: "Login successful",
	})
}

// GenerateTempUser allows admins to create temporary users with access keys.
func (h *UserHandler) GenerateTempUser(c *fiber.Ctx) error {
	var req GenerateTempUserRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	if req.OperatorName == "" || req.Email == "" || req.ExpiresAt == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "operator_name, email, and expires_at are required",
		})
	}

	expiresAt, err := time.Parse(time.RFC3339, req.ExpiresAt)
	if err != nil {
		expiresAt, err = time.Parse("2006-01-02", req.ExpiresAt)
		if err != nil {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "expires_at must be a valid ISO date",
			})
		}
	}

	today := time.Now().In(expiresAt.Location())
	todayStart := time.Date(today.Year(), today.Month(), today.Day(), 0, 0, 0, 0, today.Location())
	if expiresAt.Before(todayStart) {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Expiry date cannot be in the past",
		})
	}

	user, accessKey, err := h.service.GenerateTempUser(req.OperatorName, req.Email, expiresAt)
	if err != nil {
		status := fiber.StatusBadRequest
		if err.Error() == "Email already registered" {
			status = fiber.StatusConflict
		}

		return c.Status(status).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return c.Status(fiber.StatusCreated).JSON(GenerateTempUserResponse{
		User:      *user,
		AccessKey: accessKey,
	})
}

// GetAllUsers retrieves all users with their roles
// @Summary Get all users
// @Description Retrieve a list of all users with their role information
// @Tags Users
// @Produce json
// @Success 200 {array} models.User
// @Failure 500 {object} map[string]string
// @Router /users [get]
func (h *UserHandler) GetAllUsers(c *fiber.Ctx) error {
	users, err := h.service.GetAllUsers()
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return c.JSON(users)
}

// GetUserByID retrieves a specific user by ID
// @Summary Get user by ID
// @Description Retrieve a single user's details by their ID with role information (users can only see their own, admins can see any)
// @Tags Users
// @Produce json
// @Param id path int true "User ID"
// @Success 200 {object} models.User
// @Failure 400 {object} map[string]string
// @Failure 403 {object} map[string]string
// @Failure 404 {object} map[string]string
// @Router /users/{id} [get]
func (h *UserHandler) GetUserByID(c *fiber.Ctx) error {
	// Extract user info from JWT
	claims := c.Locals("jwt_claims")
	if claims == nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "No JWT claims found",
		})
	}

	jwtClaims, ok := claims.(jwt.MapClaims)
	if !ok {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "Invalid JWT claims",
		})
	}

	requestingUserIDFloat, ok := jwtClaims["user_id"].(float64)
	if !ok {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "Invalid user_id in token",
		})
	}
	requestingUserID := uint(requestingUserIDFloat)

	role, ok := jwtClaims["role"].(string)
	if !ok {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "Invalid role in token",
		})
	}

	idParam := c.Params("id")
	idInt, err := strconv.ParseUint(idParam, 10, 32)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid user ID",
		})
	}
	id := uint(idInt)

	// Permission check: Users can only see their own profile, Admins can see any
	if role != "Admin" && requestingUserID != id {
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
			"error": "Forbidden: You can only view your own profile",
		})
	}

	user, err := h.service.GetUser(id)
	if err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return c.JSON(user)
}

// UpdateUser updates a user's information
// @Summary Update user
// @Description Update user's email, subscription tier, or status (users can only update their own, admins can update any)
// @Tags Users
// @Accept json
// @Produce json
// @Param id path int true "User ID"
// @Param request body models.UpdateUserRequest true "Update details"
// @Success 200 {object} models.User
// @Failure 400 {object} map[string]string
// @Failure 403 {object} map[string]string
// @Failure 404 {object} map[string]string
// @Router /users/{id} [put]
func (h *UserHandler) UpdateUser(c *fiber.Ctx) error {
	// Extract user info from JWT
	claims := c.Locals("jwt_claims")
	if claims == nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "No JWT claims found",
		})
	}

	jwtClaims, ok := claims.(jwt.MapClaims)
	if !ok {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "Invalid JWT claims",
		})
	}

	requestingUserIDFloat, ok := jwtClaims["user_id"].(float64)
	if !ok {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "Invalid user_id in token",
		})
	}
	requestingUserID := uint(requestingUserIDFloat)

	role, ok := jwtClaims["role"].(string)
	if !ok {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "Invalid role in token",
		})
	}

	idParam := c.Params("id")
	idInt, err := strconv.ParseUint(idParam, 10, 32)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid user ID",
		})
	}
	id := uint(idInt)

	// Permission check: Users can only update their own profile, Admins can update any
	if role != "Admin" && requestingUserID != id {
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
			"error": "Forbidden: You can only update your own profile",
		})
	}

	var req models.UpdateUserRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	user, err := h.service.UpdateUser(id, req.Email, req.SubscriptionTier, req.Status)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return c.JSON(user)
}

// DeleteUser deletes a user by ID
// @Summary Delete user
// @Description Remove a user and all related data (users can only delete their own, admins can delete any) (CASCADE)
// @Tags Users
// @Produce json
// @Param id path int true "User ID"
// @Success 200 {object} map[string]string
// @Failure 400 {object} map[string]string
// @Failure 403 {object} map[string]string
// @Failure 404 {object} map[string]string
// @Router /users/{id} [delete]
func (h *UserHandler) DeleteUser(c *fiber.Ctx) error {
	// Extract user info from JWT
	claims := c.Locals("jwt_claims")
	if claims == nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "No JWT claims found",
		})
	}

	jwtClaims, ok := claims.(jwt.MapClaims)
	if !ok {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "Invalid JWT claims",
		})
	}

	requestingUserIDFloat, ok := jwtClaims["user_id"].(float64)
	if !ok {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "Invalid user_id in token",
		})
	}
	requestingUserID := uint(requestingUserIDFloat)

	role, ok := jwtClaims["role"].(string)
	if !ok {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "Invalid role in token",
		})
	}

	idParam := c.Params("id")
	idInt, err := strconv.ParseUint(idParam, 10, 32)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid user ID",
		})
	}
	id := uint(idInt)

	// Permission check: Users can only delete their own profile, Admins can delete any
	if role != "Admin" && requestingUserID != id {
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
			"error": "Forbidden: You can only delete your own profile",
		})
	}

	if err := h.service.DeleteUser(id); err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return c.JSON(fiber.Map{
		"message": "User deleted successfully",
	})
}

// Logout handles user logout
// @Summary Logout user
// @Description Logout the current user (clears session)
// @Tags Auth
// @Produce json
// @Success 200 {object} map[string]string
// @Router /auth/logout [post]
func (h *UserHandler) Logout(c *fiber.Ctx) error {
	refreshToken := c.Cookies("refresh_token")
	if refreshToken != "" {
		_ = h.service.Logout(refreshToken)
	}

	// Clear refresh_token cookie with explicit expiration
	c.Cookie(&fiber.Cookie{
		Name:     "refresh_token",
		Value:    "",
		HTTPOnly: true,
		Secure:   true,
		SameSite: "Lax",
		Path:     "/",
		MaxAge:   -1,
	})

	return c.JSON(fiber.Map{
		"message": "Logged out successfully",
	})
}

// GetMe returns the current authenticated user's information
// @Summary Get current user
// @Description Get the currently authenticated user's details with role information
// @Tags Auth
// @Produce json
// @Success 200 {object} models.User
// @Failure 401 {object} map[string]string
// @Router /auth/me [get]
func (h *UserHandler) GetMe(c *fiber.Ctx) error {
	claims := c.Locals("jwt_claims")
	if claims == nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "Unauthorized",
		})
	}

	// Handle both jwt.MapClaims and map[string]interface{}
	var userID uint
	switch v := claims.(type) {
	case jwt.MapClaims:
		userIDInterface, ok := v["user_id"]
		if !ok {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"error": "Invalid user ID in token",
			})
		}
		userIDFloat, ok := userIDInterface.(float64)
		if !ok {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"error": "Invalid user ID format",
			})
		}
		userID = uint(userIDFloat)
	case map[string]interface{}:
		userIDInterface, ok := v["user_id"]
		if !ok {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"error": "Invalid user ID in token",
			})
		}
		userIDFloat, ok := userIDInterface.(float64)
		if !ok {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"error": "Invalid user ID format",
			})
		}
		userID = uint(userIDFloat)
	default:
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "Invalid claims type",
		})
	}

	user, err := h.service.GetUser(userID)
	if err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "User not found",
		})
	}

	return c.JSON(user)
}

// Refresh generates a new access token from a valid refresh token
// @Summary Refresh access token
// @Description Generate a new JWT access token using a valid refresh token from cookies
// @Tags Auth
// @Produce json
// @Success 200 {object} models.LoginResponse
// @Failure 401 {object} map[string]string
// @Router /auth/refresh [post]
func (h *UserHandler) Refresh(c *fiber.Ctx) error {
	refreshToken := c.Cookies("refresh_token")
	if refreshToken == "" {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "Refresh token missing",
		})
	}

	accessToken, err := h.service.Refresh(refreshToken)
	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return c.JSON(fiber.Map{
		"token":   accessToken,
		"message": "Token refreshed successfully",
	})
}

// GetAllSessions retrieves all refresh-token sessions (admin only).
func (h *UserHandler) GetAllSessions(c *fiber.Ctx) error {
	sessions, err := h.service.GetAllSessions()
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return c.JSON(sessions)
}

// ClearExpiredSessions deletes all expired refresh-token sessions (admin only).
func (h *UserHandler) ClearExpiredSessions(c *fiber.Ctx) error {
	deleted, err := h.service.ClearExpiredSessions()
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return c.JSON(fiber.Map{
		"deleted": deleted,
	})
}
