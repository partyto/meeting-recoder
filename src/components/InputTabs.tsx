"use client";

type Tab = "text" | "audio" | "record";

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  {
    id: "record",
    label: "녹음",
    icon: (
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
        <path d="M12 2a3 3 0 0 1 3 3v6a3 3 0 0 1-6 0V5a3 3 0 0 1 3-3z" fill="currentColor"/>
        <path d="M19 10a7 7 0 0 1-14 0M12 19v3M9 22h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    id: "audio",
    label: "오디오",
    icon: (
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
        <path d="M9 18V5l12-2v13M9 18a3 3 0 1 1-6 0 3 3 0 0 1 6 0zM21 16a3 3 0 1 1-6 0 3 3 0 0 1 6 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    id: "text",
    label: "텍스트",
    icon: (
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zM14 2v6h6M16 13H8M16 17H8M10 9H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
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
    <div
      className="flex rounded-2xl p-1 gap-1"
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      {TABS.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => !disabled && onTabChange(tab.id)}
            disabled={disabled}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 text-xs font-medium rounded-xl transition-all duration-300"
            style={{
              background: isActive ? '#27272a' : 'transparent',
              color: isActive ? '#f4f4f5' : '#71717a',
              boxShadow: isActive ? 'inset 0 1px 0 rgba(255,255,255,0.08), 0 1px 3px rgba(0,0,0,0.3)' : 'none',
              cursor: disabled ? 'not-allowed' : 'pointer',
              opacity: disabled ? 0.5 : 1,
            }}
          >
            <span style={{ color: isActive ? 'var(--accent)' : 'inherit' }}>
              {tab.icon}
            </span>
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
