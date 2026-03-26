"use client";

import { useState, useRef } from "react";
import { useJobStatus } from "@/hooks/useJobStatus";
import InputTabs from "./InputTabs";
import Recorder from "./Recorder";
import ProgressLog from "./ProgressLog";
import ResultPanel from "./ResultPanel";
import TranscriptPreview from "./TranscriptPreview";

type Tab = "text" | "audio" | "record";

export default function MeetingApp() {
  const [title, setTitle] = useState("");
  const [activeTab, setActiveTab] = useState<Tab>("record");
  const [useConfluence, setUseConfluence] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fileRef = useRef<File | null>(null);
  const recordingBlobRef = useRef<Blob | null>(null);

  const { job } = useJobStatus(jobId);

  const isProcessing = isSubmitting || (job && job.status !== "done" && job.status !== "error");

  const handleFileSelect = (file: File) => {
    fileRef.current = file;
  };

  const handleRecordingComplete = (blob: Blob) => {
    recordingBlobRef.current = blob;
  };

  const handleSubmit = async () => {
    setError(null);
    setIsSubmitting(true);
    setJobId(null);

    try {
      let blobUrl: string;
      let sourceType: "text" | "audio" | "record";

      if (activeTab === "record") {
        if (!recordingBlobRef.current) {
          setError("먼저 녹음을 완료해주세요.");
          setIsSubmitting(false);
          return;
        }
        const formData = new FormData();
        formData.append("file", recordingBlobRef.current, `recording_${Date.now()}.webm`);
        const uploadResp = await fetch("/api/upload", { method: "POST", body: formData });
        if (!uploadResp.ok) throw new Error("녹음 파일 업로드 실패");
        const uploadData = await uploadResp.json();
        blobUrl = uploadData.blobUrl;
        sourceType = "record";
      } else {
        if (!fileRef.current) {
          setError("파일을 선택해주세요.");
          setIsSubmitting(false);
          return;
        }
        const formData = new FormData();
        formData.append("file", fileRef.current);
        const uploadResp = await fetch("/api/upload", { method: "POST", body: formData });
        if (!uploadResp.ok) throw new Error("파일 업로드 실패");
        const uploadData = await uploadResp.json();
        blobUrl = uploadData.blobUrl;
        sourceType = activeTab;
      }

      const transcribeResp = await fetch("/api/transcribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          blobUrl,
          title: title || `회의록 ${new Date().toLocaleString("ko-KR")}`,
          sourceType,
          useConfluence,
        }),
      });

      if (!transcribeResp.ok) throw new Error("작업 시작 실패");
      const { jobId: newJobId } = await transcribeResp.json();
      setJobId(newJobId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-start px-4 py-12">
      {/* 헤더 */}
      <div className="text-center mb-10 animate-fade-in-up">
        {/* 아이콘 */}
        <div
          className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-5"
          style={{
            background: 'var(--accent-dim)',
            border: '1px solid var(--accent-border)',
          }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path
              d="M12 2a3 3 0 0 1 3 3v6a3 3 0 0 1-6 0V5a3 3 0 0 1 3-3z"
              fill="var(--accent)"
            />
            <path
              d="M19 10a7 7 0 0 1-14 0M12 19v3M9 22h6"
              stroke="var(--accent)"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </div>

        {/* 아이배지 */}
        <div
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-medium uppercase tracking-[0.12em] mb-4"
          style={{
            background: 'var(--accent-dim)',
            color: 'var(--accent)',
            border: '1px solid var(--accent-border)',
          }}
        >
          AI 회의록
        </div>

        <h1
          className="text-3xl font-bold tracking-tight"
          style={{ color: 'var(--text-primary)' }}
        >
          회의록 자동 생성
        </h1>
        <p className="mt-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
          녹음하거나 파일을 업로드하면 AI가 회의록을 작성합니다
        </p>
      </div>

      {/* 메인 카드 — Double Bezel */}
      <div
        className="w-full max-w-lg animate-fade-in-up delay-100"
        style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid var(--border)',
          borderRadius: '2rem',
          padding: '2px',
        }}
      >
        <div
          style={{
            background: 'var(--surface)',
            borderRadius: 'calc(2rem - 2px)',
            padding: '1.75rem',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05)',
          }}
          className="space-y-5"
        >
          {/* 회의 제목 */}
          <div>
            <label
              className="block text-xs font-medium mb-2 uppercase tracking-[0.08em]"
              style={{ color: 'var(--text-secondary)' }}
            >
              회의 제목
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="예: 주간 팀 미팅"
              disabled={!!isProcessing}
              className="w-full px-4 py-3 text-sm rounded-xl outline-none transition-all duration-300"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid var(--border)',
                color: 'var(--text-primary)',
                caretColor: 'var(--accent)',
              }}
              onFocus={(e) => {
                e.currentTarget.style.border = '1px solid var(--accent-border)';
                e.currentTarget.style.background = 'rgba(96,165,250,0.05)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.border = '1px solid var(--border)';
                e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
              }}
            />
          </div>

          {/* 입력 방식 탭 */}
          <InputTabs activeTab={activeTab} onTabChange={setActiveTab} disabled={!!isProcessing} />

          {/* 탭 콘텐츠 */}
          {activeTab === "text" && (
            <FileUpload
              accept=".txt"
              label="텍스트 파일 (.txt)"
              onFileSelect={handleFileSelect}
              disabled={!!isProcessing}
            />
          )}
          {activeTab === "audio" && (
            <FileUpload
              accept=".m4a,.mp3,.wav,.aac,.ogg,.flac,.webm"
              label="오디오 파일 (m4a, mp3, wav, aac 등)"
              onFileSelect={handleFileSelect}
              disabled={!!isProcessing}
            />
          )}
          {activeTab === "record" && (
            <Recorder onRecordingComplete={handleRecordingComplete} disabled={!!isProcessing} />
          )}

          {/* 구분선 */}
          <div style={{ height: '1px', background: 'var(--border)' }} />

          {/* Confluence 옵션 */}
          <label className="flex items-center gap-3 cursor-pointer group">
            <div className="relative flex-shrink-0">
              <input
                type="checkbox"
                checked={useConfluence}
                onChange={(e) => setUseConfluence(e.target.checked)}
                disabled={!!isProcessing}
                className="sr-only peer"
              />
              <div
                className="w-9 h-5 rounded-full transition-all duration-300 peer-checked:bg-blue-500"
                style={{
                  background: useConfluence ? 'var(--accent)' : 'rgba(255,255,255,0.1)',
                }}
              >
                <div
                  className="w-3.5 h-3.5 bg-white rounded-full absolute top-[3px] transition-all duration-300"
                  style={{ left: useConfluence ? '19px' : '3px' }}
                />
              </div>
            </div>
            <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Confluence에 업로드
              <span className="ml-1.5 text-xs" style={{ color: 'var(--text-secondary)', opacity: 0.6 }}>
                (설정 필요)
              </span>
            </span>
          </label>

          {/* 에러 */}
          {error && (
            <div
              className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm"
              style={{
                background: 'rgba(239,68,68,0.08)',
                border: '1px solid rgba(239,68,68,0.2)',
                color: '#FCA5A5',
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="flex-shrink-0">
                <circle cx="12" cy="12" r="10" stroke="#FCA5A5" strokeWidth="2"/>
                <path d="M12 8v4M12 16h.01" stroke="#FCA5A5" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              {error}
            </div>
          )}

          {/* CTA 버튼 */}
          <button
            onClick={handleSubmit}
            disabled={!!isProcessing}
            className="w-full py-3.5 rounded-full text-sm font-semibold flex items-center justify-center gap-2.5 transition-all duration-300"
            style={{
              background: isProcessing ? 'rgba(255,255,255,0.06)' : 'var(--accent)',
              color: isProcessing ? 'var(--text-secondary)' : '#09090b',
              cursor: isProcessing ? 'not-allowed' : 'pointer',
              transform: 'scale(1)',
            }}
            onMouseEnter={(e) => {
              if (!isProcessing) e.currentTarget.style.transform = 'scale(1.02)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
            }}
            onMouseDown={(e) => {
              if (!isProcessing) e.currentTarget.style.transform = 'scale(0.98)';
            }}
            onMouseUp={(e) => {
              if (!isProcessing) e.currentTarget.style.transform = 'scale(1.02)';
            }}
          >
            {isProcessing ? (
              <>
                <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeDasharray="32" strokeDashoffset="12"/>
                </svg>
                처리 중...
              </>
            ) : (
              <>
                회의록 생성 시작
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center"
                  style={{ background: 'rgba(0,0,0,0.12)' }}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                    <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 진행 로그 */}
      {job && <ProgressLog logs={job.logs} status={job.status} />}

      {/* 화자분리 미리보기 */}
      {job?.transcript && job.transcript.length > 0 && (
        <TranscriptPreview segments={job.transcript} />
      )}

      {/* 결과 */}
      {job?.status === "done" && (
        <ResultPanel
          minutesHtml={job.minutesHtml}
          confluenceUrl={job.confluenceUrl}
          title={job.title}
        />
      )}
    </div>
  );
}

/* ─── 파일 업로드 ─────────────────────────────────────── */
function FileUpload({
  accept,
  label,
  onFileSelect,
  disabled,
}: {
  accept: string;
  label: string;
  onFileSelect: (file: File) => void;
  disabled: boolean;
}) {
  const [filename, setFilename] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) { setFilename(file.name); onFileSelect(file); }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) { setFilename(file.name); onFileSelect(file); }
  };

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={handleDrop}
      onClick={() => !disabled && inputRef.current?.click()}
      className="rounded-2xl p-7 text-center transition-all duration-300"
      style={{
        border: `1.5px dashed ${isDragOver ? 'var(--accent)' : 'rgba(255,255,255,0.1)'}`,
        background: isDragOver ? 'var(--accent-dim)' : 'rgba(255,255,255,0.02)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleChange}
        disabled={disabled}
        className="hidden"
      />

      {filename ? (
        <div className="flex items-center justify-center gap-2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M9 12l2 2 4-4M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" stroke="#4ADE80" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{filename}</span>
        </div>
      ) : (
        <>
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-3"
            style={{ background: 'rgba(255,255,255,0.05)' }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M4 16l4-4a3 3 0 0 1 4 0l4 4M14 14l1-1a3 3 0 0 1 4 0l1 1M14 8h.01M6 20h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2z" stroke="rgba(255,255,255,0.3)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <p className="text-sm font-medium mb-1" style={{ color: 'rgba(255,255,255,0.5)' }}>{label}</p>
          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.25)' }}>클릭하거나 파일을 드래그하세요</p>
        </>
      )}
    </div>
  );
}
