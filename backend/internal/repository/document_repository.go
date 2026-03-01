package repository

import (
	"fmt"

	"ares-ai-backend/internal/models"
	"gorm.io/gorm"
)

// DocumentRepository handles database operations for documents
type DocumentRepository struct {
	db *gorm.DB
}

// NewDocumentRepository creates a new document repository
func NewDocumentRepository(db *gorm.DB) *DocumentRepository {
	return &DocumentRepository{db: db}
}

// Create inserts a new document into the database
func (r *DocumentRepository) Create(document *models.Document) (*models.Document, error) {
	if err := r.db.Create(document).Error; err != nil {
		return nil, fmt.Errorf("create document: %w", err)
	}
	return document, nil
}

// GetByID retrieves a document by ID with user preloaded
func (r *DocumentRepository) GetByID(id uint) (*models.Document, error) {
	var doc models.Document
	if err := r.db.Preload("AuditReport").Preload("AudioDebate").First(&doc, id).Error; err != nil {
		return nil, fmt.Errorf("get document: %w", err)
	}
	return &doc, nil
}

// GetByUserID retrieves all documents for a specific user
func (r *DocumentRepository) GetByUserID(userID uint) ([]models.Document, error) {
	var docs []models.Document
	if err := r.db.Preload("AuditReport").Preload("AudioDebate").Where("user_id = ?", userID).Find(&docs).Error; err != nil {
		return nil, fmt.Errorf("get user documents: %w", err)
	}
	return docs, nil
}

// GetAll retrieves all documents (for admin)
func (r *DocumentRepository) GetAll() ([]models.Document, error) {
	var docs []models.Document
	if err := r.db.Preload("AuditReport").Preload("AudioDebate").Find(&docs).Error; err != nil {
		return nil, fmt.Errorf("get all documents: %w", err)
	}
	return docs, nil
}

// Update updates a document
func (r *DocumentRepository) Update(id uint, updates map[string]interface{}) (*models.Document, error) {
	if len(updates) == 0 {
		return r.GetByID(id)
	}

	if err := r.db.Model(&models.Document{}).Where("id = ?", id).Updates(updates).Error; err != nil {
		return nil, fmt.Errorf("update document: %w", err)
	}

	return r.GetByID(id)
}

// Delete deletes a document by ID
func (r *DocumentRepository) Delete(id uint) error {
	if err := r.db.Delete(&models.Document{}, id).Error; err != nil {
		return fmt.Errorf("delete document: %w", err)
	}
	return nil
}
