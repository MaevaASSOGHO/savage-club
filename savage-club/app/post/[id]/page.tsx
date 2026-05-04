// app/post/[id]/page.tsx
import { getServerSession, authOptions } from "@/lib/auth-compat";
import { prisma }     from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import Sidebar        from "@/components/Sidebar";
import PostDetail     from "@/components/PostDetail";

export const dynamic = "force-dynamic";

export default async function PostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id }    = await params;
  const session   = await getServerSession(authOptions);

  const post = await prisma.post.findUnique({
    where: { id },
    include: {
      User: {
        select: {
          id: true, username: true, displayName: true,
          avatar: true, isVerified: true, role: true,
        },
      },
      PostMedia: { orderBy: { order: "asc" } },
      Like:      { select: { id: true, userId: true } },
      Comment: {
        include: {
          User: {
            select: {
              id: true, username: true, displayName: true,
              avatar: true, isVerified: true,
            },
          },
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!post) notFound();

  let viewerLiked  = false;
  let viewerSaved  = false;
  let viewerId:    string | null = null;
  let postUnlocked = false;

  if (session?.user?.email) {
    const viewer = await prisma.user.findUnique({
      where:  { email: session.user.email },
      select: { id: true },
    });

    if (viewer) {
      viewerId    = viewer.id;
      const isOwner = viewer.id === post.User.id;

      // ── Vérification d'accès pour les posts abonnés ──────────────────────
      if (post.visibility === "SUBSCRIBERS" && !isOwner) {
        const isPaid = !!(post.price && post.price > 0);

        // Vérifier l'abonnement actif
        const sub = await prisma.subscription.findFirst({
          where: { subscriberId: viewer.id, creatorId: post.User.id, status: "ACTIVE" },
        });

        // Vérifier si déjà acheté (pour les posts payants)
        const purchase = isPaid ? await prisma.postPurchase.findUnique({
          where: { userId_postId: { userId: viewer.id, postId: id } },
        }) : null;

        // Ni abonné ni acheteur → redirection vers le profil
        if (!sub && !purchase) {
          redirect(`/profil/${post.User.username}`);
        }

        if (purchase) postUnlocked = true;
      }

      if (viewerId === post.User.id) postUnlocked = true; // propriétaire

      viewerLiked = post.Like.some((l) => l.userId === viewer.id);

      const saved = await prisma.savedPost.findUnique({
        where: { userId_postId: { userId: viewer.id, postId: id } },
      });
      viewerSaved = !!saved;

      // Vérifier achat si pas déjà fait
      if (!postUnlocked && post.price && post.price > 0) {
        const purchase = await prisma.postPurchase.findUnique({
          where: { userId_postId: { userId: viewer.id, postId: id } },
        });
        postUnlocked = !!purchase;
      }
    }
  } else if (post.visibility === "SUBSCRIBERS") {
    // Non connecté → redirection vers auth
    redirect(`/auth?redirect=/post/${id}`);
  }

  return (
    <div className="flex min-h-screen bg-[#1a0533]">
      <Sidebar />
      <main className="flex-1 flex items-center justify-center min-h-screen">
        <PostDetail
          post={{
            id:         post.id,
            content:    post.content ?? "",
            createdAt:  post.createdAt.toISOString(),
            visibility: post.visibility,
            price:      post.price,
            previewUrl: post.previewUrl,
            medias:     post.PostMedia,
            likes:      post.Like,
            user: {
              id:          post.User.id,
              username:    post.User.username,
              displayName: post.User.displayName,
              avatar:      post.User.avatar,
              isVerified:  post.User.isVerified,
              role:        post.User.role,
            },
            comments: post.Comment.map((c) => ({
              id:        c.id,
              text:      c.text,
              createdAt: c.createdAt.toISOString(),
              user: {
                id:          c.User.id,
                username:    c.User.username,
                displayName: c.User.displayName,
                avatar:      c.User.avatar,
                isVerified:  c.User.isVerified,
              },
            })),
          }}
          viewerLiked={viewerLiked}
          viewerSaved={viewerSaved}
          viewerId={viewerId}
          postUnlocked={postUnlocked}
        />
      </main>
    </div>
  );
}
