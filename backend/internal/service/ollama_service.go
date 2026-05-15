package service

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"strings"
	"time"
)

type DebateEntry struct {
	Role string `json:"role"`
	Text string `json:"text"`
	Time string `json:"time"`
}

type AuditReportResult struct {
	ResilienceScore   int                 `json:"resilience_score"`
	HeatmapData       []HeatmapSegment    `json:"heatmap_data"`
	Vulnerabilities   []Vulnerability     `json:"vulnerabilities"`
	LogicalFallacies  []LogicalFallacy    `json:"logical_fallacies"`
	FortificationPlan []FortificationStep `json:"fortification_plan"`
}

type HeatmapSegment struct {
	Text string `json:"text"`
	Heat string `json:"heat"`
	Note string `json:"note,omitempty"`
}

type Vulnerability struct {
	ID        string `json:"id"`
	Severity  string `json:"severity"`
	Section   string `json:"section"`
	Title     string `json:"title"`
	Detail    string `json:"detail"`
	Precedent string `json:"precedent,omitempty"`
}

type LogicalFallacy struct {
	ID       string `json:"id"`
	Type     string `json:"type"`
	Sections string `json:"sections"`
	Title    string `json:"title"`
	Detail   string `json:"detail"`
}

type FortificationStep struct {
	Step     string   `json:"step"`
	Priority string   `json:"priority"`
	Title    string   `json:"title"`
	Fixes    []string `json:"fixes"`
	Action   string   `json:"action"`
	Effort   string   `json:"effort"`
	Impact   string   `json:"impact"`
}

type OllamaService struct {
	apiKey     string
	httpClient *http.Client
}

func NewOllamaService() *OllamaService {
	return &OllamaService{
		apiKey: os.Getenv("OLLAMA_API_KEY"),
		httpClient: &http.Client{
			Timeout: 90 * time.Second,
		},
	}
}

func (s *OllamaService) GenerateDebate(rawText string) ([]DebateEntry, error) {
	if strings.TrimSpace(s.apiKey) == "" {
		return nil, fmt.Errorf("OLLAMA_API_KEY environment variable not set")
	}

	const maxChars = 20000
	if len(rawText) > maxChars {
		rawText = rawText[:maxChars]
	}

	if strings.TrimSpace(rawText) == "" {
		return nil, fmt.Errorf("raw text is empty")
	}

	systemPrompt := debateSystemPrompt()
	payload := map[string]any{
		"model": "gpt-oss:20b-cloud",
		"messages": []map[string]string{
			{
				"role":    "system",
				"content": systemPrompt,
			},
			{
				"role":    "user",
				"content": rawText,
			},
		},
		"stream": false,
	}

	body, err := json.Marshal(payload)
	if err != nil {
		return nil, fmt.Errorf("marshal Ollama payload: %w", err)
	}

	req, err := http.NewRequest(http.MethodPost, "https://ollama.com/api/chat", bytes.NewReader(body))
	if err != nil {
		return nil, fmt.Errorf("create Ollama request: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+s.apiKey)

	resp, err := s.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("call Ollama API: %w", err)
	}
	defer resp.Body.Close()

	respBytes, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("read Ollama response: %w", err)
	}

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return nil, fmt.Errorf("Ollama API returned %d: %s", resp.StatusCode, strings.TrimSpace(string(respBytes)))
	}

	var ollamaResp struct {
		Message struct {
			Role    string `json:"role"`
			Content string `json:"content"`
		} `json:"message"`
	}
	if err := json.Unmarshal(respBytes, &ollamaResp); err != nil {
		return nil, fmt.Errorf("parse Ollama response: %w", err)
	}

	jsonText := strings.TrimSpace(ollamaResp.Message.Content)
	if jsonText == "" {
		return nil, fmt.Errorf("Ollama returned empty message content")
	}

	jsonText = stripMarkdownFence(jsonText)

	transcript, err := parseDebateTranscript(jsonText)
	if err != nil {
		return nil, fmt.Errorf("parse debate JSON: %w", err)
	}

	return transcript, nil
}

