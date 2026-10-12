import type { ReactNode } from "react";
import { Fraunces, Outfit } from "next/font/google";
import "./globals.css";

const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit" });
const fraunces = Fraunces({ subsets: ["latin"], variable: "--font-fraunces" });

export const metadata = {
  title: "Screnn",
  description: "Share your screen with a short code. Viewers watch in the browser.",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${outfit.variable} ${fraunces.variable}`}>
      <body className="min-h-screen bg-paper font-sans text-ink antialiased">
        {children}
      </body>
    </html>
  );
}
