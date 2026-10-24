import { ImageResponse } from "next/og";
import { loadOgAssets } from "@/lib/og-assets";
import { DESIGNS, OG_SIZE } from "@/lib/og-designs";

// The picked share design: Costume party
const design = DESIGNS.find((d) => d.title === "Costume party")!;

export const size = OG_SIZE;
export const contentType = "image/png";
export const alt =
  "This Halloween, Dad is going as artificial intelligence. Wearable Dad Joke apparatus. DADGPT, beside a drawing of the costume: a phone sideways on a black hat and the logo on a black t-shirt.";

export default async function OpengraphImage() {
  const { assets, fonts } = await loadOgAssets();
  return new ImageResponse(design.render(assets), { ...size, fonts });
}
