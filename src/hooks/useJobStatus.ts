"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { Job } from "@/lib/types";

/**
 * 작업 상태 폴링 훅
 */
export function useJobStatus(jobId: string | null) {
  const [job, setJob] = useState<Job | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const poll = useCallback(async () => {
    if (!jobId) return;
    try {
      const resp = await fetch(`/api/status?jobId=${jobId}`);
      if (resp.ok) {
        const data = await resp.json();
        setJob(data);
        // 완료/에러 시 폴링 중지
        if (data.status === "done" || data.status === "error") {
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
        }
      }
    } catch {
      // 네트워크 에러 — 다음 폴링에서 재시도
    }
  }, [jobId]);

  useEffect(() => {
    if (!jobId) {
      setJob(null);
      return;
    }

    poll(); // 즉시 한 번 실행
    intervalRef.current = setInterval(poll, 1500);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [jobId, poll]);

  return { job };
}
