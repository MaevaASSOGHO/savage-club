// types/index.ts
export interface Media {
  id: string;
  type: 'IMAGE' | 'VIDEO';  // En majuscules comme dans votre code
  url: string;
  caption?: string;
  likes: number;
  comments: number;
  user: {
    id: string;
    username: string;
    avatar: string | null;
    isVerified: boolean;
  };
  isPaid?: boolean;
  createdAt: string;
}