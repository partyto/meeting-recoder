import type { STTResult, TranscriptSegment } from "./types";

/**
 * NAVER Clova Speech API — 한국어 STT + 화자분리
 * 월 90분 무료, 초과 시 10초당 3원
 */
export async function clovaTranscribe(
  audioBuffer: Buffer,
  filename: string = "audio.webm"
): Promise<STTResult> {
  const invokeUrl = process.env.CLOVA_SPEECH_INVOKE_URL;
  const secretKey = process.env.CLOVA_SPEECH_SECRET_KEY;

  if (!invokeUrl || !secretKey) {
    throw new Error(
      "Clova Speech API 키가 설정되지 않았습니다. CLOVA_SPEECH_INVOKE_URL, CLOVA_SPEECH_SECRET_KEY 환경변수를 확인하세요."
    );
  }

  // Clova Speech recognizer API 호출
  const formData = new FormData();
  const blob = new Blob([new Uint8Array(audioBuffer)], { type: getMimeType(filename) });
  formData.append("media", blob, filename);
  formData.append(
    "params",
    JSON.stringify({
      language: "ko-KR",
      completion: "sync",
      diarization: {
        enable: true,
      },
      sed: {
        enable: false,
      },
    })
  );

  const response = await fetch(`${invokeUrl}/recognizer/upload`, {
    method: "POST",
    headers: {
      "X-CLOVASPEECH-API-KEY": secretKey,
    },
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Clova Speech API 오류 (${response.status}): ${errorText.slice(0, 200)}`
    );
  }

  const result = await response.json();

  // Clova 응답을 STTResult로 변환
  const segments: TranscriptSegment[] = (result.segments ?? []).map(
    (seg: ClovaSegment) => ({
      text: seg.text?.trim() ?? "",
      start: seg.start ?? 0,
      end: seg.end ?? 0,
      speaker: seg.diarization?.label
        ? `화자${seg.diarization.label}`
        : undefined,
      confidence: seg.confidence ?? undefined,
    })
  );

  const fullText = segments.map((s) => s.text).join(" ");

  return {
    segments,
    fullText,
    hasDiarization: segments.some((s) => s.speaker != null),
  };
}

// Clova Speech 응답 타입
interface ClovaSegment {
  text?: string;
  start?: number;
  end?: number;
  confidence?: number;
  diarization?: {
    label?: string;
  };
  speaker?: {
    label?: string;
    name?: string;
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
