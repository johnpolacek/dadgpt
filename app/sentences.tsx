import { Fragment } from "react";

/**
 * Each sentence becomes its own wrapping box, so lines break between sentences
 * when they fit. "Open DADGPT. People walk up" never ends a line on "People".
 * A sentence wider than the line still wraps inside its box, balanced.
 */
export default function Sentences({ text }: { text: string }) {
  const parts = text.split(/(?<=[.!?])\s+/);
  if (parts.length < 2) return text;
  return parts.map((part, i) => (
    <Fragment key={i}>
      {i > 0 && " "}
      <span className="sentence">{part}</span>
    </Fragment>
  ));
}
