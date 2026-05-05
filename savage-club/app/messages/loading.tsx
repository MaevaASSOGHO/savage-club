// app/messages/loading.tsx
export default function MessagesLoading() {
  return (
    <div className="flex min-h-screen bg-[#1a0533]">
      <div className="w-16 md:w-64 flex-shrink-0"/>
      <main className="flex-1 flex animate-pulse">
        {/* Liste conversations */}
        <div className="w-full md:w-80 border-r border-white/8 flex flex-col">
          <div className="p-4 border-b border-white/8">
            <div className="h-9 bg-white/5 rounded-xl"/>
          </div>
          <div className="flex-1 p-3 space-y-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-3">
                <div className="w-11 h-11 rounded-full bg-white/8 flex-shrink-0"/>
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 bg-white/8 rounded w-24"/>
                  <div className="h-2.5 bg-white/5 rounded w-40"/>
                </div>
              </div>
            ))}
          </div>
        </div>
        {/* Zone message */}
        <div className="flex-1 hidden md:flex items-center justify-center">
          <div className="w-12 h-12 rounded-full bg-white/5"/>
        </div>
      </main>
    </div>
  );
}
