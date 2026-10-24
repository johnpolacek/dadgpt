"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import gsap from "gsap";
import { startEmbers } from "@/lib/embers";
import { blastOff, isPortrait, lastStair, prefersReducedMotion, scrambleIn, startWave } from "@/lib/motion";
import { JOKES, jokeAudioPath, randomJoke } from "@/lib/jokes";

type Turn = { role: "user" | "assistant"; content: string };
type Status = "idle" | "listening" | "thinking" | "speaking";

// Minimal Web Speech API types, not all browsers ship them in lib.dom
type Recognition = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  start(): void;
  stop(): void;
  onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }> }) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
};

// Canned mode answers with stock jokes and prerecorded audio, so it needs no API keys
type Props = { canned?: boolean };

function getRecognition(): Recognition | null {
  const w = window as unknown as Record<string, new () => Recognition>;
  const Ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition;
  return Ctor ? new Ctor() : null;
}

// Browsers don't expose voice gender, so match known male voice names
const MALE_VOICES = /\b(male|daniel|alex|fred|aaron|arthur|gordon|oliver|rishi|thomas|tom|david|mark|guy|george|james|ryan|eddy|reed|rocko|grandpa|ralph|junior)\b/i;

function pickMaleVoice(): SpeechSynthesisVoice | undefined {
  const english = window.speechSynthesis.getVoices().filter((v) => v.lang.startsWith("en"));
  const american = english.filter((v) => /^en[-_]US$/i.test(v.lang));
  return american.find((v) => MALE_VOICES.test(v.name)) ?? english.find((v) => MALE_VOICES.test(v.name));
}

// One shared element, unlocked during the mic tap so later playback isn't blocked
let dadAudio: HTMLAudioElement | null = null;
const SILENCE = "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=";

function unlockAudio() {
  dadAudio ??= new Audio();
  dadAudio.src = SILENCE;
  dadAudio.play().catch(() => {});
}

/** On phones, the first mic tap takes the page fullscreen. Android Chrome allows it, iPhone ignores it. */
function goFullscreen() {
  const root = document.documentElement;
  if (document.fullscreenElement || !root.requestFullscreen) return;
  if (!matchMedia("(pointer: coarse)").matches || matchMedia("(display-mode: standalone)").matches) return;
  root.requestFullscreen({ navigationUI: "hide" }).catch(() => {});
}

function stopSpeaking() {
  dadAudio?.pause();
  window.speechSynthesis?.cancel();
}

