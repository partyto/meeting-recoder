import type { STTResult } from "./types";
import { groqTranscribe } from "./groq-whisper";

/**
 * STT 어댑터 — Groq Whisper 사용
 */
export async function transcribe(
  audioBuffer: Buffer,
  filename: string
): Promise<STTResult> {
  return groqTranscribe(audioBuffer, filename);
}
