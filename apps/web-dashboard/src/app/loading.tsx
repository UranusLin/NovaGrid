export default function Loading() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <div className="mb-8 h-9 w-40 animate-pulse rounded-lg bg-gray-800" />
      <div className="grid gap-4">
        <div className="h-40 animate-pulse rounded-xl bg-gray-900" />
        <div className="grid grid-cols-3 gap-4">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-28 animate-pulse rounded-xl bg-gray-900" />
          ))}
        </div>
      </div>
    </main>
  );
}
