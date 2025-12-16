import { useAuth } from '@context/AuthContext';
import { supabase } from '@utils/supabase';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

export type DirectMessage = {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
};

export type MessageProfile = {
  id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
};

export type ConversationPreview = {
  userId: string;
  profile: MessageProfile;
  lastMessage: DirectMessage;
};

const fallbackProfile = (id: string): MessageProfile => ({
  id,
  username: null,
  full_name: null,
  avatar_url: null,
});

const sortByCreatedAtAsc = (a: DirectMessage, b: DirectMessage) =>
  new Date(a.created_at).getTime() - new Date(b.created_at).getTime();

const sortByCreatedAtDesc = (a: DirectMessage, b: DirectMessage) =>
  new Date(b.created_at).getTime() - new Date(a.created_at).getTime();

export const useDirectMessages = (targetUserId: string | null) => {
  const { session } = useAuth();
  const userId = session?.user?.id;
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);

  const fetchMessages = useCallback(async () => {
    if (!userId || !targetUserId) {
      setMessages([]);
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .or(
          `and(sender_id.eq.${userId},receiver_id.eq.${targetUserId}),and(sender_id.eq.${targetUserId},receiver_id.eq.${userId})`
        )
        .order('created_at', { ascending: true });
      if (error) throw error;
      setMessages((data as DirectMessage[])?.sort(sortByCreatedAtAsc) ?? []);
    } catch (err) {
      console.error('Failed to fetch messages', err);
      setMessages([]);
    } finally {
      setLoading(false);
    }
  }, [targetUserId, userId]);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!userId || !targetUserId) {
        throw new Error('You must be signed in to send messages.');
      }
      const trimmed = content.trim();
      if (!trimmed) return null;
      setSending(true);
      try {
        const { data, error } = await supabase
          .from('messages')
          .insert({
            sender_id: userId,
            receiver_id: targetUserId,
            content: trimmed,
          })
          .select('*')
          .single();
        if (error) throw error;
        if (data) {
          setMessages(prev => {
            const merged = [...prev, data as DirectMessage];
            merged.sort(sortByCreatedAtAsc);
            return merged;
          });
        }
        return (data as DirectMessage) ?? null;
      } catch (err) {
        console.error('Failed to send message', err);
        throw err;
      } finally {
        setSending(false);
      }
    },
    [targetUserId, userId]
  );

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  useEffect(() => {
    if (!userId || !targetUserId) return;
    const channel = supabase
      .channel(`messages-thread-${userId}-${targetUserId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `receiver_id=eq.${userId}` },
        payload => {
          const message = payload.new as DirectMessage;
          const involvesTarget =
            (message.sender_id === userId && message.receiver_id === targetUserId) ||
            (message.receiver_id === userId && message.sender_id === targetUserId);
          if (!involvesTarget) return;
          setMessages(prev => {
            if (prev.find(m => m.id === message.id)) return prev;
            const merged = [...prev, message];
            merged.sort(sortByCreatedAtAsc);
            return merged;
          });
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `sender_id=eq.${userId}` },
        payload => {
          const message = payload.new as DirectMessage;
          const involvesTarget =
            (message.sender_id === userId && message.receiver_id === targetUserId) ||
            (message.receiver_id === userId && message.sender_id === targetUserId);
          if (!involvesTarget) return;
          setMessages(prev => {
            if (prev.find(m => m.id === message.id)) return prev;
            const merged = [...prev, message];
            merged.sort(sortByCreatedAtAsc);
            return merged;
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [targetUserId, userId]);

  return {
    messages,
    loading,
    sending,
    refresh: fetchMessages,
    sendMessage,
  };
};

export const useConversationList = () => {
  const { session } = useAuth();
  const userId = session?.user?.id;
  const [conversations, setConversations] = useState<ConversationPreview[]>([]);
  const [loading, setLoading] = useState(false);
  const profileCache = useRef<Record<string, MessageProfile>>({});

  const ensureProfile = useCallback(async (id: string) => {
    if (profileCache.current[id]) return profileCache.current[id];
    const { data, error } = await supabase
      .from('profiles')
      .select('id, username, full_name, avatar_url')
      .eq('id', id)
      .maybeSingle();
    if (error) {
      console.warn('Failed to fetch profile for conversation', error);
    }
    const normalized = data ? (data as MessageProfile) : fallbackProfile(id);
    profileCache.current[id] = normalized;
    return normalized;
  }, []);

  const upsertFromMessage = useCallback(
    async (message: DirectMessage) => {
      if (!userId) return;
      const otherId = message.sender_id === userId ? message.receiver_id : message.sender_id;
      if (!otherId) return;
      const profile = await ensureProfile(otherId);
      setConversations(prev => {
        const filtered = prev.filter(item => item.userId !== otherId);
        const next: ConversationPreview = {
          userId: otherId,
          profile,
          lastMessage: message,
        };
        return [next, ...filtered].sort((a, b) => sortByCreatedAtDesc(a.lastMessage, b.lastMessage));
      });
    },
    [ensureProfile, userId]
  );

  const fetchConversations = useCallback(async () => {
    if (!userId) {
      setConversations([]);
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
        .order('created_at', { ascending: false })
        .limit(200);
      if (error) throw error;
      const rows = (data as DirectMessage[]) ?? [];
      const latestMap = new Map<string, DirectMessage>();
      rows.forEach(row => {
        const otherId = row.sender_id === userId ? row.receiver_id : row.sender_id;
        if (!otherId) return;
        const existing = latestMap.get(otherId);
        if (!existing || sortByCreatedAtDesc(row, existing) < 0) {
          latestMap.set(otherId, row);
        }
      });
      const partnerIds = Array.from(latestMap.keys());
      let profileMap: Record<string, MessageProfile> = {};
      if (partnerIds.length > 0) {
        const { data: profileRows } = await supabase
          .from('profiles')
          .select('id, username, full_name, avatar_url')
          .in('id', partnerIds);
        if (Array.isArray(profileRows)) {
          profileMap = Object.fromEntries(
            (profileRows as MessageProfile[]).map(profile => {
              profileCache.current[profile.id] = profile;
              return [profile.id, profile];
            })
          );
        }
      }
      const list: ConversationPreview[] = partnerIds
        .map(id => ({
          userId: id,
          profile: profileMap[id] ?? profileCache.current[id] ?? fallbackProfile(id),
          lastMessage: latestMap.get(id)!,
        }))
        .sort((a, b) => sortByCreatedAtDesc(a.lastMessage, b.lastMessage));
      setConversations(list);
    } catch (err) {
      console.error('Failed to fetch conversations', err);
      setConversations([]);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel(`messages-list-${userId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `receiver_id=eq.${userId}` },
        payload => {
          upsertFromMessage(payload.new as DirectMessage);
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `sender_id=eq.${userId}` },
        payload => {
          upsertFromMessage(payload.new as DirectMessage);
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [upsertFromMessage, userId]);

  const sorted = useMemo(
    () => [...conversations].sort((a, b) => sortByCreatedAtDesc(a.lastMessage, b.lastMessage)),
    [conversations]
  );

  return {
    conversations: sorted,
    loading,
    refresh: fetchConversations,
  };
};
