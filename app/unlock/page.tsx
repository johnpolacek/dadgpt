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
      <form onSubmit={submit}>
        <input
          type="password"
          placeholder="Passcode"
          value={passcode}
          onChange={(e) => setPasscode(e.target.value)}
          autoFocus
        />
        <button type="submit">Enter</button>
      </form>
      <p className="status">{error}</p>
    </main>
  );
}
