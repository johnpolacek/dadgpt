"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import styles from "./particles.module.css";

const rnd = gsap.utils.random;

function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

type Pt = { x: number; y: number };

/** What every ambient effect gets to work with, in CSS pixels relative to the stage. */
type Scene = {
  ctx: CanvasRenderingContext2D;
  w: number;
  h: number;
  logo: DOMRect;
  dad: DOMRect;
  gpt: DOMRect;
  /** Points on the edges of the letters, sampled from the real font. */
  edges: { dad: Pt[]; gpt: Pt[]; all: Pt[] };
  pointer: { x: number; y: number; on: boolean };
};

type Effect = (scene: Scene) => (dt: number, time: number) => void;

/** Redraws the logo text offscreen with the same face and samples its edge pixels. */
function sampleEdges(stage: HTMLElement, w: number, h: number) {
  const logo = stage.querySelector(`.${styles.logo}`) as HTMLElement;
  const spans = Array.from(logo.querySelectorAll("span")) as HTMLElement[];
  const box = stage.getBoundingClientRect();
  const off = document.createElement("canvas");
  off.width = Math.ceil(w);
  off.height = Math.ceil(h);
  const c = off.getContext("2d", { willReadFrequently: true })!;
  const result: Pt[][] = [];
  for (const span of spans) {
    c.clearRect(0, 0, off.width, off.height);
    const cs = getComputedStyle(span);
    const size = parseFloat(cs.fontSize);
    c.font = `${cs.fontWeight} ${size}px ${cs.fontFamily}`;
    c.letterSpacing = cs.letterSpacing === "normal" ? "0px" : cs.letterSpacing;
    c.fillStyle = "#fff";
    const r = span.getBoundingClientRect();
    const m = c.measureText(span.textContent ?? "");
    const fa = m.fontBoundingBoxAscent;
    const fd = m.fontBoundingBoxDescent;
    const baseline = r.top - box.top + (r.height - (fa + fd)) / 2 + fa;
    c.fillText(span.textContent ?? "", r.left - box.left, baseline);
    const data = c.getImageData(0, 0, off.width, off.height).data;
    const at = (x: number, y: number) => data[(y * off.width + x) * 4 + 3] ?? 0;
    const pts: Pt[] = [];
    for (let y = 1; y < off.height - 1; y += 2) {
      for (let x = 1; x < off.width - 1; x += 2) {
        if (at(x, y) < 128) continue;
        if (at(x - 2, y) < 128 || at(x + 2, y) < 128 || at(x, y - 2) < 128 || at(x, y + 2) < 128) pts.push({ x, y });
      }
    }
    result.push(pts);
  }
  const [dad = [], gpt = []] = result;
  return { dad, gpt, all: [...dad, ...gpt] };
}

function star(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, rot: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.beginPath();
  for (let i = 0; i < 4; i++) {
    ctx.rotate(Math.PI / 2);
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(s * 0.12, s * 0.12, 0, s);
    ctx.quadraticCurveTo(-s * 0.12, s * 0.12, 0, 0);
  }
  ctx.fill();
  ctx.restore();
}

function dot(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, alpha: number) {
  ctx.globalAlpha = alpha;
  ctx.beginPath();
  ctx.arc(x, y, size / 2, 0, Math.PI * 2);
  ctx.fill();
}

/* 1. Faint specks drift and twinkle in the air around the logo */
const dust: Effect = ({ ctx, w, h }) => {
  const motes = Array.from({ length: 70 }, () => ({ x: rnd(0, w), y: rnd(0, h), vx: rnd(-8, 8), vy: rnd(-6, 4), size: rnd(1.2, 3), a: rnd(0.35, 0.8), phase: rnd(0, 6.28), freq: rnd(0.4, 1.4) }));
  return (dt, t) => {
    for (const m of motes) {
      m.x = gsap.utils.wrap(-4, w + 4, m.x + m.vx * dt);
      m.y = gsap.utils.wrap(-4, h + 4, m.y + m.vy * dt);
      dot(ctx, m.x, m.y, m.size, m.a * (0.55 + 0.45 * Math.sin(t * m.freq + m.phase)));
    }
  };
};

