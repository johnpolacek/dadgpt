import gsap from "gsap";
import { SplitText } from "gsap/SplitText";
import { ScrambleTextPlugin } from "gsap/ScrambleTextPlugin";

gsap.registerPlugin(SplitText, ScrambleTextPlugin);

const rnd = gsap.utils.random;

export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return true;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function isPortrait(): boolean {
  return window.matchMedia("(orientation: portrait)").matches;
}

/** Letters fall in from above and bounce, like Dad missing the last stair. Reverts the split when done. */
export function lastStair(el: HTMLElement, { height = 260, spin = 90, duration = 1.1, maxStagger = 0.9 } = {}) {
  const split = SplitText.create(el, { type: "words,chars" });
  const chars = split.chars as HTMLElement[];
  const tween = gsap.fromTo(
    chars,
    { y: -height, rotation: () => rnd(-spin, spin), autoAlpha: 0 },
    {
      y: 0,
      rotation: 0,
      autoAlpha: 1,
      duration,
      ease: "bounce.out",
      overwrite: "auto",
      stagger: { amount: Math.min(maxStagger, chars.length * 0.08), from: "random" },
      onComplete: () => split.revert(),
    },
  );
  return {
    tween,
    revert: () => {
      tween.kill();
      split.revert();
    },
  };
}

/**
 * Words scramble into place one after another. Each word is held at its
 * resting width so the random letters never rewrap the line.
 */
export function scrambleIn(el: HTMLElement, { chars = "lowercase", perWord = 0.08, duration = 0.6 } = {}) {
  const split = SplitText.create(el, { type: "words" });
  const words = split.words as HTMLElement[];
  const texts = words.map((w) => w.textContent ?? "");
  const widths = words.map((w) => w.getBoundingClientRect().width);
  words.forEach((w, i) => {
    w.style.display = "inline-block";
    w.style.width = `${widths[i]}px`;
    w.style.whiteSpace = "nowrap";
    w.style.overflow = "clip";
    w.style.verticalAlign = "bottom";
    w.textContent = "";
  });
  const timeline = gsap.timeline({ onComplete: () => split.revert() });
  words.forEach((w, i) => {
    timeline.to(w, { scrambleText: { text: texts[i] ?? "", chars, speed: 0.6 }, duration, ease: "none" }, i * perWord);
  });
  return {
    timeline,
    revert: () => {
      timeline.kill();
      split.revert();
    },
  };
}

/** Transform-only moves, so DAD and GPT keep their own weights. */
const MOVES: gsap.TweenVars[] = [
  { y: -16, ease: "power2.out" },
  { rotation: 8, transformOrigin: "50% 100%", ease: "sine.inOut" },
  { scaleY: 0.78, transformOrigin: "50% 100%", ease: "power2.inOut" },
  { scale: 1.1, rotation: () => rnd(-12, 12), transformOrigin: "50% 50%", ease: "power2.inOut" },
  { skewX: 12, ease: "power2.inOut" },
];

/** Every few seconds a small move ripples across the letters and each lands where it started. */
export function startWave(el: HTMLElement, period = 7) {
  const split = SplitText.create(el, { type: "words,chars" });
  const chars = split.chars as HTMLElement[];
  let deck = gsap.utils.shuffle([...MOVES]);
  let index = 0;
  let current: gsap.core.Timeline | undefined;

  const clock = gsap.delayedCall(period, () => {
    const move = deck[index++];
    if (index >= deck.length) {
      deck = gsap.utils.shuffle([...MOVES]);
      index = 0;
    }
    current?.kill();
    current = gsap
      .timeline()
      .to(chars, { ...move, duration: 0.13, overwrite: "auto", stagger: { each: 0.035, yoyo: true, repeat: 1 } })
      .set(chars, { clearProps: "transform" });
    clock.restart(true);
  });

  return () => {
    clock.kill();
    current?.kill();
    split.revert();
  };
}

