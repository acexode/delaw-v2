import type { ReactNode } from "react";
import Link from "next/link";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-navy text-text-body">
      <header className="flex h-16 flex-none items-center px-8">
        <Link href="/" className="flex items-center gap-[11px]">
          <span className="flex h-8 w-8 items-center justify-center rounded-[9px] bg-gradient-to-br from-gold-hover to-gold-deep shadow-[0_2px_12px_rgba(201,168,76,.3)]">
            <span className="font-serif text-[19px] font-bold text-navy">D</span>
          </span>
          <span className="font-serif text-xl font-bold text-text-cream">
            DeLaw
          </span>
        </Link>
      </header>
      <main className="flex flex-1 items-center justify-center px-5 pb-24">
        {children}
      </main>
    </div>
  );
}
