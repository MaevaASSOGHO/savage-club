import { getServerSession, authOptions } from "@/lib/auth-compat";
// app/ma-liste/page.tsx
import { prisma } from "@/lib/prisma";


import { redirect } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import MaListeClient from "./MaListeClient";

export default async function MaListePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) redirect("/auth");

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: {
      id: true,
      username: true,
      // Récupérer toutes les collections avec leurs posts
      Collection: {
        include: {
          SavedPost: {
            include: {
              Post: {
                include: {
                  User: {
                    select: {
                      id: true,
                      username: true,
                      displayName: true,
                      avatar: true,
                      isVerified: true,
                    },
                  },
                  PostMedia: { orderBy: { order: "asc" } },
                  Like: { select: { id: true } },
                  Comment: { select: { id: true } },
                },
              },
            },
          },
        },
      },
      // Récupérer aussi les posts sauvegardés sans collection
      SavedPost: {
        where: {
          collectionId: null, // Uniquement ceux sans collection
        },
        orderBy: { createdAt: "desc" },
        include: {
          Post: {
            include: {
              User: {
                select: {
                  id: true,
                  username: true,
                  displayName: true,
                  avatar: true,
                  isVerified: true,
                },
              },
              PostMedia: { orderBy: { order: "asc" } },
              Like: { select: { id: true } },
              Comment: { select: { id: true } },
            },
          },
        },
      },
    },
  });

  if (!user) redirect("/auth");

  // Helper to ensure post.content is always a string
  function normalizePostContent(post: any) {
    if (!post) return null;
    return {
      ...post,
      content:  post.content  ?? "",
      medias:   post.PostMedia ?? [],
      user:     post.User      ?? null,
      likes:    post.Like      ?? [],
      comments: post.Comment   ?? [],
    };
  }

  // Créer une collection par défaut "Non classés" pour les posts sans collection
  const nonClassesCollection = {
    id: "non-classes",
    name: "Non classés",
    createdAt: new Date(),
    posts: user.SavedPost.map((s) => normalizePostContent(s.Post)).filter(Boolean),
  };

  // Combiner toutes les collections
  const collections = [
    nonClassesCollection,
    ...(user.Collection?.map(collection => ({
      id: collection.id,
      name: collection.name,
      createdAt: collection.createdAt,
      posts: collection.SavedPost.map(s => normalizePostContent(s.Post)).filter(Boolean)
    })) || [])
  ];

  return (
    <div className="flex min-h-screen bg-[#1a0533]">
      <Sidebar />
      <main className="flex-1 px-4 py-6">
        <div className="max-w-7xl mx-auto">     
          <MaListeClient
            initialCollections={collections}
            userId={user.id}
          />
        </div>
      </main>
    </div>
  );
}