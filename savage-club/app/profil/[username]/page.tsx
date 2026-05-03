import { getServerSession, authOptions } from "@/lib/auth-compat";
// app/profil/[username]/page.tsx
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";


import Sidebar from "@/components/Sidebar";
import ProfileHeader from "@/components/profile/ProfileHeader";
import ProfileStats from "@/components/profile/ProfileStats";
import ProfileActions, { SubscriptionTier } from "@/components/profile/ProfileActions";
import ProfileTabs from "@/components/profile/ProfileTabs";

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const session = await getServerSession(authOptions);

  const user = await prisma.user.findUnique({
    where: { username },
    include: {
      Post: {
        where: { status: "PUBLISHED" },
        include: {
          Like: true,
          Comment: true,
          PostMedia: { orderBy: { order: "asc" } },
        },
        orderBy: { createdAt: "desc" },
      },
      Follow_Follow_followerIdToUser: true,
      Follow_Follow_followingIdToUser: true,
    },
  });

  if (!user) notFound();

  const accountAgeMonths =
    (Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24 * 30);
  const hasBadge =
    (user.role === "CREATOR" || user.role === "TRAINER") &&
    accountAgeMonths >= 3 &&
    user.Post.length >= 60;

  const isOwner = session?.user?.email === user.email;

  // ── Niveau d'abonnement du visiteur ─────────────────────────────────────
  let viewerTier: SubscriptionTier = "NONE";

  if (session?.user?.email && !isOwner) {
    const viewer = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });
    if (viewer) {
      const sub = await prisma.subscription.findFirst({
        where: { subscriberId: viewer.id, creatorId: user.id, status: "ACTIVE" },
        select: { tier: true },
      });
      if (sub) viewerTier = sub.tier as SubscriptionTier;
    }
  }

  return (
    <div className="flex min-h-screen bg-[#1a0533]">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-4 py-8">

          <ProfileHeader
            user={{
              id: user.id,
              displayName: user.displayName,
              username: user.username,
              avatar: user.avatar,
              bio: user.bio,
              role: user.role,
              isVerified: user.isVerified,
              category: user.category ?? null,
              location: user.location ?? null,
              website: user.website ?? null,
              createdAt: user.createdAt.toISOString(),
            }}
            hasBadge={hasBadge}
            isOwner={isOwner}
            followerCount={user.Follow_Follow_followerIdToUser.length}
          />

          <ProfileStats
            postCount={user.Post.length}
            followerCount={user.Follow_Follow_followerIdToUser.length}
            followingCount={user.Follow_Follow_followingIdToUser.length}
            username={user.username}
          />

          {!isOwner && (
            <ProfileActions
              userId={user.id}
              username={user.username}
              displayName={user.displayName}
              avatar={user.avatar}
              role={user.role}
              savagePrice={user.subscriptionPrice ?? null}
              vipPrice={user.subscriptionVIP      ?? null}
              messagePrice={user.messagePrice      ?? null}
              audioCallPrice={user.audioCallPrice  ?? null}
              videoCallPrice={user.videoCallPrice  ?? null}
              viewerTier={viewerTier}
            />
          )}

          <ProfileTabs
            posts={user.Post.map((p) => ({
            ...p,
            content:  p.content ?? "",
            price:      p.price,      
            previewUrl: p.previewUrl,
            medias:   p.PostMedia,
            likes:    p.Like,
            comments: p.Comment,
            user: {
              id:        user.id,
              username:  user.username,
              avatar:    user.avatar,
              isVerified: user.isVerified,
            },
            }))}
            isOwner={isOwner}
            viewerTier={viewerTier}
          />
        </div>
      </main>
    </div>
  );
}
