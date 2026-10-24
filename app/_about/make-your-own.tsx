"use client";

import { forwardRef, useImperativeHandle, useRef, useState } from "react";
import gsap from "gsap";
import { MAKE_YOUR_OWN_PROMPT } from "@/lib/make-your-own";
import { prefersReducedMotion } from "@/lib/motion";
import Sentences from "../sentences";
import styles from "./about.module.css";

/** The old copy command, for browsers that block or stall the clipboard API */
function legacyCopy(text: string) {
  const area = document.createElement("textarea");
  area.value = text;
  area.setAttribute("readonly", "");
  Object.assign(area.style, { position: "fixed", opacity: "0", pointerEvents: "none" });
  // Inside the open dialog, since the page behind a modal can't take focus
  (document.querySelector("dialog[open]") ?? document.body).append(area);
  area.select();
  let ok = false;
  try {
    ok = document.execCommand("copy");
  } catch {}
  area.remove();
  return ok;
}

export type MakeYourOwnHandle = { open: () => void };

/** A modal with the setup prompt and a copy button. Escape, the X or a tap outside closes it. */
const MakeYourOwn = forwardRef<MakeYourOwnHandle>(function MakeYourOwn(_props, ref) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);

  useImperativeHandle(ref, () => ({
    open() {
      const dialog = dialogRef.current!;
      setCopied(false);
      dialog.showModal();
      if (prefersReducedMotion()) return;
      gsap.fromTo(panelRef.current, { autoAlpha: 0, scale: 0.85, y: 30 }, { autoAlpha: 1, scale: 1, y: 0, duration: 0.5, ease: "back.out(1.8)", overwrite: "auto", clearProps: "transform" });
    },
  }));

  function close() {
    const dialog = dialogRef.current!;
    if (prefersReducedMotion()) return dialog.close();
    gsap.to(panelRef.current, { autoAlpha: 0, scale: 0.92, y: 20, duration: 0.22, ease: "power2.in", overwrite: "auto", onComplete: () => dialog.close() });
  }

  async function copy() {
    let ok = false;
    try {
      // Some browsers hold the promise on a permission prompt, so give up after a second
      await Promise.race([navigator.clipboard.writeText(MAKE_YOUR_OWN_PROMPT), new Promise((_, reject) => setTimeout(reject, 1000))]);
      ok = true;
    } catch {
      ok = legacyCopy(MAKE_YOUR_OWN_PROMPT);
    }
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      return;
    }
    // Both blocked: select the text so a long press or Cmd+C still works
    const pre = panelRef.current?.querySelector("pre");
    if (pre) getSelection()?.selectAllChildren(pre);
  }

  return (
    <dialog
      ref={dialogRef}
      className={styles.dialog}
      aria-labelledby="make-your-own-title"
      onCancel={(event) => {
        event.preventDefault();
        close();
      }}
      onClick={(event) => {
        if (event.target === dialogRef.current) close();
      }}
    >
      <div ref={panelRef} className={styles.panel}>
        <button className={styles.panelClose} onClick={close} aria-label="Close">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
        <h2 id="make-your-own-title">Make your own Dad</h2>
        <p>
          <Sentences text={"Paste this into Claude\u00a0Code or any coding agent. It sets up DADGPT with your own keys."} />
        </p>
        <pre className={styles.prompt}>{MAKE_YOUR_OWN_PROMPT}</pre>
        <button className={styles.copy} onClick={copy} aria-live="polite">
          {copied ? "Copied" : "Copy prompt"}
        </button>
      </div>
    </dialog>
  );
});

export default MakeYourOwn;
