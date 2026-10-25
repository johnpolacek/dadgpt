import { LOGO_PATHS, LOGO_RATIO, LOGO_VIEWBOX } from "./og-logo";

/** Share image explorations. Each draws a 1200x630 card with Satori, so flex layout only. */
export const OG_SIZE = { width: 1200, height: 630 };

export type OgAssets = { costume: string };

type Design = { title: string; note: string; render: (assets: OgAssets) => React.ReactElement };

const W = OG_SIZE.width;
const H = OG_SIZE.height;
const FG = "#fff";
const BG = "#000";
const DIM = "rgba(255,255,255,0.55)";

function Logo({ width, color = FG }: { width: number; color?: string }) {
  return (
    <svg width={width} height={Math.round(width * LOGO_RATIO)} viewBox={LOGO_VIEWBOX}>
      {LOGO_PATHS.map((d, i) => (
        <path key={i} d={d} fill={color} />
      ))}
    </svg>
  );
}

function Mic({ size, color = FG }: { size: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="2" width="6" height="12" rx="3" />
      <path d="M5 10v1a7 7 0 0 0 14 0v-1" />
      <path d="M12 18v4" />
    </svg>
  );
}

const frame = { width: W, height: H, display: "flex", background: BG, color: FG, fontFamily: "Google Sans Flex" } as const;

// Fixed seed so every render scatters the sparks the same way
function sparks(count: number, seed = 7) {
  let s = seed;
  const rand = () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
  return Array.from({ length: count }, () => {
    const x = 150 + rand() * 900;
    const rise = rand();
    // Starts just above the letters and thins out as it rises
    return { x, y: 255 - rise * rise * 225, r: 1.5 + rand() * 3, o: 0.15 + (1 - rise) * 0.6 };
  });
}

