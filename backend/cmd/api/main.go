package main

import (
	"log"
	"os"

	"ares-ai-backend/internal/handlers"
	"ares-ai-backend/internal/models"
	"ares-ai-backend/internal/repository"
	"ares-ai-backend/internal/routes"
	"ares-ai-backend/internal/service"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/logger"
	"github.com/joho/godotenv"
	fiberSwagger "github.com/swaggo/fiber-swagger"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	gormLogger "gorm.io/gorm/logger"

	_ "ares-ai-backend/docs" // Import generated docs
)

// @title Ares AI API
// @version 1.0
// @description Stress-Test Engine Backend - AI-powered document analysis and resilience scoring
// @termsOfService http://swagger.io/terms/

// @contact.name API Support
// @contact.email support@ares-ai.com

// @license.name MIT
// @license.url https://opensource.org/licenses/MIT

// @host localhost:3000
// @BasePath /api/v1
// @schemes http https

func main() {
	// Load environment variables from .env file
	if err := godotenv.Load(); err != nil {
		log.Println("Warning: .env file not found, using system environment variables")
	}

	// Get database URL from environment
	databaseURL := os.Getenv("DATABASE_URL")
	if databaseURL == "" {
		log.Fatal("DATABASE_URL environment variable is not set")
	}

	// Connect to the database using GORM
	db, err := gorm.Open(postgres.Open(databaseURL), &gorm.Config{
		Logger: gormLogger.Default.LogMode(gormLogger.Warn), // Only show warnings and errors
	})
	if err != nil {
		log.Fatalf("Unable to connect to database: %v\n", err)
	}

	log.Println("✅ Successfully connected to the database!")

	// Auto-migrate models - GORM will create/update tables automatically
	if err := db.AutoMigrate(
		&models.Role{},
		&models.User{},
		&models.RefreshToken{},
		&models.UserRole{},
		&models.UserUsage{},
		&models.Document{},
		&models.AuditReport{},
		&models.AudioDebate{},
		&models.Payment{},
	); err != nil {
		log.Fatalf("Migration failed: %v\n", err)
	}

	log.Println("✅ Database migration completed!")

	// Seed default roles
	seedRoles(db)

	// Initialize Fiber app
	app := fiber.New(fiber.Config{
		AppName: "Ares AI API v1.0",
	})

	// Middleware
	app.Use(logger.New())
	app.Use(cors.New(cors.Config{
		AllowOrigins:     "http://localhost:3000, http://localhost:5173, http://127.0.0.1:3000, http://127.0.0.1:5173",
		AllowHeaders:     "Origin, Content-Type, Accept, Authorization",
		AllowMethods:     "GET, POST, PUT, DELETE, OPTIONS",
		AllowCredentials: true,
	}))

	// Swagger documentation route
	app.Get("/swagger/*", fiberSwagger.WrapHandler)

	// API routes
	api := app.Group("/api/v1")

	// Initialize repositories, services, and handlers
	userRepo := repository.NewUserRepository(db)
	userService := service.NewUserService(userRepo)
	userHandler := handlers.NewUserHandler(userService)

	// Initialize Cloudinary service
	cloudinaryService, err := service.NewCloudinaryService()
	if err != nil {
		log.Printf("⚠️  Warning: Cloudinary service not initialized: %v\n", err)
		// Continue without Cloudinary, but file uploads won't work
	}

	docRepo := repository.NewDocumentRepository(db)
	docService := service.NewDocumentServiceWithCloudinary(docRepo, cloudinaryService)
	docHandler := handlers.NewDocumentHandler(docService)

	// Setup routes
	routes.SetupHealthRoutes(api)
	routes.SetupAuthRoutes(api, userHandler)
	routes.SetupUserRoutes(api, userHandler)
	routes.SetupDocumentRoutes(api, docHandler)

	// Start server
	port := os.Getenv("PORT")
	if port == "" {
		port = "3000"
	}

	log.Printf("🚀 Ares AI Backend is running on http://localhost:%s\n", port)
	log.Printf("📚 Swagger UI available at http://localhost:%s/swagger/index.html\n", port)

	if err := app.Listen(":" + port); err != nil {
		log.Fatalf("Failed to start server: %v\n", err)
	}
}

// seedRoles ensures the required roles exist in the database
func seedRoles(db *gorm.DB) {
	roles := []models.Role{
		{ID: 1, Name: "Admin", Permissions: models.JSONMap{"manage_users": true, "manage_documents": true, "view_all_reports": true}},
		{ID: 2, Name: "User", Permissions: models.JSONMap{"create_audits": true, "view_own_reports": true}},
	}

	for _, role := range roles {
		if err := db.FirstOrCreate(&role, models.Role{ID: role.ID}).Error; err != nil {
			log.Printf("Warning: Failed to seed role %s: %v\n", role.Name, err)
		}
	}

	log.Println("✅ Roles seeded successfully!")
}
