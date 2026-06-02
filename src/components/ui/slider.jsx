import * as SliderPrimitive from "@radix-ui/react-slider"
import { cn } from "@/lib/utils"

export function Slider({ className, ...props }) {
  return (
    <SliderPrimitive.Root
      className={cn("relative flex w-full touch-none select-none items-center", className)}
      {...props}
    >
      <SliderPrimitive.Track
        className="relative h-2 w-full grow overflow-hidden rounded-full"
        style={{ background: 'var(--border)' }}
      >
        <SliderPrimitive.Range
          className="absolute h-full rounded-full"
          style={{ background: 'var(--primary)' }}
        />
      </SliderPrimitive.Track>
      <SliderPrimitive.Thumb
        className="block h-4 w-4 rounded-full shadow-md transition-transform hover:scale-110 focus:outline-none focus:ring-2"
        style={{
          background: 'var(--primary)',
          boxShadow: '0 0 0 3px rgba(108,99,255,0.2)',
        }}
      />
    </SliderPrimitive.Root>
  )
}
