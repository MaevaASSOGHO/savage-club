import { getServerSession, authOptions } from "@/lib/auth-compat";
// app/api/posts/discover/route.ts
import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '9');
    const skip = (page - 1) * limit;

    // Construire la requête pour les posts auxquels l'utilisateur a accès
    const where: any = {
      OR: [
        { visibility: 'PUBLIC' }
      ]
    };

    // Si l'utilisateur est connecté, on peut aussi voir les posts SUBSCRIBERS
    if (session?.user?.id) {
      where.OR.push(
        { 
          AND: [
            { visibility: 'SUBSCRIBERS' },
            { 
              OR: [
                // Posts des créateurs auxquels l'utilisateur est abonné
                {
                  User: {
                    Follow_Follow_followingIdToUser: {
                      some: { followerId: session.user.id }
                    }
                  }
                },
                // Ses propres posts
                { userId: session.user.id }
              ]
            }
          ]
        }
      );
    }

    // Récupérer les posts avec pagination
    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where,
        include: {
          PostMedia: {
            orderBy: { order: 'asc' },
            take: 1,
          },
          User: {
            select: {
              id: true,
              username: true,
              avatar: true,
              isVerified: true,
            },
          },
          Like: {
            select: { id: true },
          },
          Comment: {
            select: { id: true },
          },
          _count: {
            select: { PostMedia: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.post.count({ where }),
    ]);

        // Transformer les données pour correspondre au format attendu
    const formattedPosts = posts.map(post => ({
      id:         post.id,
      content:    post.content,
      visibility: post.visibility,
      medias:     post.PostMedia,
      likes:      post.Like,
      comments:   post.Comment,
      user:       post.User,
      _count:     post._count,
    }));

    const hasMore = skip + posts.length < total;

    return NextResponse.json({
      posts: formattedPosts,
      hasMore,
      page,
      total
    });
  } catch (error) {
    console.error('Error fetching discover posts:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des posts' },
      { status: 500 }
    );
  }
}