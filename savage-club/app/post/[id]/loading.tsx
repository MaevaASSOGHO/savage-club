// app/post/[id]/loading.tsx
export default function PostLoading() {
  return (
    <div className="flex min-h-screen bg-[#1a0533]">
      <div className="w-16 md:w-64 flex-shrink-0"/>
      <main className="flex-1 flex items-center justify-center">
        <div className="w-full max-w-4xl flex flex-col md:flex-row animate-pulse">
          {/* Media */}
          <div className="w-full md:w-[520px] aspect-[4/5] bg-white/5 flex-shrink-0"/>
          {/* Infos */}
          <div className="flex-1 p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/10"/>
              <div className="space-y-1.5">
                <div className="h-3.5 bg-white/10 rounded w-28"/>
                <div className="h-2.5 bg-white/5 rounded w-20"/>
              </div>
            </div>
            <div className="space-y-2">
              <div className="h-3 bg-white/8 rounded w-full"/>
              <div className="h-3 bg-white/8 rounded w-4/5"/>
            </div>
            <div className="border-t border-white/8 pt-4 space-y-3">
              {[1,2,3].map((i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-white/5"/>
                  <div className="h-3 bg-white/5 rounded flex-1"/>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
