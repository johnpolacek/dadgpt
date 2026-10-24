"use client";

import { useRef, useState } from "react";
import { LAB_JOKE, LAB_STYLES, LAB_VOICES, labAudioPath } from "@/lib/voice-lab";
import styles from "./voices.module.css";

export default function Voices() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState("");

  function play(src: string) {
    audioRef.current ??= new Audio();
    const audio = audioRef.current;
    if (playing === src) {
      audio.pause();
      return setPlaying("");
    }
    audio.onended = audio.onpause = () => setPlaying("");
    audio.src = src;
    audio.play().catch(() => setPlaying(""));
    setPlaying(src);
  }

  return (
    <div className={styles.page}>
      <header>
        <h1 className={styles.title}>Voice lab</h1>
        <p className={styles.joke}>{LAB_JOKE}</p>
      </header>

      {LAB_STYLES.map((style) => (
        <section key={style.id} className={styles.style}>
          <h2 className={styles.name}>{style.name}</h2>
          <p className={styles.instructions}>{style.instructions}</p>
          {style.text && <p className={styles.script}>Script: {style.text}</p>}
          <div className={styles.voices}>
            {LAB_VOICES.map((voice) => {
              const src = labAudioPath(style.id, voice);
              return (
                <button key={voice} className={`${styles.voice} ${playing === src ? styles.playing : ""}`} onClick={() => play(src)}>
                  {playing === src ? "■" : "▶"} {voice}
                </button>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
