package service

import (
	"fmt"
	"mime/multipart"

	"ares-ai-backend/internal/models"
	"ares-ai-backend/internal/repository"
)

// DocumentService handles business logic for documents
type DocumentService struct {
	repo              *repository.DocumentRepository
	cloudinaryService *CloudinaryService
}

// NewDocumentService creates a new document service
func NewDocumentService(repo *repository.DocumentRepository) *DocumentService {
	return &DocumentService{repo: repo}
}

// NewDocumentServiceWithCloudinary creates a new document service with Cloudinary
func NewDocumentServiceWithCloudinary(repo *repository.DocumentRepository, cs *CloudinaryService) *DocumentService {
	return &DocumentService{repo: repo, cloudinaryService: cs}
}

// CreateDocumentWithUpload creates a new document and uploads file to Cloudinary
func (s *DocumentService) CreateDocumentWithUpload(userID uint, fileName string, file *multipart.FileHeader) (*models.Document, error) {
	if s.cloudinaryService == nil {
		return nil, fmt.Errorf("Cloudinary service not initialized")
	}

	// Upload file to Cloudinary
	cloudinaryURL, err := s.cloudinaryService.UploadFile(file, "documents")
	if err != nil {
		return nil, fmt.Errorf("upload to cloudinary: %w", err)
	}

	// Create document with Cloudinary URL
	return s.CreateDocument(userID, fileName, cloudinaryURL)
}

func (s *DocumentService) UploadDocumentFile(file *multipart.FileHeader) (string, error) {
	if s.cloudinaryService == nil {
		return "", fmt.Errorf("Cloudinary service not initialized")
	}

	cloudinaryURL, err := s.cloudinaryService.UploadFile(file, "documents")
	if err != nil {
		return "", fmt.Errorf("upload to cloudinary: %w", err)
	}

	return cloudinaryURL, nil
}

// CreateDocument creates a new document
func (s *DocumentService) CreateDocument(userID uint, fileName, cloudinaryURL string) (*models.Document, error) {
	doc := &models.Document{
		UserID:        userID,
		FileName:      fileName,
		CloudinaryURL: cloudinaryURL,
		Status:        "pending",
	}

	doc, err := s.repo.Create(doc)
	if err != nil {
		return nil, fmt.Errorf("create document: %w", err)
	}

	return doc, nil
}

// GetDocument retrieves a document by ID
func (s *DocumentService) GetDocument(id uint) (*models.Document, error) {
	doc, err := s.repo.GetByID(id)
	if err != nil {
		return nil, fmt.Errorf("get document: %w", err)
	}
	return doc, nil
}

// GetUserDocuments retrieves all documents for a user
func (s *DocumentService) GetUserDocuments(userID uint) ([]models.Document, error) {
	docs, err := s.repo.GetByUserID(userID)
	if err != nil {
		return nil, fmt.Errorf("get user documents: %w", err)
	}
	return docs, nil
}

// GetAllDocuments retrieves all documents (admin)
func (s *DocumentService) GetAllDocuments() ([]models.Document, error) {
	docs, err := s.repo.GetAll()
	if err != nil {
		return nil, fmt.Errorf("get all documents: %w", err)
	}
	return docs, nil
}

func (s *DocumentService) GetAllAudioDebates() ([]models.AudioDebate, error) {
	debates, err := s.repo.GetAllAudioDebates()
	if err != nil {
		return nil, fmt.Errorf("get all audio debates: %w", err)
	}

	return debates, nil
}

// UpdateDocument updates a document
func (s *DocumentService) UpdateDocument(id uint, fileName *string, status *string) (*models.Document, error) {
	updates := map[string]interface{}{}
	if fileName != nil && *fileName != "" {
		updates["file_name"] = *fileName
	}
	if status != nil && *status != "" {
		updates["status"] = *status
	}

	doc, err := s.repo.Update(id, updates)
	if err != nil {
		return nil, fmt.Errorf("update document: %w", err)
	}

	return doc, nil
}

func (s *DocumentService) UpdateDocumentWithFields(id uint, updates map[string]interface{}) (*models.Document, error) {
	doc, err := s.repo.Update(id, updates)
	if err != nil {
		return nil, fmt.Errorf("update document fields: %w", err)
	}

	return doc, nil
}

// DeleteDocument deletes a document
func (s *DocumentService) DeleteDocument(id uint) error {
	if err := s.repo.Delete(id); err != nil {
		return fmt.Errorf("delete document: %w", err)
	}
	return nil
}
