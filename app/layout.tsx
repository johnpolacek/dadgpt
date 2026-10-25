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
  title: "DADGPT Costume",
  description: "A Halloween costume you can talk to. Tap the mic, ask Dad anything, and he answers out loud with a dad joke. Or tap the camera and get roasted.",
  // Large preview cards on X. The image itself comes from opengraph-image.tsx
  twitter: { card: "summary_large_image" },
  // Home screen launches on iPhone hide Safari's bars and draw the status bar over our black
  appleWebApp: { capable: true, title: "DADGPT", statusBarStyle: "black-translucent" },
};

// Cover lets the page reach under a sideways phone's notch; safe-area padding keeps content clear of it
export const viewport: Viewport = { viewportFit: "cover", themeColor: "#000000" };

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
