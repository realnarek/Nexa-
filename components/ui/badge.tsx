import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors",
  {
    variants: {
      variant: {
        default: "border-transparent bg-secondary text-secondary-foreground",
        outline: "border-border text-foreground/80 bg-transparent",
        primary:
          "border-primary/20 bg-primary/10 text-primary [&>svg]:text-primary",
        success:
          "border-emerald-500/20 bg-emerald-500/10 text-emerald-300",
        warning:
          "border-amber-500/20 bg-amber-500/10 text-amber-300",
        destructive:
          "border-red-500/20 bg-red-500/10 text-red-300",
        muted:
          "border-border bg-muted/50 text-muted-foreground",
      },
      size: {
        default: "text-xs",
        sm: "text-[10px] px-2 py-0.5",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, size, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant, size }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
