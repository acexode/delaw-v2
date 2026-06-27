import Link from "next/link";

const SIZES = {
  sm: { box: "h-[30px] w-[30px]", d: "text-[17px]", word: "text-[18px]" },
  md: { box: "h-8 w-8", d: "text-[19px]", word: "text-xl" },
} as const;

export function Logo({
  size = "md",
  wordmark = true,
  href = "/",
}: {
  size?: keyof typeof SIZES;
  wordmark?: boolean;
  href?: string | null;
}) {
  const s = SIZES[size];
  const inner = (
    <span className="flex items-center gap-[11px]">
      <span
        className={`flex ${s.box} items-center justify-center rounded-[9px] bg-gradient-to-br from-gold-hover to-gold-deep shadow-[0_2px_12px_rgba(201,168,76,.3)]`}
      >
        <span className={`font-serif ${s.d} font-bold text-navy`}>D</span>
      </span>
      {wordmark ? (
        <span
          className={`font-serif ${s.word} font-bold tracking-[-.01em] text-text-cream`}
        >
          DeLaw
        </span>
      ) : null}
    </span>
  );

  if (href === null) {
    return inner;
  }
  return (
    <Link href={href} className="inline-flex">
      {inner}
    </Link>
  );
}
