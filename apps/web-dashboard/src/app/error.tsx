'use client';

import { useEffect } from 'react';

type Props = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function GlobalError({ error, reset }: Props) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="max-w-md rounded-xl border border-red-900/50 bg-gray-900 p-8 text-center">
        <p className="text-4xl">⚠️</p>
        <h1 className="mt-4 text-lg font-semibold text-gray-200">Something went wrong</h1>
        <p className="mt-2 text-sm text-gray-500">
          {error.message || 'An unexpected error occurred.'}
        </p>
        {error.digest && (
          <p className="mt-1 font-mono text-xs text-gray-700">digest: {error.digest}</p>
        )}
        <button
          onClick={reset}
          className="mt-6 rounded-lg bg-gray-800 px-4 py-2 text-sm text-gray-300 transition hover:bg-gray-700"
        >
          Try again
        </button>
        <div className="mt-3">
          <a href="/" className="text-xs text-gray-600 hover:text-gray-400 underline">
            Return to dashboard
          </a>
        </div>
      </div>
    </main>
  );
}
