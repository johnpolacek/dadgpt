"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { TextPlugin } from "gsap/TextPlugin";
import s from "./about.module.css";

gsap.registerPlugin(TextPlugin);

const TAG = "Ask Dad anything. He answers with a dad joke. Every time.";
const COSTUME =
  "Wear a black t-shirt and a black baseball hat. Set a phone sideways on the brim, screen out, and open the app. Pin the printed logo to your chest. People walk up, tap the mic, and talk to Dad.";
const HOW = "Tap the mic and talk. Dad writes one pun about what you said and says it out loud. He never gives a real answer, no matter how hard you push.";
const ART = "/kit/costume.svg";
const ART_ALT = "Pen and ink drawing of the costume: a phone sideways on the brim of a black baseball hat, and a printed logo pinned to a black t-shirt.";
const GITHUB = "https://github.com/johnpolacek/dadgpt";
const LOGOS = [
  { label: "Black on white", file: "dadgpt-logo-black-on-white" },
  { label: "White on black", file: "dadgpt-logo-white-on-black" },
];
const FORMATS = ["svg", "pdf", "png"];

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return true;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

type Orient = "land" | "port";
type Play = (stage: HTMLElement) => void;

/* ---------- Shared pieces ---------- */

function Logo({ className = "" }: { className?: string }) {
  return (
    <div className={`${s.logo} ${className}`} data-a>
      <b>DAD</b>
      <span>GPT</span>
    </div>
  );
}

function MicIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="9" y="2" width="6" height="12" rx="3" />
      <path d="M5 10v1a7 7 0 0 0 14 0v-1" />
      <path d="M12 18v4" />
    </svg>
  );
}

function Back({ label = "Talk to Dad", className = "" }: { label?: string; className?: string }) {
  return (
    <a className={`${s.back} ${className}`} href="/" data-a>
      <MicIcon />
      {label}
    </a>
  );
}

function Downloads({ className = "" }: { className?: string }) {
  return (
    <div className={`${s.downloads} ${className}`} data-a>
      {LOGOS.map((logo) => (
        <div key={logo.file} className={s.dlRow}>
          <span>{logo.label}</span>
          <span className={s.dlLinks}>
            {FORMATS.map((ext) => (
              <a key={ext} href={`/kit/logo/${logo.file}.${ext}`} download>
                {ext.toUpperCase()}
              </a>
            ))}
          </span>
        </div>
      ))}
    </div>
  );
}

function Credit({ className = "" }: { className?: string }) {
  return (
    <a className={`${s.credit} ${className}`} href={GITHUB} target="_blank" rel="noopener noreferrer" data-a>
      Code on GitHub
    </a>
  );
}

function Art({ className = "" }: { className?: string }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img className={`${s.art} ${className}`} src={ART} alt={ART_ALT} data-a />;
}

/* ---------- 1. Poster ---------- */

function Poster() {
  return (
    <div className={`${s.view} ${s.poster}`}>
      <div className={s.posterText}>
        <Logo className={s.posterLogo} />
        <p className={s.posterTag} data-a>
          {TAG}
        </p>
        <p className={s.body} data-a>
          {COSTUME}
        </p>
        <p className={s.body} data-a>
          {HOW}
        </p>
        <Back />
        <Downloads />
        <Credit />
      </div>
      <Art className={s.posterArt} />
    </div>
  );
}

/* ---------- 2. Patent plate ---------- */

function Patent() {
  return (
    <div className={`${s.view} ${s.patent}`}>
      <header className={s.patentHead} data-a>
        <span>United States Patent Pending</span>
        <span>Sheet 1 of 1</span>
      </header>
      <div className={s.patentTitle} data-a>
        Wearable Dad Joke Apparatus
      </div>
      <div className={s.patentMeta} data-a>
        Inventor: Dad. Assignee: anyone who asks.
      </div>
      <div className={s.patentGrid}>
        <section className={s.patentCol}>
          <div className={s.patentLabel} data-a>
            Abstract
          </div>
          <p className={s.body} data-a>
            {TAG} {COSTUME}
          </p>
        </section>
        <div className={s.patentFig} data-a>
          <Art />
        </div>
        <section className={s.patentCol}>
          <div className={s.patentLabel} data-a>
            What is claimed is
          </div>
          <ol className={s.claims}>
            <li data-a>An apparatus worn on the head that answers any question with a pun.</li>
            <li data-a>The apparatus of claim 1, wherein the pun is spoken out loud.</li>
            <li data-a>The apparatus of claim 1, wherein no real answer is ever given.</li>
          </ol>
          <div className={s.patentLabel} data-a>
            Exhibits
          </div>
          <Downloads />
          <Back label="Operate the apparatus" />
          <Credit />
        </section>
      </div>
    </div>
  );
}

