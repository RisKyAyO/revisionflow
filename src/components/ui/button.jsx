import { cn } from "@/lib/utils"

export function Button({ className, variant = "default", size = "default", children, ...props }) {
  const base = "rf-btn"
  const variants = {
    default: "rf-btn-primary",
    secondary: "rf-btn-secondary",
    danger: "rf-btn-danger",
    ghost: "bg-transparent text-text-secondary hover:bg-surface-elevated",
    outline: "bg-transparent border border-border text-text-primary hover:bg-surface",
  }
  const sizes = {
    default: "px-4 py-2 text-sm",
    sm: "px-3 py-1.5 text-xs",
    lg: "px-6 py-3 text-base",
    icon: "p-2",
  }

  return (
    <button className={cn(base, variants[variant], sizes[size], className)} {...props}>
      {children}
    </button>
  )
}
