import * as ProgressPrimitive from "@radix-ui/react-progress"
import { cn } from "@/lib/utils"

export function Progress({ className, value = 0, color, ...props }) {
  return (
    <ProgressPrimitive.Root
      className={cn("relative h-2 w-full overflow-hidden rounded-full", className)}
      style={{ background: 'var(--border)' }}
      {...props}
    >
      <ProgressPrimitive.Indicator
        className="h-full transition-all duration-700 ease-out rounded-full"
        style={{
          width: `${value}%`,
          background: color || 'var(--primary)',
        }}
      />
    </ProgressPrimitive.Root>
  )
}