/* ---------- 3. Instruction manual ---------- */

const STEPS = [
  { title: "Dress in black", text: "A black t-shirt and a black baseball hat." },
  { title: "Phone on the brim", text: "Set it sideways, screen out, and open the app." },
  { title: "Pin the logo", text: "Print it below and pin it to your chest." },
  { title: "Let them talk", text: "People tap the mic and ask Dad anything. He answers with a pun. Every time." },
];

function Manual() {
  return (
    <div className={`${s.view} ${s.manual}`}>
      <div className={s.manualHead}>
        <Logo className={s.manualLogo} />
        <div className={s.manualKicker} data-a>
          Assembly instructions. No tools required.
        </div>
      </div>
      <ol className={s.steps}>
        {STEPS.map((step, i) => (
          <li key={step.title} className={s.step} data-a>
            <span className={s.stepNum}>{i + 1}</span>
            <strong>{step.title}</strong>
            <span>{step.text}</span>
          </li>
        ))}
      </ol>
      <div className={s.manualFoot}>
        <Back />
        <Downloads />
        <Credit />
      </div>
    </div>
  );
}

/* ---------- 4. Museum placard ---------- */

function Placard() {
  return (
    <div className={`${s.view} ${s.museum}`}>
      <div className={s.wall}>
        <Art className={s.museumArt} />
      </div>
      <aside className={s.placard} data-a>
        <div className={s.placardTitle}>DADGPT</div>
        <div className={s.placardSub}>Unknown Dad, 2026</div>
        <div className={s.placardMedium}>Cotton, baseball cap, phone, puns</div>
        <p>{COSTUME}</p>
        <p>{HOW}</p>
        <div className={s.placardShop}>Gift shop: printable logo</div>
        <Downloads className={s.placardDl} />
        <Back label="Ask the artwork" className={s.placardBack} />
        <Credit className={s.placardCredit} />
      </aside>
    </div>
  );
}

/* ---------- 5. Dad Facts label ---------- */

const FACTS = [
  ["Real answers", "0%"],
  ["Puns", "100%"],
  ["Words per reply", "Under 25"],
  ["Spoken out loud", "Yes"],
  ["Cheekiness", "A little"],
];

function Facts() {
  return (
    <div className={`${s.view} ${s.facts}`}>
      <div className={s.factsIntro}>
        <Logo className={s.factsLogo} />
        <p className={s.posterTag} data-a>
          {TAG}
        </p>
        <Back />
        <Credit />
      </div>
      <div className={s.label} data-a>
        <div className={s.labelTitle}>Dad Facts</div>
        <div className={s.labelServing}>
          <span>Serving size</span>
          <strong>1 pun</strong>
        </div>
        <div className={s.labelThick} />
        {FACTS.map(([k, v]) => (
          <div key={k} className={s.labelRow}>
            <span>{k}</span>
            <strong>{v}</strong>
          </div>
        ))}
        <div className={s.labelThick} />
        <p className={s.labelIngredients}>
          <strong>Ingredients:</strong> black t-shirt, black baseball hat, one phone set sideways on the brim, printed logo pinned to the chest, Dad.
        </p>
        <p className={s.labelIngredients}>
          <strong>Directions:</strong> walk up, tap the mic, talk to Dad.
        </p>
        <div className={s.labelThin} />
        <Downloads className={s.labelDl} />
      </div>
    </div>
  );
}

/* ---------- 6. Terminal ---------- */

const TERMINAL: { cmd: string; out: string[] }[] = [
  { cmd: "dadgpt --about", out: [TAG] },
  {
    cmd: "dadgpt --costume",
    out: ["hat ...... black baseball", "shirt .... black t-shirt", "phone .... sideways on the brim", "logo ..... printed, pinned on"],
  },
  { cmd: "dadgpt --how", out: ["1  tap the mic and talk", "2  dad writes one pun", "3  dad says it out loud", "4  no real answers, ever"] },
];

