import gsap from "gsap";
import { SplitText } from "gsap/SplitText";
import type { AboutFx } from "./about-fx";
import { scrambleIn, shake } from "./motion";

gsap.registerPlugin(SplitText);

const rnd = gsap.utils.random;

/**
 * Each slide marks its parts with data-fx, in the order they arrive:
 * slam: letters crash down from huge and hit with a shockwave
 * rise: floats up into place
 * type: letters appear one at a time, like a voice coming through
 * scramble: random letters settle into the words, then sparks
 * wipe: revealed top to bottom with sparks along the cut
 * pop: each child springs in with a small burst
 * flip: each child swings in on a hinge
 * data-at sets a start time in seconds, otherwise each part follows the last.
 */
type Parts = { scene: HTMLElement; stage: HTMLElement; fx: AboutFx | null };

const center = (el: Element) => {
  const r = el.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2, r };
};

export function enterScene({ scene, stage, fx }: Parts) {
  const parts = Array.from(scene.querySelectorAll<HTMLElement>("[data-fx]"));
  const splits: SplitText[] = [];
  const reverts: Array<() => void> = [];
  const timeline = gsap.timeline({
    defaults: { overwrite: "auto" },
    onComplete: () => {
      reverts.forEach((r) => r());
      splits.forEach((s) => s.revert());
      gsap.set(parts, { clearProps: "transform,filter,clipPath,willChange" });
    },
  });

  // Every part starts hidden before the slide shows, so nothing flashes in place
  gsap.set(parts, { autoAlpha: 0 });
  gsap.set(scene, { autoAlpha: 1 });

  let cursor = 0.1;
  for (const el of parts) {
    const at = el.dataset.at ? Number(el.dataset.at) : cursor;
    const kind = el.dataset.fx;
    let length = 0.5;

    if (kind === "slam") {
      const split = SplitText.create(el, { type: "words,chars" });
      splits.push(split);
      const chars = split.chars as HTMLElement[];
      gsap.set(el, { autoAlpha: 1 });
      const fall = 0.42;
      const spread = Math.min(0.5, chars.length * 0.03);
      timeline.fromTo(
        chars,
        { autoAlpha: 0, scale: () => rnd(2.6, 4), y: () => rnd(-160, 60), x: () => rnd(-80, 80), rotation: () => rnd(-40, 40), filter: "blur(10px)" },
        { autoAlpha: 1, scale: 1, x: 0, y: 0, rotation: 0, filter: "blur(0px)", duration: fall, ease: "expo.in", stagger: { amount: spread, from: "random" } },
        at,
      );
      length = fall + spread;
      // The hit: shake the slide and blast rings and sparks out from the words
      const big = el.dataset.impact === "big";
      timeline.call(
        () => {
          const { x, y } = center(el);
          fx?.shockwave(x, y, big ? 1.3 : 0.8);
          fx?.burst(x, y, big ? 120 : 60, big ? 1300 : 900);
          if (big) fx?.surge(80, 1.5);
        },
        undefined,
        at + length,
      );
      timeline.add(shake(stage, big ? 9 : 5, big ? 16 : 8), at + length);
    } else if (kind === "rise") {
      timeline.fromTo(el, { autoAlpha: 0, y: 30 }, { autoAlpha: 1, y: 0, duration: 0.6, ease: "power3.out" }, at);
    } else if (kind === "type") {
      const split = SplitText.create(el, { type: "words,chars" });
      splits.push(split);
      gsap.set(el, { autoAlpha: 1 });
      const chars = split.chars as HTMLElement[];
      timeline.fromTo(chars, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.01, stagger: 0.035 }, at);
      length = chars.length * 0.035 + 0.2;
    } else if (kind === "scramble") {
      // Built now and nested, so finishing or killing the slide also settles the words
      const run = scrambleIn(el, { perWord: 0.07, duration: 0.5 });
      reverts.push(run.revert);
      timeline.set(el, { autoAlpha: 1 }, at).add(run.timeline, at);
      length = run.timeline.duration();
      timeline.call(
        () => {
          const { x, y } = center(el);
          fx?.burst(x, y, 70, 1000);
          fx?.shockwave(x, y, 0.7);
        },
        undefined,
        at + length,
      );
    } else if (kind === "wipe") {
      const edge = { p: 0 };
      timeline.set(el, { autoAlpha: 1 }, at).fromTo(
        edge,
        { p: 0 },
        {
          p: 100,
          duration: 1.4,
          ease: "power2.inOut",
          onUpdate: () => {
            el.style.clipPath = `inset(0 0 ${100 - edge.p}% 0)`;
            const r = el.getBoundingClientRect();
            fx?.edge(r.left, r.right, r.top + (r.height * edge.p) / 100, 4);
          },
        },
        at,
      );
      length = 0.6;
    } else if (kind === "pop") {
      const kids = el.children.length ? (Array.from(el.children) as HTMLElement[]) : [el];
      gsap.set(el, { autoAlpha: 1 });
      kids.forEach((kid, i) => {
        timeline.fromTo(kid, { autoAlpha: 0, scale: 0.3 }, { autoAlpha: 1, scale: 1, duration: 0.55, ease: "back.out(2.6)" }, at + i * 0.14);
        timeline.call(
          () => {
            const { x, y } = center(kid);
            fx?.burst(x, y, 18, 500);
          },
          undefined,
          at + i * 0.14 + 0.12,
        );
      });
      length = kids.length * 0.14 + 0.3;
    } else if (kind === "flip") {
      const kids = Array.from(el.children) as HTMLElement[];
      gsap.set(el, { autoAlpha: 1 });
      timeline.fromTo(
        kids,
        { autoAlpha: 0, rotationY: -100, transformPerspective: 900, transformOrigin: "0% 50%" },
        { autoAlpha: 1, rotationY: 0, duration: 0.9, ease: "back.out(1.4)", stagger: 0.18 },
        at,
      );
      length = 0.5;
    }
    cursor = Math.max(cursor, at + length);
  }

  // Slide-specific extras hang off named hooks
  if (scene.dataset.finale !== undefined) {
    timeline.call(() => fx?.confetti(200), undefined, 0.5);
    timeline.call(() => fx?.confetti(120), undefined, 1.2);
  }
  const rings = scene.querySelectorAll(".ring");
  if (rings.length) {
    timeline.fromTo(rings, { scale: 1, autoAlpha: 0.7 }, { scale: 2.8, autoAlpha: 0, duration: 1.3, ease: "power2.out", stagger: 0.3, repeat: 2 }, 0.4);
  }

  return {
    timeline,
    revert: () => {
      timeline.kill();
      reverts.forEach((r) => r());
      splits.forEach((s) => s.revert());
      gsap.set([...parts, ...rings], { clearProps: "all" });
    },
  };
}

