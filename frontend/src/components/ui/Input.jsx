import * as React from "react";
import { cn } from "../../lib/utils.js";

const Input = React.forwardRef(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          // Base styles
          "flex h-9 w-full px-3 py-1 text-sm transition-colors",
          "file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground",
          "disabled:cursor-not-allowed disabled:opacity-50",
          // Light mode: OrangeAI warm input
          "rounded-[10px] bg-[rgb(248,247,247)] border border-[rgb(237,234,233)]",
          "text-[rgb(37,27,24)] placeholder:text-[rgb(145,134,131)]",
          "focus-visible:outline-none focus-visible:border-[rgb(255,64,23)] focus-visible:ring-2 focus-visible:ring-[rgb(255,64,23)]/10",
          // Dark mode: OPUX glass input
          "dark:rounded-md dark:bg-transparent dark:glass-input",
          "dark:text-white dark:border-white/10",
          "dark:placeholder:text-white/40",
          "dark:focus-visible:ring-terracotta/20 dark:focus-visible:border-white/20",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input };
