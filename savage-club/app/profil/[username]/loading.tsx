// app/profil/[username]/loading.tsx
export default function ProfileLoading() {
  return (
    <div className="flex min-h-screen bg-[#3B0764]">
      {/* Sidebar placeholder */}
      <div className="w-16 md:w-64 flex-shrink-0"/>

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-4 py-8 space-y-6 animate-pulse">

          {/* Cover */}
          <div className="h-40 bg-white/5 rounded-2xl"/>

          {/* Avatar + infos */}
          <div className="flex items-end gap-4 -mt-12 px-4">
            <div className="w-24 h-24 rounded-full bg-white/10 border-4 border-[#3B0764] flex-shrink-0"/>
            <div className="flex-1 pb-2 space-y-2">
              <div className="h-5 bg-white/10 rounded-lg w-40"/>
              <div className="h-3 bg-white/5 rounded-lg w-24"/>
            </div>
          </div>

          {/* Bio */}
          <div className="space-y-2 px-4">
            <div className="h-3 bg-white/8 rounded w-full"/>
            <div className="h-3 bg-white/8 rounded w-3/4"/>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 px-4">
            {[1,2,3].map((i) => (
              <div key={i} className="bg-white/5 rounded-xl p-3 space-y-1">
                <div className="h-5 bg-white/10 rounded w-12 mx-auto"/>
                <div className="h-3 bg-white/5 rounded w-16 mx-auto"/>
              </div>
            ))}
          </div>

          {/* Tabs */}
          <div className="flex border-b border-white/10">
            {[1,2,3,4].map((i) => (
              <div key={i} className="flex-1 py-3 flex justify-center">
                <div className="w-5 h-5 bg-white/8 rounded"/>
              </div>
            ))}
          </div>

          {/* Grid */}
          <div className="grid grid-cols-3 gap-0.5">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="aspect-square bg-white/5"/>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
