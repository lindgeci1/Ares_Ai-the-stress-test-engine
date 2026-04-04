package service

import (
	"bytes"
	"context"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/hajimehoshi/go-mp3"
	"golang.org/x/oauth2"
	"golang.org/x/oauth2/google"
)

type TTSService struct {
	tokenSource oauth2.TokenSource
	httpClient  *http.Client
}

func NewTTSService() (*TTSService, error) {
	credentialsPath := strings.TrimSpace(os.Getenv("GOOGLE_APPLICATION_CREDENTIALS"))
	if credentialsPath == "" {
		return nil, fmt.Errorf("GOOGLE_APPLICATION_CREDENTIALS environment variable not set")
	}

	credsBytes, err := os.ReadFile(credentialsPath)
	if err != nil {
		return nil, fmt.Errorf("read Google credentials: %w", err)
	}

	creds, err := google.CredentialsFromJSON(context.Background(), credsBytes, "https://www.googleapis.com/auth/cloud-platform")
	if err != nil {
		return nil, fmt.Errorf("load Google credentials: %w", err)
	}

	return &TTSService{
		tokenSource: creds.TokenSource,
		httpClient: &http.Client{
			Timeout: 90 * time.Second,
		},
	}, nil
}

func (s *TTSService) GenerateDebateAudio(transcript []DebateEntry) ([]byte, []DebateEntry, error) {
	if len(transcript) == 0 {
		return nil, nil, fmt.Errorf("transcript is empty")
	}

	var audioBuffer bytes.Buffer
	correctedTranscript := make([]DebateEntry, len(transcript))
	var cumulativeSeconds float64

	for i, entry := range transcript {
		correctedTranscript[i] = DebateEntry{
			Role: entry.Role,
			Text: entry.Text,
			Time: formatDuration(cumulativeSeconds),
		}

		text := strings.TrimSpace(entry.Text)
		if text == "" {
			continue
		}

		chunk, err := s.synthesize(text, voiceForRole(entry.Role))
		if err != nil {
			return nil, nil, err
		}

		clipDuration, err := getExactMP3Duration(chunk)
		if err != nil {
			clipDuration = float64(len(chunk)*8) / 32000.0
			log.Printf("Warning: MP3 duration decode failed for entry %d, using estimate: %v", i, err)
		}

		cumulativeSeconds += clipDuration
		audioBuffer.Write(chunk)
	}

	if audioBuffer.Len() == 0 {
		return nil, nil, fmt.Errorf("generated empty audio")
	}

	return audioBuffer.Bytes(), correctedTranscript, nil
}

// getExactMP3Duration decodes the MP3 data and returns the exact duration in seconds.
func getExactMP3Duration(data []byte) (float64, error) {
	reader := bytes.NewReader(data)
	decoder, err := mp3.NewDecoder(reader)
	if err != nil {
		return 0, fmt.Errorf("decode mp3: %w", err)
	}

	pcmBytes := decoder.Length()
	sampleRate := decoder.SampleRate()
	if pcmBytes <= 0 || sampleRate <= 0 {
		return 0, fmt.Errorf("invalid decoded mp3 metadata: length=%d sampleRate=%d", pcmBytes, sampleRate)
	}

	bytesPerSampleFrame := int64(4)
	totalSampleFrames := pcmBytes / bytesPerSampleFrame
	duration := float64(totalSampleFrames) / float64(sampleRate)

	return duration, nil
}

func formatDuration(totalSeconds float64) string {
	h := int(totalSeconds) / 3600
	m := (int(totalSeconds) % 3600) / 60
	s := int(totalSeconds) % 60
	return fmt.Sprintf("%02d:%02d:%02d", h, m, s)
}

func (s *TTSService) synthesize(text string, voiceName string) ([]byte, error) {
	token, err := s.tokenSource.Token()
	if err != nil {
		return nil, fmt.Errorf("get Google OAuth token: %w", err)
	}

	payload := map[string]any{
		"input": map[string]string{
			"text": text,
		},
		"voice": map[string]string{
			"languageCode": "en-US",
			"name":         voiceName,
		},
		"audioConfig": map[string]string{
			"audioEncoding": "MP3",
		},
	}

	body, err := json.Marshal(payload)
	if err != nil {
		return nil, fmt.Errorf("marshal TTS payload: %w", err)
	}

	req, err := http.NewRequest(http.MethodPost, "https://texttospeech.googleapis.com/v1/text:synthesize", bytes.NewReader(body))
	if err != nil {
		return nil, fmt.Errorf("create TTS request: %w", err)
	}

	req.Header.Set("Authorization", "Bearer "+token.AccessToken)
	req.Header.Set("Content-Type", "application/json")

	resp, err := s.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("call Google TTS API: %w", err)
	}
	defer resp.Body.Close()

	respBytes, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("read TTS response: %w", err)
	}

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return nil, fmt.Errorf("TTS API returned %d: %s", resp.StatusCode, strings.TrimSpace(string(respBytes)))
	}

	var ttsResp struct {
		AudioContent string `json:"audioContent"`
	}
	if err := json.Unmarshal(respBytes, &ttsResp); err != nil {
		return nil, fmt.Errorf("parse TTS response: %w", err)
	}

	if ttsResp.AudioContent == "" {
		return nil, fmt.Errorf("TTS response audioContent is empty")
	}

	audioChunk, err := base64.StdEncoding.DecodeString(ttsResp.AudioContent)
	if err != nil {
		return nil, fmt.Errorf("decode TTS audio chunk: %w", err)
	}

	return audioChunk, nil
}

func voiceForRole(role string) string {
	switch strings.ToUpper(role) {
	case "AUDITOR":
		return "en-US-Neural2-D"
	case "OPTIMIST":
		return "en-US-Neural2-F"
	default:
		return "en-US-Neural2-A"
	}
}