/* 2. Tiny embers rise off the baseline and wander up past the letters */
const embers: Effect = ({ ctx, logo }) => {
  const list: { x: number; y: number; vx: number; vy: number; age: number; life: number; size: number; wob: number; ph: number }[] = [];
  let acc = 0;
  return (dt, t) => {
    acc += 26 * dt;
    while (acc >= 1) {
      acc -= 1;
      list.push({ x: rnd(logo.left, logo.right), y: logo.bottom + rnd(-2, 4), vx: rnd(-4, 4), vy: -rnd(22, 50), age: 0, life: rnd(2.2, 4), size: rnd(1.5, 3), wob: rnd(4, 12), ph: rnd(0, 6.28) });
    }
    for (let i = list.length - 1; i >= 0; i--) {
      const e = list[i]!;
      e.age += dt;
      if (e.age > e.life) {
        list.splice(i, 1);
        continue;
      }
      e.y += e.vy * dt;
      e.x += e.vx * dt;
      const k = e.age / e.life;
      dot(ctx, e.x + Math.sin(t * 2 + e.ph) * e.wob * k, e.y, e.size * (1 - k * 0.4), 0.9 * Math.sin(k * Math.PI));
    }
  };
};

/* 3. Now and then a four-point glint catches on a letter's edge */
const glints: Effect = ({ ctx, edges }) => {
  const list: { x: number; y: number; age: number; life: number; size: number; rot: number }[] = [];
  let next = 0.3;
  return (dt) => {
    next -= dt;
    if (next <= 0 && edges.all.length) {
      next = rnd(0.2, 0.6);
      const p = edges.all[Math.floor(rnd(0, edges.all.length))]!;
      list.push({ ...p, age: 0, life: rnd(0.6, 1.1), size: rnd(9, 18), rot: rnd(0, Math.PI) });
    }
    for (let i = list.length - 1; i >= 0; i--) {
      const g = list[i]!;
      g.age += dt;
      if (g.age > g.life) {
        list.splice(i, 1);
        continue;
      }
      const k = Math.sin((g.age / g.life) * Math.PI);
      ctx.globalAlpha = k;
      star(ctx, g.x, g.y, g.size * k, g.rot + g.age);
    }
  };
};

/* 4. A few moons orbit the logo, dimmer and smaller as they pass behind */
const orbit: Effect = ({ ctx, logo }) => {
  const cx = logo.left + logo.width / 2;
  const cy = logo.top + logo.height / 2;
  const rx = logo.width * 0.62;
  const ry = logo.height * 0.95;
  const moons = Array.from({ length: 5 }, (_, i) => ({ a: (i / 5) * Math.PI * 2 + rnd(-0.3, 0.3), speed: rnd(0.25, 0.4), tilt: rnd(-0.25, 0.25), size: rnd(2.5, 4.5) }));
  return (dt) => {
    for (const m of moons) {
      m.a += m.speed * dt;
      for (let trail = 0; trail < 10; trail++) {
        const a = m.a - trail * 0.035;
        const depth = Math.sin(a);
        const x = cx + Math.cos(a) * rx;
        const y = cy + depth * ry * 0.35 + Math.cos(a) * ry * m.tilt;
        const near = (depth + 1) / 2;
        dot(ctx, x, y, m.size * (0.5 + near * 0.7) * (1 - trail / 12), (0.35 + near * 0.65) * (1 - trail / 10));
      }
    }
  };
};

/* 5. The hairline GPT sheds fine vapor that drifts off to the right */
const vapor: Effect = ({ ctx, edges }) => {
  const list: { x: number; y: number; vx: number; vy: number; age: number; life: number }[] = [];
  let acc = 0;
  return (dt) => {
    acc += 40 * dt;
    while (acc >= 1 && edges.gpt.length) {
      acc -= 1;
      const p = edges.gpt[Math.floor(rnd(0, edges.gpt.length))]!;
      list.push({ ...p, vx: rnd(8, 26), vy: -rnd(2, 10), age: 0, life: rnd(1.2, 2.4) });
    }
    for (let i = list.length - 1; i >= 0; i--) {
      const v = list[i]!;
      v.age += dt;
      if (v.age > v.life) {
        list.splice(i, 1);
        continue;
      }
      v.x += v.vx * dt;
      v.y += v.vy * dt;
      const k = v.age / v.life;
      dot(ctx, v.x, v.y, 1.8, 0.85 * (1 - k));
    }
  };
};

