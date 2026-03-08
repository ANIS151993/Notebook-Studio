import type { Metadata } from "next";
import { JetBrains_Mono, Space_Grotesk } from "next/font/google";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const jetBrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Notebook Studio",
  description: "CSV cleaning, notebook generation, visualizations, and secure authentication.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${spaceGrotesk.variable} ${jetBrainsMono.variable} font-sans antialiased`}
        suppressHydrationWarning
      >
        <div className="flex min-h-screen flex-col">
          <div className="flex-1">{children}</div>
          <footer className="border-t border-[#d4af37]/35 bg-[#0f0f0f] px-6 py-4 text-center">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-[#f4d03f]">
              Copyright MD ANISUR RAHMAN CHOWDHURY
            </p>
            <p className="mt-1 text-[11px] uppercase tracking-[0.22em] text-[#c9a961]">
              Gannon UNIVERSITY
            </p>
          </footer>
        </div>
      </body>
    </html>
  );
}
