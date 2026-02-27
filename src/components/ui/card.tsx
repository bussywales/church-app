import type { HTMLAttributes } from "react";

type CardProps = HTMLAttributes<HTMLDivElement>;

export function Card({ className = "", ...props }: CardProps) {
  return <div {...props} className={`rounded-lg border border-slate-200 bg-white p-5 shadow-sm ${className}`.trim()} />;
}
