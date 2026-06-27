"use client";

import { useRef } from "react";

import { otpCellClass } from "./ui";

interface OtpInputProps {
  value: string[];
  onChange: (next: string[]) => void;
  onComplete?: (code: string) => void;
  length?: number;
  disabled?: boolean;
  autoFocus?: boolean;
}

/** Six discrete digit cells: auto-advance, backspace-to-previous, full paste. */
export function OtpInput({
  value,
  onChange,
  onComplete,
  length = 6,
  disabled = false,
  autoFocus = false,
}: OtpInputProps) {
  const refs = useRef<Array<HTMLInputElement | null>>([]);

  const emit = (next: string[]) => {
    onChange(next);
    if (next.every((c) => c !== "") && next.length === length) {
      onComplete?.(next.join(""));
    }
  };

  const handleChange = (index: number, raw: string) => {
    const digit = raw.replace(/\D/g, "").slice(-1);
    const next = [...value];
    next[index] = digit;
    emit(next);
    if (digit && index < length - 1) {
      refs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (e.key === "Backspace" && !value[index] && index > 0) {
      refs.current[index - 1]?.focus();
    }
    if (e.key === "ArrowLeft" && index > 0) {
      refs.current[index - 1]?.focus();
    }
    if (e.key === "ArrowRight" && index < length - 1) {
      refs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const digits = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, length)
      .split("");
    if (digits.length === 0) {
      return;
    }
    const next = Array.from({ length }, (_, i) => digits[i] ?? "");
    emit(next);
    const focusIndex = Math.min(digits.length, length - 1);
    refs.current[focusIndex]?.focus();
  };

  return (
    <div className="flex justify-center gap-[9px]">
      {Array.from({ length }).map((_, i) => (
        <input
          // eslint-disable-next-line jsx-a11y/no-autofocus
          autoFocus={autoFocus && i === 0}
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          value={value[i] ?? ""}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={handlePaste}
          inputMode="numeric"
          maxLength={1}
          disabled={disabled}
          aria-label={`Digit ${i + 1}`}
          className={otpCellClass}
        />
      ))}
    </div>
  );
}
