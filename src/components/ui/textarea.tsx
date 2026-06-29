import * as React from "react";
import { cn } from "@/lib/utils";

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        "border-line bg-surface text-ink flex min-h-20 w-full rounded-md border px-3.5 py-2.5 text-sm",
        "placeholder:text-muted/70 transition-colors outline-none",
        "focus-visible:border-lacquer focus-visible:ring-lacquer/30 focus-visible:ring-2",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  ),
);
Textarea.displayName = "Textarea";

export { Textarea };
