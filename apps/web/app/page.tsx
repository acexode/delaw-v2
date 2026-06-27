export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-md bg-gradient-to-br from-gold-hover to-gold-deep font-serif text-xl font-bold text-navy">
          D
        </span>
        <span className="font-serif text-2xl font-bold text-text-cream">
          DeLaw
        </span>
      </div>
      <h1 className="font-serif text-3xl font-bold tracking-tight text-text-cream">
        African Law. Intelligently Practiced.
      </h1>
      <p className="max-w-md text-sm text-text-muted">
        Monorepo scaffold is live. Application modules are built in subsequent
        sprints per the technical specification.
      </p>
    </main>
  );
}
