import { useAuth } from '@context/AuthContext';
import { supabase } from '@utils/supabase';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

export type FriendProfileSummary = {
  id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
};

type FriendshipRow = {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: 'pending' | 'accepted' | 'declined' | 'blocked';
  created_at: string;
  responded_at: string | null;
  requester_acknowledged: boolean;
  addressee_acknowledged: boolean;
  requester: FriendProfileSummary | null;
  addressee: FriendProfileSummary | null;
};

export type FriendCandidate = {
  profile: FriendProfileSummary;
  relation?: RelationLookupEntry;
};

export type FriendListEntry = {
  friendshipId: string;
  profile: FriendProfileSummary;
  since: string;
};

export type RelationLookupEntry = {
  type: 'friend' | 'incoming' | 'outgoing' | 'declined' | 'blocked';
  friendshipId: string;
};

export type FriendRequestItem = {
  id: string;
  other: FriendProfileSummary;
  created_at: string;
};

export type FriendNotificationItem = {
  id: string;
  other: FriendProfileSummary;
  responded_at: string | null;
};

type MutationKey = `user:${string}` | `friendship:${string}`;

const fallbackProfile = (id: string): FriendProfileSummary => ({
  id,
  username: null,
  full_name: 'Deleted user',
  avatar_url: null,
});

