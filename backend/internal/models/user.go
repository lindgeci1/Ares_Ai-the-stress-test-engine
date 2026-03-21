package models

import (
	"database/sql/driver"
	"encoding/json"
	"time"

	"gorm.io/datatypes"
)

// JSONMap is a custom type for JSONB in GORM
type JSONMap datatypes.JSONMap

// User represents a user in the system
type User struct {
	ID               uint           `json:"id" gorm:"primaryKey;autoIncrement"`
	Email            string         `json:"email" gorm:"type:varchar(255);uniqueIndex;not null"`
	PasswordHash     string         `json:"-" gorm:"type:varchar(255);not null"`
	OperatorName     string         `json:"operator_name" gorm:"type:varchar(255)"`
	StripeCustomerID *string        `json:"stripe_customer_id,omitempty" gorm:"type:varchar(255)"`
	SubscriptionTier string         `json:"subscription_tier" gorm:"type:varchar(50);default:'Free'"`
	Status           string         `json:"status" gorm:"type:varchar(50);default:'active'"`
	Roles            []Role         `json:"roles,omitempty" gorm:"many2many:user_roles;constraint:OnDelete:CASCADE"`
	UserUsage        *UserUsage     `json:"user_usage,omitempty" gorm:"foreignKey:UserID;constraint:OnDelete:CASCADE"`
	Documents        []Document     `json:"documents,omitempty" gorm:"foreignKey:UserID;constraint:OnDelete:CASCADE"`
	Payments         []Payment      `json:"payments,omitempty" gorm:"foreignKey:UserID;constraint:OnDelete:CASCADE"`
	RefreshTokens    []RefreshToken `json:"-" gorm:"foreignKey:UserID;constraint:OnDelete:CASCADE"`
	CreatedAt        time.Time      `json:"created_at" gorm:"autoCreateTime"`
	UpdatedAt        time.Time      `json:"updated_at" gorm:"autoUpdateTime"`
}

// TableName specifies the table name for User model
func (User) TableName() string {
	return "users"
}

// Role represents a role with permissions
type Role struct {
	ID          int       `json:"id" gorm:"primary_key"`
	Name        string    `json:"name" gorm:"type:varchar(50);not null"`
	Permissions JSONMap   `json:"permissions" gorm:"type:jsonb;default:'{}'" swaggertype:"object"`
	Users       []User    `json:"-" gorm:"many2many:user_roles;constraint:OnDelete:CASCADE"`
	CreatedAt   time.Time `json:"created_at" gorm:"autoCreateTime"`
}

// TableName specifies the table name for Role model
func (Role) TableName() string {
	return "roles"
}

// Scan implements sql.Scanner interface
func (j JSONMap) Scan(value interface{}) error {
	b, _ := value.([]byte)
	return json.Unmarshal(b, (*datatypes.JSONMap)(&j))
}

// Value implements driver.Valuer interface
func (j JSONMap) Value() (driver.Value, error) {
	return json.Marshal(j)
}

// UserRole represents the association between users and roles (junction table)
type UserRole struct {
	UserID    uint      `json:"user_id" gorm:"primaryKey"`
	RoleID    int       `json:"role_id" gorm:"primaryKey"`
	User      User      `json:"-" gorm:"foreignKey:UserID;references:ID;constraint:OnDelete:CASCADE"`
	Role      Role      `json:"-" gorm:"foreignKey:RoleID;references:ID;constraint:OnDelete:CASCADE"`
	CreatedAt time.Time `json:"created_at" gorm:"autoCreateTime"`
}

// TableName specifies the table name for UserRole model
func (UserRole) TableName() string {
	return "user_roles"
}

// UserUsage tracks user audit limits and usage
type UserUsage struct {
	UserID          uint      `json:"user_id" gorm:"primaryKey"`
	AuditsPerformed int       `json:"audits_performed" gorm:"default:0"`
	AuditLimit      int       `json:"audit_limit" gorm:"default:10"`
	RoundsPerAudit  int       `json:"rounds_per_audit" gorm:"default:3"`
	LastResetAt     time.Time `json:"last_reset_at" gorm:"autoCreateTime"`
	CreatedAt       time.Time `json:"created_at" gorm:"autoCreateTime"`
	UpdatedAt       time.Time `json:"updated_at" gorm:"autoUpdateTime"`
}

// TableName specifies the table name for UserUsage model
func (UserUsage) TableName() string {
	return "user_usages"
}

// RefreshToken stores refresh tokens for user sessions
type RefreshToken struct {
	ID        uint      `json:"id" gorm:"primaryKey;autoIncrement"`
	UserID    uint      `json:"user_id" gorm:"not null;index"`
	Token     string    `json:"token" gorm:"type:text;not null;uniqueIndex"`
	CreatedAt time.Time `json:"created_at" gorm:"autoCreateTime"`
	ExpiresAt time.Time `json:"expires_at" gorm:"not null"`
	User      User      `json:"user,omitempty" gorm:"foreignKey:UserID;references:ID;constraint:OnDelete:CASCADE"`
}

// TableName specifies the table name for RefreshToken model
func (RefreshToken) TableName() string {
	return "refresh_tokens"
}

// RegisterRequest represents the registration payload
type RegisterRequest struct {
	Email        string `json:"email" validate:"required,email"`
	Password     string `json:"password" validate:"required,min=6"`
	OperatorName string `json:"operator_name" validate:"required"`
}

// LoginRequest represents the login payload
type LoginRequest struct {
	Email    string `json:"email" validate:"required,email"`
	Password string `json:"password" validate:"required"`
}

// LoginResponse represents the login response
type LoginResponse struct {
	User    User   `json:"user"`
	Token   string `json:"token,omitempty"`
	Message string `json:"message"`
}

// UpdateUserRequest represents the user update payload
type UpdateUserRequest struct {
	Email            *string `json:"email,omitempty" validate:"omitempty,email"`
	SubscriptionTier *string `json:"subscription_tier,omitempty"`
	Status           *string `json:"status,omitempty" validate:"omitempty,oneof=active suspended"`
}
