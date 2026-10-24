import { NextResponse } from "next/server";
import { COOKIE_NAME, passcodeToken } from "@/lib/passcode";

export async function POST(request: Request) {
  const { passcode } = await request.json().catch(() => ({ passcode: "" }));
  const expected = process.env.PASSCODE;

  if (!expected || passcode !== expected) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(COOKIE_NAME, await passcodeToken(expected), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
  return response;
}
