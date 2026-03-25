"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useWakeLock } from "./useWakeLock";

const CHUNK_INTERVAL = 30_000; // 30초마다 청크 생성
const DB_NAME = "meeting-recorder";
const STORE_NAME = "chunks";

interface RecorderState {
  isRecording: boolean;
  duration: number; // seconds
  chunkCount: number;
  audioLevel: number; // 0-1
  error: string | null;
}

/**
 * 브라우저 녹음 훅
 * - MediaRecorder + 30초 청크
 * - IndexedDB 백업
 * - Wake Lock
 * - 오디오 레벨 미터
 * - 스트림 자동 복구
 */
export function useRecorder() {
  const [state, setState] = useState<RecorderState>({
    isRecording: false,
    duration: 0,
    chunkCount: 0,
    audioLevel: 0,
    error: null,
  });

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const levelTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const startTimeRef = useRef<number>(0);

  const wakeLock = useWakeLock();

  // IndexedDB 헬퍼
  const openDB = useCallback((): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, 1);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { autoIncrement: true });
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }, []);

  const saveChunkToDB = useCallback(
    async (chunk: Blob) => {
      const db = await openDB();
      const tx = db.transaction(STORE_NAME, "readwrite");
      tx.objectStore(STORE_NAME).add(chunk);
      db.close();
    },
    [openDB]
  );

  const clearDB = useCallback(async () => {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).clear();
    db.close();
  }, [openDB]);

  const getAllChunksFromDB = useCallback(async (): Promise<Blob[]> => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const request = tx.objectStore(STORE_NAME).getAll();
      request.onsuccess = () => {
        db.close();
        resolve(request.result as Blob[]);
      };
      request.onerror = () => {
        db.close();
        reject(request.error);
      };
    });
  }, [openDB]);

  // 오디오 레벨 측정
  const startLevelMeter = useCallback((stream: MediaStream) => {
    const audioContext = new AudioContext();
    const source = audioContext.createMediaStreamSource(stream);
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 256;
    source.connect(analyser);

    audioContextRef.current = audioContext;
    analyserRef.current = analyser;

    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    levelTimerRef.current = setInterval(() => {
      analyser.getByteFrequencyData(dataArray);
      const avg =
        dataArray.reduce((sum, val) => sum + val, 0) / dataArray.length;
      setState((prev) => ({ ...prev, audioLevel: avg / 255 }));
    }, 100);
  }, []);

  const stopLevelMeter = useCallback(() => {
    if (levelTimerRef.current) {
      clearInterval(levelTimerRef.current);
      levelTimerRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    analyserRef.current = null;
  }, []);

  // 녹음 시작
  const startRecording = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, error: null }));
      await clearDB();
      chunksRef.current = [];

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 16000,
        },
      });
      streamRef.current = stream;

      // Wake Lock 활성화
      await wakeLock.request();

      // 오디오 레벨 미터 시작
      startLevelMeter(stream);

      // MediaRecorder 설정
      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : "audio/webm";

      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = async (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
          await saveChunkToDB(e.data);
          setState((prev) => ({
            ...prev,
            chunkCount: chunksRef.current.length,
          }));
        }
      };

      // 스트림 끊김 감지 → 자동 복구
      stream.getAudioTracks()[0].onended = async () => {
        if (state.isRecording) {
          setState((prev) => ({
            ...prev,
            error: "마이크 연결이 끊겼습니다. 재연결 시도 중...",
          }));
          try {
            const newStream = await navigator.mediaDevices.getUserMedia({
              audio: true,
            });
            streamRef.current = newStream;
            // 새 recorder로 계속 녹음 (이전 청크는 보존됨)
            const newRecorder = new MediaRecorder(newStream, { mimeType });
            newRecorder.ondataavailable = recorder.ondataavailable;
            mediaRecorderRef.current = newRecorder;
            newRecorder.start(CHUNK_INTERVAL);
            startLevelMeter(newStream);
            setState((prev) => ({ ...prev, error: null }));
          } catch {
            setState((prev) => ({
              ...prev,
              error: "마이크 재연결 실패. 이전 녹음은 보존되어 있습니다.",
            }));
          }
        }
      };

      recorder.start(CHUNK_INTERVAL);
      startTimeRef.current = Date.now();

      // 타이머
      timerRef.current = setInterval(() => {
        setState((prev) => ({
          ...prev,
          duration: Math.floor((Date.now() - startTimeRef.current) / 1000),
        }));
      }, 1000);

      setState((prev) => ({
        ...prev,
        isRecording: true,
        duration: 0,
        chunkCount: 0,
      }));
    } catch (err) {
      setState((prev) => ({
        ...prev,
        error:
          err instanceof Error
            ? err.message
            : "마이크 접근에 실패했습니다.",
      }));
    }
  }, [wakeLock, startLevelMeter, clearDB, saveChunkToDB, state.isRecording]);

  // 녹음 중지 → Blob 반환
  const stopRecording = useCallback(async (): Promise<Blob | null> => {
    return new Promise((resolve) => {
      const recorder = mediaRecorderRef.current;
      if (!recorder || recorder.state === "inactive") {
        resolve(null);
        return;
      }

      recorder.onstop = async () => {
        // 타이머 정리
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }

        stopLevelMeter();
        await wakeLock.release();

        // 스트림 정리
        streamRef.current?.getTracks().forEach((t) => t.stop());
        streamRef.current = null;

        // IndexedDB에서 모든 청크 로드 (안전망)
        let chunks = chunksRef.current;
        if (chunks.length === 0) {
          chunks = await getAllChunksFromDB();
        }

        const blob = new Blob(chunks, { type: recorder.mimeType });

        setState((prev) => ({
          ...prev,
          isRecording: false,
          audioLevel: 0,
        }));

        resolve(blob);
      };

      recorder.stop();
    });
  }, [stopLevelMeter, wakeLock, getAllChunksFromDB]);

  // 컴포넌트 언마운트 시 정리
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      stopLevelMeter();
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, [stopLevelMeter]);

  return {
    ...state,
    startRecording,
    stopRecording,
  };
}
