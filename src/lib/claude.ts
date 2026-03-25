import Anthropic from "@anthropic-ai/sdk";
import { buildMinutesPrompt, cleanHtmlResponse } from "./prompts";
import type { TranscriptSegment } from "./types";

function getAnthropic() {
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
}

/**
 * Claude API로 회의록 HTML 생성
 */
export async function generateMinutes(
  transcript: string,
  title: string,
  segments?: TranscriptSegment[]
): Promise<string> {
  const prompt = buildMinutesPrompt(transcript, title, segments);

  const message = await getAnthropic().messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 16000,
    messages: [{ role: "user", content: prompt }],
  });

  const html =
    message.content[0].type === "text" ? message.content[0].text : "";
  return cleanHtmlResponse(html);
}

/**
 * Claude API 스트리밍으로 회의록 HTML 생성 (SSE용)
 */
export async function* generateMinutesStream(
  transcript: string,
  title: string,
  segments?: TranscriptSegment[]
): AsyncGenerator<string> {
  const prompt = buildMinutesPrompt(transcript, title, segments);

  const stream = getAnthropic().messages.stream({
    model: "claude-sonnet-4-6",
    max_tokens: 16000,
    messages: [{ role: "user", content: prompt }],
  });

  for await (const event of stream) {
    if (
      event.type === "content_block_delta" &&
      event.delta.type === "text_delta"
    ) {
      yield event.delta.text;
    }
  }
}
