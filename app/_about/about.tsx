"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import gsap from "gsap";
import { createAboutFx, type AboutFx } from "@/lib/about-fx";
import { enterScene, exitScene } from "@/lib/about-deck";
import { prefersReducedMotion } from "@/lib/motion";
import { registerOutro, releaseNavigation } from "@/lib/transition";
import MakeYourOwn, { type MakeYourOwnHandle } from "./make-your-own";
import Sentences from "../sentences";
import TransitionLink from "../transition-link";
import styles from "./about.module.css";

const SCENES = 6;

const LOGOS = [
  { name: "Black on white", file: "dadgpt-logo-black-on-white" },
  { name: "White on black", file: "dadgpt-logo-white-on-black" },
];

type Entry = ReturnType<typeof enterScene>;

export default function About() {
  const deckRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const fxRef = useRef<AboutFx | null>(null);
  const indexRef = useRef(0);
  const entryRef = useRef<Entry | null>(null);
  const exitRef = useRef<gsap.core.Timeline | null>(null);
  const pendingRef = useRef<gsap.core.Tween | null>(null);
  const [index, setIndex] = useState(0);
  const makeRef = useRef<MakeYourOwnHandle>(null);

  const sceneAt = (i: number) => stageRef.current!.querySelector<HTMLElement>(`[data-scene="${i}"]`)!;
  const parts = (i: number) => ({ scene: sceneAt(i), stage: stageRef.current!, fx: fxRef.current });

  function show(i: number) {
    deckRef.current?.setAttribute("data-ready", "");
    indexRef.current = i;
    setIndex(i);
    if (prefersReducedMotion()) {
      gsap.set(sceneAt(i), { autoAlpha: 1 });
      return;
    }
    entryRef.current = enterScene(parts(i));
  }

  /** The first tap during an entrance finishes it. The next one moves on. */
  function go(target: number, origin?: { x: number; y: number }) {
    if (target < 0 || target >= SCENES || target === indexRef.current) return;
    const entry = entryRef.current;
    if (entry?.timeline.isActive()) {
      entry.timeline.progress(1);
      return;
    }
    exitRef.current?.progress(1);
    // A slide still waiting to arrive has nothing on screen to blow apart
    const waiting = pendingRef.current !== null;
    pendingRef.current?.kill();
    pendingRef.current = null;
    const from = indexRef.current;
    indexRef.current = target;
    setIndex(target);
    if (prefersReducedMotion()) {
      gsap.set(sceneAt(from), { clearProps: "all" });
      gsap.set(sceneAt(target), { autoAlpha: 1 });
      return;
    }
    const box = stageRef.current!.getBoundingClientRect();
    if (!waiting) exitRef.current = exitScene(parts(from), origin ?? { x: box.left + box.width / 2, y: box.top + box.height / 2 });
    entryRef.current = null;
    // The next slide starts arriving while the last one is still flying apart
    pendingRef.current = gsap.delayedCall(waiting ? 0 : 0.28, () => {
      pendingRef.current = null;
      entryRef.current = enterScene(parts(target));
    });
  }

  // Intro: embers fade up and the first slide crashes in
  useLayoutEffect(() => {
    let cancelled = false;
    releaseNavigation();
    if (!prefersReducedMotion() && deckRef.current) fxRef.current = createAboutFx(deckRef.current);
    document.fonts.ready.then(() => {
      if (!cancelled) show(0);
    });
    return () => {
      cancelled = true;
      pendingRef.current?.kill();
      entryRef.current?.revert();
      exitRef.current?.kill();
      fxRef.current?.destroy();
      fxRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Leaving the page blows the current slide apart from the middle
  useEffect(
    () =>
      registerOutro(() => {
        pendingRef.current?.kill();
        if (pendingRef.current) {
          pendingRef.current = null;
          return gsap.timeline();
        }
        entryRef.current?.timeline.progress(1);
        exitRef.current?.progress(1);
        const box = stageRef.current!.getBoundingClientRect();
        return exitScene(parts(indexRef.current), { x: box.left + box.width / 2, y: box.top + box.height / 2 });
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  // Keys: arrows, space and page keys move
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      // The prompt dialog owns the keyboard while it is open
      if (document.querySelector("dialog[open]")) return;
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      const onControl = (event.target as HTMLElement).closest("a, button");
      if (["ArrowRight", "PageDown"].includes(event.key) || (event.key === " " && !onControl)) {
        event.preventDefault();
        go(indexRef.current + 1);
      } else if (["ArrowLeft", "PageUp"].includes(event.key)) {
        event.preventDefault();
        go(indexRef.current - 1);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Tap the left third to go back, anywhere else to go forward. Swipes work too.
  const swipeRef = useRef<{ x: number; y: number; swiped: boolean }>({ x: 0, y: 0, swiped: false });
  const onPointerDown = (event: React.PointerEvent) => {
    swipeRef.current = { x: event.clientX, y: event.clientY, swiped: false };
  };
  const onPointerUp = (event: React.PointerEvent) => {
    const dx = event.clientX - swipeRef.current.x;
    const dy = event.clientY - swipeRef.current.y;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) {
      swipeRef.current.swiped = true;
      go(indexRef.current + (dx < 0 ? 1 : -1), { x: event.clientX, y: event.clientY });
    }
  };
  const onClick = (event: React.MouseEvent) => {
    if (swipeRef.current.swiped || (event.target as HTMLElement).closest("a, button")) return;
    const box = stageRef.current!.getBoundingClientRect();
    const back = event.clientX < box.left + box.width * 0.3;
    go(indexRef.current + (back ? -1 : 1), { x: event.clientX, y: event.clientY });
  };

  const scene = (i: number, label: string) => ({
    "data-scene": i,
    className: styles.scene,
    "aria-label": label,
    "aria-hidden": i !== index,
    inert: i !== index,
  });

  return (
    <main ref={deckRef} className={styles.deck}>
      <div ref={stageRef} className={styles.stage} onPointerDown={onPointerDown} onPointerUp={onPointerUp} onClick={onClick}>
        <section {...scene(0, "DADGPT")} data-first>
          <p className={styles.kicker} data-fx="rise">
            The costume that talks back
          </p>
          <h1 className={styles.logo} data-fx="slam" data-impact="big">
            DAD<span className="gpt">GPT</span>
          </h1>
          <p className={styles.sub} data-fx="rise">
            Ask Dad anything.
          </p>
          <p className={styles.hint} data-fx="rise">
            Tap to continue
          </p>
        </section>

        <section {...scene(1, "Every time")}>
          <h2 className={styles.line} data-fx="slam">
            He answers with a dad joke.
          </h2>
          <h2 className={styles.huge} data-fx="slam" data-impact="big">
            Every. Single. Time.
          </h2>
        </section>

        <section {...scene(2, "The costume")} data-layout="split">
          <figure className={styles.figure} data-fx="wipe">
            <img
              src="/kit/costume.svg"
              width={640}
              height={884}
              alt="A pen and ink drawing of the costume. A phone sits sideways on the brim of a black baseball hat and shows the DADGPT logo. The wearer has on a black t-shirt with the printed logo pinned to the chest."
            />
          </figure>
          <div className={styles.side}>
            <h2 className={styles.title} data-fx="slam">
              It&apos;s a costume.
            </h2>
            <ol className={styles.steps} data-fx="pop">
              <li>Wear a black t-shirt and a black hat.</li>
              <li>Set a phone sideways on the brim, screen out.</li>
              <li>Pin the printed logo to your chest.</li>
              <li>
                <Sentences text="Open DADGPT. People walk up and talk to Dad." />
              </li>
            </ol>
          </div>
        </section>

        <section {...scene(3, "How Dad works")}>
          <h2 className={styles.title} data-fx="slam">
            Tap. Talk. Groan.
          </h2>
          <div className={styles.micWrap} data-fx="pop">
            <span className={`${styles.mic} mic`}>
              <span className={`${styles.ring} ring`} />
              <span className={`${styles.ring} ring`} />
              <span className={`${styles.ring} ring`} />
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="9" y="2" width="6" height="12" rx="3" />
                <path d="M5 10v1a7 7 0 0 0 14 0v-1" />
                <path d="M12 18v4" />
              </svg>
            </span>
          </div>
          <p className={styles.said} data-fx="type">
            Why won&apos;t skeletons fight each other?
          </p>
          <p className={styles.reply} data-fx="scramble">
            They don&apos;t have the guts.
          </p>
          <p className={styles.note} data-fx="rise">
            <Sentences text="Your browser hears you. A language model writes one pun. Dad says it out loud." />
          </p>
        </section>

        <section {...scene(4, "Printable logo")}>
          <h2 className={styles.title} data-fx="slam">
            Print the logo.
          </h2>
          <div className={styles.cards} data-fx="flip">
            {LOGOS.map((logo) => (
              <div key={logo.file} className={`${styles.card} card`}>
                <img src={`/kit/logo/${logo.file}.svg`} width={889} height={298} alt={`DADGPT logo, ${logo.name.toLowerCase()}`} />
                <div className={styles.files}>
                  {["svg", "pdf", "png"].map((ext) => (
                    <a key={ext} href={`/kit/logo/${logo.file}.${ext}`} download>
                      {ext.toUpperCase()}
                    </a>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <p className={styles.note} data-fx="rise">
            <Sentences text="Vector files print sharp at any size. The PDF fills a letter page." />
          </p>
        </section>

        <section {...scene(5, "Talk to Dad")} data-finale>
          <h2 className={styles.huge} data-fx="slam" data-impact="big">
            Go talk to Dad.
          </h2>
          <div className={styles.choices} data-fx="pop">
            <TransitionLink href="/free" className={styles.cta}>
              <strong>Free</strong>
              <span>
                <Sentences text="Stock jokes. Anyone can play." />
              </span>
            </TransitionLink>
            <button
              className={`${styles.cta} ${styles.ctaLive}`}
              onClick={(event) => {
                const r = event.currentTarget.getBoundingClientRect();
                fxRef.current?.burst(r.left + r.width / 2, r.top + r.height / 2, 40, 700);
                makeRef.current?.open();
              }}
            >
              <strong>Make your own</strong>
              <span>
                <Sentences text="Copy a prompt for your coding agent." />
              </span>
            </button>
          </div>
          <p className={styles.note} data-fx="rise">
            <span className="sentence">Built for a Halloween party.</span>{" "}
            <span className="sentence">
              <a href="https://github.com/johnpolacek/dadgpt" target="_blank" rel="noopener noreferrer">
                Code on GitHub
              </a>
            </span>
          </p>
        </section>
      </div>

      <a className={styles.github} href="https://github.com/johnpolacek/dadgpt" target="_blank" rel="noopener noreferrer" aria-label="DADGPT on GitHub">
        <svg width="22" height="22" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
          <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
        </svg>
      </a>

      {/* Skip the tour and go straight to Dad */}
      <nav className={styles.skip} aria-label="Talk to Dad">
        <TransitionLink href="/free">Free</TransitionLink>
      </nav>

      <nav className={styles.bar} aria-label="Slides">
        <button className={styles.arrow} onClick={() => go(index - 1)} disabled={index === 0} aria-label="Previous slide">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M15 6l-6 6 6 6" />
          </svg>
        </button>
        <div className={styles.dots}>
          {Array.from({ length: SCENES }, (_, i) => (
            <button
              key={i}
              className={styles.dot}
              data-on={i <= index ? "" : undefined}
              onClick={() => go(i)}
              aria-label={`Slide ${i + 1} of ${SCENES}`}
              aria-current={i === index ? "step" : undefined}
            />
          ))}
        </div>
        <button className={styles.arrow} onClick={() => go(index + 1)} disabled={index === SCENES - 1} aria-label="Next slide">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M9 6l6 6-6 6" />
          </svg>
        </button>
      </nav>
      <MakeYourOwn ref={makeRef} />
      <p className={styles.srOnly} aria-live="polite">
        Slide {index + 1} of {SCENES}
      </p>
    </main>
  );
}
