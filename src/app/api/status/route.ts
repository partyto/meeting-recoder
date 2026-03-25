import { NextRequest, NextResponse } from "next/server";
import { getJob } from "@/lib/job-store";

export const runtime = "nodejs";

/**
 * GET /api/status?jobId=xxx — 작업 상태 조회
 */
export async function GET(request: NextRequest) {
  const jobId = request.nextUrl.searchParams.get("jobId");

  if (!jobId) {
    return NextResponse.json(
      { error: "jobId가 필요합니다." },
      { status: 400 }
    );
  }

  const job = await getJob(jobId);

  if (!job) {
    return NextResponse.json(
      { error: "작업을 찾을 수 없습니다." },
      { status: 404 }
    );
  }

  return NextResponse.json(job);
}
