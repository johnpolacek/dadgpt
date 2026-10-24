"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { SplitText } from "gsap/SplitText";
import { ScrambleTextPlugin } from "gsap/ScrambleTextPlugin";
import { TextPlugin } from "gsap/TextPlugin";
import styles from "./motion.module.css";

gsap.registerPlugin(SplitText, ScrambleTextPlugin, TextPlugin);

const rnd = gsap.utils.random;

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return true;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

// Each demo runs inside a GSAP context scoped to its stage. Whatever it
// returns runs on revert, so Replay always starts from clean markup.
type Play = (stage: HTMLElement) => void | (() => void);

function Card({ n, title, note, play, children }: { n: number; title: string; note: string; play: Play; children: React.ReactNode }) {
  const stageRef = useRef<HTMLDivElement>(null);
  const ctxRef = useRef<gsap.Context | null>(null);

  const run = () => {
    const stage = stageRef.current;
    if (!stage) return;
    ctxRef.current?.revert();
    ctxRef.current = null;
    stage.dataset.ready = "";
    if (prefersReducedMotion()) return;
    ctxRef.current = gsap.context(() => play(stage), stage);
  };

  useEffect(() => {
    let cancelled = false;
    // Split measurements need the final face
    document.fonts.ready.then(() => !cancelled && run());
    return () => {
      cancelled = true;
      ctxRef.current?.revert();
      ctxRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <figure className={styles.card}>
      <div ref={stageRef} className={styles.stage}>
        {children}
      </div>
      <figcaption className={styles.caption}>
        <div>
          <span className={styles.num}>{String(n).padStart(2, "0")}</span>
          <strong>{title}</strong>
          <p>{note}</p>
        </div>
        <button className={styles.replay} onClick={run} aria-label={`Replay ${title}`}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
            <path d="M3 3v5h5" />
          </svg>
        </button>
      </figcaption>
    </figure>
  );
}

function Logo() {
  return (
    <div className={styles.logo}>
      <span className="dad">DAD</span>
      <span className="gpt">GPT</span>
    </div>
  );
}

function shake(target: Element, times = 6, power = 8) {
  return gsap
    .timeline()
    .to(target, { x: () => rnd(-power, power), y: () => rnd(-power / 2, power / 2), duration: 0.04, repeat: times, yoyo: true, repeatRefresh: true, ease: "none" })
    .set(target, { x: 0, y: 0 });
}

/* 1. DAD drops from the ceiling and lands hard, then GPT fades in like a whisper */
const slam: Play = (stage) => {
  const q = gsap.utils.selector(stage);
  const gpt = SplitText.create(q(".gpt"), { type: "chars" });
  gsap
    .timeline()
    .fromTo(q(".dad"), { yPercent: -160, autoAlpha: 0 }, { yPercent: 0, autoAlpha: 1, duration: 0.42, ease: "power4.in" })
    .to(q(".dad"), { scaleY: 0.78, scaleX: 1.12, transformOrigin: "50% 100%", duration: 0.07, yoyo: true, repeat: 1, ease: "power2.out" })
    .add(shake(stage), "<")
    .fromTo(gpt.chars, { autoAlpha: 0, x: -12 }, { autoAlpha: 1, x: 0, duration: 0.5, ease: "power2.out", stagger: 0.09 }, "+=0.15");
};

/* 2. The weights trade places: who's your daddy now */
const swap: Play = (stage) => {
  const q = gsap.utils.selector(stage);
  const dad = SplitText.create(q(".dad"), { type: "chars" });
  const gpt = SplitText.create(q(".gpt"), { type: "chars" });
  gsap
    .timeline({ repeat: 1, repeatDelay: 0.6, delay: 0.4 })
    .to(dad.chars, { fontWeight: 1, duration: 0.5, ease: "power2.inOut", stagger: 0.06 })
    .to(gpt.chars, { fontWeight: 800, duration: 0.5, ease: "power2.inOut", stagger: 0.06 }, "<")
    .to(dad.chars, { fontWeight: 800, duration: 0.5, ease: "power2.inOut", stagger: -0.06 }, "+=0.7")
    .to(gpt.chars, { fontWeight: 1, duration: 0.5, ease: "power2.inOut", stagger: -0.06 }, "<");
};

/* 3. Letters fall in and bounce, like Dad missing the last stair */
const tumble: Play = (stage) => {
  const q = gsap.utils.selector(stage);
  const split = SplitText.create(q("." + styles.logo), { type: "chars" });
  gsap.fromTo(
    split.chars,
    { y: -260, rotation: () => rnd(-90, 90), autoAlpha: 0 },
    { y: 0, rotation: 0, autoAlpha: 1, duration: 1.1, ease: "bounce.out", stagger: { each: 0.08, from: "random" } },
  );
};

/* 4. Idle ripple through the logo, three passes then rest */
const wave: Play = (stage) => {
  const q = gsap.utils.selector(stage);
  const split = SplitText.create(q("." + styles.logo), { type: "chars" });
  const moves: gsap.TweenVars[] = [
    { y: -18, ease: "power2.out" },
    { rotation: 10, transformOrigin: "50% 100%", ease: "sine.inOut" },
    { scaleY: 0.75, transformOrigin: "50% 100%", ease: "power2.inOut" },
  ];
  const tl = gsap.timeline({ delay: 0.3 });
  moves.forEach((vars) => {
    tl.to(split.chars, { ...vars, duration: 0.14, stagger: { each: 0.04, yoyo: true, repeat: 1 } }, "+=0.6");
  });
  tl.set(split.chars, { clearProps: "transform" });
};

/* 5. Listening: rings breathe out of the mic */
const rings: Play = (stage) => {
  const q = gsap.utils.selector(stage);
  gsap
    .timeline({ repeat: 4 })
    .fromTo(q("." + styles.ring), { scale: 1, autoAlpha: 0.6 }, { scale: 2.6, autoAlpha: 0, duration: 1.4, ease: "power2.out", stagger: 0.35 })
    .to(q("." + styles.mic), { scale: 1.08, duration: 0.35, yoyo: true, repeat: 1, ease: "sine.inOut" }, 0);
};

/* 6. Thinking: the status scrambles through Dad's thought process */
const think: Play = (stage) => {
  const q = gsap.utils.selector(stage);
  const el = q("." + styles.status);
  const scramble = (text: string) => ({ scrambleText: { text, chars: "DADGPT?!#%", speed: 0.5, revealDelay: 0.2 }, duration: 0.9 });
  gsap
    .timeline()
    .to(el, scramble("Hmm..."))
    .to(el, scramble("Let me think..."), "+=0.8")
    .to(el, scramble("Oh! I've got one."), "+=0.8");
};

/* 7. Speak-in: words arrive at talking pace, the punchline tumbles in letter by letter */
const speak: Play = (stage) => {
  const q = gsap.utils.selector(stage);
  const words = SplitText.create(q("." + styles.reply), { type: "words" }).words as HTMLElement[];
  const tl = gsap.timeline({ delay: 0.3 });
  gsap.set(words, { autoAlpha: 0 });
  let t = 0;
  words.forEach((word) => {
    const text = word.textContent ?? "";
    if (word.closest("." + styles.punch)) {
      const chars = SplitText.create(word, { type: "chars" }).chars;
      tl.set(word, { autoAlpha: 1 }, t);
      tl.fromTo(chars, { y: -40, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.6, ease: "bounce.out", stagger: 0.05 }, t);
      t += 0.35;
    } else {
      tl.fromTo(word, { y: 14, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.35, ease: "power3.out" }, t);
      t += 0.12 + text.length * 0.02;
    }
    if (/[.!?]$/.test(text)) t += 0.6;
  });
};

/* 8. Typewriter: Dad pecks out the reply with two fingers */
const type: Play = (stage) => {
  const q = gsap.utils.selector(stage);
  const el = q("." + styles.typed)[0] as HTMLElement;
  const full = el.dataset.text ?? "";
  gsap.set(el, { text: "" });
  gsap.timeline({ delay: 0.4 }).to(el, { text: full, duration: full.length * 0.045, ease: "none" });
  gsap.fromTo(q("." + styles.caret), { autoAlpha: 1 }, { autoAlpha: 0, duration: 0.5, repeat: 9, yoyo: true, ease: "steps(1)" });
};

/* 9. Rimshot: the punchline stamps down, the screen shakes, emoji rain */
const rimshot: Play = (stage) => {
  const q = gsap.utils.selector(stage);
  const stamp = SplitText.create(q("." + styles.stamp), { type: "chars" });
  const box = stage.getBoundingClientRect();
  const emoji = ["🥁", "😂", "🙄", "🤦", "🥁", "😆"];
  const drops = Array.from({ length: 28 }, (_, i) => {
    const span = document.createElement("span");
    span.className = styles.drop;
    span.textContent = emoji[i % emoji.length];
    span.setAttribute("aria-hidden", "true");
    stage.append(span);
    return span;
  });
  const tl = gsap.timeline({ delay: 0.5 });
  tl.fromTo(stamp.chars, { scale: 2.4, autoAlpha: 0 }, { scale: 1, autoAlpha: 1, duration: 0.28, ease: "power4.out", stagger: 0.09 })
    .add(shake(stage, 4, 10), 0.28)
    .add(shake(stage, 4, 10), 0.46)
    .add(shake(stage, 8, 6), 0.64);
  drops.forEach((drop) => {
    tl.fromTo(
      drop,
      { x: rnd(0, box.width), y: -40, rotation: rnd(-60, 60), autoAlpha: 1 },
      { y: box.height + 40, rotation: `+=${rnd(-180, 180)}`, duration: rnd(1.1, 1.9), ease: "power2.in" },
      0.7 + rnd(0, 0.7),
    );
  });
  return () => drops.forEach((d) => d.remove());
};

/* 11. Clear: tap the X and the chat blows apart away from it */
const blast: Play = (stage) => {
  const q = gsap.utils.selector(stage);
  const x = q("." + styles.clear)[0] as HTMLElement;
  const lines = q("." + styles.line) as HTMLElement[];
  const onClick = () => {
    const b = x.getBoundingClientRect();
    const ox = b.left + b.width / 2;
    const oy = b.top + b.height / 2;
    const chars = SplitText.create(lines, { type: "chars,words" }).chars as HTMLElement[];
    const tl = gsap.timeline();
    tl.add(shake(stage, 7, 8), 0).to(x, { scale: 1.4, autoAlpha: 0, filter: "blur(12px)", duration: 0.3, ease: "power4.out" }, 0);
    chars.forEach((c) => {
      const r = c.getBoundingClientRect();
      const angle = Math.atan2(r.top - oy, r.left - ox) + rnd(-0.5, 0.5);
      const d = rnd(300, 700);
      tl.to(c, { x: Math.cos(angle) * d, y: Math.sin(angle) * d, rotation: rnd(-720, 720), scale: rnd(0.3, 2.2), autoAlpha: 0, duration: rnd(0.4, 0.7), ease: "expo.out" }, rnd(0, 0.1));
    });
  };
  x.addEventListener("click", onClick);
  return () => x.removeEventListener("click", onClick);
};

/* 12. Clear alt: tap the X and lines fold away bottom up, X spins out */
const fold: Play = (stage) => {
  const q = gsap.utils.selector(stage);
  const x = q("." + styles.clear)[0] as HTMLElement;
  const onClick = () => {
    gsap
      .timeline()
      .to(x, { rotation: 180, scale: 0, duration: 0.45, ease: "back.in(2)" }, 0)
      .to(q("." + styles.line), { scaleY: 0, y: -24, autoAlpha: 0, transformOrigin: "50% 0%", duration: 0.4, ease: "back.in(1.8)", stagger: { each: 0.08, from: "end" } }, 0.05);
  };
  x.addEventListener("click", onClick);
  return () => x.removeEventListener("click", onClick);
};

/* 10. The groan: once the joke lands, its letters sag under their own weight */
const groan: Play = (stage) => {
  const q = gsap.utils.selector(stage);
  const split = SplitText.create(q("." + styles.reply), { type: "chars,words" });
  gsap
    .timeline({ delay: 0.9 })
    .to(split.chars, {
      y: () => rnd(4, 26),
      rotation: () => rnd(-25, 25),
      transformOrigin: "50% 0%",
      duration: 1,
      ease: "bounce.out",
      stagger: { each: 0.015, from: "random" },
    })
    .to(q("." + styles.sigh), { autoAlpha: 1, y: 0, duration: 0.4, ease: "power2.out" }, "-=0.4");
};

const JOKE = "I'm reading a book about anti-gravity.";

export default function Motion() {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1>
          DAD<span className="gpt">GPT</span> motion
        </h1>
        <p>Twelve ideas for animating the site. Hit replay on any card. Cards 11 and 12 play when you tap the X.</p>
      </header>

      <h2 className={styles.section}>Logo</h2>
      <div className={styles.grid}>
        <Card n={1} title="Slam" note="DAD drops and lands hard. GPT whispers in after." play={slam}>
          <Logo />
        </Card>
        <Card n={2} title="Weight swap" note="DAD and GPT trade weights, then trade back." play={swap}>
          <Logo />
        </Card>
        <Card n={3} title="Last stair" note="Letters fall in from everywhere and bounce into place." play={tumble}>
          <Logo />
        </Card>
        <Card n={4} title="Idle wave" note="A hop, a lean and a squash ripple through, then rest." play={wave}>
          <Logo />
        </Card>
      </div>

      <h2 className={styles.section}>Listening and thinking</h2>
      <div className={styles.grid}>
        <Card n={5} title="Listening rings" note="Rings breathe out of the mic while Dad listens." play={rings}>
          <div className={styles.micWrap}>
            <span className={styles.ring} />
            <span className={styles.ring} />
            <span className={styles.ring} />
            <span className={styles.mic}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="9" y="2" width="6" height="12" rx="3" />
                <path d="M5 10v1a7 7 0 0 0 14 0v-1" />
                <path d="M12 18v4" />
              </svg>
            </span>
          </div>
        </Card>
        <Card n={6} title="Scrambled thoughts" note="The status line scrambles through Dad's thinking." play={think}>
          <p className={styles.status}>&nbsp;</p>
        </Card>
      </div>

      <h2 className={styles.section}>The reply</h2>
      <div className={styles.grid}>
        <Card n={7} title="Speak-in" note="Words land at talking pace. The punchline tumbles in." play={speak}>
          <p className={`${styles.reply} ${styles.kern}`}>
            {JOKE} It&apos;s <span className={styles.punch}>impossible</span> to put down.
          </p>
        </Card>
        <Card n={8} title="Two-finger typing" note="Dad types it out slowly with a blinking caret." play={type}>
          <p className={styles.reply}>
            <span className={styles.typed} data-text={`${JOKE} It's impossible to put down.`} />
            <span className={styles.caret}>|</span>
          </p>
        </Card>
        <Card n={9} title="Rimshot" note="Ba dum tss stamps down, the screen shakes, emoji rain." play={rimshot}>
          <p className={`${styles.stamp} ${styles.kern}`}>BA DUM TSS</p>
        </Card>
        <Card n={10} title="The groan" note="After the joke lands, its letters sag under the weight." play={groan}>
          <div className={styles.groanWrap}>
            <p className={`${styles.reply} ${styles.kern}`}>Why did the scarecrow win an award? He was outstanding in his field.</p>
            <p className={styles.sigh}>ugh, dad.</p>
          </div>
        </Card>
      </div>

      <h2 className={styles.section}>Clearing the chat</h2>
      <div className={styles.grid}>
        <Card n={11} title="Blast off" note="Tap the X. The chat flies apart away from the button." play={blast}>
          <ChatSample />
        </Card>
        <Card n={12} title="Fold away" note="Tap the X. Lines fold up from the bottom, the X spins out." play={fold}>
          <ChatSample />
        </Card>
      </div>
    </div>
  );
}

function ChatSample() {
  return (
    <div className={styles.chat}>
      <p className={`${styles.line} ${styles.said}`}>Can you make me a sandwich?</p>
      <p className={`${styles.line} ${styles.kern}`}>Poof! You&apos;re a sandwich.</p>
      <p className={`${styles.line} ${styles.said}`}>What time is it?</p>
      <p className={`${styles.line} ${styles.kern}`}>Time to get a watch, kiddo.</p>
      <button className={styles.clear} aria-label="Clear chat">
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
          <path d="M6 6l12 12M18 6L6 18" />
        </svg>
      </button>
    </div>
  );
}
