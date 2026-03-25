"use client";

import { useState } from "react";
import { useRecorder } from "@/hooks/useRecorder";

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function Recorder({
  onRecordingComplete,
  disabled,
}: {
  onRecordingComplete: (blob: Blob) => void;
  disabled: boolean;
}) {
  const {
    isRecording,
    duration,
    chunkCount,
    audioLevel,
    error,
    startRecording,
    stopRecording,
  } = useRecorder();
  const [hasRecording, setHasRecording] = useState(false);

  const handleToggle = async () => {
    if (isRecording) {
      const blob = await stopRecording();
      if (blob) {
        onRecordingComplete(blob);
        setHasRecording(true);
      }
    } else {
      setHasRecording(false);
      await startRecording();
    }
  };

  return (
    <div className="text-center py-6 space-y-4">
      {/* 녹음 버튼 */}
      <button
        onClick={handleToggle}
        disabled={disabled && !isRecording}
        className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto transition-all ${
          isRecording
            ? "bg-red-500 hover:bg-red-600 animate-pulse-recording"
            : "bg-blue-600 hover:bg-blue-700"
        } ${disabled && !isRecording ? "opacity-50 cursor-not-allowed" : ""}`}
      >
        {isRecording ? (
          <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
            <rect x="6" y="6" width="12" height="12" rx="2" />
          </svg>
        ) : (
          <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="6" />
          </svg>
        )}
      </button>

      {/* 상태 텍스트 */}
      <div>
        {isRecording ? (
          <p className="text-red-500 font-medium">
            녹음 중 — {formatTime(duration)}
          </p>
        ) : hasRecording ? (
          <p className="text-green-600 font-medium">
            녹음 완료 ({formatTime(duration)})
          </p>
        ) : (
          <p className="text-gray-500">녹음 시작 버튼을 누르세요</p>
        )}
      </div>

      {/* 오디오 레벨 미터 */}
      {isRecording && (
        <div className="flex items-center justify-center gap-0.5">
          {Array.from({ length: 20 }).map((_, i) => (
            <div
              key={i}
              className="w-1.5 rounded-full transition-all duration-75"
              style={{
                height: `${Math.max(4, audioLevel * 40 * (1 + Math.sin(i * 0.5)))}px`,
                backgroundColor:
                  audioLevel > 0.7
                    ? "#ef4444"
                    : audioLevel > 0.3
                    ? "#f59e0b"
                    : "#22c55e",
              }}
            />
          ))}
        </div>
      )}

      {/* 청크 정보 */}
      {isRecording && chunkCount > 0 && (
        <p className="text-xs text-gray-400">
          {chunkCount}개 청크 저장됨
        </p>
      )}

      {/* 에러 */}
      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}
    </div>
  );
}
