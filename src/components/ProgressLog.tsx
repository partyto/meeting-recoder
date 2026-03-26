"use client";

import { useEffect, useRef } from "react";
import type { JobStatus } from "@/lib/types";

const STATUS_CONFIG: Record<JobStatus, { label: string; color: string; bg: string; border: string; dot: string }> = {
  pending:              { label: "대기 중",             color: "#94A3B8", bg: "rgba(148,163,184,0.08)", border: "rgba(148,163,184,0.2)", dot: "#94A3B8" },
  uploading:            { label: "업로드 중",            color: "#60A5FA", bg: "rgba(96,165,250,0.08)",  border: "rgba(96,165,250,0.2)",  dot: "#60A5FA" },
  transcribing:         { label: "음성 인식 중",         color: "#A78BFA", bg: "rgba(167,139,250,0.08)", border: "rgba(167,139,250,0.2)", dot: "#A78BFA" },
  generating:           { label: "회의록 작성 중",       color: "#34D399", bg: "rgba(52,211,153,0.08)",  border: "rgba(52,211,153,0.2)",  dot: "#34D399" },
  uploading_confluence: { label: "Confluence 업로드 중", color: "#60A5FA", bg: "rgba(96,165,250,0.08)",  border: "rgba(96,165,250,0.2)",  dot: "#60A5FA" },
  done:                 { label: "완료",                 color: "#4ADE80", bg: "rgba(74,222,128,0.08)",  border: "rgba(74,222,128,0.2)",  dot: "#4ADE80" },
  error:                { label: "오류 발생",             color: "#F87171", bg: "rgba(248,113,113,0.08)", border: "rgba(248,113,113,0.2)", dot: "#F87171" },
};

export default function ProgressLog({
  logs,
  status,
}: {
  logs: string[];
  status: JobStatus;
}) {
  const boxRef = useRef<HTMLDivElement>(null);
  const cfg = STATUS_CONFIG[status];
  const isActive = !["done", "error"].includes(status);

  useEffect(() => {
    if (boxRef.current) {
      boxRef.current.scrollTop = boxRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div
      className="w-full max-w-lg mt-4 overflow-hidden animate-fade-in-up delay-200"
      style={{
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: '1.5rem',
      }}
    >
      {/* 헤더 */}
      <div
        className="flex items-center justify-between px-5 py-3.5"
        style={{
          borderBottom: '1px solid rgba(255,255,255,0.05)',
          background: 'rgba(255,255,255,0.02)',
        }}
      >
        <div className="flex items-center gap-2">
          {/* 트래픽 라이트 스타일 점 */}
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500/40" />
            <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/40" />
            <div className="w-2.5 h-2.5 rounded-full bg-green-500/40" />
          </div>
          <span
            className="text-xs font-mono ml-2"
            style={{ color: 'rgba(255,255,255,0.25)' }}
          >
            처리 현황
          </span>
        </div>

        {/* 상태 배지 */}
        <div
          className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium"
          style={{
            background: cfg.bg,
            border: `1px solid ${cfg.border}`,
            color: cfg.color,
          }}
        >
          <div
            className="w-1.5 h-1.5 rounded-full"
            style={{
              background: cfg.dot,
              boxShadow: isActive ? `0 0 6px ${cfg.dot}` : 'none',
              animation: isActive ? 'pulse 1.5s ease-in-out infinite' : 'none',
            }}
          />
          {cfg.label}
        </div>
      </div>

      {/* 로그 터미널 */}
      <div
        ref={boxRef}
        className="log-box p-4 text-xs font-mono max-h-52 overflow-y-auto leading-relaxed"
        style={{
          background: '#0a0a0c',
          color: 'rgba(255,255,255,0.6)',
        }}
      >
        {logs.length === 0 ? (
          <span style={{ color: 'rgba(255,255,255,0.2)' }}>
            처리가 시작되면 로그가 표시됩니다...
          </span>
        ) : (
          logs.map((log, i) => (
            <div key={i} className="flex items-start gap-2 mb-1.5">
              <span style={{ color: 'var(--accent)', opacity: 0.5, flexShrink: 0 }}>›</span>
              <span>{log}</span>
            </div>
          ))
        )}
        {/* 커서 깜빡임 */}
        {isActive && (
          <div className="flex items-center gap-2 mt-1">
            <span style={{ color: 'var(--accent)', opacity: 0.5 }}>›</span>
            <span
              className="w-1.5 h-3.5 inline-block"
              style={{
                background: 'var(--accent)',
                opacity: 0.7,
                animation: 'blink 1s step-end infinite',
              }}
            />
          </div>
        )}
      </div>

      <style>{`
        @keyframes blink { 0%,100%{opacity:0.7} 50%{opacity:0} }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
      `}</style>
    </div>
  );
}
