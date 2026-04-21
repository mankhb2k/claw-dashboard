import axios from 'axios';
import * as fs from 'fs/promises';
import * as FormData from 'form-data';
import { Logger } from '../logger.ts';

const logger = new Logger('STTTool');

export interface STTParams {
  audioUrl?: string; // URL to audio file
  audioPath?: string; // Local path to audio file
  language?: string; // Language code (default: 'en')
  provider?: 'openai' | 'google' | 'deepgram' | 'local'; // Provider to use
}

interface STTResult {
  transcript: string; // Transcribed text
  confidence?: number; // Confidence score 0-1
  language?: string; // Detected language
  duration: number; // Audio duration in seconds
  format: string; // Always 'text'
  mimeType: string;
}

export class STTTool {
  async transcribe(audioPath: string, params: STTParams, deadline: number): Promise<STTResult> {
    const timeoutMs = deadline - Date.now();

    if (timeoutMs <= 0) {
      throw new Error('Job deadline exceeded before processing');
    }

    const provider = params.provider || 'openai';
    logger.log('STT transcription started', { provider });

    switch (provider) {
      case 'openai':
        return await this.transcribeOpenAI(audioPath, params, timeoutMs);
      case 'google':
        return await this.transcribeGoogle(audioPath, params, timeoutMs);
      case 'deepgram':
        return await this.transcribeDeepgram(audioPath, params, timeoutMs);
      case 'local':
        return await this.transcribeLocal(audioPath, params, timeoutMs);
      default:
        throw new Error(`Unknown STT provider: ${provider}`);
    }
  }

  private async transcribeOpenAI(audioPath: string, params: STTParams, timeoutMs: number): Promise<STTResult> {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      logger.warn('OPENAI_API_KEY not configured, using mock response');
      return this.createMockResult();
    }

    try {
      const audioBuffer = await fs.readFile(audioPath);
      const form = new FormData();
      form.append('file', audioBuffer, 'audio.wav');
      form.append('model', 'whisper-1');
      form.append('language', params.language || 'en');

      const response = await axios.post('https://api.openai.com/v1/audio/transcriptions', form, {
        headers: {
          ...form.getHeaders(),
          'Authorization': `Bearer ${apiKey}`,
        },
        timeout: timeoutMs,
      });

      const transcript = response.data.text;
      logger.log('OpenAI STT transcription complete', { length: transcript.length });

      return {
        transcript,
        confidence: 0.95, // OpenAI doesn't return confidence
        language: params.language || 'en',
        duration: 30, // Would need to probe audio file
        format: 'text',
        mimeType: 'text/plain',
      };
    } catch (err) {
      logger.error('OpenAI STT error:', err);
      throw err;
    }
  }

  private async transcribeGoogle(audioPath: string, params: STTParams, timeoutMs: number): Promise<STTResult> {
    const apiKey = process.env.GOOGLE_STT_API_KEY;
    if (!apiKey) {
      logger.warn('GOOGLE_STT_API_KEY not configured, using mock response');
      return this.createMockResult();
    }

    try {
      const audioBuffer = await fs.readFile(audioPath);
      const audioContent = audioBuffer.toString('base64');

      const response = await axios.post(
        `https://speech.googleapis.com/v1/speech:recognize?key=${apiKey}`,
        {
          config: {
            encoding: 'LINEAR16',
            languageCode: params.language || 'en-US',
          },
          audio: {
            content: audioContent,
          },
        },
        { timeout: timeoutMs },
      );

      const transcript =
        response.data.results?.map((r: any) => r.alternatives?.[0]?.transcript).join(' ') || '';
      logger.log('Google STT transcription complete', { length: transcript.length });

      return {
        transcript,
        confidence: response.data.results?.[0]?.alternatives?.[0]?.confidence || 0.9,
        language: params.language || 'en',
        duration: 30,
        format: 'text',
        mimeType: 'text/plain',
      };
    } catch (err) {
      logger.error('Google STT error:', err);
      throw err;
    }
  }

  private async transcribeDeepgram(audioPath: string, params: STTParams, timeoutMs: number): Promise<STTResult> {
    const apiKey = process.env.DEEPGRAM_API_KEY;
    if (!apiKey) {
      logger.warn('DEEPGRAM_API_KEY not configured, using mock response');
      return this.createMockResult();
    }

    try {
      const audioBuffer = await fs.readFile(audioPath);

      const response = await axios.post('https://api.deepgram.com/v1/listen?model=nova-2', audioBuffer, {
        headers: {
          'Authorization': `Token ${apiKey}`,
          'Content-Type': 'audio/wav',
        },
        timeout: timeoutMs,
      });

      const transcript = response.data.results?.channels?.[0]?.alternatives?.[0]?.transcript || '';
      const confidence = response.data.results?.channels?.[0]?.alternatives?.[0]?.confidence || 0.9;

      logger.log('Deepgram STT transcription complete', { length: transcript.length });

      return {
        transcript,
        confidence,
        language: params.language || 'en',
        duration: response.data.metadata?.duration || 30,
        format: 'text',
        mimeType: 'text/plain',
      };
    } catch (err) {
      logger.error('Deepgram STT error:', err);
      throw err;
    }
  }

  private async transcribeLocal(audioPath: string, params: STTParams, timeoutMs: number): Promise<STTResult> {
    logger.warn('Local STT transcription not fully implemented, using mock response');
    // Would use Whisper.cpp, Vosk, or similar for local transcription
    // For MVP, just return mock data
    return this.createMockResult();
  }

  private async createMockResult(): Promise<STTResult> {
    const mockTranscripts = [
      'This is a sample transcription of the audio content.',
      'Hello, how are you today?',
      'The quick brown fox jumps over the lazy dog.',
    ];

    const transcript = mockTranscripts[Math.floor(Math.random() * mockTranscripts.length)];

    logger.log('Mock STT result created', { transcript });

    return {
      transcript,
      confidence: 0.85,
      language: 'en',
      duration: 30,
      format: 'text',
      mimeType: 'text/plain',
    };
  }
}
