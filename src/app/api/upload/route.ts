import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";

export const runtime = "nodejs";

/**
 * POST /api/upload — 오디오/텍스트 파일을 Vercel Blob에 업로드
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "파일이 없습니다." }, { status: 400 });
    }

    // Vercel Blob에 업로드
    const blob = await put(file.name, file, {
      access: "private",
    });

    return NextResponse.json({
      blobUrl: blob.url,
      filename: file.name,
      size: file.size,
    });
  } catch (error) {
    console.error("[upload] error:", error);
    const message =
      error instanceof Error ? error.message : "업로드 실패";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
