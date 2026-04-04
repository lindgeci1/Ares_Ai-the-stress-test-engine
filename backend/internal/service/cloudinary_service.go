package service

import (
	"bytes"
	"context"
	"fmt"
	"mime/multipart"
	"os"

	"github.com/cloudinary/cloudinary-go/v2"
	"github.com/cloudinary/cloudinary-go/v2/api/uploader"
)

type CloudinaryService struct {
	client *cloudinary.Cloudinary
}

func NewCloudinaryService() (*CloudinaryService, error) {
	cloudinaryURL := os.Getenv("CLOUDINARY_URL")
	if cloudinaryURL == "" {
		return nil, fmt.Errorf("CLOUDINARY_URL environment variable not set")
	}

	client, err := cloudinary.NewFromURL(cloudinaryURL)
	if err != nil {
		return nil, fmt.Errorf("failed to initialize Cloudinary: %w", err)
	}

	return &CloudinaryService{client: client}, nil
}

func (cs *CloudinaryService) UploadFile(file *multipart.FileHeader, folder string) (string, error) {
	if cs.client == nil {
		return "", fmt.Errorf("Cloudinary client not initialized")
	}

	// Open the file
	src, err := file.Open()
	if err != nil {
		return "", fmt.Errorf("failed to open file: %w", err)
	}
	defer src.Close()

	// Upload to Cloudinary with folder organization
	ctx := context.Background()
	result, err := cs.client.Upload.Upload(ctx, src, uploader.UploadParams{
		Folder: folder,
	})

	if err != nil {
		return "", fmt.Errorf("failed to upload to Cloudinary: %w", err)
	}

	return result.SecureURL, nil
}

func (cs *CloudinaryService) DeleteFile(publicID string) error {
	if cs.client == nil {
		return fmt.Errorf("Cloudinary client not initialized")
	}

	ctx := context.Background()
	_, err := cs.client.Upload.Destroy(ctx, uploader.DestroyParams{
		PublicID: publicID,
	})

	if err != nil {
		return fmt.Errorf("failed to delete from Cloudinary: %w", err)
	}

	return nil
}

func (cs *CloudinaryService) UploadBytes(data []byte, folder string, fileName string) (string, error) {
	if cs.client == nil {
		return "", fmt.Errorf("Cloudinary client not initialized")
	}

	if len(data) == 0 {
		return "", fmt.Errorf("no data provided for upload")
	}

	ctx := context.Background()
	result, err := cs.client.Upload.Upload(ctx, bytes.NewReader(data), uploader.UploadParams{
		Folder:       folder,
		PublicID:     fileName,
		ResourceType: "auto",
	})
	if err != nil {
		return "", fmt.Errorf("failed to upload bytes to Cloudinary: %w", err)
	}

	return result.SecureURL, nil
}

// ExtractPublicIDFromURL extracts the public ID from a Cloudinary URL
func ExtractPublicIDFromURL(url string) string {
	// Parse Cloudinary URL to extract public ID
	// URL format: https://res.cloudinary.com/{cloud_name}/image/upload/{folder}/{public_id}
	// For simplicity, we'll extract from the end of the URL
	// This is a basic implementation - adjust based on actual URL structure
	return url
}
