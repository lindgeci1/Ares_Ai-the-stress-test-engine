package models

import (
	"time"
)

// Payment represents a payment transaction
type Payment struct {
	ID              uint      `json:"id" gorm:"primaryKey;autoIncrement"`
	UserID          uint      `json:"user_id" gorm:"not null;index"`
	User            User      `json:"user,omitempty" gorm:"foreignKey:UserID"`
	OfferID         *uint     `json:"offer_id" gorm:"index;default:null"` // nullable FK → offers.id
	Offer           *Offer    `json:"offer,omitempty" gorm:"foreignKey:OfferID"`
	StripeSessionID string    `json:"stripe_session_id" gorm:"type:varchar(255);uniqueIndex"`
	AmountPaid      float64   `json:"amount_paid" gorm:"type:numeric(10,2);not null"`
	Status          string    `json:"status" gorm:"type:varchar(50);default:'pending'"`
	CreatedAt       time.Time `json:"created_at" gorm:"autoCreateTime"`
	UpdatedAt       time.Time `json:"updated_at" gorm:"autoUpdateTime"`
}

// TableName specifies the table name for Payment model
func (Payment) TableName() string {
	return "payments"
}
