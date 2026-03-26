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
    <div className="flex flex-col items-center py-8 gap-6">
      {/* 녹음 버튼 */}
      <div className="relative flex items-center justify-center">
        {/* 외부 링 */}
        <div
          className="absolute rounded-full transition-all duration-500"
          style={{
            width: isRecording ? '110px' : '96px',
            height: isRecording ? '110px' : '96px',
            background: isRecording
              ? 'rgba(239,68,68,0.08)'
              : 'rgba(96,165,250,0.06)',
            border: isRecording
              ? '1px solid rgba(239,68,68,0.2)'
              : '1px solid rgba(96,165,250,0.15)',
          }}
        />

        {/* 버튼 */}
        <button
          onClick={handleToggle}
          disabled={disabled && !isRecording}
          className={`relative w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 ${
            isRecording ? 'animate-pulse-recording' : ''
          }`}
          style={{
            background: isRecording
              ? 'rgba(239,68,68,0.15)'
              : 'rgba(96,165,250,0.12)',
            border: isRecording
              ? '1.5px solid rgba(239,68,68,0.4)'
              : '1.5px solid rgba(96,165,250,0.3)',
            boxShadow: isRecording
              ? 'inset 0 1px 0 rgba(255,255,255,0.1), 0 0 24px rgba(239,68,68,0.15)'
              : 'inset 0 1px 0 rgba(255,255,255,0.08), 0 0 24px rgba(96,165,250,0.1)',
            cursor: disabled && !isRecording ? 'not-allowed' : 'pointer',
            opacity: disabled && !isRecording ? 0.4 : 1,
            transform: 'scale(1)',
          }}
          onMouseEnter={(e) => {
            if (!disabled || isRecording) e.currentTarget.style.transform = 'scale(1.04)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
          }}
          onMouseDown={(e) => {
            if (!disabled || isRecording) e.currentTarget.style.transform = 'scale(0.96)';
          }}
          onMouseUp={(e) => {
            if (!disabled || isRecording) e.currentTarget.style.transform = 'scale(1.04)';
          }}
        >
          {isRecording ? (
            /* 정지 아이콘 */
            <div
              className="w-7 h-7 rounded-lg"
              style={{ background: '#EF4444' }}
            />
          ) : (
            /* 마이크 아이콘 */
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
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
          )}
        </button>
      </div>

      {/* 상태 텍스트 */}
      <div className="text-center">
        {isRecording ? (
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
            <span className="text-sm font-medium" style={{ color: '#FCA5A5' }}>
              녹음 중 — {formatTime(duration)}
            </span>
          </div>
        ) : hasRecording ? (
          <div className="flex items-center gap-2">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M9 12l2 2 4-4M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" stroke="#4ADE80" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span className="text-sm font-medium" style={{ color: '#4ADE80' }}>
              녹음 완료 — {formatTime(duration)}
            </span>
          </div>
        ) : (
          <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            버튼을 눌러 녹음을 시작하세요
          </span>
        )}
      </div>

      {/* 오디오 레벨 미터 */}
      {isRecording && (
        <div className="flex items-center justify-center gap-0.5 h-8">
          {Array.from({ length: 24 }).map((_, i) => {
            const level = audioLevel * (1 + 0.4 * Math.sin(i * 0.7 + Date.now() / 200));
            const height = Math.max(3, level * 28);
            return (
              <div
                key={i}
                className="w-1 rounded-full transition-all duration-75"
                style={{
                  height: `${height}px`,
                  background: audioLevel > 0.7
                    ? '#F87171'
                    : audioLevel > 0.35
                    ? '#FBBF24'
                    : 'var(--accent)',
                  opacity: 0.7 + audioLevel * 0.3,
                }}
              />
            );
          })}
        </div>
      )}

      {/* 청크 정보 */}
      {isRecording && chunkCount > 0 && (
        <span
          className="text-xs px-2.5 py-1 rounded-full"
          style={{
            background: 'rgba(255,255,255,0.05)',
            color: 'var(--text-secondary)',
            border: '1px solid var(--border)',
          }}
        >
          {chunkCount}개 청크 저장됨
        </span>
      )}

      {/* 에러 */}
      {error && (
        <p className="text-sm text-red-400 text-center">{error}</p>
      )}
    </div>
  );
}
