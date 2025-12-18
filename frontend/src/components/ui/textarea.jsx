import * as React from "react"
import { cn } from "@/lib/utils.js"

const Textarea = React.forwardRef(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          // Base styles
          "flex min-h-[60px] w-full px-3 py-2 text-sm transition-colors",
          "disabled:cursor-not-allowed disabled:opacity-50",
          // Light mode: OrangeAI warm textarea
          "rounded-[10px] bg-[rgb(248,247,247)] border border-[rgb(237,234,233)]",
          "text-[rgb(37,27,24)] placeholder:text-[rgb(145,134,131)]",
          "focus-visible:outline-none focus-visible:border-[rgb(255,64,23)] focus-visible:ring-2 focus-visible:ring-[rgb(255,64,23)]/10",
          // Dark mode: OPUX glass textarea
          "dark:rounded-md dark:bg-transparent dark:glass-input",
          "dark:text-white dark:border-white/10",
          "dark:placeholder:text-white/40",
          "dark:focus-visible:ring-terracotta/20 dark:focus-visible:border-white/20",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Textarea.displayName = "Textarea"

export { Textarea }