function Terminal() {
  return (
    <div className={`${s.view} ${s.term}`}>
      <div className={s.termBar} data-a>
        <span>dad@costume: ~</span>
        <Logo className={s.termLogo} />
      </div>
      <div className={s.termBody}>
        {TERMINAL.map((block) => (
          <div key={block.cmd} className={s.termBlock}>
            <div className={s.termCmd} data-a>
              <span className={s.prompt}>$</span> <span data-type={block.cmd}>{block.cmd}</span>
            </div>
            {block.out.map((line) => (
              <div key={line} className={s.termOut} data-a>
                {line}
              </div>
            ))}
          </div>
        ))}
        <div className={s.termBlock}>
          <div className={s.termCmd} data-a>
            <span className={s.prompt}>$</span> <span data-type="dadgpt --print">dadgpt --print</span>
          </div>
          <Downloads className={s.termDl} />
        </div>
        <div className={s.termCmd} data-a>
          <span className={s.prompt}>$</span> <a className={s.termRun} href="/">dadgpt</a>
          <span className={s.cursor} />
        </div>
        <Credit className={s.termCredit} />
      </div>
      <Art className={s.termArt} />
    </div>
  );
}

/* ---------- 7. Comic ---------- */

function Comic() {
  return (
    <div className={`${s.view} ${s.comic}`}>
      <div className={s.comicTop}>
        <Logo className={s.comicLogo} />
        <p className={s.posterTag} data-a>
          {TAG}
        </p>
      </div>
      <div className={s.panels}>
        <figure className={s.panel} data-a>
          <Art className={s.panelArt} />
          <figcaption>Put on the costume.</figcaption>
        </figure>
        <figure className={s.panel} data-a>
          <div className={s.bubble}>Why can&apos;t you give me a real answer?</div>
          <div className={s.panelMic}>
            <MicIcon />
          </div>
          <figcaption>Someone taps the mic.</figcaption>
        </figure>
        <figure className={s.panel} data-a>
          <div className={`${s.bubble} ${s.bubbleDad}`}>I&apos;m reading a book about anti-gravity. It&apos;s impossible to put down.</div>
          <Logo className={s.panelLogo} />
          <figcaption>Dad answers. Out loud.</figcaption>
        </figure>
      </div>
      <div className={s.comicFoot}>
        <p className={s.body} data-a>
          {COSTUME}
        </p>
        <Downloads />
        <Back />
        <Credit />
      </div>
    </div>
  );
}

/* ---------- 8. Dad explains (chat) ---------- */

const CHAT: { q: string; a: string }[] = [
  { q: "What is this?", a: TAG },
  { q: "How do I wear it?", a: COSTUME },
  { q: "How does it work?", a: HOW },
  { q: "Can I print the logo?", a: "Sure. I never miss a good print job." },
];

function Chat() {
  return (
    <div className={`${s.view} ${s.chat}`}>
      <div className={s.chatHero}>
        <Logo className={s.chatLogo} />
        <a className={s.chatMic} href="/" aria-label="Back to Dad" data-a>
          <MicIcon />
        </a>
        <span className={s.chatHint} data-a>
          Back to Dad
        </span>
      </div>
      <div className={s.chatLog}>
        {CHAT.map((turn) => (
          <div key={turn.q} className={s.chatTurn}>
            <p className={s.said} data-a>
              {turn.q}
            </p>
            <p className={s.reply} data-a data-scramble>
              {turn.a}
            </p>
          </div>
        ))}
        <Downloads />
        <Credit />
      </div>
    </div>
  );
}

/* ---------- Animations ---------- */

/** Everything marked data-a rises in, in reading order */
const rise: Play = (stage) => {
  const q = gsap.utils.selector(stage);
  q("[data-screen]").forEach((screen) => {
    const items = screen.querySelectorAll("[data-a]");
    gsap.fromTo(items, { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, duration: 0.6, ease: "power3.out", stagger: 0.06 });
  });
};

