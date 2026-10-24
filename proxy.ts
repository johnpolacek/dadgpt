import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { COOKIE_NAME, passcodeToken } from "@/lib/passcode";

export async function proxy(request: NextRequest) {
  // The front page and the free Dad with canned jokes are open to anyone
  if (request.nextUrl.pathname === "/" || request.nextUrl.pathname === "/free") return NextResponse.next();

  const passcode = process.env.PASSCODE;
  if (!passcode) return NextResponse.next();

  const cookie = request.cookies.get(COOKIE_NAME)?.value;
  if (cookie === (await passcodeToken(passcode))) return NextResponse.next();

  if (request.nextUrl.pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Locked" }, { status: 401 });
  }
  return NextResponse.redirect(new URL("/unlock", request.url));
}

export const config = {
  matcher: ["/((?!unlock|api/unlock|jokes/|kit/|_next/static|_next/image|favicon.ico|icon.svg|apple-icon|app-icon|manifest.webmanifest|opengraph-image).*)"],
};
