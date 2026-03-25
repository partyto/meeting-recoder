// ── 공유 타입 정의 ──

export interface TranscriptSegment {
  text: string;
  start: number; // ms
  end: number;   // ms
  speaker?: string; // e.g. "화자1"
  confidence?: number;
}

export interface STTResult {
  segments: TranscriptSegment[];
  fullText: string;
  hasDiarization: boolean;
}

export type JobStatus =
  | "pending"
  | "uploading"
  | "transcribing"
  | "generating"
  | "uploading_confluence"
  | "done"
  | "error";

export interface Job {
  id: string;
  status: JobStatus;
  logs: string[];
  transcript?: TranscriptSegment[];
  fullText?: string;
  minutesHtml?: string;
  confluenceUrl?: string;
  error?: string;
  title: string;
  sourceType: "text" | "audio" | "record";
  blobUrl?: string;
  useConfluence: boolean;
  createdAt: string;
  updatedAt: string;
}
