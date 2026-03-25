import type { TranscriptSegment } from "./types";

/**
 * 녹취록 → 회의록 변환 Claude 프롬프트 생성
 * Python 원본(회의록앱.py 116~169줄)에서 이식 + 화자분리 지원 추가
 */
export function buildMinutesPrompt(
  transcript: string,
  meetingTitle: string,
  segments?: TranscriptSegment[]
): string {
  const now = new Date();
  const nowStr = `${now.getFullYear()}년 ${now.getMonth() + 1}월 ${now.getDate()}일 ${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

  // 화자분리 세그먼트가 있으면 화자 라벨 포함 텍스트 생성
  const transcriptText =
    segments && segments.some((s) => s.speaker)
      ? segments.map((s) => `[${s.speaker}] ${s.text}`).join("\n")
      : transcript;

  return `아래는 회의 녹취 내용입니다.
이 내용을 바탕으로 전문적인 회의록을 Confluence Storage Format(HTML)으로 작성해주세요.

[녹취 내용]
${transcriptText}

[작성 지침]
- 없는 내용은 "해당 없음" 또는 "미확인"으로 표기하세요.
- 명확하고 간결하게 작성하세요.
- "협의가 필요한 사항"은 결론이 나지 않았거나 추가 논의·합의가 필요한 항목입니다.
- "추가 확인/검토 사안"은 사실 확인, 데이터 조회, 외부 확인 등이 필요한 미결 항목입니다.
- HTML 태그만 출력하세요 (코드블록, 설명 텍스트 없이).
${segments && segments.some((s) => s.speaker) ? "- [화자N] 형식으로 발화자가 표시되어 있으니, 누가 어떤 발언을 했는지 반영하세요.\n" : ""}
[출력 형식]

<h2>회의 기본 정보</h2>
<table>
<tr><th>항목</th><th>내용</th></tr>
<tr><td>회의 제목</td><td>${meetingTitle}</td></tr>
<tr><td>회의 일시</td><td>${nowStr}</td></tr>
<tr><td>참석자</td><td>녹취에서 파악된 참석자 목록</td></tr>
</table>

<h2>회의 목적</h2>
<p>이 회의의 주요 목적을 1~2문장으로 요약</p>

<h2>주요 논의 사항</h2>
<ul>
<li><strong>주제 1:</strong> 논의 내용 상세 기술</li>
</ul>

<h2>결정 사항</h2>
<ul>
<li>회의에서 최종 결정된 사항</li>
</ul>

<h2>협의가 필요한 사항</h2>
<ul>
<li><strong>항목 1:</strong> 내용 및 현재 상황</li>
</ul>

<h2>추가 확인/검토 사안</h2>
<ul>
<li><strong>확인 항목 1:</strong> 확인이 필요한 내용</li>
</ul>

<h2>액션 아이템</h2>
<table>
<tr><th>담당자</th><th>할 일</th><th>기한</th></tr>
<tr><td>이름</td><td>내용</td><td>날짜 또는 미정</td></tr>
</table>

<h2>기타 참고 사항</h2>
<p>기타 메모 또는 해당 없음</p>`;
}

/** Claude 응답에서 ```html 코드블록 래핑 제거 */
export function cleanHtmlResponse(html: string): string {
  let cleaned = html.trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.split("\n").slice(1).join("\n");
  }
  if (cleaned.endsWith("```")) {
    cleaned = cleaned.split("\n").slice(0, -1).join("\n");
  }
  return cleaned.trim();
}
