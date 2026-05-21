import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "@/components/providers/Providers";
import { ToastHost } from "@/components/ui/ToastHost";

export const metadata: Metadata = {
  title: "Stay in Kosovo",
  description: "Smart experience and mobility platform for Kosovo",
  manifest: "/manifest.json",
  appleWebApp: { capable: true, title: "Stay in Kosovo" },
};

export const viewport: Viewport = {
  themeColor: "#b91c1c",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="sq">
      <body>
        <Providers>
          {children}
          <ToastHost />
        </Providers>
      </body>
    </html>
  );
}
