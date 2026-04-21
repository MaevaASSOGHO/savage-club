// app/ma-liste/MaListeClient.tsx
"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import CollectionDialog from "@/components/CollectionDialog";
import PostModal from "@/components/PostModal";

interface Media {
  id: string;
  url: string;
  type: string;
  order: number;
}

interface Post {
  id: string;
  content: string;
  medias: Media[];
  visibility: string;
  likes: { id: string }[];
  comments: { id: string }[];
  user: {
    id: string;
    username: string;
    displayName: string;
    avatar: string | null;
    isVerified: boolean;
  };
  createdAt: Date;
}

interface Collection {
  id: string;
  name: string;
  posts: Post[];
  createdAt: Date;
}

interface Props {
  initialCollections: Collection[];
  userId: string;
}

// Composant de grille inspiré de ProfileTabs
function CollectionGrid({ posts, collectionName }: { posts: Post[]; collectionName: string }) {
  if (posts.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-white/25 text-sm">Aucune publication dans cette collection</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-0.5">
      {posts.map((post) => {
        const medias = post.medias ?? [];
        const firstMedia = medias[0];
        const hasMultiple = medias.length > 1;
        
        return (
          <Link
            key={post.id}
            href={`/post/${post.id}`}
            className="relative aspect-square bg-white/5 overflow-hidden group"
          >
            {firstMedia ? (
              firstMedia.type === "VIDEO" ? (
                <video
                  src={firstMedia.url}
                  className="w-full h-full object-cover"
                  muted
                  playsInline
                  preload="metadata"
                  onMouseEnter={(e) => (e.currentTarget as HTMLVideoElement).play()}
                  onMouseLeave={(e) => { 
                    const v = e.currentTarget as HTMLVideoElement; 
                    v.pause(); 
                    v.currentTime = 0; 
                  }}
                />
              ) : (
                <img
                  src={firstMedia.url}
                  alt=""
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              )
            ) : (
              <div className="w-full h-full flex items-center justify-center p-3">
                <p className="text-white/40 text-xs text-center line-clamp-4">{post.content}</p>
              </div>
            )}

            {/* Icône carousel si plusieurs médias */}
            {hasMultiple && (
              <div className="absolute top-2 right-2">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="white" opacity="0.9">
                  <rect x="7" y="3" width="14" height="14" rx="2"/>
                  <path d="M3 7v11a2 2 0 002 2h11" stroke="white" strokeWidth="2" fill="none"/>
                </svg>
              </div>
            )}

            {/* Icône vidéo seule */}
            {!hasMultiple && firstMedia?.type === "VIDEO" && (
              <div className="absolute top-2 right-2">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
                  <polygon points="23 7 16 12 23 17 23 7"/>
                  <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
                </svg>
              </div>
            )}

            {/* Cadenas payant */}
            {post.visibility === "PAID" && (
              <div className="absolute top-2 left-2 bg-amber-400 rounded-full w-5 h-5 flex items-center justify-center">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="black">
                  <rect x="3" y="11" width="18" height="11" rx="2"/>
                  <path d="M7 11V7a5 5 0 0110 0v4"/>
                </svg>
              </div>
            )}
          </Link>
        );
      })}
    </div>
  );
}

