// community/community.types.ts
export type User = {
  id: string;
  username: string;
  avatar?: string;
  isVerified?: boolean;
};

export type Comment = {
  id: string;
  author: string;
  text: string;
  userId?: string;
  timestamp?: string;
};

export type Post = {
  id: string;
  user: User;
  content: string;
  title?: string;
  image?: string;
  likes: number;
  comments: Comment[];
  commentsCount?: number;
  timestamp: string;
  isLiked: boolean;
  type: 'workout' | 'meal' | 'progress' | 'achievement' | 'blog';
  metrics?: {
    calories?: number;
    duration?: number;
    distance?: number;
    weight?: number;
  };
};

export type PostStats = {
  posts: number;
  followers: number;
  following: number;
};

// Legacy types for backward compatibility with existing blog
export type BlogPost = {
  id: string;
  title: string;
  avatarUrl?: string;
  imageUrl?: string;
  likes: number;
  comments: Comment[];
};
