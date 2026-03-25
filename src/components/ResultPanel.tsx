"use client";

import { useCallback } from "react";

export default function ResultPanel({
  minutesHtml,
  confluenceUrl,
  title,
}: {
  minutesHtml?: string;
  confluenceUrl?: string;
  title: string;
}) {
  const handleDownload = useCallback(() => {
    if (!minutesHtml) return;

    const now = new Date();
    const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}_${String(now.getHours()).padStart(2, "0")}${String(now.getMinutes()).padStart(2, "0")}`;
    const safeTitle = title.replace(/ /g, "_").replace(/\//g, "-");

    const fullHtml = `<!DOCTYPE html>
<html lang="ko"><head><meta charset="UTF-8"><title>${title}</title>
<style>
body{font-family:-apple-system,sans-serif;max-width:860px;margin:40px auto;padding:20px;color:#333;line-height:1.6}
table{border-collapse:collapse;width:100%;margin:12px 0}
th,td{border:1px solid #ddd;padding:10px 14px;text-align:left}
th{background:#f0f4ff;font-weight:600}
h1{color:#0052cc}h2{color:#0052cc;border-bottom:2px solid #0052cc;padding-bottom:6px;margin-top:32px}
ul{padding-left:20px}li{margin-bottom:6px}
</style></head><body>
<h1>${title}</h1>${minutesHtml}
<hr style="margin-top:40px">
<p style="color:#999;font-size:12px">자동 생성: ${now.toLocaleString("ko-KR")}</p>
</body></html>`;

    const blob = new Blob([fullHtml], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${dateStr}_${safeTitle}_회의록.html`;
    a.click();
    URL.revokeObjectURL(url);
  }, [minutesHtml, title]);

  return (
    <div className="mt-6 bg-white rounded-xl shadow-sm border border-green-200 overflow-hidden">
      <div className="px-4 py-3 bg-green-50 border-b border-green-200">
        <span className="text-sm font-medium text-green-700">
          회의록 생성 완료
        </span>
      </div>
      <div className="p-4 space-y-3">
        {/* 다운로드 버튼 */}
        <button
          onClick={handleDownload}
          className="w-full py-2.5 text-white font-medium rounded-lg transition-colors"
          style={{ backgroundColor: "var(--primary)" }}
        >
          회의록 HTML 다운로드
        </button>

        {/* Confluence 링크 */}
        {confluenceUrl && (
          <a
            href={confluenceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full py-2.5 text-center text-blue-600 font-medium border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors"
          >
            Confluence에서 보기
          </a>
        )}

        {/* 회의록 미리보기 */}
        {minutesHtml && (
          <details className="mt-2">
            <summary className="text-sm text-gray-500 cursor-pointer hover:text-gray-700">
              회의록 미리보기
            </summary>
            <div
              className="mt-3 p-4 border rounded-lg prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: minutesHtml }}
            />
          </details>
        )}
      </div>
    </div>
  );
}
