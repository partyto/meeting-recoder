"use client";

import type { TranscriptSegment } from "@/lib/types";

const SPEAKER_COLORS = [
  "bg-blue-100 text-blue-700",
  "bg-green-100 text-green-700",
  "bg-purple-100 text-purple-700",
  "bg-orange-100 text-orange-700",
  "bg-pink-100 text-pink-700",
  "bg-teal-100 text-teal-700",
];

function formatMs(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function TranscriptPreview({
  segments,
}: {
  segments: TranscriptSegment[];
}) {
  const speakers = [...new Set(segments.map((s) => s.speaker).filter(Boolean))];
  const hasDiarization = speakers.length > 0;

  if (!hasDiarization) return null;

  const getSpeakerColor = (speaker: string) => {
    const idx = speakers.indexOf(speaker);
    return SPEAKER_COLORS[idx % SPEAKER_COLORS.length];
  };

  return (
    <div className="mt-6 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="px-4 py-3 bg-gray-50 border-b">
        <span className="text-sm font-medium text-gray-700">
          화자별 녹취록 ({speakers.length}명 감지)
        </span>
      </div>
      <div className="p-4 max-h-80 overflow-y-auto space-y-2">
        {segments.map((seg, i) => (
          <div key={i} className="flex gap-3 text-sm">
            <span className="text-gray-400 text-xs font-mono mt-0.5 shrink-0">
              {formatMs(seg.start)}
            </span>
            {seg.speaker && (
              <span
                className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${getSpeakerColor(seg.speaker)}`}
              >
                {seg.speaker}
              </span>
            )}
            <span className="text-gray-700">{seg.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
