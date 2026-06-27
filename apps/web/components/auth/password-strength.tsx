import { passwordStrength } from "../../lib/constants";

export function PasswordStrength({ value }: { value: string }) {
  const { score, label, color } = passwordStrength(value);
  return (
    <>
      <div className="mt-2 flex gap-1">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-1 flex-1 rounded-[3px] transition-colors"
            style={{ background: i < score ? color : "#243049" }}
          />
        ))}
      </div>
      <div
        className="mt-[5px] min-h-[14px] text-[11px] font-medium"
        style={{ color: value ? color : "#5C6678" }}
      >
        {label}
      </div>
    </>
  );
}
