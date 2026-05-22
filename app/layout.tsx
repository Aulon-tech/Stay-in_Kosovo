import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers/Providers";
import { ToastHost } from "@/components/ui/ToastHost";
import { CRITICAL_CSS } from "@/lib/critical-css";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  display: "swap",
});

export const metadata: Metadata = {
  title: "KosovoGo",
  description: "AI-powered city experience and itinerary app for Prishtina",
  manifest: "/manifest.json",
  appleWebApp: { capable: true, title: "KosovoGo" },
};

export const viewport: Viewport = {
  themeColor: "#0E6E6E",
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
    <html lang="sq" className={jakarta.variable}>
      <head>
        <style dangerouslySetInnerHTML={{ __html: CRITICAL_CSS }} />
      </head>
      <body
        className={`${jakarta.className} min-h-screen bg-kg-surface font-sans text-kg-neutral antialiased`}
      >
        <Providers>
          {children}
          <ToastHost />
        </Providers>
      </body>
    </html>
  );
}
