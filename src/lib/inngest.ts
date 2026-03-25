import { Inngest } from "inngest";
import { transcribe } from "./stt-adapter";
import { generateMinutes } from "./claude";
import { uploadToConfluence } from "./confluence";
import { getJob, setJobStatus, addLog, updateJob } from "./job-store";
import type { STTProvider } from "./types";

export const inngest = new Inngest({ id: "meeting-minutes" });

/**
 * 회의록 생성 파이프라인
 * STT → 회의록 생성 → Confluence 업로드
 */
export const processJob = inngest.createFunction(
  {
    id: "process-meeting-job",
    retries: 1,
    triggers: [{ event: "meeting/job.created" }],
  },
  async ({ event, step }) => {
    const { jobId } = event.data as { jobId: string };

    // Step 1: 작업 정보 로드
    const job = await step.run("load-job", async () => {
      const j = await getJob(jobId);
      if (!j) throw new Error(`Job ${jobId} not found`);
      return j;
    });

    // Step 2: 오디오/텍스트 처리
    // Inngest step은 JSON 직렬화하므로 Buffer 대신 number[]로 전달
    let audioData: number[] | null = null;
    let fullText = "";

    if (job.sourceType === "text") {
      fullText = await step.run("read-text", async () => {
        await setJobStatus(jobId, "transcribing", "텍스트 파일 읽는 중...");
        if (!job.blobUrl) throw new Error("텍스트 URL이 없습니다.");
        const resp = await fetch(job.blobUrl);
        const text = await resp.text();
        await addLog(jobId, `텍스트 로드 완료 (${text.length}자)`);
        return text;
      });
    } else {
      audioData = await step.run("download-audio", async () => {
        await setJobStatus(jobId, "transcribing", "오디오 파일 다운로드 중...");
        if (!job.blobUrl) throw new Error("오디오 URL이 없습니다.");
        const resp = await fetch(job.blobUrl);
        const arrayBuffer = await resp.arrayBuffer();
        await addLog(
          jobId,
          `다운로드 완료 (${(arrayBuffer.byteLength / 1024 / 1024).toFixed(1)}MB)`
        );
        return Array.from(new Uint8Array(arrayBuffer));
      });

      // Step 3: STT 수행
      const sttResult = await step.run("transcribe", async () => {
        const provider: STTProvider = job.useDiarization ? "clova" : "groq";
        await addLog(
          jobId,
          `음성 인식 중... (${provider === "clova" ? "Clova Speech — 화자분리" : "Groq Whisper"})`
        );
        const audioBuffer = Buffer.from(audioData!);
        const result = await transcribe(
          audioBuffer,
          job.blobUrl?.split("/").pop() ?? "audio.webm",
          provider
        );
        await addLog(
          jobId,
          `음성 인식 완료! (${result.segments.length}개 세그먼트${result.hasDiarization ? ", 화자분리 포함" : ""})`
        );
        return result;
      });

      fullText = sttResult.fullText;

      await step.run("save-transcript", async () => {
        await updateJob(jobId, {
          transcript: sttResult.segments,
          fullText: sttResult.fullText,
        });
      });
    }

    // Step 4: Claude 회의록 생성
    const minutesHtml = await step.run("generate-minutes", async () => {
      await setJobStatus(jobId, "generating", "Claude가 회의록 작성 중...");
      const currentJob = await getJob(jobId);
      const html = await generateMinutes(
        fullText,
        job.title,
        currentJob?.transcript
      );
      await addLog(jobId, "회의록 작성 완료!");
      return html;
    });

    // Step 5: Confluence 업로드 (선택)
    let confluenceUrl = "";
    if (job.useConfluence) {
      confluenceUrl = await step.run("upload-confluence", async () => {
        await setJobStatus(
          jobId,
          "uploading_confluence",
          "Confluence 업로드 중..."
        );
        const audioBuffer = audioData ? Buffer.from(audioData) : undefined;
        const result = await uploadToConfluence(
          job.title,
          minutesHtml,
          audioBuffer,
          audioBuffer
            ? job.blobUrl?.split("/").pop() ?? "audio.webm"
            : undefined
        );
        await addLog(jobId, `Confluence 업로드 완료!`);
        return result.pageUrl;
      });
    }

    // Step 6: 완료
    await step.run("finalize", async () => {
      await updateJob(jobId, {
        status: "done",
        minutesHtml,
        confluenceUrl,
        fullText,
      });
      await addLog(jobId, "모든 처리가 완료되었습니다.");
    });

    return { jobId, status: "done" };
  }
);
