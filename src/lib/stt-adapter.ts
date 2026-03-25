import type { STTResult, STTProvider } from "./types";
import { groqTranscribe } from "./groq-whisper";
import { clovaTranscribe } from "./clova-speech";

/**
 * STT 어댑터 — Groq/Clova를 동일 인터페이스로 추상화
 */
export async function transcribe(
  audioBuffer: Buffer,
  filename: string,
  provider: STTProvider
): Promise<STTResult> {
  switch (provider) {
    case "clova":
      return clovaTranscribe(audioBuffer, filename);
    case "groq":
    default:
      return groqTranscribe(audioBuffer, filename);
  }
}
