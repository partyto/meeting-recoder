import { NextRequest, NextResponse } from "next/server";
import { inngest } from "@/lib/inngest";
import { createJob } from "@/lib/job-store";

export const runtime = "nodejs";

/**
 * POST /api/transcribe — STT 파이프라인 트리거
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      blobUrl,
      title,
      sourceType,
      useConfluence = false,
      useDiarization = false,
    } = body;

    if (!blobUrl) {
      return NextResponse.json(
        { error: "blobUrl이 필요합니다." },
        { status: 400 }
      );
    }

    // 작업 ID 생성
    const jobId = `job_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    // 작업 생성
    await createJob(jobId, {
      title: title || `회의록 ${new Date().toLocaleString("ko-KR")}`,
      sourceType: sourceType || "audio",
      blobUrl,
      useConfluence,
      useDiarization,
    });

    // Inngest 이벤트 발행 (백그라운드 처리 시작)
    await inngest.send({
      name: "meeting/job.created",
      data: { jobId },
    });

    return NextResponse.json({ jobId });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "작업 생성 실패";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
