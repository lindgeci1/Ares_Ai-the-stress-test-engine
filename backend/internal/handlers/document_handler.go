package handlers

import (
	"strconv"

	"ares-ai-backend/internal/service"
	"github.com/gofiber/fiber/v2"
	"github.com/golang-jwt/jwt/v5"
)

// DocumentHandler handles HTTP requests for document-related endpoints
type DocumentHandler struct {
	service *service.DocumentService
}

// NewDocumentHandler creates a new document handler
func NewDocumentHandler(service *service.DocumentService) *DocumentHandler {
	return &DocumentHandler{service: service}
}

// extractJWTClaims extracts user info from JWT claims
func extractJWTClaims(c *fiber.Ctx) (userID uint, role string, err error) {
	claims := c.Locals("jwt_claims")
	if claims == nil {
		err = fiber.NewError(fiber.StatusUnauthorized, "No JWT claims found")
		return
	}

	jwtClaims, ok := claims.(jwt.MapClaims)
	if !ok {
		err = fiber.NewError(fiber.StatusUnauthorized, "Invalid JWT claims")
		return
	}

	userIDFloat, ok := jwtClaims["user_id"].(float64)
	if !ok {
		err = fiber.NewError(fiber.StatusUnauthorized, "Invalid user_id in token")
		return
	}
	userID = uint(userIDFloat)

	role, ok = jwtClaims["role"].(string)
	if !ok {
		err = fiber.NewError(fiber.StatusUnauthorized, "Invalid role in token")
		return
	}

	return
}

// CreateDocument handles document creation with file upload
// @Summary Create document with file upload
// @Description Create a new document and upload file to Cloudinary
// @Tags Documents
// @Accept multipart/form-data
// @Produce json
// @Param file formData file true "Document file"
// @Success 201 {object} models.Document
// @Failure 400 {object} map[string]string
// @Failure 403 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /documents [post]
func (h *DocumentHandler) CreateDocument(c *fiber.Ctx) error {
	// Parse multipart form
	file, err := c.FormFile("file")
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "File is required",
		})
	}

	// Get user_id from JWT claims, NOT from request
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

	userIDFloat, ok := jwtClaims["user_id"].(float64)
	if !ok {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "Invalid user_id in token",
		})
	}
	userID := uint(userIDFloat)

	// Upload and create document
	doc, err := h.service.CreateDocumentWithUpload(userID, file.Filename, file)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return c.Status(fiber.StatusCreated).JSON(doc)
}

// GetAllDocuments retrieves all documents (admin)
// @Summary Get all documents
// @Description Retrieve all documents in the system
// @Tags Documents
// @Produce json
// @Success 200 {array} models.Document
// @Failure 500 {object} map[string]string
// @Router /documents [get]
func (h *DocumentHandler) GetAllDocuments(c *fiber.Ctx) error {
	docs, err := h.service.GetAllDocuments()
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return c.JSON(docs)
}

// GetDocumentByID retrieves a specific document
// @Summary Get document by ID
// @Description Retrieve a single document's details (users can only see their own, admins can see any)
// @Tags Documents
// @Produce json
// @Param id path int true "Document ID"
// @Success 200 {object} models.Document
// @Failure 400 {object} map[string]string
// @Failure 403 {object} map[string]string
// @Failure 404 {object} map[string]string
// @Router /documents/{id} [get]
func (h *DocumentHandler) GetDocumentByID(c *fiber.Ctx) error {
	// Extract user info from JWT
	requestingUserID, role, err := extractJWTClaims(c)
	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	idParam := c.Params("id")
	idInt, err := strconv.ParseUint(idParam, 10, 32)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid document ID",
		})
	}
	id := uint(idInt)

	doc, err := h.service.GetDocument(id)
	if err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	// Permission check: Users can only see their own documents, Admins can see any
	if role != "Admin" && requestingUserID != doc.UserID {
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
			"error": "Forbidden: You can only view your own documents",
		})
	}

	return c.JSON(doc)
}