export default function MaListeClient({ initialCollections, userId }: Props) {
  const router = useRouter();
  const [collections, setCollections] = useState<Collection[]>(initialCollections);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCollection, setEditingCollection] = useState<Collection | null>(null);
  const scrollContainersRef = useRef<{ [key: string]: HTMLDivElement | null }>({});

  const scroll = (collectionId: string, direction: "left" | "right") => {
    const container = scrollContainersRef.current[collectionId];
    if (container) {
      const scrollAmount = 400;
      const currentScroll = container.scrollLeft;
      container.scrollTo({
        left: direction === "left" ? currentScroll - scrollAmount : currentScroll + scrollAmount,
        behavior: "smooth",
      });
    }
  };

  const handleAddCollection = async (name: string) => {
    try {
      const res = await fetch("/api/collections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      
      if (res.ok) {
        const newCollection = await res.json();
        setCollections([...collections, {
          ...newCollection,
          posts: [],
        }]);
        router.refresh();
      }
    } catch (error) {
      console.error("Erreur lors de la création de la collection:", error);
    }
  };

  const handleEditCollection = async (id: string, newName: string) => {
    if (id === "non-classes") return;
    
    try {
      const res = await fetch(`/api/collections/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName }),
      });
      
      if (res.ok) {
        setCollections(collections.map(col => 
          col.id === id ? { ...col, name: newName } : col
        ));
        router.refresh();
      }
    } catch (error) {
      console.error("Erreur lors de la modification de la collection:", error);
    }
  };

  const handleDeleteCollection = async (id: string) => {
    if (id === "non-classes") return;
    
    try {
      const res = await fetch(`/api/collections/${id}`, {
        method: "DELETE",
      });
      
      if (res.ok) {
        setCollections(collections.filter(col => col.id !== id));
        router.refresh();
      }
    } catch (error) {
      console.error("Erreur lors de la suppression de la collection:", error);
    }
  };

  return (
    <div>
      {/* HEADER */}
      {/* HEADER */}
<div className="flex items-center justify-between mb-6">
  <div>
    <h1 className="text-2xl font-bold text-white">Mes favoris</h1>
    <p className="text-white/40 text-sm">
      {collections.reduce((acc, col) => acc + col.posts.length, 0)} publications sauvegardées
    </p>
  </div>

  <button
    onClick={() => {
      setEditingCollection(null);
      setIsDialogOpen(true);
    }}
    className="flex items-center gap-2 border-2 border-dashed border-white/15 hover:border-amber-400/40 rounded-xl px-4 py-2 text-white/30 hover:text-amber-400/60 transition-all text-sm"
  >
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
    Nouvelle collection
  </button>
</div>
      {/* Collections avec défilement horizontal */}
      <div className="space-y-12">
        {collections.map((collection) => (
          <div key={collection.id} className="relative">
            {/* En-tête de la collection avec boutons d'édition */}
            <div className="flex items-center justify-between mb-4 px-2">
              <div className="flex items-center gap-3">
                <h2 className="text-white text-xl font-semibold">
                  {collection.name}
                </h2>
                <span className="text-white/40 text-sm">
                  {collection.posts.length}
                </span>
              </div>

              {/* Boutons d'édition (pas pour "Non classés") */}
              {collection.id !== "non-classes" && (
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setEditingCollection(collection);
                      setIsDialogOpen(true);
                    }}
                    className="p-2 rounded-lg bg-[#2D1B3F] text-white/60 hover:text-white hover:bg-[#3D2B4F] transition-colors"
                    title="Modifier la collection"
                  >
                    ✎
                  </button>
                  <button
                    onClick={() => handleDeleteCollection(collection.id)}
                    className="p-2 rounded-lg bg-[#2D1B3F] text-white/60 hover:text-white hover:bg-[#3D2B4F] transition-colors"
                    title="Supprimer la collection"
                  >
                    ×
                  </button>
                </div>
              )}
            </div>

            {/* Zone de défilement horizontal */}
            {collection.posts.length > 0 ? (
              <div className="relative group">
                {/* Flèche gauche */}
                {collection.posts.length > 3 && (
                  <button
                    onClick={() => scroll(collection.id, "left")}
                    className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-[#2D1B3F] border border-white/10 flex items-center justify-center text-white/60 hover:text-white hover:bg-[#3D2B4F] transition-colors opacity-0 group-hover:opacity-100 -ml-5"
                  >
                    ←
                  </button>
                )}

                {/* Flèche droite */}
                {collection.posts.length > 3 && (
                  <button
                    onClick={() => scroll(collection.id, "right")}
                    className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-[#2D1B3F] border border-white/10 flex items-center justify-center text-white/60 hover:text-white hover:bg-[#3D2B4F] transition-colors opacity-0 group-hover:opacity-100 -mr-5"
                  >
                    →
                  </button>
                )}

                {/* Conteneur scrollable horizontal avec la grille */}
                <div
                  ref={(el) => { scrollContainersRef.current[collection.id] = el; }}
                  className="overflow-x-auto scrollbar-hide"
                  style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
                >
                  <div className="inline-flex gap-0.5 min-w-full">
                    {/* On duplique la grille pour chaque "page" de défilement */}
                    <CollectionGrid 
                      posts={collection.posts} 
                      collectionName={collection.name}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-[#2D1B3F]/50 rounded-xl p-12 text-center border border-white/5">
                <p className="text-white/40">
                  Aucune publication dans cette collection
                </p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Dialogue pour ajouter/modifier une collection */}
      <CollectionDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onSubmit={(name) => {
          if (editingCollection) {
            handleEditCollection(editingCollection.id, name);
          } else {
            handleAddCollection(name);
          }
          setIsDialogOpen(false);
        }}
        initialName={editingCollection?.name}
        title={editingCollection ? "Modifier la collection" : "Nouvelle collection"}
      />

      {/* Modal du post (carousel) */}
      {selectedPost && (
        <PostModal
          post={selectedPost}
          onClose={() => setSelectedPost(null)}
          onNext={() => {
            const allPosts = collections.flatMap(c => c.posts);
            const currentIndex = allPosts.findIndex(p => p.id === selectedPost.id);
            if (currentIndex < allPosts.length - 1) {
              setSelectedPost(allPosts[currentIndex + 1]);
            }
          }}
          onPrev={() => {
            const allPosts = collections.flatMap(c => c.posts);
            const currentIndex = allPosts.findIndex(p => p.id === selectedPost.id);
            if (currentIndex > 0) {
              setSelectedPost(allPosts[currentIndex - 1]);
            }
          }}
          hasNext={collections.flatMap(c => c.posts).findIndex(p => p.id === selectedPost.id) < collections.flatMap(c => c.posts).length - 1}
          hasPrev={collections.flatMap(c => c.posts).findIndex(p => p.id === selectedPost.id) > 0}
        />
      )}
    </div>
  );
}