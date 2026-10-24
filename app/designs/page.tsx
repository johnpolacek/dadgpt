"use client";

import { useState } from "react";
import styles from "./designs.module.css";

// Google Sans Flex covers 1 to 1000
const WEIGHTS = [1, 100, 200, 300, 400, 500, 600, 700, 800, 900, 1000];

function Word({ dad, gpt }: { dad: number; gpt: number }) {
  return (
    <>
      <span style={{ fontWeight: dad }}>DAD</span>
      <span style={{ fontWeight: gpt }}>GPT</span>
    </>
  );
}

function Slider({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <label className={styles.slider}>
      <span>{label}</span>
      <input type="range" min={1} max={1000} value={value} onChange={(e) => onChange(Number(e.target.value))} />
      <span className={styles.value}>{value}</span>
    </label>
  );
}

export default function Designs() {
  const [dad, setDad] = useState(1000);
  const [gpt, setGpt] = useState(1);

  return (
    <div className={styles.page}>
      <section className={styles.preview}>
        <div className={styles.big}>
          <Word dad={dad} gpt={gpt} />
        </div>
        <div className={styles.controls}>
          <Slider label="DAD" value={dad} onChange={setDad} />
          <Slider label="GPT" value={gpt} onChange={setGpt} />
        </div>
      </section>

      <section>
        <h2 className={styles.heading}>Every combo · rows are DAD, columns are GPT · tap to preview</h2>
        <div className={styles.matrixScroll}>
          <table className={styles.matrix}>
            <thead>
              <tr>
                <th />
                {WEIGHTS.map((w) => (
                  <th key={w} scope="col">GPT {w}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {WEIGHTS.map((d) => (
                <tr key={d}>
                  <th scope="row">DAD {d}</th>
                  {WEIGHTS.map((g) => (
                    <td key={g}>
                      <button
                        className={`${styles.cell} ${d === dad && g === gpt ? styles.active : ""}`}
                        onClick={() => {
                          setDad(d);
                          setGpt(g);
                          window.scrollTo({ top: 0, behavior: "smooth" });
                        }}
                        aria-label={`DAD ${d}, GPT ${g}`}
                      >
                        <Word dad={d} gpt={g} />
                      </button>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