export const DESIGNS: Design[] = [
  {
    title: "Giant logo",
    note: "Just the wordmark, as big as it goes. Reads at thumbnail size.",
    render: () => (
      <div style={{ ...frame, flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 48 }}>
        <Logo width={1000} />
        <div style={{ fontSize: 34, color: DIM, letterSpacing: 6 }}>A HALLOWEEN COSTUME YOU CAN TALK TO</div>
      </div>
    ),
  },
  {
    title: "Tagline",
    note: "Logo up top, the promise in big type below.",
    render: () => (
      <div style={{ ...frame, flexDirection: "column", justifyContent: "space-between", padding: 72 }}>
        <Logo width={420} />
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ fontSize: 76, fontWeight: 700, lineHeight: 1.05, letterSpacing: -2 }}>Ask Dad anything.</div>
          <div style={{ fontSize: 76, lineHeight: 1.05, letterSpacing: -2, color: DIM }}>He answers with a dad joke. Every time.</div>
        </div>
      </div>
    ),
  },
  {
    title: "Costume",
    note: "The pen and ink drawing beside the logo, so people get it’s a costume.",
    render: ({ costume }) => (
      <div style={{ ...frame, alignItems: "center", padding: "0 72px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 36, flex: 1 }}>
          <Logo width={580} />
          <div style={{ fontSize: 44, lineHeight: 1.2, maxWidth: 560 }}>A Halloween costume you can talk to.</div>
          <div style={{ fontSize: 26, color: DIM, maxWidth: 560, lineHeight: 1.35 }}>Black tee. Black hat. Phone on the brim. Dad does the rest.</div>
        </div>
        <img src={costume} width={430} height={594} style={{ marginTop: 60 }} />
      </div>
    ),
  },
  {
    title: "Patent plate",
    note: "A patent filing for a Wearable Dad Joke Apparatus, with Fig. 1.",
    render: ({ costume }) => (
      <div style={{ ...frame, padding: 28 }}>
        <div style={{ display: "flex", flex: 1, border: "2px solid #fff", padding: "32px 44px", gap: 40 }}>
          <div style={{ display: "flex", flexDirection: "column", flex: 1, justifyContent: "space-between" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 18, letterSpacing: 4, color: DIM }}>
              <div>UNITED STATES PATENT PENDING</div>
              <div>SHEET 1 OF 1</div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              <div style={{ fontSize: 64, fontWeight: 700, lineHeight: 1.05, letterSpacing: -1 }}>Wearable Dad Joke Apparatus</div>
              <div style={{ fontSize: 26, color: DIM, lineHeight: 1.35 }}>An apparatus worn on the head that answers any question with a pun.</div>
            </div>
            <Logo width={300} />
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", borderLeft: "1px solid rgba(255,255,255,0.4)", paddingLeft: 40 }}>
            <img src={costume} width={360} height={497} />
            <div style={{ fontSize: 20, fontStyle: "italic", color: DIM, marginTop: 6 }}>Fig. 1</div>
          </div>
        </div>
      </div>
    ),
  },
  {
    title: "Speech bubble",
    note: "A real canned joke in a bubble, said by the logo.",
    render: () => (
      <div style={{ ...frame, flexDirection: "column", justifyContent: "center", padding: "0 90px", gap: 0 }}>
        <div style={{ display: "flex", background: FG, color: BG, borderRadius: 48, padding: "48px 56px", fontSize: 58, fontWeight: 700, lineHeight: 1.15, letterSpacing: -1 }}>
          I don’t trust stairs. They’re always up to something.
        </div>
        {/* Tail: a white triangle under the bubble, pointing at the logo */}
        <svg width={64} height={56} viewBox="0 0 64 56" style={{ marginLeft: 90, marginTop: -1 }}>
          <path d="M0 0H64L0 56Z" fill={FG} />
        </svg>
        <div style={{ display: "flex", marginTop: 24, alignItems: "flex-end", justifyContent: "space-between" }}>
          <Logo width={360} />
          <div style={{ fontSize: 26, color: DIM }}>Ask Dad anything.</div>
        </div>
      </div>
    ),
  },
  {
    title: "Mic and rings",
    note: "The app’s mic button mid pulse, under the logo.",
    render: () => (
      <div style={{ ...frame, flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 20 }}>
        <Logo width={640} />
        <div style={{ display: "flex", position: "relative", width: 300, height: 300, alignItems: "center", justifyContent: "center" }}>
          <svg width={300} height={300} viewBox="0 0 300 300" style={{ position: "absolute", left: 0, top: 0 }}>
            <circle cx="150" cy="150" r="140" fill="none" stroke="#fff" strokeOpacity="0.12" strokeWidth="2" />
            <circle cx="150" cy="150" r="112" fill="none" stroke="#fff" strokeOpacity="0.25" strokeWidth="2" />
            <circle cx="150" cy="150" r="86" fill="none" stroke="#fff" strokeOpacity="0.45" strokeWidth="2" />
            <circle cx="150" cy="150" r="62" fill="none" stroke="#fff" strokeWidth="3" />
          </svg>
          <Mic size={56} />
        </div>
        <div style={{ fontSize: 26, color: DIM, letterSpacing: 4 }}>TAP TO TALK TO DAD</div>
      </div>
    ),
  },
  {
    title: "Embers",
    note: "Sparks rise off the logo like the live site’s ember effect.",
    render: () => (
      <div style={{ ...frame, flexDirection: "column", alignItems: "center", justifyContent: "center", position: "relative" }}>
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", left: 0, top: 0 }}>
          {sparks(140).map((p, i) => (
            <circle key={i} cx={p.x} cy={p.y} r={p.r} fill="#fff" fillOpacity={p.o} />
          ))}
        </svg>
        <div style={{ display: "flex", marginTop: 150 }}>
          <Logo width={900} />
        </div>
        <div style={{ fontSize: 28, color: DIM, marginTop: 40 }}>A Halloween costume you can talk to</div>
      </div>
    ),
  },
  {
    title: "Costume party",
    note: "Halloween flavored. Dad is going as artificial intelligence.",
    render: ({ costume }) => (
      <div style={{ ...frame, alignItems: "center", padding: "0 0 0 80px" }}>
        <div style={{ display: "flex", flexDirection: "column", flex: 1, gap: 28 }}>
          <div style={{ fontSize: 24, letterSpacing: 6, color: DIM }}>THIS HALLOWEEN</div>
          <div style={{ display: "flex", flexDirection: "column", fontSize: 80, fontWeight: 700, lineHeight: 1, letterSpacing: -2 }}>
            <div>Dad is going as</div>
            <div>artificial</div>
            <div>intelligence.</div>
          </div>
          <div style={{ fontSize: 32, color: DIM }}>Wearable Dad Joke apparatus.</div>
          <Logo width={300} />
        </div>
        {/* The drawing bleeds off the right edge, like a costume photo cropped tight */}
        <img src={costume} width={520} height={718} style={{ marginTop: 200, marginRight: -40 }} />
      </div>
    ),
  },
];