/** The plate inks in: the figure first, then the text */
const plate: Play = (stage) => {
  const q = gsap.utils.selector(stage);
  q("[data-screen]").forEach((screen) => {
    const fig = screen.querySelector(`.${s.patentFig}`);
    const rest = Array.from(screen.querySelectorAll("[data-a]")).filter((el) => el !== fig && !fig?.contains(el));
    gsap
      .timeline()
      .fromTo(fig, { autoAlpha: 0, clipPath: "inset(0 0 100% 0)" }, { autoAlpha: 1, clipPath: "inset(0 0 0% 0)", duration: 1.4, ease: "power2.inOut" })
      .fromTo(rest, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.4, stagger: 0.05 }, 0.5)
      .set(fig, { clearProps: "clipPath" });
  });
};

/** Steps drop in one at a time, like turning pages */
const steps: Play = (stage) => {
  const q = gsap.utils.selector(stage);
  q("[data-screen]").forEach((screen) => {
    const items = screen.querySelectorAll("[data-a]");
    gsap.fromTo(items, { autoAlpha: 0, scale: 0.92 }, { autoAlpha: 1, scale: 1, duration: 0.5, ease: "back.out(2)", stagger: 0.12 });
  });
};

/** Lights come up on the artwork, then the placard */
const gallery: Play = (stage) => {
  const q = gsap.utils.selector(stage);
  q("[data-screen]").forEach((screen) => {
    const art = screen.querySelector(`.${s.museumArt}`);
    const placard = screen.querySelector(`.${s.placard}`);
    gsap
      .timeline()
      .fromTo(art, { autoAlpha: 0, filter: "brightness(0.2)" }, { autoAlpha: 1, filter: "brightness(1)", duration: 1.6, ease: "power1.inOut", clearProps: "filter" })
      .fromTo(placard, { autoAlpha: 0, y: 10 }, { autoAlpha: 1, y: 0, duration: 0.6, ease: "power2.out" }, "-=0.6");
  });
};

/** Rows of the label print top to bottom */
const label: Play = (stage) => {
  const q = gsap.utils.selector(stage);
  q("[data-screen]").forEach((screen) => {
    const intro = screen.querySelectorAll(`.${s.factsIntro} [data-a]`);
    const box = screen.querySelector(`.${s.label}`);
    const rows = box ? Array.from(box.children) : [];
    gsap
      .timeline()
      .fromTo(intro, { autoAlpha: 0, y: 10 }, { autoAlpha: 1, y: 0, duration: 0.5, ease: "power2.out", stagger: 0.08 })
      .set(box, { autoAlpha: 1 }, 0.2)
      .fromTo(rows, { autoAlpha: 0, x: -8 }, { autoAlpha: 1, x: 0, duration: 0.3, ease: "power2.out", stagger: 0.07 }, 0.2);
  });
};

/** Each command types itself, then its output appears */
const typing: Play = (stage) => {
  const q = gsap.utils.selector(stage);
  q("[data-screen]").forEach((screen) => {
    gsap.set(screen.querySelectorAll("[data-a]"), { autoAlpha: 0 });
    const tl = gsap.timeline();
    screen.querySelectorAll("[data-a]").forEach((el) => {
      const typed = el.querySelector<HTMLElement>("[data-type]");
      tl.set(el, { autoAlpha: 1 });
      if (typed) {
        const text = typed.dataset.type ?? "";
        tl.fromTo(typed, { text: "" }, { text, duration: text.length * 0.035, ease: "none" });
      } else tl.fromTo(el, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.05 }, "+=0.06");
    });
  });
};

/** Panels slap down, bubbles pop */
const panels: Play = (stage) => {
  const q = gsap.utils.selector(stage);
  q("[data-screen]").forEach((screen) => {
    const items = screen.querySelectorAll("[data-a]");
    const bubbles = screen.querySelectorAll(`.${s.bubble}`);
    gsap
      .timeline()
      .fromTo(items, { autoAlpha: 0, rotation: () => gsap.utils.random(-4, 4), scale: 0.9 }, { autoAlpha: 1, rotation: 0, scale: 1, duration: 0.45, ease: "back.out(2.5)", stagger: 0.15 })
      .fromTo(bubbles, { scale: 0, transformOrigin: "20% 100%" }, { scale: 1, duration: 0.4, ease: "back.out(3)", stagger: 0.3 }, 0.5);
  });
};