export function shake(target: Element, times = 7, power = 8) {
  return gsap
    .timeline()
    .to(target, { x: () => rnd(-power, power), y: () => rnd(-power / 2, power / 2), duration: 0.04, repeat: times, yoyo: true, repeatRefresh: true, ease: "none" })
    .set(target, { x: 0, y: 0 });
}

/** The chat's letters fly straight away from the pressed button, which flares out. */
export function blastOff({ root, texts, pressed }: { root: HTMLElement; texts: HTMLElement[]; pressed: HTMLElement }) {
  const box = pressed.getBoundingClientRect();
  const ox = box.left + box.width / 2;
  const oy = box.top + box.height / 2;
  const split = SplitText.create(texts, { type: "words,chars" });
  const chars = split.chars as HTMLElement[];
  const timeline = gsap.timeline({ defaults: { overwrite: "auto" } });

  timeline.add(shake(root), 0).to(pressed, { scale: 1.4, autoAlpha: 0, filter: "blur(12px)", duration: 0.3, ease: "power4.out" }, 0);
  gsap.set(chars, { willChange: "transform, opacity" });
  for (const char of chars) {
    const r = char.getBoundingClientRect();
    const angle = Math.atan2(r.top + r.height / 2 - oy, r.left + r.width / 2 - ox) + rnd(-0.45, 0.45);
    const distance = rnd(340, 820);
    timeline.to(
      char,
      { x: Math.cos(angle) * distance, y: Math.sin(angle) * distance, rotation: rnd(-720, 720), scale: rnd(0.3, 2.4), autoAlpha: 0, duration: rnd(0.4, 0.6), ease: "expo.out" },
      rnd(0, 0.1),
    );
  }

  return {
    timeline,
    revert: () => {
      timeline.revert();
      split.revert();
    },
  };
}

const spreadX = () => window.innerWidth * 0.6;
const spreadY = () => window.innerHeight * 0.6;

/** Page intro: the headline's letters fly in from all over and the rest rises into place. */
export function scatterIn(headline: HTMLElement, rest: Element[]) {
  const timeline = gsap.timeline({ defaults: { overwrite: "auto" } });
  if (prefersReducedMotion()) return timeline.set([headline, ...rest], { autoAlpha: 1 });
  const split = SplitText.create(headline, { type: "words,chars" });
  gsap.set(headline, { autoAlpha: 1 });
  gsap.set(rest, { autoAlpha: 0, y: 16 });
  timeline
    .fromTo(
      split.chars,
      { autoAlpha: 0, x: () => rnd(-spreadX(), spreadX()), y: () => rnd(-spreadY(), spreadY()), rotation: () => rnd(-90, 90), scale: 0.5 },
      { autoAlpha: 1, x: 0, y: 0, rotation: 0, scale: 1, duration: 0.75, ease: "power4.out", stagger: { each: 0.03, from: "random" } },
      0,
    )
    .to(rest, { autoAlpha: 1, y: 0, duration: 0.45, ease: "power3.out", stagger: 0.07 }, 0.3)
    .call(() => {
      split.revert();
      gsap.set(rest, { clearProps: "transform" });
    });
  return timeline;
}

/** Page outro: everything else lifts away, then the headline's letters scatter off screen. */
export function scatterOut(headline: HTMLElement, rest: Element[]) {
  const timeline = gsap.timeline({ defaults: { overwrite: "auto" } });
  if (prefersReducedMotion()) return timeline.set([headline, ...rest], { autoAlpha: 0 });
  const split = SplitText.create(headline, { type: "words,chars" });
  timeline
    .to(rest, { autoAlpha: 0, y: -10, duration: 0.25, ease: "power2.in", stagger: 0.04 }, 0)
    .to(
      split.chars,
      { autoAlpha: 0, x: () => rnd(-spreadX(), spreadX()), y: () => rnd(-spreadY(), spreadY()), rotation: () => rnd(-90, 90), scale: 0.5, duration: 0.55, ease: "power3.in", stagger: { each: 0.02, from: "random" } },
      0.08,
    );
  return timeline;
}
