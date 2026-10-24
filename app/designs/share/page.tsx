import { DESIGNS } from "@/lib/og-designs";
import styles from "./share.module.css";

const TITLE = "DADGPT Costume";
const DESCRIPTION = "A Halloween costume you can talk to. Tap the mic, ask Dad anything, and he answers out loud with a dad joke.";
const DOMAIN = "dadgpt.vercel.app";

// Each image is the real 1200x630 PNG the route renders, so the pick drops straight into opengraph-image.tsx
export default function ShareDesigns() {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1>Share image</h1>
        <p>The picture that shows when someone posts the DADGPT link. Each one is the real 1200 by 630 image, then how it looks in a text and in Slack.</p>
      </header>

      <div className={styles.list}>
        {DESIGNS.map((design, i) => {
          const src = `/designs/share/og/${i + 1}`;
          return (
            <figure key={design.title} className={styles.card}>
              <img className={styles.full} src={src} width={1200} height={630} alt={`Share image ${i + 1}, ${design.title}`} />
              <figcaption className={styles.caption}>
                <span className={styles.num}>{String(i + 1).padStart(2, "0")}</span>
                <strong>{design.title}</strong>
                <p>{design.note}</p>
              </figcaption>

              <div className={styles.contexts}>
                {/* A text message link preview: image on top, title and domain underneath */}
                <div className={styles.imessage}>
                  <img src={src} width={1200} height={630} alt="" />
                  <div className={styles.imessageText}>
                    <strong>{TITLE}</strong>
                    <span>{DOMAIN}</span>
                  </div>
                </div>

                {/* A Slack unfurl: side bar, site, title, description, then the image */}
                <div className={styles.slack}>
                  <span className={styles.slackSite}>DADGPT</span>
                  <strong className={styles.slackTitle}>{TITLE}</strong>
                  <span className={styles.slackDesc}>{DESCRIPTION}</span>
                  <img src={src} width={1200} height={630} alt="" />
                </div>
              </div>
            </figure>
          );
        })}
      </div>
    </div>
  );
}
