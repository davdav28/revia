import * as React from "react";
import { cn } from "@/lib/utils";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = "text", ...props }, ref) => {
    return (
      <input
        ref={ref}
        type={type}
        className={cn(
          "border-line bg-surface text-ink flex h-11 w-full rounded-md border px-3.5 text-sm",
          "placeholder:text-muted/70",
          "transition-colors outline-none",
          "focus-visible:border-lacquer focus-visible:ring-lacquer/30 focus-visible:ring-2",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "aria-[invalid=true]:border-status-dormant aria-[invalid=true]:ring-status-dormant/20",
          className,
        )}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
