export const metadata = {
  title: 'Devices — NovaGrid',
};

export default function DevicesPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <div className="mb-6">
        <a href="/" className="text-xs text-gray-500 hover:text-gray-300">
          ← Dashboard
        </a>
        <h1 className="mt-2 text-2xl font-bold text-gray-100">Devices</h1>
        <p className="mt-1 text-sm text-gray-500">
          Registered DePIN hardware nodes and their telemetry status.
        </p>
      </div>
      <div className="rounded-xl border border-gray-800 bg-gray-900 p-6 text-center text-sm text-gray-500">
        Hardware relayer integration coming in the next build cycle.
      </div>
    </main>
  );
}