func (s *OllamaService) GenerateAuditReport(rawText string) (*AuditReportResult, error) {
	if strings.TrimSpace(s.apiKey) == "" {
		return nil, fmt.Errorf("OLLAMA_API_KEY environment variable not set")
	}

	const maxChars = 20000
	if len(rawText) > maxChars {
		rawText = rawText[:maxChars]
	}

	if strings.TrimSpace(rawText) == "" {
		return nil, fmt.Errorf("raw text is empty")
	}

	payload := map[string]any{
		"model": "gpt-oss:20b-cloud",
		"messages": []map[string]string{
			{
				"role":    "system",
				"content": auditReportSystemPrompt(),
			},
			{
				"role":    "user",
				"content": rawText,
			},
		},
		"stream": false,
	}

	body, err := json.Marshal(payload)
	if err != nil {
		return nil, fmt.Errorf("marshal Ollama payload: %w", err)
	}

	req, err := http.NewRequest(http.MethodPost, "https://ollama.com/api/chat", bytes.NewReader(body))
	if err != nil {
		return nil, fmt.Errorf("create Ollama request: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+s.apiKey)

	resp, err := s.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("call Ollama API: %w", err)
	}
	defer resp.Body.Close()

	respBytes, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("read Ollama response: %w", err)
	}

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return nil, fmt.Errorf("Ollama API returned %d: %s", resp.StatusCode, strings.TrimSpace(string(respBytes)))
	}

	var ollamaResp struct {
		Message struct {
			Role    string `json:"role"`
			Content string `json:"content"`
		} `json:"message"`
	}
	if err := json.Unmarshal(respBytes, &ollamaResp); err != nil {
		return nil, fmt.Errorf("parse Ollama response: %w", err)
	}

	jsonText := strings.TrimSpace(ollamaResp.Message.Content)
	if jsonText == "" {
		return nil, fmt.Errorf("Ollama returned empty message content")
	}

	jsonText = stripMarkdownFence(jsonText)

	result := &AuditReportResult{}
	if err := json.Unmarshal([]byte(jsonText), result); err != nil {
		return nil, fmt.Errorf("parse audit report JSON: %w", err)
	}

	return result, nil
}

func debateSystemPrompt() string {
	return `You are orchestrating an AI debate about a document.

Rules:
- Act as two agents: AUDITOR and OPTIMIST.
- AUDITOR is red-team and aggressive, focused on vulnerabilities.
- OPTIMIST is blue-team and defensive, focused on strengths.
- Conduct exactly 3 rounds.
- In each round this order must be followed:
  1) AUDITOR attacks
  2) OPTIMIST defends
  3) SYSTEM announces round result
- Start with one SYSTEM entry announcing audit initiation.
- Return ONLY a valid JSON array.
- Do not include markdown or backticks.
- Every item must be exactly:
  {"role":"AUDITOR"|"OPTIMIST"|"SYSTEM","text":"...","time":"HH:MM:SS"}
- Times must be sequential and start from 00:00:00.`
}

func auditReportSystemPrompt() string {
	return `You are an expert legal and document auditor. Analyze the provided document text and return a comprehensive audit report as a single JSON object with NO markdown, NO backticks, NO explanation - ONLY valid JSON.

The JSON must have exactly these fields:

1. "resilience_score": integer 0-100. How well the document would survive legal/regulatory scrutiny. Below 40 = CRITICAL, 40-69 = MODERATE, 70+ = RESILIENT.

2. "heatmap_data": array of objects. Break the document into logical segments (sentences or short paragraphs). Each object: {"text": "exact text from document", "heat": "red|yellow|green|neutral", "note": "brief explanation of why this rating"}. Use "red" for critical vulnerabilities, "yellow" for moderate concerns, "green" for strong/secure clauses, "neutral" for headings/structural text.

3. "vulnerabilities": array of objects. Each: {"id": "VLN-001", "severity": "CRITICAL|HIGH|MODERATE", "section": "Section X - Title", "title": "Short title", "detail": "Detailed explanation of the vulnerability and its legal implications", "precedent": "Relevant legal case or regulation if applicable"}. Find real vulnerabilities - vague language, missing definitions, overreach, compliance gaps.

4. "logical_fallacies": array of objects. Each: {"id": "LF-001", "type": "FALLACY TYPE IN CAPS", "sections": "Section X vs Section Y", "title": "Short title", "detail": "Explanation of the logical inconsistency between clauses"}. Look for contradictions, circular reasoning, scope creep between sections.

5. "fortification_plan": array of objects. Each: {"step": "01", "priority": "CRITICAL|HIGH|MEDIUM", "title": "Short action title", "fixes": ["VLN-001", "LF-001"], "action": "Detailed rewrite instructions", "effort": "HIGH|MEDIUM|LOW", "impact": "What this eliminates"}. Provide actionable fixes ordered by priority.

Return ONLY the JSON object. No wrapping, no explanation.`
}

func stripMarkdownFence(text string) string {
	trimmed := strings.TrimSpace(text)
	if strings.HasPrefix(trimmed, "```") {
		trimmed = strings.TrimPrefix(trimmed, "```json")
		trimmed = strings.TrimPrefix(trimmed, "```")
		if idx := strings.LastIndex(trimmed, "```"); idx >= 0 {
			trimmed = trimmed[:idx]
		}
	}

	return strings.TrimSpace(trimmed)
}

func parseDebateTranscript(text string) ([]DebateEntry, error) {
	var transcript []DebateEntry
	if err := json.Unmarshal([]byte(text), &transcript); err == nil {
		return transcript, nil
	}

	var wrapped struct {
		Transcript []DebateEntry `json:"transcript"`
	}
	if err := json.Unmarshal([]byte(text), &wrapped); err == nil && len(wrapped.Transcript) > 0 {
		return wrapped.Transcript, nil
	}

	return nil, fmt.Errorf("invalid transcript JSON")
}