/** Speaks with the OpenAI voice, falling back to the browser voice if that fails */
async function speak(text: string, onDone: () => void) {
  try {
    const res = await fetch("/api/speak", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    if (!res.ok) throw new Error(`TTS ${res.status}`);
    const url = URL.createObjectURL(await res.blob());
    await playAudio(url, () => {
      URL.revokeObjectURL(url);
      onDone();
    });
  } catch {
    speakWithBrowser(text, onDone);
  }
}

/** Plays a joke's prerecorded mp3, falling back to the browser voice if it is missing */
async function speakJoke(index: number, onDone: () => void) {
  try {
    await playAudio(jokeAudioPath(index), onDone);
  } catch {
    speakWithBrowser(JOKES[index], onDone);
  }
}

async function playAudio(src: string, onDone: () => void) {
  dadAudio ??= new Audio();
  const audio = dadAudio;
  const finish = () => {
    audio.onended = audio.onerror = audio.onpause = null;
    onDone();
  };
  audio.onended = audio.onerror = audio.onpause = finish;
  audio.src = src;
  try {
    await audio.play();
  } catch (error) {
    audio.onended = audio.onerror = audio.onpause = null;
    throw error;
  }
}

function speakWithBrowser(text: string, onDone: () => void) {
  if (!("speechSynthesis" in window)) return onDone();
  const utterance = new SpeechSynthesisUtterance(text);
  const voice = pickMaleVoice();
  if (voice) utterance.voice = voice;
  utterance.pitch = 0.8;
  utterance.rate = 0.95;
  utterance.onend = onDone;
  utterance.onerror = onDone;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
}

/** A chat line. New Dad replies scramble in word by word. */
function Message({ text, className, animate }: { text: string; className: string; animate: boolean }) {
  const ref = useRef<HTMLParagraphElement>(null);
  useLayoutEffect(() => {
    if (!animate || !ref.current || prefersReducedMotion()) return;
    return scrambleIn(ref.current).revert;
    // Only on mount: a line never re-animates
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <p ref={ref} className={className}>
      {text}
    </p>
  );
}

export default function DadChat({ canned = false }: Props) {
  const storageKey = canned ? "dadgpt_canned_history" : "dadgpt_history";
  const [history, setHistory] = useState<Turn[]>([]);
  const [status, setStatus] = useState<Status>("idle");
  const [heard, setHeard] = useState("");
  const [supported, setSupported] = useState(true);
  const recognitionRef = useRef<Recognition | null>(null);
  const mainRef = useRef<HTMLElement>(null);
  const chatRef = useRef<HTMLElement>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const messagesRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLElement>(null);
  const logoRef = useRef<HTMLHeadingElement>(null);
  const micWrapRef = useRef<HTMLDivElement>(null);
  // Lines loaded from storage appear as-is, only new replies fall in
  const loadedCountRef = useRef(0);
  const wasOpenRef = useRef(false);
  const blastingRef = useRef(false);

  useEffect(() => {
    setSupported(Boolean(getRecognition()));
    // Chrome loads voices async, so trigger the load before the first reply
    window.speechSynthesis?.getVoices();
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed: Turn[] = JSON.parse(saved);
        loadedCountRef.current = parsed.length;
        setHistory(parsed);
      }
    } catch {}
  }, []);

  // Intro: the logo falls down the stairs, the mic pops in, then the logo idles with a wave
  useLayoutEffect(() => {
    const logo = logoRef.current;
    const mic = micWrapRef.current;
    if (!logo || !mic) return;
    if (prefersReducedMotion()) {
      gsap.set([logo, mic], { autoAlpha: 1 });
      return;
    }
    let cancelled = false;
    let stair: ReturnType<typeof lastStair> | undefined;
    let pop: gsap.core.Tween | undefined;
    let stopWave: (() => void) | undefined;
    let stopEmbers: (() => void) | undefined;
    document.fonts.ready.then(() => {
      if (cancelled) return;
      gsap.set(logo, { autoAlpha: 1 });
      stair = lastStair(logo);
      pop = gsap.fromTo(mic, { scale: 0.5, autoAlpha: 0 }, { scale: 1, autoAlpha: 1, duration: 0.6, ease: "back.out(2)", delay: 1.1 });
      stair.tween.then(() => {
        if (cancelled) return;
        stopWave = startWave(logo);
        if (heroRef.current) stopEmbers = startEmbers(heroRef.current, logo);
      });
    });
    return () => {
      cancelled = true;
      stair?.revert();
      pop?.kill();
      stopWave?.();
      stopEmbers?.();
    };
  }, []);

  // Rings: a slow breath now and then while idle, fast pulses while listening
  useEffect(() => {
    const rings = micWrapRef.current?.querySelectorAll(".ring");
    if (!rings?.length || prefersReducedMotion()) return;
    const listening = status === "listening";
    const tl = listening
      ? gsap.timeline({ repeat: -1 }).fromTo(rings, { scale: 1, autoAlpha: 0.6 }, { scale: 2.6, autoAlpha: 0, duration: 1.4, ease: "power2.out", stagger: 0.35 })
      : gsap.timeline({ repeat: -1, repeatDelay: 6, delay: 3 }).fromTo(rings[0], { scale: 1, autoAlpha: 0.35 }, { scale: 2.4, autoAlpha: 0, duration: 3, ease: "sine.out" });
    return () => {
      tl.kill();
      gsap.set(rings, { scale: 1, autoAlpha: 0 });
    };
  }, [status]);

  function save(next: Turn[]) {
    setHistory(next);
    try {
      localStorage.setItem(storageKey, JSON.stringify(next.slice(-50)));
    } catch {}
  }

  async function send(text: string) {
    const next: Turn[] = [...history, { role: "user", content: text }];
    save(next);
    setStatus("thinking");

    if (canned) {
      const last = history.findLast((turn) => turn.role === "assistant")?.content;
      const index = randomJoke(last);
      await new Promise((resolve) => setTimeout(resolve, 600 + Math.random() * 600));
      save([...next, { role: "assistant", content: JOKES[index] }]);
      setStatus("speaking");
      speakJoke(index, () => setStatus("idle"));
      return;
    }

    let reply = "Dad is napping. Try again.";
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next }),
      });
      const data = await res.json();
      if (data.reply) reply = data.reply;
      else if (data.error) reply = data.error;
    } catch {}

    save([...next, { role: "assistant", content: reply }]);
    setStatus("speaking");
    speak(reply, () => setStatus("idle"));
  }

  function listen() {
    if (status === "listening") {
      recognitionRef.current?.stop();
      return;
    }
    stopSpeaking();
    unlockAudio();
    goFullscreen();

    const recognition = getRecognition();
    if (!recognition) return;
    recognitionRef.current = recognition;

    let transcript = "";
    recognition.lang = "en-US";
    recognition.interimResults = true;
    recognition.continuous = false;

    recognition.onresult = (event) => {
      transcript = Array.from(event.results)
        .map((result) => result[0].transcript)
        .join("");
      setHeard(transcript);
    };
    recognition.onerror = () => setStatus("idle");
    recognition.onend = () => {
      recognitionRef.current = null;
      if (transcript.trim()) send(transcript.trim());
      else setStatus("idle");
    };

    setHeard("");
    setStatus("listening");
    recognition.start();
  }

  function clear() {
    stopSpeaking();
    recognitionRef.current?.stop();
    loadedCountRef.current = 0;
    setHeard("");
    setStatus("idle");
    save([]);
  }

  // The X blows the visible chat apart, then the panel slides away
  function clearWithBlast(event: React.MouseEvent<HTMLButtonElement>) {
    const scroller = scrollerRef.current;
    const messages = messagesRef.current;
    if (blastingRef.current) return;
    if (!scroller || !messages || !mainRef.current || prefersReducedMotion()) return clear();
    blastingRef.current = true;
    stopSpeaking();
    recognitionRef.current?.stop();
    const view = scroller.getBoundingClientRect();
    const texts = Array.from(messages.querySelectorAll("p")).filter((p) => {
      const r = p.getBoundingClientRect();
      return r.bottom > view.top && r.top < view.bottom;
    });
    const blast = blastOff({ root: mainRef.current, texts, pressed: event.currentTarget });
    blast.timeline.eventCallback("onComplete", () => {
      gsap.set(messages, { autoAlpha: 0 });
      blast.revert();
      blastingRef.current = false;
      clear();
    });
  }

  useEffect(() => {
    const scroller = scrollerRef.current;
    scroller?.scrollTo({ top: scroller.scrollHeight, behavior: "smooth" });
  }, [history, heard, status]);

  // Fade the edges only where text is actually cut off by scrolling
  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    const update = () => {
      const above = scroller.scrollTop > 1;
      const below = scroller.scrollTop + scroller.clientHeight < scroller.scrollHeight - 1;
      scroller.style.setProperty("--fade-top", above ? "4rem" : "0px");
      scroller.style.setProperty("--fade-bottom", below ? "3rem" : "0px");
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(scroller);
    if (messagesRef.current) observer.observe(messagesRef.current);
    scroller.addEventListener("scroll", update, { passive: true });
    return () => {
      observer.disconnect();
      scroller.removeEventListener("scroll", update);
    };
  }, []);

  const open = history.length > 0 || (status === "listening" && Boolean(heard)) || status === "thinking";

  // The chat panel slides in beside the hero, or below it on tall screens
  useLayoutEffect(() => {
    const chat = chatRef.current;
    if (!chat || open === wasOpenRef.current) return;
    wasOpenRef.current = open;
    if (open) gsap.set(messagesRef.current, { clearProps: "opacity,visibility" });
    if (prefersReducedMotion()) return;
    const basis = isPortrait() ? "58%" : "50%";
    const [from, to] = open ? ["0%", basis] : [basis, "0%"];
    gsap.fromTo(chat, { flexBasis: from }, { flexBasis: to, duration: open ? 0.8 : 0.7, ease: "power3.inOut", overwrite: "auto", clearProps: "flexBasis" });
  }, [open]);

  const statusText = !supported
    ? "Dad can't hear you in this browser. Try Chrome or Safari."
    : status === "listening"
      ? "Talk to send a message"
      : "";

  return (
    <main ref={mainRef} className={`split ${open ? "open" : ""}`}>
      <section className="hero" ref={heroRef}>
        <h1 ref={logoRef} data-intro>
          DAD<span className="gpt">GPT</span>
        </h1>
        <div ref={micWrapRef} className="micWrap" data-intro>
          <span className="ring" />
          <span className="ring" />
          <span className="ring" />
          <button
            className={`mic ${status === "listening" ? "listening" : ""}`}
            onClick={listen}
            disabled={!supported || status === "thinking"}
            aria-label={status === "listening" ? "Stop listening" : "Talk to Dad"}
          >
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="9" y="2" width="6" height="12" rx="3" />
              <path d="M5 10v1a7 7 0 0 0 14 0v-1" />
              <path d="M12 18v4" />
            </svg>
          </button>
        </div>
        <p className="status">{statusText}</p>
        {canned && (
          <a className="about" href="https://github.com/johnpolacek/dadgpt" target="_blank" rel="noopener noreferrer">
            About
          </a>
        )}
      </section>

      <section className="chat" ref={chatRef}>
        <div className="scroller" ref={scrollerRef} aria-live="polite">
          <div className="messages" ref={messagesRef}>
            {history.map((turn, i) => (
              <Message
                key={`m-${i}`}
                text={turn.content}
                className={turn.role === "user" ? "said" : "reply"}
                animate={turn.role === "assistant" && i >= loadedCountRef.current}
              />
            ))}
            {/* Same key as the turn it becomes, so the line stays put when saved */}
            {status === "listening" && heard && <Message key={`m-${history.length}`} text={heard} className="said" animate={false} />}
            {status === "thinking" && <p className="reply thinking">Hmm...</p>}
          </div>
        </div>
        {history.length > 0 && (
          <button className="clear" onClick={clearWithBlast} aria-label="Clear chat">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        )}
      </section>
    </main>
  );
}
