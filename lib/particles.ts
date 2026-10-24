import gsap from "gsap";
import { prefersReducedMotion } from "./motion";

const rnd = gsap.utils.random;

type Shape = "dot" | "square" | "spark" | "star" | "ring";

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  age: number;
  life: number;
  shape: Shape;
  rotation: number;
  spin: number;
  drag: number;
  gravity: number;
  // Rings grow from the button's box
  box?: { w: number; h: number; spread: number };
};

/** Phones get fewer sparks; they still read as a burst at that size. */
const SPARKS = { fine: 46, coarse: 32 };

let canvas: HTMLCanvasElement | null = null;
let ctx: CanvasRenderingContext2D | null = null;
let dpr = 1;
const particles: Particle[] = [];
let running = false;

function ensureCanvas() {
  if (!canvas) {
    canvas = document.createElement("canvas");
    canvas.setAttribute("aria-hidden", "true");
    Object.assign(canvas.style, { position: "fixed", inset: "0", width: "100%", height: "100%", pointerEvents: "none", zIndex: "50" });
    document.body.append(canvas);
    ctx = canvas.getContext("2d");
  }
  dpr = Math.min(2, window.devicePixelRatio || 1);
  const w = Math.round(window.innerWidth * dpr);
  const h = Math.round(window.innerHeight * dpr);
  if (canvas.width !== w || canvas.height !== h) {
    canvas.width = w;
    canvas.height = h;
  }
}

function draw(p: Particle, k: number) {
  if (!ctx) return;
  ctx.globalAlpha = p.alpha * (1 - k);
  if (p.shape === "ring" && p.box) {
    const grow = p.box.spread * gsap.parseEase("power2.out")(k);
    const w = p.box.w + grow * 2;
    const h = p.box.h + grow * 2;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(p.x - w / 2, p.y - h / 2, w, h, Math.min(w, h) / 2);
    ctx.stroke();
    return;
  }
  ctx.save();
  ctx.translate(p.x, p.y);
  if (p.shape === "spark") {
    // A short streak along the direction of travel
    ctx.rotate(Math.atan2(p.vy, p.vx));
    const len = Math.min(14, Math.hypot(p.vx, p.vy) * 0.03 + p.size);
    ctx.lineWidth = p.size * 0.8;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(-len, 0);
    ctx.lineTo(0, 0);
    ctx.stroke();
  } else if (p.shape === "square") {
    ctx.rotate(p.rotation);
    ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
  } else if (p.shape === "star") {
    ctx.rotate(p.rotation);
    const s = p.size * Math.sin(k * Math.PI);
    ctx.beginPath();
    for (let i = 0; i < 4; i++) {
      ctx.rotate(Math.PI / 2);
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(s * 0.12, s * 0.12, 0, s);
      ctx.quadraticCurveTo(-s * 0.12, s * 0.12, 0, 0);
    }
    ctx.fill();
  } else {
    ctx.beginPath();
    ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function tick(_time: number, deltaMs: number) {
  if (!ctx || !canvas) return;
  const dt = Math.min(0.05, deltaMs / 1000);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#fff";
  ctx.strokeStyle = "#fff";
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i]!;
    p.age += dt;
    if (p.age >= p.life) {
      particles.splice(i, 1);
      continue;
    }
    const damp = Math.pow(1 - p.drag, dt * 60);
    p.vx *= damp;
    p.vy = p.vy * damp + p.gravity * dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.rotation += p.spin * dt;
    draw(p, p.age / p.life);
  }
  ctx.globalAlpha = 1;
  if (particles.length === 0) {
    gsap.ticker.remove(tick);
    running = false;
  }
}

function spawn(p: Partial<Particle> & Pick<Particle, "x" | "y" | "life">) {
  particles.push({ vx: 0, vy: 0, size: 2, alpha: 1, age: 0, shape: "dot", rotation: 0, spin: 0, drag: 0, gravity: 0, ...p });
}

/** Sparks erupt off the button's edge with two shockwave rings. */
export function burst(button: HTMLElement) {
  if (prefersReducedMotion()) return;
  ensureCanvas();
  const r = button.getBoundingClientRect();
  const cx = r.left + r.width / 2;
  const cy = r.top + r.height / 2;
  const box = { w: r.width, h: r.height };

  spawn({ x: cx, y: cy, life: 0.55, alpha: 0.9, shape: "ring", box: { ...box, spread: 34 } });
  spawn({ x: cx, y: cy, life: 0.8, alpha: 0.45, shape: "ring", box: { ...box, spread: 64 } });

  const coarse = window.matchMedia("(pointer: coarse)").matches;
  const count = coarse ? SPARKS.coarse : SPARKS.fine;
  for (let i = 0; i < count; i++) {
    const angle = rnd(0, Math.PI * 2);
    const nx = Math.cos(angle);
    const ny = Math.sin(angle);
    const speed = rnd(140, 420);
    const roll = Math.random();
    spawn({
      x: cx + nx * (r.width / 2),
      y: cy + ny * (r.height / 2),
      vx: nx * speed,
      vy: ny * speed - 60,
      size: roll < 0.3 ? rnd(2, 3.2) : rnd(1.2, 2.6),
      shape: roll < 0.3 ? "square" : roll < 0.75 ? "spark" : "dot",
      rotation: rnd(0, Math.PI),
      spin: rnd(-12, 12),
      life: rnd(0.45, 1),
      drag: 0.1,
      gravity: 520,
    });
  }
  for (let i = 0; i < 4; i++) {
    const angle = rnd(0, Math.PI * 2);
    const reach = Math.max(r.width, r.height) * rnd(0.6, 1.1);
    spawn({ x: cx + Math.cos(angle) * reach, y: cy + Math.sin(angle) * reach, size: rnd(6, 12), shape: "star", rotation: rnd(0, Math.PI), spin: rnd(-2, 2), life: rnd(0.4, 0.7), alpha: 1 });
  }

  if (!running) {
    running = true;
    gsap.ticker.add(tick);
  }
}

/** Every enabled button on the page bursts when pressed, by pointer or keyboard. */
export function attachPressParticles() {
  const onPointer = (event: PointerEvent) => {
    if (event.button !== 0) return;
    const button = (event.target as Element | null)?.closest("button");
    if (button && !button.disabled) burst(button);
  };
  const onKey = (event: KeyboardEvent) => {
    if (event.repeat || (event.key !== "Enter" && event.key !== " ")) return;
    const button = (event.target as Element | null)?.closest("button");
    if (button && !button.disabled) burst(button);
  };
  document.addEventListener("pointerdown", onPointer, { capture: true, passive: true });
  document.addEventListener("keydown", onKey, { capture: true });
  return () => {
    document.removeEventListener("pointerdown", onPointer, { capture: true });
    document.removeEventListener("keydown", onKey, { capture: true });
    gsap.ticker.remove(tick);
    running = false;
    particles.length = 0;
    canvas?.remove();
    canvas = null;
    ctx = null;
  };
}
