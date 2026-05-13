// app/api/posts/discover/route.ts
import { getServerSession } from "@/lib/auth-compat";
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    const searchParams = request.nextUrl.searchParams;
    const page  = parseInt(searchParams.get('page')  || '1');
    const limit = parseInt(searchParams.get('limit') || '9');
    const skip  = (page - 1) * limit;

    // Posts accessibles : PUBLIC pour tous, + SUBSCRIBERS pour les abonnés connectés
    const where: any = {
      OR: [{ visibility: 'PUBLIC' }],
    };

    if (session?.user?.id) {
      where.OR.push({
        AND: [
          { visibility: 'SUBSCRIBERS' },
          {
            OR: [
              // Posts des créateurs auxquels l'utilisateur est abonné
              {
                User: {
                  Follow_Follow_followingIdToUser: {
                    some: { followerId: session.user.id },
                  },
                },
              },
              // Ses propres posts
              { userId: session.user.id },
            ],
          },
        ],
      });
    }

    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where,
        include: {
          PostMedia: {
            orderBy: { order: 'asc' },
            // On prend tous les médias pour l'affichage (le MediaCard n'en affiche qu'un)
            take: 1,
          },
          User: {
            select: {
              id:                true,
              username:          true,
              displayName:       true,
              avatar:            true,
              isVerified:        true,
              subscriptionPrice: true,   // nécessaire pour SubscribeModal
              subscriptionVIP:   true,   // nécessaire pour SubscribeModal
            },
          },
          Like:    { select: { id: true } },
          Comment: { select: { id: true } },
          _count:  { select: { PostMedia: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.post.count({ where }),
    ]);

    const formattedPosts = posts.map((post) => ({
      id:         post.id,
      content:    post.content,
      createdAt:  post.createdAt,
      visibility: post.visibility,
      price:      post.price,       // pour l'overlay payant
      previewUrl: post.previewUrl,  // aperçu flou pour les posts payants
      medias:     post.PostMedia,
      likes:      post.Like,
      comments:   post.Comment,
      user:       post.User,
      _count:     post._count,
    }));

    return NextResponse.json({
      posts:   formattedPosts,
      hasMore: skip + posts.length < total,
      page,
      total,
    });
  } catch (error) {
    console.error('Error fetching discover posts:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des posts' },
      { status: 500 }
    );
  }
}
