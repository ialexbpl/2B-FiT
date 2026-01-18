// src/hooks/usePosts.ts
import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@utils/supabase';
import { useAuth } from '../context/AuthContext';

export type Post = {
  id: string;
  user_id: string;
  content: string;
  image_url?: string;
  post_type: 'workout' | 'meal' | 'progress' | 'achievement';
  calories?: number;
  duration?: number;
  distance?: number;
  weight?: number;
  likes_count: number;
  comments_count: number;
  created_at: string;
  user: {
    id: string;
    username: string | null;
    full_name: string | null;
    avatar_url: string | null;
  };
  is_private?: boolean;
  is_liked: boolean;
};

export const usePosts = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { session } = useAuth();
  const refreshIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isFetchingRef = useRef(false);

  const likeDesiredRef = useRef<Record<string, boolean | null>>({});
  const likeInFlightRef = useRef<Record<string, boolean>>({});


  const lastFetchRef = useRef<number>(0);
  const cacheRef = useRef<Post[]>([]);

  const fetchPosts = useCallback(async (force = false) => {
    const now = Date.now();
    if (!force && now - lastFetchRef.current < 4000) {
      if (cacheRef.current.length) {
        setPosts(cacheRef.current);
        setLoading(false);
        setRefreshing(false);
      }
      return;
    }
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    lastFetchRef.current = now;
    try {
      console.log('Fetching posts...');
      setErrorMessage(null);

      if (!session?.user?.id) {
        setPosts([]);
        setLoading(false);
        return;
      }

      const [postsRes, likedRes] = await Promise.all([
        supabase
          .from('posts')
          .select(`
            *,
            user:profiles!user_id (
              id,
              username,
              full_name,
              avatar_url
            )
          `)
          .order('created_at', { ascending: false }),
        supabase.from('post_likes').select('post_id').eq('user_id', session.user.id),
      ]);

      if (postsRes.error) throw postsRes.error;
      if (likedRes.error) throw likedRes.error;

      const likedSet = new Set((likedRes.data || []).map((like: any) => like.post_id));
      const postsRaw = postsRes.data || [];
      const userIds = Array.from(new Set(postsRaw.map((p: any) => p.user_id)));

      // fetch privacy flags separately (no FK relationship required)
      let privacyMap: Record<string, boolean> = {};
      try {
        if (userIds.length) {
          const { data: privacyRows } = await supabase
            .from('profile_settings')
            .select('id, is_private')
            .in('id', userIds);
          if (Array.isArray(privacyRows)) {
            privacyMap = Object.fromEntries(
              privacyRows.map((row: any) => [row.id, Boolean(row.is_private)])
            );
          }
        }
      } catch {
        // leave map empty; downstream defaults will hide others' posts
      }

      const currentUserId = session?.user?.id;
      const postsWithFlags = postsRaw.map(post => {
        const privacyFlag = privacyMap[post.user_id];
        const isPrivate =
          typeof privacyFlag === 'boolean'
            ? privacyFlag
            : post.user_id !== currentUserId; // default: hide others if privacy unknown
        return {
          ...post,
          is_private: isPrivate,
          is_liked: likedSet.has(post.id),
        };
      });

      const postsWithLikes = postsWithFlags.filter(
        p => !p.is_private || p.user_id === currentUserId
      );

      console.log(`Loaded ${postsWithLikes.length} posts`);
      cacheRef.current = postsWithLikes;
      setPosts(postsWithLikes);
    } catch (error) {
      console.warn('Error fetching posts:', error);
      setErrorMessage('Network request failed. Check your connection and Supabase URL.');
      setPosts([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
      isFetchingRef.current = false;
    }
  }, [session?.user?.id]);

  const createPost = async (postData: {
    content: string;
    image_url?: string;
    post_type: Post['post_type'];
    calories?: number;
    duration?: number;
    distance?: number;
    weight?: number;
  }) => {
    if (!session?.user) throw new Error('User must be logged in to create post');

    try {
      console.log('Creating post for user:', session.user.id);

      const { data, error } = await supabase
        .from('posts')
        .insert([
          {
            ...postData,
            user_id: session.user.id,
            likes_count: 0,
            comments_count: 0,
          },
        ])
        .select()
        .single();

      if (error) throw error;
      if (!data) throw new Error('No data returned from post creation');

      console.log('Post created successfully:', data);

      // Re-fetch with joined profile data for UI
      const { data: fullPostData } = await supabase
        .from('posts')
        .select(`
          *,
          user:profiles!user_id (
            id,
            username,
            full_name,
            avatar_url
          )
        `)
        .eq('id', data.id)
        .single();

      const postToAdd = fullPostData || {
        ...data,
        user: {
          id: session.user.id,
          username: 'You',
          full_name: 'You',
          avatar_url: null,
        },
      };

      setPosts(prev => [
        {
          ...postToAdd,
          is_private: postToAdd.is_private ?? false,
          is_liked: false,
        },
        ...prev,
      ]);

      return postToAdd;
    } catch (error) {
      console.error('Error creating post:', error);
      throw error;
    }
  };

  const likePost = async (postId: string) => {
  if (!session?.user?.id) {
    console.log('Cannot like post - no user session');
    return;
  }

  let nextLiked = false;

  setPosts(prev =>
    prev.map(p => {
      if (p.id !== postId) return p;

      nextLiked = !p.is_liked;
      const nextCount = Math.max((p.likes_count || 0) + (nextLiked ? 1 : -1), 0);

      return { ...p, is_liked: nextLiked, likes_count: nextCount };
    })
  );

  cacheRef.current = cacheRef.current.map(p => {
    if (p.id !== postId) return p;
    const liked = !p.is_liked;
    return {
      ...p,
      is_liked: liked,
      likes_count: Math.max((p.likes_count || 0) + (liked ? 1 : -1), 0),
    };
  });

  likeDesiredRef.current[postId] = nextLiked;

  if (likeInFlightRef.current[postId]) return;

  likeInFlightRef.current[postId] = true;

  try {
    while (likeDesiredRef.current[postId] !== null && likeDesiredRef.current[postId] !== undefined) {
      const desired = likeDesiredRef.current[postId] as boolean;
      likeDesiredRef.current[postId] = null;

      if (desired) {
        const { error } = await supabase
          .from('post_likes')
          .upsert([{ post_id: postId, user_id: session.user.id }], {
            onConflict: 'post_id,user_id',
          });

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('post_likes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', session.user.id);

        if (error) throw error;
      }
    }
  } catch (error) {
    console.error('Error toggling like:', error);

    fetchPosts(true);
  } finally {
    likeInFlightRef.current[postId] = false;
  }
};


  const deletePost = async (postId: string) => {
    if (!session?.user?.id) {
      console.log('Cannot delete post - no user session');
      return;
    }

    try {
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', postId)
        .eq('user_id', session.user.id);

      if (error) throw error;

      setPosts(prev => prev.filter(p => p.id !== postId));
    } catch (error) {
      console.error('Error deleting post:', error);
      throw error;
    }
  };

  // Manual refresh
  const manualRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchPosts(true);
  }, [fetchPosts]);

  const adjustCommentCount = (postId: string, delta: number) => {
    setPosts(prev =>
      prev.map(p =>
        p.id === postId
          ? { ...p, comments_count: Math.max((p.comments_count || 0) + delta, 0) }
          : p
      )
    );
  };

  useEffect(() => {
    fetchPosts();
    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
        refreshIntervalRef.current = null;
      }
    };
  }, [fetchPosts]);

  return {
    posts,
    loading,
    refreshing,
    createPost,
    likePost,
    deletePost,
    adjustCommentCount,
    error: errorMessage,
    refetch: manualRefresh, // manual refresh
    // interval-based auto-refresh; keep API surface for compatibility
    startAutoRefresh: () => {},
    stopAutoRefresh: () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
        refreshIntervalRef.current = null;
      }
    },
  };
};
