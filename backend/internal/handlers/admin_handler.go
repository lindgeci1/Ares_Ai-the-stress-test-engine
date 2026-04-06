package handlers

import (
	"math"
	"time"

	"ares-ai-backend/internal/models"

	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
)

// GetAdminStats returns aggregated platform statistics
// GET /api/v1/admin/stats
func GetAdminStats(db *gorm.DB) fiber.Handler {
	return func(c *fiber.Ctx) error {
		var totalDocuments int64
		db.Model(&models.Document{}).Count(&totalDocuments)

		var activeUsers int64
		db.Model(&models.User{}).Where("status = ?", "active").Count(&activeUsers)

		var totalUsers int64
		db.Model(&models.User{}).Count(&totalUsers)

		var totalAuditReports int64
		db.Model(&models.AuditReport{}).Count(&totalAuditReports)

		var totalAudioDebates int64
		db.Model(&models.AudioDebate{}).Count(&totalAudioDebates)

		var avgResilience float64
		db.Model(&models.AuditReport{}).
			Where("resilience_score IS NOT NULL").
			Select("COALESCE(AVG(resilience_score), 0)").
			Scan(&avgResilience)

		var processedDocs int64
		db.Model(&models.Document{}).Where("status = ?", "processed").Count(&processedDocs)

		var pendingDocs int64
		db.Model(&models.Document{}).Where("status = ?", "pending").Count(&pendingDocs)

		var failedDocs int64
		db.Model(&models.Document{}).Where("status = ?", "failed").Count(&failedDocs)

		var totalPayments int64
		db.Model(&models.Payment{}).Where("status = ?", "succeeded").Count(&totalPayments)

		var totalRevenue float64
		db.Model(&models.Payment{}).
			Where("status = ?", "succeeded").
			Select("COALESCE(SUM(amount_paid), 0)").
			Scan(&totalRevenue)

		type RecentActivity struct {
			DocumentID uint      `json:"document_id"`
			FileName   string    `json:"file_name"`
			Status     string    `json:"status"`
			UserEmail  string    `json:"user_email"`
			CreatedAt  time.Time `json:"created_at"`
		}

		var recentActivity []RecentActivity
		db.Model(&models.Document{}).
			Select("documents.id as document_id, documents.file_name, documents.status, users.email as user_email, documents.created_at").
			Joins("LEFT JOIN users ON users.id = documents.user_id").
			Order("documents.created_at DESC").
			Limit(10).
			Scan(&recentActivity)

		return c.JSON(fiber.Map{
			"total_documents":     totalDocuments,
			"active_users":        activeUsers,
			"total_users":         totalUsers,
			"total_audit_reports": totalAuditReports,
			"total_audio_debates": totalAudioDebates,
			"avg_resilience":      math.Round(avgResilience*10) / 10,
			"processed_docs":      processedDocs,
			"pending_docs":        pendingDocs,
			"failed_docs":         failedDocs,
			"total_payments":      totalPayments,
			"total_revenue":       math.Round(totalRevenue*100) / 100,
			"recent_activity":     recentActivity,
		})
	}
}

// GetPublicStats returns limited platform metrics for the landing page.
// GET /api/v1/public/stats - no auth required.
func GetPublicStats(db *gorm.DB) fiber.Handler {
	return func(c *fiber.Ctx) error {
		var totalDocuments int64
		db.Model(&models.Document{}).Count(&totalDocuments)

		var totalAuditReports int64
		db.Model(&models.AuditReport{}).Count(&totalAuditReports)

		var avgResilience float64
		db.Model(&models.AuditReport{}).
			Where("resilience_score IS NOT NULL").
			Select("COALESCE(AVG(resilience_score), 0)").
			Scan(&avgResilience)

		var totalThreats int64
		db.Raw("SELECT COALESCE(SUM(jsonb_array_length(vulnerabilities)), 0) FROM audit_reports WHERE vulnerabilities IS NOT NULL AND vulnerabilities != 'null'").
			Scan(&totalThreats)

		var totalAudioDebates int64
		db.Model(&models.AudioDebate{}).Count(&totalAudioDebates)

		return c.JSON(fiber.Map{
			"total_documents":     totalDocuments,
			"total_audits":        totalAuditReports,
			"total_threats":       totalThreats,
			"avg_resilience":      math.Round(avgResilience*10) / 10,
			"total_audio_debates": totalAudioDebates,
		})
	}
}
