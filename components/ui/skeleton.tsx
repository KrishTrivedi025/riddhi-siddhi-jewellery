import * as React from "react"
import { cn } from "@/lib/utils"

/**
 * Shimmer skeleton — replaces the plain pulse animation.
 * Uses a CSS keyframe shimmer for a premium, smooth loading feel.
 * The shimmer uses actual gradient movement instead of opacity,
 * which looks far more polished and loads perceived faster.
 */
function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("skeleton-shimmer rounded-md", className)}
      {...props}
    />
  )
}

export { Skeleton }
