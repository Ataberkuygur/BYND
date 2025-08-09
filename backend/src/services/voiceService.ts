import OpenAI from 'openai';
import { env } from '../utils/env';
import { Readable } from 'stream';

const isDummy = env.OPENAI_API_KEY === 'dummy';
let client: OpenAI | null = null;
if (!isDummy) {
  client = new OpenAI({ apiKey: env.OPENAI_API_KEY });
}

// Text-only voice feature marker; always enabled since no external TTS dependency required now
export function voiceFeatureEnabled(): boolean {
  return true;
}

/**
 * Transcribe audio buffer to text using OpenAI Whisper API
 * @param audioBuffer - The audio file buffer
 * @param filename - Original filename for format detection
 * @returns Promise<string> - The transcribed text
 */
export async function transcribeAudio(audioBuffer: Buffer, filename: string): Promise<string> {
  if (isDummy || !client) {
    // Return dummy transcription for development
    const dummyTranscriptions = [
      "Create a task to review project proposal by tomorrow",
      "Schedule a meeting with the team next week",
      "Add reminder to call client at 3 PM",
      "Book flight for business trip next month",
      "Set up doctor appointment for next Friday"
    ];
    const randomIndex = Math.floor(Math.random() * dummyTranscriptions.length);
    return dummyTranscriptions[randomIndex];
  }

  try {
    // Create a readable stream from the buffer with proper typing
    const audioStream = Readable.from(audioBuffer);
    // Set filename for OpenAI API
    Object.defineProperty(audioStream, 'path', { value: filename });

    const transcription = await client.audio.transcriptions.create({
      file: audioStream as unknown as File, // Type assertion for OpenAI compatibility
      model: 'whisper-1',
      language: 'en', // Can be made configurable
      response_format: 'text'
    });

    return transcription.trim();
  } catch (error) {
    console.error('Whisper transcription error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new Error('Failed to transcribe audio: ' + errorMessage);
  }
}
