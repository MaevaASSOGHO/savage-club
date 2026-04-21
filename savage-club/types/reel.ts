// types/reel.ts ou directement dans le fichier
import { Post, User, PostMedia, Like, Comment } from "@prisma/client";

export type FormattedReel = {
  id: string;
  content: string | null;
  createdAt: Date;
  user: {
    id: string;
    username: string;
    displayName: string | null;
    avatar: string | null;
    isVerified: boolean;
  };
  medias: PostMedia[];
  likes: Like[];
  comments: Comment[];
  likesCount: number;
  commentsCount: number;
};