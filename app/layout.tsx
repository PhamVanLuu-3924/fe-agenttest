import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "VDAgent — Phân tích bất động sản",
  description: "Không gian làm việc multi-agent cho Sales Operations",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="vi">
      <body>
        {children}
        <script src="https://mcp.figma.com/mcp/html-to-design/capture.js" async />
      </body>
    </html>
  );
}
