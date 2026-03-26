import Groq from "groq-sdk";
import { buildMinutesPrompt, cleanHtmlResponse } from "./prompts";
import type { TranscriptSegment } from "./types";

function getGroqClient() {
  return new Groq({ apiKey: process.env.GROQ_API_KEY });
}

/**
 * Groq LLM(llama-3.3-70b)으로 회의록 HTML 생성
 */
// Groq 무료 플랜 TPM 한도(6,000) 내에서 안전하게 처리할 수 있는 최대 길이
const MAX_TRANSCRIPT_CHARS = 5000;

export async function generateMinutes(
  transcript: string,
  title: string,
  segments?: TranscriptSegment[]
): Promise<string> {
  const truncated =
    transcript.length > MAX_TRANSCRIPT_CHARS
      ? transcript.slice(0, MAX_TRANSCRIPT_CHARS) + "\n\n[이하 내용은 길이 제한으로 생략됨]"
      : transcript;
  const prompt = buildMinutesPrompt(truncated, title, segments);

  const completion = await getGroqClient().chat.completions.create({
    model: "llama-3.1-8b-instant",
    max_tokens: 2048,
    messages: [{ role: "user", content: prompt }],
  });

  const html = completion.choices[0]?.message?.content ?? "";
  return cleanHtmlResponse(html);
}
