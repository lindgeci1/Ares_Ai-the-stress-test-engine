package models

import "time"

// ResetPassword stores one-time reset codes for password recovery.
type ResetPassword struct {
	ID        uint      `json:"id" gorm:"primaryKey;autoIncrement"`
	UserID    uint      `json:"user_id" gorm:"not null;index"`
	User      User      `json:"user,omitempty" gorm:"foreignKey:UserID;references:ID;constraint:OnDelete:CASCADE"`
	Code      string    `json:"code" gorm:"type:varchar(6);not null;uniqueIndex"`
	Status    string    `json:"status" gorm:"type:varchar(20);not null;default:'pending'"`
	ExpiresAt time.Time `json:"expires_at" gorm:"not null;index"`
	CreatedAt time.Time `json:"created_at" gorm:"autoCreateTime"`
	UpdatedAt time.Time `json:"updated_at" gorm:"autoUpdateTime"`
}

// TableName specifies the table name for ResetPassword model.
func (ResetPassword) TableName() string {
	return "reset_passwords"
}
