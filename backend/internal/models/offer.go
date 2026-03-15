package models

import (
	"time"

	"gorm.io/datatypes"
)

// Offer represents a subscription plan/package
type Offer struct {
	ID            uint           `json:"id" gorm:"primaryKey;autoIncrement"`
	Name          string         `json:"name" gorm:"type:varchar(100);not null"`
	Tier          int            `json:"tier" gorm:"not null;default:1"`
	TierLabel     string         `json:"tier_label" gorm:"type:varchar(50)"`
	Price         float64        `json:"price" gorm:"type:numeric(10,2);default:0"`
	PriceLabel    string         `json:"price_label" gorm:"type:varchar(50)"`
	PriceSuffix   string         `json:"price_suffix" gorm:"type:varchar(20)"`
	Features      datatypes.JSON `json:"features" gorm:"type:jsonb;default:'[]'"`
	Color         string         `json:"color" gorm:"type:varchar(20);default:'#EF4444'"`
	IsRecommended bool           `json:"is_recommended" gorm:"default:false"`
	IsActive      bool           `json:"is_active" gorm:"default:true"`
	SortOrder     int            `json:"sort_order" gorm:"default:0"`
	CTALabel      string         `json:"cta_label" gorm:"type:varchar(100)"`
	CTAType       string         `json:"cta_type" gorm:"type:varchar(50);default:'link'"` // none | link | contact
	CTALink       string         `json:"cta_link" gorm:"type:varchar(255)"`
	CreatedAt     time.Time      `json:"created_at" gorm:"autoCreateTime"`
	UpdatedAt     time.Time      `json:"updated_at" gorm:"autoUpdateTime"`
}

// TableName specifies the table name for Offer model
func (Offer) TableName() string {
	return "offers"
}
