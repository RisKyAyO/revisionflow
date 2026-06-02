import * as DialogPrimitive from "@radix-ui/react-dialog"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

export const Dialog = DialogPrimitive.Root
export const DialogTrigger = DialogPrimitive.Trigger
export const DialogPortal = DialogPrimitive.Portal
export const DialogClose = DialogPrimitive.Close

export function DialogOverlay({ className, ...props }) {
  return (
    <DialogPrimitive.Overlay
      className={cn("fixed inset-0 z-50 bg-black/60 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0", className)}
      {...props}
    />
  )
}

export function DialogContent({ className, children, ...props }) {
  return (
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Content
        className={cn(
          "fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-xl border p-6 shadow-2xl duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
          className
        )}
        style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
        {...props}
      >
        {children}
        <DialogPrimitive.Close
          className="absolute right-4 top-4 rounded-lg p-1.5 opacity-70 transition-opacity hover:opacity-100"
          style={{ color: 'var(--text-secondary)', background: 'var(--card-elevated)' }}
        >
          <X size={16} />
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPortal>
  )
}

export function DialogHeader({ className, ...props }) {
  return <div className={cn("mb-5", className)} {...props} />
}

export function DialogTitle({ className, ...props }) {
  return <DialogPrimitive.Title className={cn("card-title text-lg", className)} style={{ color: 'var(--text-primary)', fontSize: '18px', fontWeight: 600 }} {...props} />
}

export function DialogDescription({ className, ...props }) {
  return <p className={cn("caption mt-1", className)} {...props} />
}

export function DialogFooter({ className, ...props }) {
  return <div className={cn("flex justify-end gap-3 mt-6", className)} {...props} />
}
