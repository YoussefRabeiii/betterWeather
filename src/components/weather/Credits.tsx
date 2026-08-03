import type { ReactNode } from "react";

const TWITTER = "https://x.com/youssefRabeiii";

function Dot() {
  return (
    <span className="mx-1.5 text-white/30" aria-hidden>
      ·
    </span>
  );
}

function CreditLink({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-white/75 no-underline transition hover:text-white"
    >
      {children}
    </a>
  );
}

export function Credits() {
  return (
    <div className="pointer-events-auto fixed top-4 left-4 z-50 max-w-[20rem] text-[11px] leading-relaxed text-white/55 sm:max-w-lg sm:text-xs">
      <p>
        spun into the sky by{" "}
        <a
          href={TWITTER}
          target="_blank"
          rel="noopener noreferrer"
          className="font-bold text-white/90 underline underline-offset-2 transition hover:text-white"
        >
          Youssef Rabei
        </a>
      </p>
      <p className="mt-1 flex flex-wrap items-center">
        <span>built with</span>
        <span className="ml-1 inline-flex flex-wrap items-center">
          <CreditLink href="https://cursor.com">Cursor</CreditLink>
          <Dot />
          <CreditLink href="https://grok.com">Grok</CreditLink>
          <Dot />
          <CreditLink href="https://canvasui.dev/">Canvas UI</CreditLink>
          <Dot />
          <CreditLink href="https://cobe.vercel.app/">COBE</CreditLink>
        </span>
      </p>
    </div>
  );
}
