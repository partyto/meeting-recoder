import Groq from "groq-sdk";
import { buildMinutesPrompt, cleanHtmlResponse } from "./prompts";
import type { TranscriptSegment } from "./types";

function getGroqClient() {
  return new Groq({ apiKey: process.env.GROQ_API_KEY });
}

/**
 * Groq LLM(llama-3.3-70b)으로 회의록 HTML 생성
 */
export async function generateMinutes(
  transcript: string,
  title: string,
  segments?: TranscriptSegment[]
): Promise<string> {
  const prompt = buildMinutesPrompt(transcript, title, segments);

  const completion = await getGroqClient().chat.completions.create({
    model: "llama-3.3-70b-versatile",
    max_tokens: 4096,
    messages: [{ role: "user", content: prompt }],
  });

  const html = completion.choices[0]?.message?.content ?? "";
  return cleanHtmlResponse(html);
}