/* 6. The letter edges fizz with a living, breathing halo */
const shimmer: Effect = ({ ctx, edges }) => {
  const pts = gsap.utils.shuffle([...edges.all]).slice(0, 800).map((p) => ({ ...p, ph: rnd(0, 6.28), f: rnd(0.6, 2), r: rnd(1.5, 5) }));
  return (_dt, t) => {
    for (const p of pts) {
      const s = Math.sin(t * p.f + p.ph);
      dot(ctx, p.x + Math.cos(t * p.f * 0.7 + p.ph) * p.r, p.y + s * p.r, 1.8, 0.35 + 0.45 * (s * 0.5 + 0.5));
    }
  };
};

/* 7. Drifting points join into a faint network when they pass close */
const constellation: Effect = ({ ctx, w, h }) => {
  const nodes = Array.from({ length: 22 }, () => ({ x: rnd(0, w), y: rnd(0, h), vx: rnd(-8, 8), vy: rnd(-8, 8) }));
  const reach = Math.min(w, h) * 0.32;
  return (dt) => {
    for (const n of nodes) {
      n.x += n.vx * dt;
      n.y += n.vy * dt;
      if (n.x < 0 || n.x > w) n.vx *= -1;
      if (n.y < 0 || n.y > h) n.vy *= -1;
    }
    ctx.lineWidth = 1;
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i]!;
        const b = nodes[j]!;
        const d = Math.hypot(a.x - b.x, a.y - b.y);
        if (d > reach) continue;
        ctx.globalAlpha = 0.45 * (1 - d / reach);
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }
    }
    for (const n of nodes) dot(ctx, n.x, n.y, 2.8, 0.8);
  };
};

/* 8. Dad's dandruff: slow flakes drift down, swaying */
const dandruff: Effect = ({ ctx, w, h }) => {
  const flakes = Array.from({ length: 55 }, () => ({ x: rnd(0, w), y: rnd(-h, h), vy: rnd(14, 30), sway: rnd(6, 18), f: rnd(0.5, 1.2), ph: rnd(0, 6.28), size: rnd(1.8, 3.6), a: rnd(0.45, 0.85) }));
  return (dt, t) => {
    for (const f of flakes) {
      f.y += f.vy * dt;
      if (f.y > h + 4) {
        f.y = -4;
        f.x = rnd(0, w);
      }
      dot(ctx, f.x + Math.sin(t * f.f + f.ph) * f.sway, f.y, f.size, f.a);
    }
  };
};

/* 9. Motes drift on their own, and gather toward your finger or cursor */
const gather: Effect = ({ ctx, w, h, pointer }) => {
  const motes = Array.from({ length: 90 }, () => ({ x: rnd(0, w), y: rnd(0, h), vx: rnd(-8, 8), vy: rnd(-8, 8), size: rnd(1.3, 2.8), a: rnd(0.45, 0.85) }));
  return (dt) => {
    for (const m of motes) {
      if (pointer.on) {
        const dx = pointer.x - m.x;
        const dy = pointer.y - m.y;
        const d = Math.max(30, Math.hypot(dx, dy));
        m.vx += (dx / d) * 160 * dt;
        m.vy += (dy / d) * 160 * dt;
      }
      m.vx *= Math.pow(0.97, dt * 60);
      m.vy *= Math.pow(0.97, dt * 60);
      if (!pointer.on && Math.hypot(m.vx, m.vy) < 4) {
        m.vx += rnd(-3, 3) * dt * 10;
        m.vy += rnd(-3, 3) * dt * 10;
      }
      m.x = gsap.utils.wrap(-4, w + 4, m.x + m.vx * dt);
      m.y = gsap.utils.wrap(-4, h + 4, m.y + m.vy * dt);
      dot(ctx, m.x, m.y, m.size, m.a);
    }
  };
};

