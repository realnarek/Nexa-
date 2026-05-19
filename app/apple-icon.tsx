import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 180,
          height: 180,
          background: "#0a0a0a",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <svg width={120} height={120} viewBox="0 0 24 24">
          <path
            d="M12 2.5L21 12L12 21.5L3 12L12 2.5Z"
            stroke="#ff9d47"
            strokeWidth="1.5"
            strokeLinejoin="round"
            fill="none"
          />
          <path
            d="M12 7L17 12L12 17L7 12L12 7Z"
            fill="#ff9d47"
            fillOpacity="0.85"
          />
        </svg>
      </div>
    ),
    { ...size }
  );
}
