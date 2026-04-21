import axios from 'axios';
import * as fs from 'fs/promises';
import { Logger } from '../logger.ts';

const logger = new Logger('TTSTool');

export interface TTSParams {
  text: string; // Text to synthesize
  voice?: string; // Voice ID (default: 'en-US-Neural2-C')
  language?: string; // Language code (default: 'en-US')
  speed?: number; // Speaking rate 0.25 to 4.0 (default: 1.0)
  pitch?: number; // Pitch adjustment -20 to 20 (default: 0)
  provider?: 'google' | 'elevenlabs' | 'local'; // Provider to use
}

interface TTSResult {
  outputPath: string;
  duration: number; // seconds (estimated)
  format: string; // audio format
  mimeType: string;
}

export class TTSTool {
  async synthesize(params: TTSParams, deadline: number): Promise<TTSResult> {
    const timeoutMs = deadline - Date.now();

    if (timeoutMs <= 0) {
      throw new Error('Job deadline exceeded before processing');
    }

    const provider = params.provider || 'google';
    logger.log('TTS synthesis started', { provider, textLength: params.text.length });

    switch (provider) {
      case 'google':
        return await this.synthesizeGoogle(params, timeoutMs);
      case 'elevenlabs':
        return await this.synthesizeElevenLabs(params, timeoutMs);
      case 'local':
        return await this.synthesizeLocal(params, timeoutMs);
      default:
        throw new Error(`Unknown TTS provider: ${provider}`);
    }
  }

  private async synthesizeGoogle(params: TTSParams, timeoutMs: number): Promise<TTSResult> {
    const apiKey = process.env.GOOGLE_TTS_API_KEY;
    if (!apiKey) {
      logger.warn('GOOGLE_TTS_API_KEY not configured, using mock response');
      return this.createMockResult();
    }

    try {
      const response = await axios.post(
        'https://texttospeech.googleapis.com/v1/text:synthesize',
        {
          input: { text: params.text },
          voice: {
            languageCode: params.language || 'en-US',
            name: params.voice || 'en-US-Neural2-C',
          },
          audioConfig: {
            audioEncoding: 'MP3',
            pitch: params.pitch || 0,
            speakingRate: params.speed || 1.0,
          },
        },
        {
          params: { key: apiKey },
          timeout: timeoutMs,
        },
      );

      const audioContent = response.data.audioContent;
      const audioBuffer = Buffer.from(audioContent, 'base64');
      const outputPath = `/tmp/openclaw_tts_${Date.now()}.mp3`;

      await fs.writeFile(outputPath, audioBuffer);
      logger.log('Google TTS synthesis complete', { outputPath, size: audioBuffer.length });

      return {
        outputPath,
        duration: Math.ceil(params.text.split(' ').length / 2.5), // Rough estimate: ~2.5 words/sec
        format: 'mp3',
        mimeType: 'audio/mpeg',
      };
    } catch (err) {
      logger.error('Google TTS error:', err);
      throw err;
    }
  }

  private async synthesizeElevenLabs(params: TTSParams, timeoutMs: number): Promise<TTSResult> {
    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) {
      logger.warn('ELEVENLABS_API_KEY not configured, using mock response');
      return this.createMockResult();
    }

    try {
      const voiceId = params.voice || 'pNInz6obpgDQGcFmaJgB'; // Adam voice
      const url = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`;

      const response = await axios.post(
        url,
        {
          text: params.text,
          model_id: 'eleven_monolingual_v1',
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
          },
        },
        {
          headers: {
            'xi-api-key': apiKey,
            'Content-Type': 'application/json',
          },
          responseType: 'arraybuffer',
          timeout: timeoutMs,
        },
      );

      const audioBuffer = Buffer.from(response.data);
      const outputPath = `/tmp/openclaw_tts_${Date.now()}.mp3`;

      await fs.writeFile(outputPath, audioBuffer);
      logger.log('ElevenLabs TTS synthesis complete', { outputPath, size: audioBuffer.length });

      return {
        outputPath,
        duration: Math.ceil(params.text.split(' ').length / 2.5),
        format: 'mp3',
        mimeType: 'audio/mpeg',
      };
    } catch (err) {
      logger.error('ElevenLabs TTS error:', err);
      throw err;
    }
  }

  private async synthesizeLocal(params: TTSParams, timeoutMs: number): Promise<TTSResult> {
    logger.warn('Local TTS synthesis not fully implemented, using mock response');
    // Would use Sherpa-ONNX or similar for local synthesis
    // For MVP, just return mock data
    return this.createMockResult();
  }

  private async createMockResult(): Promise<TTSResult> {
    // Generate a mock WAV file for testing
    const channels = 1;
    const sampleRate = 44100;
    const bitsPerSample = 16;
    const duration = 5; // seconds

    const numSamples = sampleRate * duration;
    const dataSize = numSamples * (bitsPerSample / 8);
    const fileSize = 36 + dataSize;

    const buffer = Buffer.alloc(44 + dataSize);

    // WAV header
    buffer.write('RIFF', 0);
    buffer.writeUInt32LE(fileSize, 4);
    buffer.write('WAVE', 8);
    buffer.write('fmt ', 12);
    buffer.writeUInt32LE(16, 16); // Subchunk1Size
    buffer.writeUInt16LE(1, 20); // AudioFormat (1 = PCM)
    buffer.writeUInt16LE(channels, 22);
    buffer.writeUInt32LE(sampleRate, 24);
    buffer.writeUInt32LE(sampleRate * channels * (bitsPerSample / 8), 28); // ByteRate
    buffer.writeUInt16LE(channels * (bitsPerSample / 8), 32); // BlockAlign
    buffer.writeUInt16LE(bitsPerSample, 34);
    buffer.write('data', 36);
    buffer.writeUInt32LE(dataSize, 40);

    const outputPath = `/tmp/openclaw_tts_${Date.now()}.wav`;
    await fs.writeFile(outputPath, buffer);

    logger.log('Mock TTS result created', { outputPath, size: buffer.length });

    return {
      outputPath,
      duration,
      format: 'wav',
      mimeType: 'audio/wav',
    };
  }
}
