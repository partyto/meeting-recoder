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
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css">
<style>
*{box-sizing:border-box}
body{font-family:'Pretendard',sans-serif;max-width:860px;margin:40px auto;padding:20px 32px;color:#1a1a2e;line-height:1.7;background:#fafafa;word-break:keep-all}
h1{font-size:1.75rem;font-weight:700;color:#1a1a2e;margin-bottom:4px}
h2{font-size:1.1rem;font-weight:600;color:#1a1a2e;border-bottom:1.5px solid #e5e7eb;padding-bottom:8px;margin-top:2.5rem}
table{border-collapse:collapse;width:100%;margin:14px 0;font-size:0.9rem}
th,td{border:1px solid #e5e7eb;padding:10px 14px;text-align:left}
th{background:#f3f4f6;font-weight:600;color:#374151}
ul,ol{padding-left:22px}li{margin-bottom:5px}
.meta{color:#9ca3af;font-size:0.8rem;margin-bottom:2.5rem;padding-bottom:1rem;border-bottom:1px solid #f3f4f6}
</style></head><body>
<h1>${title}</h1>
<div class="meta">자동 생성: ${now.toLocaleString("ko-KR")}</div>
${minutesHtml}
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
    <div
      className="w-full max-w-lg mt-4 overflow-hidden animate-fade-in-up delay-300"
      style={{
        background: 'rgba(74,222,128,0.04)',
        border: '1px solid rgba(74,222,128,0.15)',
        borderRadius: '1.5rem',
      }}
    >
      {/* 헤더 */}
      <div
        className="flex items-center gap-2.5 px-5 py-4"
        style={{ borderBottom: '1px solid rgba(74,222,128,0.1)' }}
      >
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ background: 'rgba(74,222,128,0.15)' }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="M9 12l2 2 4-4M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" stroke="#4ADE80" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <span className="text-sm font-semibold" style={{ color: '#4ADE80' }}>
          회의록 생성 완료
        </span>
      </div>

      {/* 버튼 영역 */}
      <div className="p-5 space-y-3">
        {/* 다운로드 버튼 */}
        <button
          onClick={handleDownload}
          className="w-full py-3.5 rounded-full text-sm font-semibold flex items-center justify-center gap-2.5 transition-all duration-300"
          style={{
            background: '#4ADE80',
            color: '#052e16',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.02)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
          onMouseDown={(e) => { e.currentTarget.style.transform = 'scale(0.98)'; }}
          onMouseUp={(e) => { e.currentTarget.style.transform = 'scale(1.02)'; }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          회의록 HTML 다운로드
          <div
            className="w-6 h-6 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(0,0,0,0.1)' }}
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
              <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </button>

        {/* Confluence 링크 */}
        {confluenceUrl && (
          <a
            href={confluenceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-3.5 rounded-full text-sm font-medium transition-all duration-300"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              color: 'rgba(255,255,255,0.7)',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.08)';
              (e.currentTarget as HTMLElement).style.transform = 'scale(1.01)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)';
              (e.currentTarget as HTMLElement).style.transform = 'scale(1)';
            }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Confluence에서 보기
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </a>
        )}

        {/* 회의록 미리보기 */}
        {minutesHtml && (
          <details className="mt-2">
            <summary
              className="text-xs cursor-pointer transition-colors duration-200 list-none flex items-center gap-1.5"
              style={{ color: 'rgba(255,255,255,0.3)' }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.6)'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.3)'; }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8zM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z" stroke="currentColor" strokeWidth="2"/>
              </svg>
              미리보기
            </summary>
            <div
              className="mt-3 p-4 rounded-xl text-sm prose prose-sm prose-invert max-w-none"
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.06)',
                color: 'rgba(255,255,255,0.7)',
              }}
              dangerouslySetInnerHTML={{ __html: minutesHtml }}
            />
          </details>
        )}
      </div>
    </div>
  );
}