// GetUserDocuments retrieves all documents for a user
// @Summary Get user documents
// @Description Retrieve documents for the current user (users see only their own, admins can request any user)
// @Tags Documents
// @Produce json
// @Param userId path int false "User ID (optional for admins)"
// @Success 200 {array} models.Document
// @Failure 400 {object} map[string]string
// @Failure 403 {object} map[string]string
// @Router /documents/user/{userId} [get]
func (h *DocumentHandler) GetUserDocuments(c *fiber.Ctx) error {
	// Get requesting user info from JWT claims
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

	role, ok := jwtClaims["role"].(string)
	if !ok {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "Invalid role in token",
		})
	}

	requestingUserIDFloat, ok := jwtClaims["user_id"].(float64)
	if !ok {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "Invalid user_id in token",
		})
	}
	requestingUserID := uint(requestingUserIDFloat)

	// Get requested user ID from URL
	userIDParam := c.Params("userId")
	userIDInt, err := strconv.ParseUint(userIDParam, 10, 32)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid user ID",
		})
	}
	requestUserID := uint(userIDInt)

	// Permission check: Users can only see their own documents, Admins can see any
	if role != "Admin" && requestingUserID != requestUserID {
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
			"error": "Forbidden: You can only view your own documents",
		})
	}

	docs, err := h.service.GetUserDocuments(requestUserID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return c.JSON(docs)
}

// UpdateDocument updates a document
// @Summary Update document
// @Description Update document information (users can only update their own, admins can update any)
// @Tags Documents
// @Accept json
// @Produce json
// @Param id path int true "Document ID"
// @Param request body models.UpdateDocumentRequest true "Update details"
// @Success 200 {object} models.Document
// @Failure 400 {object} map[string]string
// @Failure 403 {object} map[string]string
// @Failure 404 {object} map[string]string
// @Router /documents/{id} [put]
func (h *DocumentHandler) UpdateDocument(c *fiber.Ctx) error {
	// Extract user info from JWT
	requestingUserID, role, err := extractJWTClaims(c)
	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	idParam := c.Params("id")
	idInt, err := strconv.ParseUint(idParam, 10, 32)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid document ID",
		})
	}
	id := uint(idInt)

	// Check ownership before allowing update
	doc, err := h.service.GetDocument(id)
	if err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	if role != "Admin" && requestingUserID != doc.UserID {
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
			"error": "Forbidden: You can only update your own documents",
		})
	}

	var req struct {
		FileName *string `json:"file_name,omitempty"`
		Status   *string `json:"status,omitempty"`
	}

	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	updatedDoc, err := h.service.UpdateDocument(id, req.FileName, req.Status)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return c.JSON(updatedDoc)
}

// DeleteDocument deletes a document
// @Summary Delete document
// @Description Remove a document (users can only delete their own, admins can delete any)
// @Tags Documents
// @Produce json
// @Param id path int true "Document ID"
// @Success 200 {object} map[string]string
// @Failure 400 {object} map[string]string
// @Failure 403 {object} map[string]string
// @Failure 404 {object} map[string]string
// @Router /documents/{id} [delete]
func (h *DocumentHandler) DeleteDocument(c *fiber.Ctx) error {
	// Extract user info from JWT
	requestingUserID, role, err := extractJWTClaims(c)
	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	idParam := c.Params("id")
	idInt, err := strconv.ParseUint(idParam, 10, 32)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid document ID",
		})
	}
	id := uint(idInt)

	// Check ownership before allowing delete
	doc, err := h.service.GetDocument(id)
	if err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	if role != "Admin" && requestingUserID != doc.UserID {
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
			"error": "Forbidden: You can only delete your own documents",
		})
	}

	if err := h.service.DeleteDocument(id); err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return c.JSON(fiber.Map{
		"message": "Document deleted successfully",
	})
}
