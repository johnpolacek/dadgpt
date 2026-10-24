"use client";

import { useState } from "react";
import { CopyPrompt } from "../_about/make-your-own";

export default function Unlock() {
  const [passcode, setPasscode] = useState("");
  const [error, setError] = useState("");

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const res = await fetch("/api/unlock", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ passcode }),
    });
    if (res.ok) {
      window.location.href = "/live";
    } else {
      setError("Nope. Ask your father.");
    }
  }

  return (
    <main className="unlock">
      <a className="back" href="/">
        Back
      </a>
      <h1>DAD<span className="gpt">GPT</span></h1>
      <p className="unlock-note">Live DADGPT uses API keys protected by a passcode.</p>
      <form onSubmit={submit}>
        <input
          type="password"
          placeholder="Passcode"
          value={passcode}
          onChange={(e) => setPasscode(e.target.value)}
        />
        <button type="submit">Enter</button>
      </form>
      <p className="status">{error}</p>
      {/* Most visitors don't have the passcode, so show them how to get a Dad of their own */}
      <section className="unlock-own">
        <h3>Want your own?</h3>
        <p className="unlock-note">Paste this into Claude Code or any coding agent.</p>
        <CopyPrompt />
      </section>
    </main>
  );
}
