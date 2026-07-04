import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type InputProps = InputHTMLAttributes<HTMLInputElement>;

export function Input({ className, ...props }: InputProps) {
  return (
    <input
      {...props}
      className={cn(
        "w-full rounded-2xl border border-border bg-white/85 px-4 py-3 text-sm text-foreground shadow-sm transition placeholder:text-muted focus:border-royal focus:outline-none focus:ring-4 focus:ring-royal/12",
        className,
      )}
    />
  );
}
