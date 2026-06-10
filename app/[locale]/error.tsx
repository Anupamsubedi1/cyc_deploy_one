"use client";

import { useEffect } from "react";

type ErrorPageProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    // Logged to the browser console so the failure is visible even in production.
    console.error("Route error:", error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <h1 className="text-2xl font-semibold text-slate-800 sm:text-3xl">
        Something went wrong
      </h1>
      <p className="mt-3 max-w-xl text-sm text-slate-600 sm:text-base">
        An unexpected error occurred while loading this page. Please try again.
      </p>
      {error.digest && (
        <p className="mt-2 font-mono text-xs text-slate-400">
          Error ID: {error.digest}
        </p>
      )}
      {process.env.NODE_ENV !== "production" && (
        <pre className="mt-4 max-w-2xl overflow-auto rounded bg-slate-100 p-4 text-left text-xs text-red-700">
          {error.message}
        </pre>
      )}
      <button
        type="button"
        onClick={reset}
        className="mt-6 inline-flex items-center rounded-sm bg-teal-mid px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0d837f]"
      >
        Try again
      </button>
    </div>
  );
}
