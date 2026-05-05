// loading.tsx — Feed
export default function FeedLoading() {
  return (
    <div className="flex min-h-screen bg-[#1a0533]">
      <div className="w-16 md:w-64 flex-shrink-0"/>
      <main className="flex-1 flex justify-center px-4 py-6">
        <div className="w-full max-w-xl flex flex-col gap-8 animate-pulse">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-3">
              {/* Header */}
              <div className="flex items-center gap-2.5 px-1">
                <div className="w-9 h-9 rounded-full bg-white/10"/>
                <div className="space-y-1.5">
                  <div className="h-3 bg-white/10 rounded w-24"/>
                  <div className="h-2.5 bg-white/5 rounded w-16"/>
                </div>
              </div>
              {/* Media */}
              <div className="aspect-[4/5] bg-white/5 rounded-sm max-w-[420px]"/>
              {/* Actions */}
              <div className="flex gap-4 px-1">
                {[1,2,3,4].map((j) => (
                  <div key={j} className="w-5 h-5 bg-white/8 rounded"/>
                ))}
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