/** Everything on the slide blows away from where you tapped, then the slide hides. */
export function exitScene({ scene, fx }: Parts, origin: { x: number; y: number }) {
  const texts = Array.from(scene.querySelectorAll<HTMLElement>("h1, h2, p, li, figcaption"));
  const others = Array.from(scene.querySelectorAll<HTMLElement>("img, .mic, .card, a, button")).filter((el) => !texts.some((t) => t.contains(el)));
  const split = SplitText.create(texts, { type: "words,chars" });
  const chars = split.chars as HTMLElement[];
  const timeline = gsap.timeline({ defaults: { overwrite: "auto" } });

  fx?.shockwave(origin.x, origin.y, 0.9);
  fx?.burst(origin.x, origin.y, 50, 900);

  gsap.set(chars, { willChange: "transform, opacity" });
  for (const char of chars) {
    const r = char.getBoundingClientRect();
    const angle = Math.atan2(r.top + r.height / 2 - origin.y, r.left + r.width / 2 - origin.x) + rnd(-0.5, 0.5);
    const distance = rnd(300, 900);
    timeline.to(
      char,
      { x: Math.cos(angle) * distance, y: Math.sin(angle) * distance, rotation: rnd(-540, 540), scale: rnd(0.3, 2.2), autoAlpha: 0, duration: rnd(0.35, 0.55), ease: "expo.out" },
      rnd(0, 0.08),
    );
  }
  if (others.length) {
    timeline.to(others, { scale: 1.25, autoAlpha: 0, filter: "blur(14px)", duration: 0.4, ease: "power3.out" }, 0);
  }
  timeline.call(() => {
    split.revert();
    gsap.set(scene.querySelectorAll("*"), { clearProps: "all" });
    gsap.set(scene, { clearProps: "all" });
  });
  return timeline;
}
