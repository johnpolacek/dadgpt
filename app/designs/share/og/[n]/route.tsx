import { ImageResponse } from "next/og";
import { loadOgAssets } from "@/lib/og-assets";
import { DESIGNS, OG_SIZE } from "@/lib/og-designs";

export function generateStaticParams() {
  return DESIGNS.map((_, i) => ({ n: String(i + 1) }));
}

export async function GET(_request: Request, { params }: { params: Promise<{ n: string }> }) {
  const design = DESIGNS[Number((await params).n) - 1];
  if (!design) return new Response("Not found", { status: 404 });
  const { assets, fonts } = await loadOgAssets();
  return new ImageResponse(design.render(assets), { ...OG_SIZE, fonts });
}
