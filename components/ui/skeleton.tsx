import { cn } from "@/lib/utils";

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-md bg-muted/40",
        "before:absolute before:inset-0",
        "before:bg-gradient-to-r before:from-transparent before:via-white/[0.04] before:to-transparent",
        "before:bg-[length:200%_100%] before:animate-shimmer",
        className,
      )}
      {...props}
    />
  );
}

export { Skeleton };
