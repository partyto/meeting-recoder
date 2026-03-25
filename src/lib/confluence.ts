/**
 * Confluence REST API 연동
 * Python 원본(회의록앱.py 232~270줄)에서 이식
 */

const CONFLUENCE_URL = process.env.CONFLUENCE_URL ?? "";
const CONFLUENCE_EMAIL = process.env.CONFLUENCE_EMAIL ?? "";
const CONFLUENCE_API_TOKEN = process.env.CONFLUENCE_API_TOKEN ?? "";
const CONFLUENCE_SPACE_KEY = process.env.CONFLUENCE_SPACE_KEY ?? "";
const CONFLUENCE_FOLDER_ID = process.env.CONFLUENCE_FOLDER_ID ?? "";

function authHeader(): string {
  return (
    "Basic " +
    Buffer.from(`${CONFLUENCE_EMAIL}:${CONFLUENCE_API_TOKEN}`).toString(
      "base64"
    )
  );
}

export function isConfluenceConfigured(): boolean {
  return !!(CONFLUENCE_URL && CONFLUENCE_EMAIL && CONFLUENCE_API_TOKEN && CONFLUENCE_SPACE_KEY);
}

/**
 * Confluence 페이지 생성 + 오디오 파일 첨부 (선택)
 */
export async function uploadToConfluence(
  title: string,
  htmlContent: string,
  audioBuffer?: Buffer,
  audioFilename?: string
): Promise<{ pageUrl: string; pageId: string }> {
  if (!isConfluenceConfigured()) {
    throw new Error("Confluence 설정이 완료되지 않았습니다.");
  }

  // 페이지 생성
  const data: Record<string, unknown> = {
    type: "page",
    title,
    space: { key: CONFLUENCE_SPACE_KEY },
    body: {
      storage: { value: htmlContent, representation: "storage" },
    },
  };
  if (CONFLUENCE_FOLDER_ID) {
    data.ancestors = [{ id: CONFLUENCE_FOLDER_ID }];
  }

  const createResp = await fetch(
    `${CONFLUENCE_URL}/wiki/rest/api/content`,
    {
      method: "POST",
      headers: {
        Authorization: authHeader(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    }
  );

  if (!createResp.ok) {
    const errText = await createResp.text();
    throw new Error(
      `Confluence 페이지 생성 오류 (${createResp.status}): ${errText.slice(0, 200)}`
    );
  }

  const info = await createResp.json();
  const pageId = info.id;
  const pageUrl = `${CONFLUENCE_URL}/wiki${info._links.webui}`;

  // 오디오 파일 첨부 (선택)
  if (audioBuffer && audioFilename) {
    const formData = new FormData();
    const blob = new Blob([new Uint8Array(audioBuffer)]);
    formData.append("file", blob, audioFilename);

    await fetch(
      `${CONFLUENCE_URL}/wiki/rest/api/content/${pageId}/child/attachment`,
      {
        method: "POST",
        headers: {
          Authorization: authHeader(),
          "X-Atlassian-Token": "no-check",
        },
        body: formData,
      }
    );
  }

  return { pageUrl, pageId };
}
