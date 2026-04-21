// app/api/media/route.ts
import { NextRequest, NextResponse } from 'next/server';

// Données mockées
const generateMockMedia = (page: number, limit: number, tab: string) => {
  const start = (page - 1) * limit;
  const mockMedia = [];
  
  const users = [
    { id: 'user1', username: 'savage_artist', avatar: null, isVerified: true },
    { id: 'user2', username: 'creative_design', avatar: null, isVerified: false },
    { id: 'user3', username: 'photo_daily', avatar: null, isVerified: true },
    { id: 'user4', username: 'art_gallery', avatar: null, isVerified: false },
    { id: 'user5', username: 'visual_stories', avatar: null, isVerified: true },
  ];
  
  for (let i = 0; i < limit; i++) {
    const id = start + i + 1;
    const user = users[(start + i) % users.length];
    const type = i % 4 === 0 ? 'VIDEO' : 'IMAGE';
    
    // Ajuster les likes selon le tab
    let likes = Math.floor(Math.random() * 10000);
    if (tab === 'popular') likes = Math.floor(Math.random() * 50000) + 10000;
    if (tab === 'trending') likes = Math.floor(Math.random() * 20000) + 5000;
    
    mockMedia.push({
      id: `media-${Date.now()}-${id}`,
      type,
      url: type === 'VIDEO' 
        ? 'https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4'
        : `https://picsum.photos/400/400?random=${id}`,
      caption: `Publication inspirante #${id}`,
      likes,
      comments: Math.floor(Math.random() * 500),
      user,
      isPaid: i % 10 === 0, // 1 sur 10 est payant
      createdAt: new Date(Date.now() - (id * 3600000)).toISOString()
    });
  }
  
  return mockMedia;
};

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '9');
  const tab = searchParams.get('tab') || 'trending';
  
  // Simulation de délai réseau
  await new Promise(resolve => setTimeout(resolve, 800));
  
  const media = generateMockMedia(page, limit, tab);
  const hasMore = page < 8; // 8 pages maximum
  
  return NextResponse.json({
    media,
    hasMore,
    page,
    total: 72 // 8 pages * 9 items
  });
}