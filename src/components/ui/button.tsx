import Link from "next/link";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type ButtonVariant = "primary" | "gold" | "secondary" | "outline" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-primary text-white shadow-[0_14px_34px_rgba(14,36,71,0.22)] hover:bg-royal hover:text-white",
  gold: "bg-gold text-ink shadow-[0_14px_34px_rgba(211,166,74,0.28)] hover:bg-gold-deep hover:text-ink",
  secondary: "bg-white text-primary shadow-sm ring-1 ring-border hover:bg-ivory-strong",
  outline: "bg-transparent text-primary ring-1 ring-primary/25 hover:bg-primary hover:text-white",
  ghost: "bg-transparent text-primary hover:bg-primary/8",
  danger: "bg-danger text-white shadow-sm hover:bg-danger/90",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "min-h-11 px-4 py-2 text-xs",
  md: "min-h-11 px-4 py-2 text-sm",
  lg: "min-h-12 px-5 py-3 text-base",
};

export function buttonStyles({
  variant = "primary",
  size = "md",
  className,
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
} = {}) {
  return cn(
    "inline-flex items-center justify-center gap-2 rounded-full font-bold tracking-[-0.01em] transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-4 focus-visible:ring-offset-ivory disabled:pointer-events-none disabled:opacity-55",
    variantClasses[variant],
    sizeClasses[size],
    className,
  );
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

export function Button({ className, variant = "primary", size = "md", ...props }: ButtonProps) {
  return <button {...props} className={buttonStyles({ variant, size, className })} />;
}

type CTAButtonProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
  href: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
};

export function CTAButton({
  href,
  className,
  variant = "primary",
  size = "md",
  children,
  ...props
}: CTAButtonProps) {
  return (
    <Link href={href} className={buttonStyles({ variant, size, className })} {...props}>
      {children}
    </Link>
  );
}