function Card({ n, title, note, effect }: { n: number; title: string; note: string; effect: Effect }) {
  const stageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const stage = stageRef.current;
    const canvas = canvasRef.current;
    if (!stage || !canvas || prefersReducedMotion()) return;
    const ctx = canvas.getContext("2d")!;
    const pointer = { x: 0, y: 0, on: false };
    let step: ((dt: number, t: number) => void) | null = null;
    let visible = false;
    let time = 0;
    let cancelled = false;

    const build = () => {
      const box = stage.getBoundingClientRect();
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = Math.round(box.width * dpr);
      canvas.height = Math.round(box.height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const rel = (r: DOMRect) => new DOMRect(r.left - box.left, r.top - box.top, r.width, r.height);
      const logo = stage.querySelector(`.${styles.logo}`) as HTMLElement;
      const [dad, gpt] = Array.from(logo.querySelectorAll("span"));
      step = effect({
        ctx,
        w: box.width,
        h: box.height,
        logo: rel(logo.getBoundingClientRect()),
        dad: rel(dad!.getBoundingClientRect()),
        gpt: rel(gpt!.getBoundingClientRect()),
        edges: sampleEdges(stage, box.width, box.height),
        pointer,
      });
    };

    const tick = (_t: number, deltaMs: number) => {
      if (!step || !visible) return;
      const dt = Math.min(0.05, deltaMs / 1000);
      time += dt;
      const box = stage.getBoundingClientRect();
      ctx.clearRect(0, 0, box.width, box.height);
      ctx.fillStyle = "#fff";
      ctx.strokeStyle = "#fff";
      step(dt, time);
      ctx.globalAlpha = 1;
    };

    // Only animate cards that are on screen
    const io = new IntersectionObserver(([entry]) => (visible = Boolean(entry?.isIntersecting)));
    io.observe(stage);
    const ro = new ResizeObserver(() => step && build());
    const move = (e: PointerEvent) => {
      const box = stage.getBoundingClientRect();
      pointer.x = e.clientX - box.left;
      pointer.y = e.clientY - box.top;
      pointer.on = true;
    };
    const leave = () => (pointer.on = false);
    stage.addEventListener("pointermove", move);
    stage.addEventListener("pointerdown", move);
    stage.addEventListener("pointerleave", leave);
    stage.addEventListener("pointerup", (e) => e.pointerType !== "mouse" && leave());

    // Edge sampling needs the real face
    document.fonts.ready.then(() => {
      if (cancelled) return;
      build();
      ro.observe(stage);
      gsap.ticker.add(tick);
    });

    return () => {
      cancelled = true;
      gsap.ticker.remove(tick);
      io.disconnect();
      ro.disconnect();
      stage.removeEventListener("pointermove", move);
      stage.removeEventListener("pointerdown", move);
      stage.removeEventListener("pointerleave", leave);
    };
  }, [effect]);

  return (
    <figure className={styles.card}>
      <div ref={stageRef} className={styles.stage}>
        <div className={styles.logo}>
          <span>DAD</span>
          <span className={styles.gpt}>GPT</span>
        </div>
        <canvas ref={canvasRef} className={styles.canvas} aria-hidden="true" />
      </div>
      <figcaption className={styles.caption}>
        <span className={styles.num}>{String(n).padStart(2, "0")}</span>
        <strong>{title}</strong>
        <p>{note}</p>
      </figcaption>
    </figure>
  );
}

const EFFECTS = [
  { title: "Dust", note: "Faint specks drift and twinkle in the air.", effect: dust },
  { title: "Embers", note: "Tiny sparks rise off the baseline and wander up.", effect: embers },
  { title: "Glints", note: "Now and then a sparkle catches on a letter edge.", effect: glints },
  { title: "Orbit", note: "A few moons circle the logo, dimming as they pass behind.", effect: orbit },
  { title: "Vapor", note: "The thin GPT sheds fine vapor that drifts to the right.", effect: vapor },
  { title: "Fizz", note: "The letter edges shimmer with a soft, living halo.", effect: shimmer },
  { title: "Constellation", note: "Drifting points link into a faint network when close.", effect: constellation },
  { title: "Dandruff", note: "Slow flakes drift down past the logo. Sorry, Dad.", effect: dandruff },
  { title: "Gather", note: "Motes drift, then gather toward your cursor or finger.", effect: gather },
];

export default function Particles() {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1>
          DAD<span className="gpt">GPT</span> particles
        </h1>
        <p>Nine ambient ideas for the logo. Each one runs only while it is on screen.</p>
      </header>
      <div className={styles.grid}>
        {EFFECTS.map((e, i) => (
          <Card key={e.title} n={i + 1} {...e} />
        ))}
      </div>
    </div>
  );
}