export const useFriends = () => {
  const { session } = useAuth();
  const userId = session?.user?.id;
  const [relationshipsLoading, setRelationshipsLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [relationships, setRelationships] = useState<FriendshipRow[]>([]);
  const [rawCandidates, setRawCandidates] = useState<FriendProfileSummary[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [mutatingKeys, setMutatingKeys] = useState<Record<MutationKey, true>>({});
  const notifications = useMemo(() => {
    try {
      return require('expo-notifications') as typeof import('expo-notifications');
    } catch {
      return null;
    }
  }, []);
  const notifiedInvitesRef = useRef<Set<string>>(new Set());

  const setMutating = useCallback((key: MutationKey, value: boolean) => {
    setMutatingKeys(prev => {
      if (value) {
        return { ...prev, [key]: true };
      }
      const clone = { ...prev };
      delete clone[key];
      return clone;
    });
  }, []);

  const fetchRelationships = useCallback(async () => {
    if (!userId) {
      setRelationships([]);
      return;
    }
    setRelationshipsLoading(true);
    try {
      const { data, error } = await supabase
        .from('friendships')
        .select(
          `
            id,
            requester_id,
            addressee_id,
            status,
            created_at,
            responded_at,
            requester_acknowledged,
            addressee_acknowledged
          `
        )
        .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`)
        .order('created_at', { ascending: false });
      if (error) throw error;
      const rows = (data ?? []) as Omit<FriendshipRow, 'requester' | 'addressee'>[];
      const ids = Array.from(
        new Set(rows.flatMap(row => [row.requester_id, row.addressee_id]).filter(Boolean))
      );
      let profileMap: Record<string, FriendProfileSummary> = {};
      if (ids.length > 0) {
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('id, username, full_name, avatar_url')
          .in('id', ids);
        if (profilesError) {
          console.error('Failed to fetch friendship profiles', profilesError);
        } else {
          profileMap = Object.fromEntries(
            (profilesData as FriendProfileSummary[]).map(profile => [profile.id, profile])
          );
        }
      }
      const normalized = rows.map(row => ({
        ...row,
        requester: profileMap[row.requester_id] ?? null,
        addressee: profileMap[row.addressee_id] ?? null,
      })) as FriendshipRow[];
      setRelationships(normalized);
    } catch (err) {
      console.error('Failed to fetch friendships', err);
      setRelationships([]);
    } finally {
      setRelationshipsLoading(false);
    }
  }, [userId]);

  const fetchProfiles = useCallback(
    async (term: string) => {
      if (!userId) {
        setRawCandidates([]);
        return;
      }
      setSearchLoading(true);
      try {
        const normalized = term.trim();
        let query = supabase
          .from('profiles')
          .select('id, username, full_name, avatar_url')
          .neq('id', userId)
          .order('full_name', { ascending: true, nullsFirst: false })
          .limit(40);
        if (normalized.length > 0) {
          const fragment = `%${normalized}%`;
          query = query.or(`username.ilike.${fragment},full_name.ilike.${fragment}`);
        }
        const { data, error } = await query;
        if (error) throw error;
        setRawCandidates((data as FriendProfileSummary[]) ?? []);
      } catch (err) {
        console.error('Failed to fetch profiles', err);
        setRawCandidates([]);
      } finally {
        setSearchLoading(false);
      }
    },
    [userId]
  );

  const refresh = useCallback(async () => {
    await Promise.all([fetchRelationships(), fetchProfiles(debouncedQuery)]);
  }, [debouncedQuery, fetchProfiles, fetchRelationships]);
  const invitesCacheKey = userId ? `friends:notified:${userId}` : null;

  const ensureNotificationPermission = useCallback(async () => {
    if (!notifications) return false;
    try {
      const { status, granted } = await notifications.getPermissionsAsync();
      if (granted || status === notifications.PermissionStatus.GRANTED) return true;
      const req = await notifications.requestPermissionsAsync();
      return req.granted || req.status === notifications.PermissionStatus.GRANTED;
    } catch (e) {
      console.warn('Friends notification permission failed', e);
      return false;
    }
  }, [notifications]);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(searchQuery.trim());
    }, 250);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  useEffect(() => {
    fetchProfiles(debouncedQuery);
  }, [debouncedQuery, fetchProfiles]);

  useEffect(() => {
    fetchRelationships();
  }, [fetchRelationships]);

  useEffect(() => {
    if (!userId) {
      setRelationships([]);
      setRawCandidates([]);
      notifiedInvitesRef.current.clear();
    }
  }, [userId]);

  useEffect(() => {
    const loadNotified = async () => {
      if (!invitesCacheKey) return;
      try {
        const saved = await AsyncStorage.getItem(invitesCacheKey);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            notifiedInvitesRef.current = new Set(parsed);
          }
        }
      } catch {
        notifiedInvitesRef.current = new Set();
      }
    };
    loadNotified();
  }, [invitesCacheKey]);

  useEffect(() => {
    const notifyNewInvites = async () => {
      if (!notifications || !userId || !invitesCacheKey) return;
      const incoming = relationships.filter(
        row => row.status === 'pending' && row.addressee_id === userId
      );
      const unseen = incoming.filter(row => !notifiedInvitesRef.current.has(row.id));
      if (unseen.length === 0) return;

      const allowed = await ensureNotificationPermission();
      if (!allowed) return;

      const first = unseen[0];
      const otherId = first.requester_id;
      const requesterProfile = first.requester ?? fallbackProfile(otherId);

      try {
        await notifications.scheduleNotificationAsync({
          content: {
            title: 'New friend invite',
            body: `${requesterProfile.full_name || requesterProfile.username || 'Someone'} sent you a request.`,
            data: { type: 'friend-invite', friendshipId: first.id, from: otherId },
          },
          trigger: null,
        });
      } catch (e) {
        console.warn('Failed to schedule friend invite notification', e);
      }

      unseen.forEach(invite => notifiedInvitesRef.current.add(invite.id));
      await AsyncStorage.setItem(invitesCacheKey, JSON.stringify([...notifiedInvitesRef.current]));
    };
    notifyNewInvites();
  }, [ensureNotificationPermission, invitesCacheKey, notifications, relationships, userId]);

  const relationLookup = useMemo(() => {
    const map = new Map<string, RelationLookupEntry>();
    relationships.forEach(row => {
      const otherId = row.requester_id === userId ? row.addressee_id : row.requester_id;
      if (!otherId) return;
      let type: RelationLookupEntry['type'];
      if (row.status === 'accepted') {
        type = 'friend';
      } else if (row.status === 'declined') {
        type = 'declined';
      } else if (row.status === 'blocked') {
        type = 'blocked';
      } else if (row.requester_id === userId) {
        type = 'outgoing';
      } else {
        type = 'incoming';
      }
      map.set(otherId, { type, friendshipId: row.id });
    });
    return map;
  }, [relationships, userId]);

  const relationForUser = useCallback(
    (targetId: string) => relationLookup.get(targetId),
    [relationLookup]
  );

  const searchResults: FriendCandidate[] = useMemo(
    () =>
      rawCandidates.map(profile => ({
        profile,
        relation: relationLookup.get(profile.id),
      })),
    [rawCandidates, relationLookup]
  );

  const incomingRequests: FriendRequestItem[] = useMemo(
    () =>
      relationships
        .filter(row => row.status === 'pending' && row.addressee_id === userId)
        .map(row => ({
          id: row.id,
          created_at: row.created_at,
          other: row.requester ?? fallbackProfile(row.requester_id),
        })),
    [relationships, userId]
  );

  const acceptanceNotifications: FriendNotificationItem[] = useMemo(
    () =>
      relationships
        .filter(row => row.status === 'accepted' && row.requester_id === userId && !row.requester_acknowledged)
        .map(row => ({
          id: row.id,
          responded_at: row.responded_at,
          other: row.addressee ?? fallbackProfile(row.addressee_id),
        })),
    [relationships, userId]
  );

  const friendCount = useMemo(
    () => relationships.filter(row => row.status === 'accepted').length,
    [relationships]
  );

  const friends: FriendListEntry[] = useMemo(
    () =>
      relationships
        .filter(row => row.status === 'accepted')
        .map(row => {
          const isRequester = row.requester_id === userId;
          const other = isRequester
            ? row.addressee ?? fallbackProfile(row.addressee_id)
            : row.requester ?? fallbackProfile(row.requester_id);
          return {
            friendshipId: row.id,
            profile: other,
            since: row.responded_at ?? row.created_at,
          };
        }),
    [relationships, userId]
  );

  const isUserMutating = useCallback(
    (targetId: string) => Boolean(mutatingKeys[`user:${targetId}`]),
    [mutatingKeys]
  );

  const isFriendshipMutating = useCallback(
    (friendshipId: string) => Boolean(mutatingKeys[`friendship:${friendshipId}`]),
    [mutatingKeys]
  );

  const sendInvite = useCallback(
    async (targetUserId: string) => {
      if (!userId) throw new Error('You must be signed in to send invitations.');
      const currentRelation = relationLookup.get(targetUserId)?.type;
      if (currentRelation === 'friend') {
        throw new Error('You are already friends.');
      }
      if (currentRelation === 'outgoing') {
        throw new Error('The invitation is already pending.');
      }
      if (currentRelation === 'incoming') {
        throw new Error('This member already sent you an invitation. Check your requests.');
      }
      if (currentRelation === 'blocked') {
        throw new Error('The connection is unavailable right now.');
      }
      setMutating(`user:${targetUserId}`, true);
      try {
        const { error } = await supabase.from('friendships').insert({
          requester_id: userId,
          addressee_id: targetUserId,
        });
        if (error) throw error;
        await fetchRelationships();
      } finally {
        setMutating(`user:${targetUserId}`, false);
      }
    },
    [fetchRelationships, relationLookup, setMutating, userId]
  );

  const cancelInvite = useCallback(
    async (friendshipId: string) => {
      if (!userId) throw new Error('You must be signed in to cancel invitations.');
      setMutating(`friendship:${friendshipId}`, true);
      try {
        const { error } = await supabase
          .from('friendships')
          .delete()
          .eq('id', friendshipId)
          .eq('requester_id', userId);
        if (error) throw error;
        await fetchRelationships();
      } finally {
        setMutating(`friendship:${friendshipId}`, false);
      }
    },
    [fetchRelationships, setMutating, userId]
  );

  const acceptInvite = useCallback(
    async (friendshipId: string) => {
      if (!userId) throw new Error('You must be signed in to respond to invitations.');
      setMutating(`friendship:${friendshipId}`, true);
      try {
        const { error } = await supabase
          .from('friendships')
          .update({
            status: 'accepted',
            responded_at: new Date().toISOString(),
            requester_acknowledged: false,
            addressee_acknowledged: true,
          })
          .eq('id', friendshipId)
          .eq('addressee_id', userId);
        if (error) throw error;
        await fetchRelationships();
      } finally {
        setMutating(`friendship:${friendshipId}`, false);
      }
    },
    [fetchRelationships, setMutating, userId]
  );

  const declineInvite = useCallback(
    async (friendshipId: string) => {
      if (!userId) throw new Error('You must be signed in to respond to invitations.');
      setMutating(`friendship:${friendshipId}`, true);
      try {
        const { error } = await supabase
          .from('friendships')
          .delete()
          .eq('id', friendshipId)
          .eq('addressee_id', userId);
        if (error) throw error;
        await fetchRelationships();
      } finally {
        setMutating(`friendship:${friendshipId}`, false);
      }
    },
    [fetchRelationships, setMutating, userId]
  );

  const acknowledgeNotification = useCallback(
    async (friendshipId: string) => {
      if (!userId) throw new Error('You must be signed in to update notifications.');
      setMutating(`friendship:${friendshipId}`, true);
      try {
        const { error } = await supabase
          .from('friendships')
          .update({
            requester_acknowledged: true,
          })
          .eq('id', friendshipId)
          .eq('requester_id', userId);
        if (error) throw error;
        await fetchRelationships();
      } finally {
        setMutating(`friendship:${friendshipId}`, false);
      }
    },
    [fetchRelationships, setMutating, userId]
  );

  const removeFriend = useCallback(
    async (friendshipId: string) => {
      if (!userId) throw new Error('You must be signed in to remove friends.');
      setMutating(`friendship:${friendshipId}`, true);
      try {
        const { error } = await supabase
          .from('friendships')
          .delete()
          .eq('id', friendshipId)
          .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`);
        if (error) throw error;
        await fetchRelationships();
      } finally {
        setMutating(`friendship:${friendshipId}`, false);
      }
    },
    [fetchRelationships, setMutating, userId]
  );

  return {
    searchQuery,
    setSearchQuery,
    searchResults,
    searchLoading,
    relationshipsLoading,
    incomingRequests,
    acceptanceNotifications,
    friendCount,
    friends,
    sendInvite,
    cancelInvite,
    acceptInvite,
    declineInvite,
    acknowledgeNotification,
    removeFriend,
    relationForUser,
    isUserMutating,
    isFriendshipMutating,
    refresh,
  };
};
