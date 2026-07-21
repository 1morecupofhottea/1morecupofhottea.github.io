/**
 * Shared visual for the "3 bouncing suit symbols" loading state.
 * Used by app/loading.tsx (Next.js route-transition Suspense fallback) and by
 * InitialLoading (first-visit splash), so both stay visually in sync.
 */
export function LoadingIndicator({ label = "Loading..." }: { label?: string }) {
  return (
    <div
      className="flex flex-col items-center justify-center gap-5"
      aria-label="Loading"
      role="status"
    >
      {/* 3 bouncing suit symbols with staggered delay */}
      <div className="flex gap-3">
        {(["♠", "♣", "♥"] as const).map((suit, i) => (
          <div
            key={suit}
            className="flex h-10 w-10 items-center justify-center rounded-xl
                       border border-indigo-200 bg-indigo-50 text-lg font-bold text-indigo-600"
            style={{
              animation: `spin-bounce 0.8s ease-in-out ${i * 0.14}s infinite`,
            }}
          >
            {suit}
          </div>
        ))}
      </div>
      <p className="font-mono text-xs tracking-widest text-muted-foreground uppercase">
        {label}
      </p>
    </div>
  );
}
