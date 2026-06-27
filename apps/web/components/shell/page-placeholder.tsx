export function PagePlaceholder({ title }: { title: string }) {
  return (
    <div className="flex h-full flex-col gap-2 p-8">
      <h1 className="font-serif text-2xl font-semibold text-text-cream">
        {title}
      </h1>
      <p className="text-sm text-text-muted">
        This page is scaffolded — module UI is built in a later sprint.
      </p>
    </div>
  );
}
