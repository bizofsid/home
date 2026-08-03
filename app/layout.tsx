import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Nav from "@/components/Nav";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Devonport Dollar Flow",
  description:
    "Keep Devonport's spending circulating in Devonport — a local business network and flow-tracking tool for the village.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="h-full flex flex-col bg-page text-ink">
        <Nav />
        <main className="flex-1 min-w-0">{children}</main>
        <footer className="border-t border-line px-4 py-6 text-center text-xs text-ink-muted">
          Devonport Dollar Flow — a community project for Devonport, Auckland.
          Directory started with hand-written sample listings; businesses join
          themselves from here on.
        </footer>
      </body>
    </html>
  );
}
