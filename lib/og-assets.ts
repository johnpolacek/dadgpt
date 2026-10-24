import { readFile } from "node:fs/promises";
import { join } from "node:path";
import type { ImageResponse } from "next/og";
import type { OgAssets } from "./og-designs";

// Loaded once per server. The static TTFs stand in for the variable font, which Satori can't read.
type Fonts = NonNullable<ConstructorParameters<typeof ImageResponse>[1]>["fonts"];
let assets: Promise<{ assets: OgAssets; fonts: Fonts }> | undefined;

export function loadOgAssets() {
  assets ??= Promise.all([
    readFile(join(process.cwd(), "public/kit/costume.svg")),
    readFile(join(process.cwd(), "assets/og/google-sans-flex-400.ttf")),
    readFile(join(process.cwd(), "assets/og/google-sans-flex-700.ttf")),
  ]).then(([costume, regular, bold]) => ({
    assets: { costume: `data:image/svg+xml;base64,${costume.toString("base64")}` },
    fonts: [
      { name: "Google Sans Flex", data: regular, weight: 400 as const, style: "normal" as const },
      { name: "Google Sans Flex", data: bold, weight: 700 as const, style: "normal" as const },
    ],
  }));
  return assets;
}
