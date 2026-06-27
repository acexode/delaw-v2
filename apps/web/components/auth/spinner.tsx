/** Gold-ink spinner used inside gold CTA buttons (matches main.html). */
export function Spinner() {
  return (
    <span
      className="inline-block h-4 w-4 animate-spin rounded-full"
      style={{ border: "2px solid rgba(26,20,4,.35)", borderTopColor: "#1a1404" }}
      aria-hidden
    />
  );
}
