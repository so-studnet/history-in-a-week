import type { Metadata, Viewport } from "next";
import "./globals.css";
import { SyncBoot } from "@/components/sync-boot";

export const metadata: Metadata = {
  title: "歴検2級 世界史 直前演習",
  description: "歴史能力検定 世界史2級の4択演習・苦手の復習",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ja" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <SyncBoot />
        {children}
      </body>
    </html>
  );
}
