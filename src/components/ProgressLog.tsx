"use client";

import { useEffect, useRef } from "react";
import type { JobStatus } from "@/lib/types";

const STATUS_LABELS: Record<JobStatus, string> = {
  pending: "대기 중",
  uploading: "업로드 중",
  transcribing: "음성 인식 중",
  generating: "회의록 작성 중",
  uploading_confluence: "Confluence 업로드 중",
  done: "완료",
  error: "오류 발생",
};

export default function ProgressLog({
  logs,
  status,
}: {
  logs: string[];
  status: JobStatus;
}) {
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (boxRef.current) {
      boxRef.current.scrollTop = boxRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="mt-6 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* 헤더 */}
      <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b">
        <span className="text-sm font-medium text-gray-700">처리 현황</span>
        <span
          className={`text-xs px-2 py-1 rounded-full font-medium ${
            status === "done"
              ? "bg-green-100 text-green-700"
              : status === "error"
              ? "bg-red-100 text-red-700"
              : "bg-blue-100 text-blue-700"
          }`}
        >
          {STATUS_LABELS[status]}
        </span>
      </div>

      {/* 로그 */}
      <div
        ref={boxRef}
        className="log-box bg-gray-900 text-gray-300 p-4 text-sm font-mono max-h-60 overflow-y-auto"
      >
        {logs.length === 0 ? (
          <p className="text-gray-500">처리가 시작되면 로그가 표시됩니다...</p>
        ) : (
          logs.map((log, i) => (
            <p key={i} className="mb-1">
              <span className="text-gray-500 mr-2">▸</span>
              {log}
            </p>
          ))
        )}
      </div>
    </div>
  );
}
