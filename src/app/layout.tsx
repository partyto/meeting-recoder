import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "회의록 자동 생성",
  description: "녹음/파일에서 자동으로 회의록을 생성합니다",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
