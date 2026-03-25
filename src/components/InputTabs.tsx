"use client";

type Tab = "text" | "audio" | "record";

const TABS: { id: Tab; label: string }[] = [
  { id: "record", label: "녹음" },
  { id: "audio", label: "오디오 파일" },
  { id: "text", label: "텍스트 파일" },
];

export default function InputTabs({
  activeTab,
  onTabChange,
  disabled,
}: {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
  disabled: boolean;
}) {
  return (
    <div className="flex rounded-lg bg-gray-100 p-1">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          onClick={() => !disabled && onTabChange(tab.id)}
          disabled={disabled}
          className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors ${
            activeTab === tab.id
              ? "bg-white text-blue-600 shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          } ${disabled ? "cursor-not-allowed opacity-50" : ""}`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
