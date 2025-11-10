// blog/BlogAdapter.tsx
import type { Comment as BlogComment, Post as BlogPost } from './PostCard';
import type { Post as CommunityPost, User } from '../community/community.types';

// Konwersja z BlogPost (stary system) na Post (nowy system społeczności)
export const convertBlogPostToCommunityPost = (blogPost: BlogPost): CommunityPost => ({
  id: blogPost.id,
  user: {
    id: 'blog-author',
    username: 'HealthFlow Blog',
    isVerified: true,
    avatar: blogPost.avatarUrl,
  },
  content: blogPost.title,
  title: blogPost.title,
  image: blogPost.imageUrl,
  likes: blogPost.likes,
  comments: blogPost.comments.map(comment => ({
    id: comment.id,
    author: comment.author,
    text: comment.text,
    userId: comment.author.toLowerCase().replace(/\s+/g, '-'),
    timestamp: new Date().toISOString(),
  })),
  timestamp: new Date().toISOString(),
  isLiked: false,
  type: 'blog',
});

// Konwersja z Post (nowy system) na BlogPost (stary system)
export const convertCommunityPostToBlogPost = (post: CommunityPost): BlogPost => ({
  id: post.id,
  title: post.title || post.content,
  avatarUrl: post.user.avatar,
  imageUrl: post.image,
  likes: post.likes,
  comments: post.comments.map(comment => ({
    id: comment.id,
    author: comment.author,
    text: comment.text,
  })),
});

// Helper do konwersji wielu postów na raz
export const convertBlogPostsToCommunityPosts = (blogPosts: BlogPost[]): CommunityPost[] => {
  return blogPosts.map(convertBlogPostToCommunityPost);
};

// Helper do konwersji wielu postów społeczności na blogowe
export const convertCommunityPostsToBlogPosts = (posts: CommunityPost[]): BlogPost[] => {
  return posts.map(convertCommunityPostToBlogPost);
};

// Funkcja do mieszania postów z bloga i społeczności w jednym feedzie
export const createMixedFeed = (blogPosts: BlogPost[], communityPosts: CommunityPost[]): CommunityPost[] => {
  const convertedBlogPosts = convertBlogPostsToCommunityPosts(blogPosts);
  return [...convertedBlogPosts, ...communityPosts].sort((a, b) => 
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
};