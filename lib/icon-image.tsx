import { ImageResponse } from "next/og";

/** The logo D on a black square, as a PNG of any size. Shared by the iOS and install icons. */
export function iconImage(size: number) {
  const s = size / 180;
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#000" }}>
        <svg width={92 * s} height={103 * s} viewBox="6.95 -71.6 64.1 71.6">
          <path
            fill="#fff"
            d="M34.40 0L6.95 0L6.95-71.60L34.40-71.60Q50.80-71.60 60.93-61.73Q71.05-51.85 71.05-35.80Q71.05-19.60 60.93-9.80Q50.80 0 34.40 0ZM27.55-52.70L27.55-18.10L32.85-18.10Q40.75-17.95 45.48-22.55Q50.20-27.15 50.20-35.60Q50.20-43.90 45.48-48.30Q40.75-52.70 32.85-52.70Z"
          />
        </svg>
      </div>
    ),
    { width: size, height: size },
  );
}
