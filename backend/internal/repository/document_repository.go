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
	if err := r.db.
		Preload("AuditReports", func(db *gorm.DB) *gorm.DB {
			return db.Order("round_number ASC")
		}).
		Preload("AudioDebates", func(db *gorm.DB) *gorm.DB {
			return db.Order("round_number ASC")
		}).
		First(&doc, id).Error; err != nil {
		return nil, fmt.Errorf("get document: %w", err)
	}
	return &doc, nil
}

// GetByUserID retrieves all documents for a specific user
func (r *DocumentRepository) GetByUserID(userID uint) ([]models.Document, error) {
	var docs []models.Document
	if err := r.db.
		Preload("AuditReports", func(db *gorm.DB) *gorm.DB {
			return db.Order("round_number ASC")
		}).
		Preload("AudioDebates", func(db *gorm.DB) *gorm.DB {
			return db.Order("round_number ASC")
		}).
		Where("user_id = ?", userID).
		Find(&docs).Error; err != nil {
		return nil, fmt.Errorf("get user documents: %w", err)
	}
	return docs, nil
}

// GetAll retrieves all documents (for admin)
func (r *DocumentRepository) GetAll() ([]models.Document, error) {
	var docs []models.Document
	if err := r.db.
		Preload("AuditReports", func(db *gorm.DB) *gorm.DB {
			return db.Order("round_number ASC")
		}).
		Preload("AudioDebates", func(db *gorm.DB) *gorm.DB {
			return db.Order("round_number ASC")
		}).
		Find(&docs).Error; err != nil {
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

// CreateAudioDebate inserts a new audio debate linked to a document
func (r *DocumentRepository) CreateAudioDebate(debate *models.AudioDebate) error {
	if err := r.db.Create(debate).Error; err != nil {
		return fmt.Errorf("create audio debate: %w", err)
	}

	return nil
}

func (r *DocumentRepository) CreateAuditReport(report *models.AuditReport) error {
	if err := r.db.Create(report).Error; err != nil {
		return fmt.Errorf("create audit report: %w", err)
	}

	return nil
}

func (r *DocumentRepository) IncrementAuditsPerformed(userID uint) error {
	result := r.db.Model(&models.UserUsage{}).
		Where("user_id = ?", userID).
		UpdateColumn("audits_performed", gorm.Expr("audits_performed + 1"))
	if result.Error != nil {
		return fmt.Errorf("increment audits_performed: %w", result.Error)
	}

	return nil
}

func (r *DocumentRepository) IncrementRoundsUsed(documentID uint) error {
	result := r.db.Model(&models.Document{}).
		Where("id = ?", documentID).
		UpdateColumn("rounds_used", gorm.Expr("rounds_used + 1"))
	if result.Error != nil {
		return fmt.Errorf("increment rounds_used: %w", result.Error)
	}

	return nil
}

func (r *DocumentRepository) GetAllAudioDebates() ([]models.AudioDebate, error) {
	var debates []models.AudioDebate
	if err := r.db.Order("created_at DESC").Find(&debates).Error; err != nil {
		return nil, fmt.Errorf("get all audio debates: %w", err)
	}

	return debates, nil
}
