import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import { Trophy } from "lucide-react";
import { BottomNav } from "@/components/BottomNav";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Play da Tarde",
  description: "Torneio de tênis Play da Tarde — grupos, chaves e ranking",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#047857",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className={`${geistSans.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <header className="sticky top-0 z-10 bg-emerald-700 text-white">
          <div className="mx-auto flex h-14 max-w-3xl items-center gap-2 px-4">
            <Trophy size={22} />
            <span className="text-lg font-semibold">Play da Tarde</span>
          </div>
        </header>
        <main className="mx-auto w-full max-w-3xl flex-1 px-4 pt-4 pb-24">{children}</main>
        <BottomNav />
      </body>
    </html>
  );
}
