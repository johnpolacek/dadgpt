import gsap from "gsap";

const rnd = gsap.utils.random;

type Kind = "ember" | "spark" | "dot" | "confetti" | "ring";

type Particle = {
  kind: Kind;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  age: number;
  life: number;
  rotation: number;
  spin: number;
  drag: number;
  gravity: number;
  // Rings: how far they grow and how thick they start
  spread?: number;
  // Confetti: flutter phase, so each strip twists on its own beat
  ph?: number;
};

/** Phones get fewer particles. The bursts still read at that size. */
const budget = () => (matchMedia("(pointer: coarse)").matches ? 0.6 : 1);

/**
 * One full-screen canvas for the About deck: embers drifting up all the time,
 * plus shockwaves, spark bursts, edge sparks and confetti on demand.
 */
export function createAboutFx(container: HTMLElement) {
  const canvas = document.createElement("canvas");
  canvas.setAttribute("aria-hidden", "true");
  Object.assign(canvas.style, { position: "absolute", inset: "0", width: "100%", height: "100%", pointerEvents: "none", zIndex: "2" });
  container.append(canvas);
  const ctx = canvas.getContext("2d")!;
  const particles: Particle[] = [];
  let dpr = 1;
  let w = 0;
  let h = 0;
  let emberAcc = 0;
  let emberRate = 10;
  let time = 0;
  let surgeEnd: gsap.core.Tween | undefined;

  const fit = () => {
    dpr = Math.min(2, window.devicePixelRatio || 1);
    w = container.clientWidth;
    h = container.clientHeight;
    const cw = Math.round(w * dpr);
    const ch = Math.round(h * dpr);
    if (canvas.width !== cw) canvas.width = cw;
    if (canvas.height !== ch) canvas.height = ch;
  };

  const add = (p: Partial<Particle> & Pick<Particle, "kind" | "x" | "y">) =>
    particles.push({ vx: 0, vy: 0, size: 2, alpha: 1, age: 0, life: 1, rotation: 0, spin: 0, drag: 0, gravity: 0, ...p });

  const tick = (_t: number, deltaMs: number) => {
    const dt = Math.min(0.05, deltaMs / 1000);
    time += dt;
    fit();

    emberAcc += emberRate * budget() * dt;
    while (emberAcc >= 1) {
      emberAcc -= 1;
      add({ kind: "ember", x: rnd(0, w), y: h + 10, vy: -rnd(20, 60), vx: rnd(-6, 6), size: rnd(1, 2.6), alpha: rnd(0.25, 0.6), life: rnd(5, 9), ph: rnd(0, 6.28) });
    }

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = ctx.strokeStyle = "#fff";

    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i]!;
      p.age += dt;
      const k = p.age / p.life;
      if (k >= 1) {
        particles.splice(i, 1);
        continue;
      }
      const damp = Math.pow(1 - p.drag, dt * 60);
      p.vx *= damp;
      p.vy = p.vy * damp + p.gravity * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.rotation += p.spin * dt;

      if (p.kind === "ring") {
        const r = (p.spread ?? 200) * gsap.parseEase("expo.out")(k);
        ctx.globalAlpha = p.alpha * (1 - k);
        ctx.lineWidth = p.size * (1 - k) + 0.5;
        ctx.beginPath();
        ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
        ctx.stroke();
      } else if (p.kind === "spark") {
        // A streak along its velocity, so fast sparks read as light trails
        ctx.globalAlpha = p.alpha * (1 - k);
        ctx.lineWidth = p.size * (1 - k * 0.6);
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x - p.vx * 0.045, p.y - p.vy * 0.045);
        ctx.stroke();
      } else if (p.kind === "confetti") {
        // Flat strips that flip as they flutter down
        const flip = Math.cos(time * 9 + (p.ph ?? 0));
        p.x += Math.sin(time * 3 + (p.ph ?? 0)) * 30 * dt;
        ctx.globalAlpha = p.alpha * Math.min(1, (1 - k) * 4);
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.scale(1, flip);
        ctx.fillRect(-p.size, -p.size * 0.35, p.size * 2, p.size * 0.7);
        ctx.restore();
      } else {
        if (p.kind === "ember") p.x += Math.sin(time * 1.3 + (p.ph ?? 0)) * 8 * dt;
        ctx.globalAlpha = p.alpha * Math.sin(k * Math.PI);
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size / 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
  };

  gsap.ticker.add(tick);
  gsap.fromTo(canvas, { opacity: 0 }, { opacity: 1, duration: 1 });

  const local = (x: number, y: number) => {
    const box = container.getBoundingClientRect();
    return { x: x - box.left, y: y - box.top };
  };

  return {
    /** Rings blasting out from a point, in page coordinates */
    shockwave(px: number, py: number, power = 1) {
      const { x, y } = local(px, py);
      const reach = Math.hypot(w, h) * 0.5 * power;
      add({ kind: "ring", x, y, size: 6, spread: reach, life: 0.9, alpha: 0.9 });
      add({ kind: "ring", x, y, size: 2, spread: reach * 0.6, life: 1.2, alpha: 0.5 });
    },
    /** Sparks and dots flung out from a point */
    burst(px: number, py: number, count = 60, speed = 900) {
      const { x, y } = local(px, py);
      const n = Math.round(count * budget());
      for (let i = 0; i < n; i++) {
        const angle = rnd(0, Math.PI * 2);
        const v = rnd(0.25, 1) * speed;
        const spark = i % 3 !== 0;
        add({
          kind: spark ? "spark" : "dot",
          x,
          y,
          vx: Math.cos(angle) * v,
          vy: Math.sin(angle) * v,
          size: spark ? rnd(1, 2.4) : rnd(2, 5),
          drag: 0.06,
          gravity: spark ? 300 : 500,
          life: rnd(0.5, 1.2),
          alpha: rnd(0.6, 1),
        });
      }
    },
    /** Sparks spraying off a horizontal line, like the edge of a cut */
    edge(px0: number, px1: number, py: number, count = 6) {
      const a = local(px0, py);
      const b = local(px1, py);
      for (let i = 0; i < Math.round(count * budget()); i++) {
        add({ kind: "spark", x: rnd(a.x, b.x), y: a.y, vx: rnd(-200, 200), vy: rnd(-260, 40), size: rnd(0.8, 1.8), drag: 0.05, gravity: 700, life: rnd(0.3, 0.7), alpha: 0.9 });
      }
    },
    /** Two cannons fire confetti up from the bottom corners */
    confetti(count = 160) {
      const n = Math.round(count * budget());
      for (let i = 0; i < n; i++) {
        const left = i % 2 === 0;
        const angle = (left ? -60 : -120) * (Math.PI / 180) + rnd(-0.35, 0.35);
        const v = rnd(0.55, 1) * Math.max(h * 2.1, 900);
        add({
          kind: "confetti",
          x: left ? 0 : w,
          y: h,
          vx: Math.cos(angle) * v,
          vy: Math.sin(angle) * v,
          size: rnd(4, 9),
          drag: 0.045,
          gravity: 900,
          spin: rnd(-8, 8),
          rotation: rnd(0, 6.28),
          life: rnd(2.6, 4),
          alpha: rnd(0.7, 1),
          ph: rnd(0, 6.28),
        });
      }
    },
    /** More embers for a big moment, back to the drift after */
    surge(rate = 60, seconds = 1.2) {
      emberRate = rate;
      surgeEnd?.kill();
      surgeEnd = gsap.delayedCall(seconds, () => (emberRate = 10));
    },
    destroy() {
      gsap.ticker.remove(tick);
      surgeEnd?.kill();
      gsap.killTweensOf(canvas);
      canvas.remove();
    },
  };
}

export type AboutFx = ReturnType<typeof createAboutFx>;
