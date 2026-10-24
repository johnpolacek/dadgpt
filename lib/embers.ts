import gsap from "gsap";

const rnd = gsap.utils.random;

/** Embers per second off the logo's baseline. */
const RATE = 18;

/** Positions are relative to the logo (x as a fraction of its width, y in px above its baseline), so embers ride along when it moves. */
type Ember = { fx: number; dy: number; vx: number; vy: number; age: number; life: number; size: number; wob: number; ph: number };

/**
 * Tiny embers rise off the bottom of the logo and wander up past the letters.
 * Draws on a canvas laid over `container`. Every frame reads where the logo is now,
 * so the whole cloud stays with it while the chat panel slides it sideways.
 */
export function startEmbers(container: HTMLElement, logo: HTMLElement) {
  const canvas = document.createElement("canvas");
  canvas.setAttribute("aria-hidden", "true");
  Object.assign(canvas.style, { position: "absolute", inset: "0", width: "100%", height: "100%", pointerEvents: "none" });
  container.prepend(canvas);
  const ctx = canvas.getContext("2d")!;
  let dpr = 1;
  let w = 0;
  let h = 0;

  // Resized inside the frame, right before drawing. A resize observer fires after
  // the frame is drawn and wipes it, which blanked the embers while the panel slid.
  const fit = (box: DOMRect) => {
    dpr = Math.min(2, window.devicePixelRatio || 1);
    w = box.width;
    h = box.height;
    const cw = Math.round(w * dpr);
    const ch = Math.round(h * dpr);
    if (canvas.width !== cw) canvas.width = cw;
    if (canvas.height !== ch) canvas.height = ch;
  };

  const embers: Ember[] = [];
  let acc = 0;
  let time = 0;

  const tick = (_t: number, deltaMs: number) => {
    const dt = Math.min(0.05, deltaMs / 1000);
    time += dt;
    const box = container.getBoundingClientRect();
    fit(box);
    const r = logo.getBoundingClientRect();
    const left = r.left - box.left;
    const bottom = r.bottom - box.top;
    // Tuned on a ~90px logo; scale the motion with the real one
    const k = Math.max(0.6, r.height / 90);

    acc += RATE * k * dt;
    while (acc >= 1) {
      acc -= 1;
      embers.push({
        fx: rnd(0, 1),
        dy: rnd(-2, 4),
        vx: rnd(-1, 1) * k,
        vy: -rnd(6, 13) * k,
        age: 0,
        life: rnd(3.5, 6.4),
        size: rnd(1.5, 3) * Math.min(1.4, k),
        wob: rnd(4, 12) * k,
        ph: rnd(0, 6.28),
      });
    }

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = "#fff";
    for (let i = embers.length - 1; i >= 0; i--) {
      const e = embers[i]!;
      e.age += dt;
      if (e.age > e.life) {
        embers.splice(i, 1);
        continue;
      }
      e.fx += (e.vx * dt) / Math.max(1, r.width);
      e.dy += e.vy * dt;
      const p = e.age / e.life;
      ctx.globalAlpha = 0.64 * Math.sin(p * Math.PI);
      ctx.beginPath();
      ctx.arc(left + e.fx * r.width + Math.sin(time * 0.5 + e.ph) * e.wob * p, bottom + e.dy, (e.size * (1 - p * 0.4)) / 2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  };

  // Fade in so the first embers don't pop
  gsap.fromTo(canvas, { opacity: 0 }, { opacity: 1, duration: 1.2, ease: "power1.out" });
  gsap.ticker.add(tick);

  return () => {
    gsap.ticker.remove(tick);
    gsap.killTweensOf(canvas);
    canvas.remove();
  };
}
