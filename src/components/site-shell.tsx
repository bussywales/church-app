import type { ReactNode } from "react";
import { SiteNav } from "@/components/site-nav";

export function SiteShell({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-ivory text-foreground">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,rgba(211,166,74,0.24),transparent_34rem),radial-gradient(circle_at_80%_10%,rgba(35,74,138,0.16),transparent_32rem),linear-gradient(180deg,rgba(255,252,246,0.92),rgba(246,238,222,0.72))]" />
      <SiteNav />
      <main className="mx-auto w-full max-w-6xl px-4 py-7 sm:px-6 sm:py-10 lg:px-8">
        {children}
      </main>
    </div>
  );
}
