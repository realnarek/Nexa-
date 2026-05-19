import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ size: string }> }
) {
  const { size: sizeParam } = await params;

  const isMaskable = sizeParam.startsWith("maskable-");
  const px = Math.min(
    Math.max(parseInt(sizeParam.replace("maskable-", "")) || 192, 16),
    1024
  );

  // Maskable icons keep the glyph within the 80% safe zone
  const iconRatio = isMaskable ? 0.52 : 0.68;
  const iconSize = Math.round(px * iconRatio);

  // Border radius: 22.5% for regular (looks good at all sizes), 0 for maskable
  const borderRadius = isMaskable ? 0 : Math.round(px * 0.225);

  return new ImageResponse(
    (
      <div
        style={{
          width: px,
          height: px,
          background: "#0a0a0a",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius,
        }}
      >
        <svg width={iconSize} height={iconSize} viewBox="0 0 24 24">
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
    { width: px, height: px }
  );
}
