package service

import (
	"bytes"
	"context"
	"fmt"
	"log"
	"os"
	"strings"
	"time"

	tts "cloud.google.com/go/texttospeech/apiv1"
	texttospeechpb "cloud.google.com/go/texttospeech/apiv1/texttospeechpb"
	"github.com/hajimehoshi/go-mp3"
	"google.golang.org/api/option"
)

type TTSService struct {
	client *tts.Client
}

func NewTTSService() (*TTSService, error) {
	credsOption, err := googleCredentialsOption()
	if err != nil {
		return nil, err
	}

	client, err := tts.NewClient(context.Background(), credsOption)
	if err != nil {
		return nil, fmt.Errorf("create Google Text-to-Speech client: %w", err)
	}

	return &TTSService{
		client: client,
	}, nil
}

func googleCredentialsOption() (option.ClientOption, error) {
	if credentialsJSON := strings.TrimSpace(os.Getenv("GOOGLE_CREDENTIALS_JSON")); credentialsJSON != "" {
		return option.WithCredentialsJSON([]byte(credentialsJSON)), nil
	}

	credentialsPath := strings.TrimSpace(os.Getenv("GOOGLE_APPLICATION_CREDENTIALS"))
	if credentialsPath == "" {
		return nil, fmt.Errorf("GOOGLE_CREDENTIALS_JSON or GOOGLE_APPLICATION_CREDENTIALS environment variable not set")
	}

	return option.WithCredentialsFile(credentialsPath), nil
}

func (s *TTSService) Close() error {
	if s.client == nil {
		return nil
	}

	return s.client.Close()
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
	ctx, cancel := context.WithTimeout(context.Background(), 90*time.Second)
	defer cancel()

	req := &texttospeechpb.SynthesizeSpeechRequest{
		Input: &texttospeechpb.SynthesisInput{
			InputSource: &texttospeechpb.SynthesisInput_Text{Text: text},
		},
		Voice: &texttospeechpb.VoiceSelectionParams{
			LanguageCode: "en-US",
			Name:         voiceName,
		},
		AudioConfig: &texttospeechpb.AudioConfig{
			AudioEncoding: texttospeechpb.AudioEncoding_MP3,
		},
	}

	resp, err := s.client.SynthesizeSpeech(ctx, req)
	if err != nil {
		return nil, fmt.Errorf("call Google TTS API: %w", err)
	}
	if len(resp.AudioContent) == 0 {
		return nil, fmt.Errorf("TTS response audioContent is empty")
	}

	return resp.AudioContent, nil
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