/** Questions appear, Dad's answers scramble in like the live app */
const chat: Play = (stage) => {
  const q = gsap.utils.selector(stage);
  q("[data-screen]").forEach((screen) => {
    gsap.set(screen.querySelectorAll("[data-a]"), { autoAlpha: 0 });
    const tl = gsap.timeline();
    screen.querySelectorAll<HTMLElement>("[data-a]").forEach((el) => {
      if (el.hasAttribute("data-scramble")) {
        const text = el.textContent ?? "";
        tl.set(el, { autoAlpha: 1 }).fromTo(el, { text: "" }, { text, duration: Math.min(1.2, text.length * 0.012), ease: "none" });
      } else tl.fromTo(el, { autoAlpha: 0, y: 8 }, { autoAlpha: 1, y: 0, duration: 0.35, ease: "power2.out" }, "+=0.05");
    });
  });
};

/* ---------- Card ---------- */

function Screen({ o, children }: { o: Orient; children: React.ReactNode }) {
  return (
    <div className={s.device}>
      <div className={`${s.screen} ${o === "land" ? s.land : s.port}`} data-screen>
        {children}
      </div>
      <span className={s.deviceLabel}>{o === "land" ? "On the hat" : "In hand"}</span>
    </div>
  );
}

function Card({ n, title, note, play, View }: { n: number; title: string; note: string; play: Play; View: () => React.ReactNode }) {
  const stageRef = useRef<HTMLDivElement>(null);
  const ctxRef = useRef<gsap.Context | null>(null);

  const run = () => {
    const stage = stageRef.current;
    if (!stage) return;
    ctxRef.current?.revert();
    ctxRef.current = null;
    stage.dataset.ready = "";
    if (prefersReducedMotion()) return;
    stage.querySelectorAll("[data-screen]").forEach((el) => el.scrollTo(0, 0));
    ctxRef.current = gsap.context(() => play(stage), stage);
  };

  useEffect(() => {
    let cancelled = false;
    document.fonts.ready.then(() => !cancelled && run());
    return () => {
      cancelled = true;
      ctxRef.current?.revert();
      ctxRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <figure className={s.card}>
      <div ref={stageRef} className={s.stage}>
        <Screen o="land">
          <View />
        </Screen>
        <Screen o="port">
          <View />
        </Screen>
      </div>
      <figcaption className={s.caption}>
        <div>
          <span className={s.num}>{String(n).padStart(2, "0")}</span>
          <strong>{title}</strong>
          <p>{note}</p>
        </div>
        <button className={s.replay} onClick={run} aria-label={`Replay ${title}`}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
            <path d="M3 3v5h5" />
          </svg>
        </button>
      </figcaption>
    </figure>
  );
}

const DIRECTIONS: { title: string; note: string; play: Play; View: () => React.ReactNode }[] = [
  { title: "Poster", note: "Big logo and tagline beside the drawing. Loud, simple, reads from across a party.", play: rise, View: Poster },
  { title: "Patent plate", note: "The drawing as Fig. 1 of a patent filing, with an abstract and claims.", play: plate, View: Patent },
  { title: "Instruction manual", note: "Four numbered assembly steps. The most useful if someone wants to make one.", play: steps, View: Manual },
  { title: "Museum placard", note: "The costume hung like an artwork, with a white wall label beside it.", play: gallery, View: Placard },
  { title: "Dad Facts", note: "A nutrition label. Real answers 0%, puns 100%.", play: label, View: Facts },
  { title: "Terminal", note: "A shell session that prints the about info, one command at a time.", play: typing, View: Terminal },
  { title: "Comic strip", note: "Three panels: wear it, tap the mic, Dad answers with a pun.", play: panels, View: Comic },
  { title: "Dad explains", note: "Told as a chat in the app's own style, so it feels like the same place.", play: chat, View: Chat },
];

export default function AboutDesigns() {
  return (
    <div className={s.page}>
      <header className={s.header}>
        <div className={s.pageTitle}>About page</div>
        <p>Eight directions for the About page. Each shows the sideways phone on the hat and a phone held upright. Mocks scroll. Replay reruns the intro.</p>
      </header>
      <div className={s.grid}>
        {DIRECTIONS.map((d, i) => (
          <Card key={d.title} n={i + 1} {...d} />
        ))}
      </div>
    </div>
  );
}
