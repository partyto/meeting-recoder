import Groq from "groq-sdk";
import type { STTResult, TranscriptSegment } from "./types";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

/**
 * Groq Whisper API로 한국어 STT 수행 (무료)
 * 화자분리 미지원 — 단일 텍스트 스트림 반환
 */
export async function groqTranscribe(
  audioBuffer: Buffer,
  filename: string = "audio.webm"
): Promise<STTResult> {
  const file = new File([new Uint8Array(audioBuffer)], filename, {
    type: getMimeType(filename),
  });

  const response = await groq.audio.transcriptions.create({
    file,
    model: "whisper-large-v3",
    language: "ko",
    response_format: "verbose_json",
    timestamp_granularities: ["segment"],
  });

  // verbose_json 형식에서 segments 추출
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rawSegments = (response as any).segments as
    | Array<{ text: string; start?: number; end?: number }>
    | undefined;

  const segments: TranscriptSegment[] = (rawSegments ?? []).map((seg) => ({
    text: seg.text.trim(),
    start: Math.round((seg.start ?? 0) * 1000),
    end: Math.round((seg.end ?? 0) * 1000),
  }));

  return {
    segments,
    fullText: response.text ?? segments.map((s) => s.text).join(" "),
    hasDiarization: false,
  };
}

function getMimeType(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase();
  const mimeMap: Record<string, string> = {
    webm: "audio/webm",
    wav: "audio/wav",
    mp3: "audio/mpeg",
    m4a: "audio/m4a",
    ogg: "audio/ogg",
    flac: "audio/flac",
    aac: "audio/aac",
  };
  return mimeMap[ext ?? ""] ?? "audio/webm";
}
