import { GoogleGenerativeAI } from "@google/generative-ai";
import { buildMinutesPrompt, cleanHtmlResponse } from "./prompts";
import type { TranscriptSegment } from "./types";

function getGemini() {
  return new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
}

export async function generateMinutes(
  transcript: string,
  title: string,
  segments?: TranscriptSegment[]
): Promise<string> {
  const prompt = buildMinutesPrompt(transcript, title, segments);

  const model = getGemini().getGenerativeModel({ model: "gemini-1.5-flash" });
  const result = await model.generateContent(prompt);
  const html = result.response.text();
  return cleanHtmlResponse(html);
}
