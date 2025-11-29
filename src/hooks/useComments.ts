// src/hooks/useComments.ts
import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@utils/supabase';
import { useAuth } from '@context/AuthContext';

export type Comment = {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
  updated_at: string;
  user?: {
    id: string;
    username: string | null;
    full_name: string | null;
    avatar_url: string | null;
  };
};

export const useComments = (postId: string | null) => {
  const { session } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const fetchComments = useCallback(async () => {
    if (!postId) return;
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from('post_comments')
        .select(`
          *,
          user:profiles!user_id (
            id,
            username,
            full_name,
            avatar_url
          )
        `)
        .eq('post_id', postId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setComments(data || []);
    } catch (error) {
      console.error('Error fetching comments:', error);
    } finally {
      setLoading(false);
    }
  }, [postId]);

  const addComment = useCallback(
    async (content: string) => {
      if (!postId) throw new Error('postId is required to add a comment');
      if (!session?.user?.id) throw new Error('User must be logged in to comment');

      const trimmed = content.trim();
      if (!trimmed) return null;

      try {
        setSubmitting(true);

        const { data, error } = await supabase
          .from('post_comments')
          .insert([
            {
              post_id: postId,
              user_id: session.user.id,
              content: trimmed,
            },
          ])
          .select(`
            *,
            user:profiles!user_id (
              id,
              username,
              full_name,
              avatar_url
            )
          `)
          .single();

        if (error) throw error;

        if (data) {
          setComments(prev => [...prev, data]);
        }

        return data || null;
      } catch (error) {
        console.error('Error adding comment:', error);
        throw error;
      } finally {
        setSubmitting(false);
      }
    },
    [postId, session?.user?.id]
  );

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  return {
    comments,
    loading,
    submitting,
    refresh: fetchComments,
    addComment,
  };
};
