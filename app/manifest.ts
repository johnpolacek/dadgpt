import type { MetadataRoute } from "next";

// Opened from the home screen, the app runs without browser bars
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "DADGPT",
    short_name: "DADGPT",
    description: "Ask Dad anything.",
    // Opening from the home screen goes straight to Dad
    start_url: "/free",
    display: "standalone",
    orientation: "any",
    background_color: "#000000",
    theme_color: "#000000",
    icons: [
      { src: "/app-icon/192", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/app-icon/512", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/app-icon/512", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
