import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  showWordmark?: boolean;
}

/**
 * The Nexa mark — a diamond/portal glyph drawn from two overlapping triangles,
 * paired with an italic display serif wordmark for editorial character.
 */
export function Logo({ className, size = "md", showWordmark = true }: LogoProps) {
  const dim =
    size === "sm" ? 18 : size === "lg" ? 28 : 22;

  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <div
        className="relative grid place-items-center rounded-md"
        style={{ width: dim + 8, height: dim + 8 }}
      >
        <svg
          width={dim}
          height={dim}
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden
        >
          <defs>
            <linearGradient id="nexa-mark" x1="0" y1="0" x2="24" y2="24" gradientUnits="userSpaceOnUse">
              <stop offset="0" stopColor="hsl(28 100% 64%)" />
              <stop offset="1" stopColor="hsl(20 95% 55%)" />
            </linearGradient>
          </defs>
          <path
            d="M12 2.5L21 12L12 21.5L3 12L12 2.5Z"
            stroke="url(#nexa-mark)"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          <path
            d="M12 7L17 12L12 17L7 12L12 7Z"
            fill="url(#nexa-mark)"
            fillOpacity="0.85"
          />
        </svg>
      </div>
      {showWordmark && (
        <span
          className={cn(
            "display-serif italic leading-none",
            size === "sm" && "text-lg",
            size === "md" && "text-xl",
            size === "lg" && "text-2xl",
          )}
        >
          Nexa
        </span>
      )}
    </div>
  );
}
