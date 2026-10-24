import { iconImage } from "@/lib/icon-image";

const SIZES = [192, 512];

// Android install icons, listed in the manifest
export function generateStaticParams() {
  return SIZES.map((size) => ({ size: String(size) }));
}

export async function GET(_request: Request, { params }: { params: Promise<{ size: string }> }) {
  const size = Number((await params).size);
  if (!SIZES.includes(size)) return new Response("Not found", { status: 404 });
  return iconImage(size);
}
