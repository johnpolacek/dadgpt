import type { Metadata, Viewport } from "next";
import { Google_Sans_Flex } from "next/font/google";
import "./globals.css";
import PressParticles from "./press-particles";

// Hide text until the font loads, since animations wait on document.fonts.ready anyway.
// Next has no fallback metrics for this font yet, so skip the generated fallback.
const googleSans = Google_Sans_Flex({
  subsets: ["latin"],
  display: "block",
  adjustFontFallback: false,
  fallback: ["system-ui", "sans-serif"],
});

export const metadata: Metadata = {
  title: "DADGPT",
  description: "Ask Dad anything.",
};

// Cover lets the page reach under a sideways phone's notch; safe-area padding keeps content clear of it
export const viewport: Viewport = { viewportFit: "cover" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Lets CSS hide intro elements before first paint, only when JS runs */}
        <script dangerouslySetInnerHTML={{ __html: "document.documentElement.classList.add('js')" }} />
      </head>
      <body className={googleSans.className}>
        {children}
        <PressParticles />
      </body>
    </html>
  );
}
