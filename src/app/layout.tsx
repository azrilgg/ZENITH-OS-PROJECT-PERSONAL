import type { Metadata } from "next";
import { Outfit, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import AppShell from "@/components/layout/AppShell";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "ZENITH OS — Productivity Engine",
  description: "Hyper-Minimalist Spatial Tech Productivity Web App. Master your tasks, focus, habits, and time with a 2026-futuristic interface.",
  keywords: ["productivity", "task manager", "pomodoro", "habit tracker", "calendar"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${outfit.variable} ${jetbrainsMono.variable} dark`}
    >
      <head>
        <meta name="theme-color" content="#06060B" />
      </head>
      <body
        className="min-h-screen antialiased"
        style={{
          fontFamily: "var(--font-outfit), var(--font-sans)",
          background: "var(--bg-primary)",
          color: "var(--text-primary)",
        }}
      >
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
