// Shared Tailwind class tokens for the auth screens. These map 1:1 to the
// inline style tokens in main.html (fld, fldIcon, lbl, btnGold, otpStyle, …),
// expressed with the DeLaw Tailwind palette (packages/config preset).

export const inputClass =
  "h-11 w-full rounded-[10px] border border-line-strong bg-bg-850 px-[13px] text-sm text-text-body outline-none transition placeholder:text-text-faint focus:border-gold focus:ring-[3px] focus:ring-gold/10";

export const inputIconClass = `${inputClass} pl-10`;

export const selectClass =
  "h-11 w-full appearance-none rounded-[10px] border border-line-strong bg-bg-850 pl-[13px] pr-9 text-sm text-text-body outline-none transition focus:border-gold focus:ring-[3px] focus:ring-gold/10";

export const labelClass =
  "mb-[7px] block text-[12.5px] font-semibold text-text-secondary";

export const goldButtonClass =
  "flex h-[46px] w-full items-center justify-center gap-2 rounded-[11px] bg-gradient-to-br from-gold-hover to-gold text-[14.5px] font-bold text-gold-ink shadow-gold transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-70";

export const goldButtonAutoClass =
  "inline-flex h-11 items-center gap-2 rounded-[11px] bg-gradient-to-br from-gold-hover to-gold px-[22px] text-sm font-bold text-gold-ink shadow-gold transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-70";

export const backButtonClass =
  "inline-flex h-11 items-center gap-2 rounded-[11px] border border-line-accent bg-transparent px-[18px] text-sm font-semibold text-text-secondary transition hover:border-line-hover";

export const otpCellClass =
  "h-[58px] w-[50px] rounded-[11px] border-[1.5px] border-line-strong bg-bg-850 text-center font-mono text-2xl font-semibold text-text-cream outline-none transition focus:border-gold focus:ring-[3px] focus:ring-gold/10";

export const authCenterClass =
  "flex min-h-screen items-center justify-center px-5 pb-24 pt-10";

export const authCardClass =
  "w-full max-w-[420px] rounded-[18px] border border-line bg-bg-800 px-[34px] py-9 shadow-card-lg";

export const ghostInputWrapClass = "relative";
