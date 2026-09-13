/**
 * Public loading state.
 *
 * Almost every page here is statically generated and arrives immediately, so
 * this is rarely seen — it covers the few that read the database at request
 * time, and a cold Neon instance waking up. Shaped like the dark page header
 * that opens every page, so the transition does not flash a different layout.
 */
export default function Loading() {
  return (
    <div role="status" aria-live="polite" aria-busy="true">
      <span className="sr-only">Loading…</span>
      <section className="bg-ink">
        <div className="shell">
          <div className="railed railed-inset pt-14 pb-14 md:pt-20 md:pb-20">
            <span className="block h-3 w-28 animate-pulse rounded-sm bg-white/10" />
            <span className="mt-5 block h-10 w-[min(28rem,80%)] animate-pulse rounded-sm bg-white/15" />
            <span className="mt-4 block h-4 w-[min(40rem,95%)] animate-pulse rounded-sm bg-white/10" />
          </div>
        </div>
      </section>
      <section className="bg-paper">
        <div className="shell">
          <div className="railed railed-inset py-20 md:py-28">
            <div className="grid gap-8 md:grid-cols-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i}>
                  <span className="block h-4 w-40 animate-pulse rounded-sm bg-black/[0.06]" />
                  <span className="mt-3 block h-3 w-full animate-pulse rounded-sm bg-black/[0.05]" />
                  <span className="mt-2 block h-3 w-4/5 animate-pulse rounded-sm bg-black/[0.05]" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
