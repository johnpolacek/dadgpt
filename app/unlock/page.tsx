"use client";

import { useState } from "react";

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
    <main>
      <h1>DAD<span className="gpt">GPT</span></h1>
      {/* Most people land here from a shared link, so point them somewhere they can play */}
      <p className="unlock-note">Live Dad is the costume's private mode. It needs the owner's passcode.</p>
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
      <nav className="unlock-links" aria-label="Other ways to talk to Dad">
        <a href="/free">Talk to Free Dad</a>
        <a href="https://github.com/johnpolacek/dadgpt" target="_blank" rel="noopener noreferrer">
          Make your own
        </a>
      </nav>
    </main>
  );
}
