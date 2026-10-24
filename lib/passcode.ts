export const COOKIE_NAME = "dadgpt_pass";

// Store a hash in the cookie, never the passcode itself
export async function passcodeToken(passcode: string) {
  const data = new TextEncoder().encode(`dadgpt:${passcode}`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
