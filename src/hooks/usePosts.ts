// src/hooks/usePosts.ts
import { useState, useEffect, useRef } from 'react';
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
  is_liked: boolean;
};

export const usePosts = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { session } = useAuth();
  const refreshIntervalRef = useRef<ReturnType<typeof setTimeout> | null>(null); // ✅ POPRAWIONE

  const fetchPosts = async () => {
    try {
      console.log('🔄 Fetching posts...');
      
      if (!session?.user?.id) {
        console.log('No user session, setting empty posts');
        setPosts([]);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          user:profiles!user_id (
            id,
            username,
            full_name,
            avatar_url
          ),
          post_likes!left (
            user_id
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const postsWithLikes = data?.map(post => ({
        ...post,
        is_liked: post.post_likes?.some((like: any) => like.user_id === session?.user?.id) || false
      })) || [];

      console.log(`✅ Loaded ${postsWithLikes.length} posts`);
      setPosts(postsWithLikes);
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const createPost = async (postData: {
    content: string;
    image_url?: string;
    post_type: 'workout' | 'meal' | 'progress' | 'achievement';
    calories?: number;
    duration?: number;
    distance?: number;
    weight?: number;
  }) => {
    if (!session?.user) throw new Error('User must be logged in to create post');

    try {
      console.log('🚀 Creating post for user:', session.user.id);
      
      const { data, error } = await supabase
        .from('posts')
        .insert([{
          ...postData,
          user_id: session.user.id,
          likes_count: 0,
          comments_count: 0
        }])
        .select()
        .single();

      if (error) throw error;
      if (!data) throw new Error('No data returned from post creation');

      console.log('✅ Post created successfully:', data);

      // Po INSERT załaduj pełne dane z JOINem
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
          avatar_url: null
        }
      };

      setPosts(prev => [{
        ...postToAdd,
        is_liked: false
      }, ...prev]);

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

    try {
      const post = posts.find(p => p.id === postId);
      const isCurrentlyLiked = post?.is_liked;

      if (isCurrentlyLiked) {
        const { error } = await supabase
          .from('post_likes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', session.user.id);

        if (error) throw error;

        setPosts(prev => prev.map(p => 
          p.id === postId 
            ? { ...p, is_liked: false, likes_count: p.likes_count - 1 }
            : p
        ));
      } else {
        const { error } = await supabase
          .from('post_likes')
          .insert([{ post_id: postId, user_id: session.user.id }]);

        if (error) throw error;

        setPosts(prev => prev.map(p => 
          p.id === postId 
            ? { ...p, is_liked: true, likes_count: p.likes_count + 1 }
            : p
        ));
      }
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  // ✅ AUTO-REFRESH CO 30 SEKUND
  const startAutoRefresh = () => {
    // Czyścimy poprzedni interval
    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current);
    }
    
    // Ustawiamy nowy interval - odświeżaj co 30 sekund
    refreshIntervalRef.current = setTimeout(() => {
      console.log('🔄 Auto-refreshing posts...');
      fetchPosts();
      // Ustawiamy kolejny interval po wykonaniu
      startAutoRefresh();
    }, 30000); // 30 sekund
  };

  const stopAutoRefresh = () => {
    if (refreshIntervalRef.current) {
      clearTimeout(refreshIntervalRef.current);
      refreshIntervalRef.current = null;
    }
  };

  // Ręczne odświeżanie
  const manualRefresh = async () => {
    setRefreshing(true);
    await fetchPosts();
  };

  useEffect(() => {
    fetchPosts();
    startAutoRefresh();

    // Cleanup przy odmontowaniu komponentu
    return () => {
      stopAutoRefresh();
    };
  }, [session?.user?.id]);

  return {
    posts,
    loading,
    refreshing,
    createPost,
    likePost,
    refetch: manualRefresh, // Ręczne odświeżanie
    startAutoRefresh,
    stopAutoRefresh,
  };
};