import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

/**
 * POST /api/upload — 클라이언트 사이드 업로드 토큰 발급
 * 파일은 브라우저에서 Vercel Blob으로 직접 업로드 (4.5MB 함수 한도 우회)
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody;
  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async () => ({
        access: "private",
        addRandomSuffix: true,
      }),
      onUploadCompleted: async ({ blob }) => {
        console.log("[upload] completed:", blob.url);
      },
    });
    return NextResponse.json(jsonResponse);
  } catch (error) {
    console.error("[upload] error:", error);
    return NextResponse.json({ error: String(error) }, { status: 400 });
  }
}
