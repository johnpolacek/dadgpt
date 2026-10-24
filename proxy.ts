import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { COOKIE_NAME, passcodeToken } from "@/lib/passcode";

export async function proxy(request: NextRequest) {
  // The home page tells canned jokes, so anyone can use it
  if (request.nextUrl.pathname === "/") return NextResponse.next();

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
  matcher: ["/((?!unlock|api/unlock|jokes/|_next/static|_next/image|favicon.ico|icon.svg|apple-icon).*)"],
};
