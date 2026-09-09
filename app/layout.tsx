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
  title: "Fit Preview",
  description:
    "Preview how an item will fit before you order it — enter your measurements once, then check any retailer's size chart against them.",
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
          Fit Preview — your measurements stay in your browser. Fit estimates
          are a heuristic, not a guarantee.
        </footer>
      </body>
    </html>
  );
}
