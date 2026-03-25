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
  const [useDiarization, setUseDiarization] = useState(true);
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
        // 녹음 Blob 업로드
        if (!recordingBlobRef.current) {
          setError("먼저 녹음을 완료해주세요.");
          setIsSubmitting(false);
          return;
        }
        const formData = new FormData();
        formData.append(
          "file",
          recordingBlobRef.current,
          `recording_${Date.now()}.webm`
        );
        const uploadResp = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });
        if (!uploadResp.ok) throw new Error("녹음 파일 업로드 실패");
        const uploadData = await uploadResp.json();
        blobUrl = uploadData.blobUrl;
        sourceType = "record";
      } else {
        // 파일 업로드
        if (!fileRef.current) {
          setError("파일을 선택해주세요.");
          setIsSubmitting(false);
          return;
        }
        const formData = new FormData();
        formData.append("file", fileRef.current);
        const uploadResp = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });
        if (!uploadResp.ok) throw new Error("파일 업로드 실패");
        const uploadData = await uploadResp.json();
        blobUrl = uploadData.blobUrl;
        sourceType = activeTab;
      }

      // STT 파이프라인 트리거
      const transcribeResp = await fetch("/api/transcribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          blobUrl,
          title: title || `회의록 ${new Date().toLocaleString("ko-KR")}`,
          sourceType,
          useConfluence,
          useDiarization: activeTab !== "text" && useDiarization,
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
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* 헤더 */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold" style={{ color: "var(--primary)" }}>
          회의록 자동 생성
        </h1>
        <p className="text-gray-500 mt-2">
          녹음하거나 파일을 업로드하면 AI가 회의록을 작성합니다
        </p>
      </div>

      {/* 메인 카드 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
        {/* 회의 제목 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            회의 제목
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="예: 주간 팀 미팅"
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            disabled={!!isProcessing}
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
            label="오디오 파일 (m4a, mp3, wav, aac, ogg, flac)"
            onFileSelect={handleFileSelect}
            disabled={!!isProcessing}
          />
        )}
        {activeTab === "record" && (
          <Recorder
            onRecordingComplete={handleRecordingComplete}
            disabled={!!isProcessing}
          />
        )}

        {/* 옵션 */}
        <div className="flex flex-col gap-3">
          {activeTab !== "text" && (
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={useDiarization}
                onChange={(e) => setUseDiarization(e.target.checked)}
                disabled={!!isProcessing}
                className="rounded"
              />
              <span>
                화자 분리 사용{" "}
                <span className="text-gray-400">(Clova Speech — 월 90분 무료)</span>
              </span>
            </label>
          )}
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={useConfluence}
              onChange={(e) => setUseConfluence(e.target.checked)}
              disabled={!!isProcessing}
              className="rounded"
            />
            <span>
              Confluence에 업로드{" "}
              <span className="text-gray-400">(설정 필요)</span>
            </span>
          </label>
        </div>

        {/* 에러 표시 */}
        {error && (
          <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* 실행 버튼 */}
        <button
          onClick={handleSubmit}
          disabled={!!isProcessing}
          className="w-full py-3 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            backgroundColor: isProcessing ? "#999" : "var(--primary)",
          }}
        >
          {isProcessing ? "처리 중..." : "회의록 생성 시작"}
        </button>
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

// 파일 업로드 컴포넌트 (인라인)
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
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      setFilename(file.name);
      onFileSelect(file);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFilename(file.name);
      onFileSelect(file);
    }
  };

  return (
    <div
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
      onClick={() => !disabled && inputRef.current?.click()}
      className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
        disabled
          ? "border-gray-200 bg-gray-50 cursor-not-allowed"
          : "border-gray-300 hover:border-blue-400 hover:bg-blue-50"
      }`}
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
        <p className="text-sm font-medium text-gray-700">{filename}</p>
      ) : (
        <>
          <p className="text-gray-500 text-sm">{label}</p>
          <p className="text-gray-400 text-xs mt-1">
            클릭하거나 파일을 드래그하세요
          </p>
        </>
      )}
    </div>
  );
}
