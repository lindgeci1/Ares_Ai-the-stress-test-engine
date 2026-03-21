package service

import (
	"fmt"
	"net/smtp"
	"os"
)

// EmailService sends transactional emails through SMTP.
type EmailService struct {
	host string
	port string
	user string
	pass string
}

// NewEmailService creates an email service from SMTP environment variables.
func NewEmailService() *EmailService {
	return &EmailService{
		host: os.Getenv("SMTP_HOST"),
		port: os.Getenv("SMTP_PORT"),
		user: os.Getenv("SMTP_USER"),
		pass: os.Getenv("SMTP_PASS"),
	}
}

// SendResetCode sends a password reset code email.
func (s *EmailService) SendResetCode(toEmail string, code string) error {
	if s.host == "" || s.port == "" || s.user == "" || s.pass == "" {
		return fmt.Errorf("smtp configuration is incomplete")
	}

	subject := "Subject: ARES AI Password Reset Code\r\n"
	headers := "MIME-version: 1.0;\r\nContent-Type: text/html; charset=\"UTF-8\";\r\n\r\n"
	body := fmt.Sprintf(`
<!doctype html>
<html>
	<body style="margin:0;padding:0;background:#050505;font-family:monospace;">
		<table role="presentation" width="100%%" cellspacing="0" cellpadding="0" style="background:#050505;padding:24px;">
			<tr>
				<td align="center">
					<table role="presentation" width="100%%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#0a0a0a;border:1px solid #262626;">
						<tr>
							<td style="padding:24px;text-align:center;">
								<div style="color:#EF4444;font-size:18px;letter-spacing:3px;font-weight:700;">ARES AI</div>
								<div style="margin-top:16px;color:#ffffff;font-size:16px;letter-spacing:2px;font-weight:700;">YOUR RESET CODE</div>
								<div style="margin:18px auto 14px auto;max-width:260px;border:1px solid #EF4444;padding:14px;background:#050505;color:#EF4444;font-size:34px;letter-spacing:8px;font-weight:700;text-align:center;">%s</div>
								<div style="color:#999999;font-size:12px;letter-spacing:1px;">This code expires in 5 minutes</div>
							</td>
						</tr>
						<tr>
							<td style="border-top:1px solid #262626;padding:16px 24px;color:#666666;font-size:11px;text-align:center;line-height:1.5;">
								If you did not request this, ignore this email. - ARES AI STRESS-TEST ENGINE
							</td>
						</tr>
					</table>
				</td>
			</tr>
		</table>
	</body>
</html>
`, code)
	message := []byte(subject + headers + body)

	auth := smtp.PlainAuth("", s.user, s.pass, s.host)
	addr := fmt.Sprintf("%s:%s", s.host, s.port)

	if err := smtp.SendMail(addr, auth, s.user, []string{toEmail}, message); err != nil {
		return fmt.Errorf("send reset code email: %w", err)
	}

	return nil
}
