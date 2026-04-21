const stories = [
  {
    id: 1,
    avatar: "https://api.builder.io/api/v1/image/assets/TEMP/6a8dce0df5c8c92fb4c74f8e0fae79d424b7810f?width=64",
    username: "coach.hamond",
  },
  {
    id: 2,
    avatar: "https://api.builder.io/api/v1/image/assets/TEMP/6e42a7ec384b96114c634cbf4998ef459e1ea59a?width=64",
    username: "edith.brou",
  },
  {
    id: 3,
    avatar: "https://api.builder.io/api/v1/image/assets/TEMP/6f2b0f10c38de1c455c172cc626db3cb18f3bc32?width=64",
    username: "yasmine_k",
  },
  {
    id: 4,
    avatar: "https://api.builder.io/api/v1/image/assets/TEMP/c36ce1d4f8db47b4310915f3e951017a517fe2f7?width=64",
    username: "marc.dev",
  },
  {
    id: 5,
    avatar: "https://api.builder.io/api/v1/image/assets/TEMP/68c428a8482a502207902826cdf742a12e204361?width=64",
    username: "leon_fit",
  },
];

export default function StoriesBar() {
  return (
    <div className="flex items-center gap-3 sm:gap-5 overflow-x-auto scrollbar-hide py-1">
      {stories.map((story) => (
        <button
          key={story.id}
          className="flex flex-col items-center gap-1 flex-shrink-0 group"
        >
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full ring-2 ring-purple-400/60 ring-offset-2 ring-offset-transparent overflow-hidden transition-all group-hover:ring-purple-300">
            <img
              src={story.avatar}
              alt={story.username}
              className="w-full h-full object-cover"
            />
          </div>
          <span className="text-[9px] sm:text-[10px] text-white/70 max-w-[48px] truncate">
            {story.username}
          </span>
        </button>
      ))}
    </div>
  );
}
