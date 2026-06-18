import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { Colors } from '../../../../shared/constants/colors';
import { AdminScreenHeader } from '../../../components/admin/AdminScreenHeader';
import { useDirectMessages } from '../../../hooks/use-direct-messages';
import { DirectMessageComposer } from '../../../components/DirectMessageComposer';
import { ChatMessageList } from '../../../components/ChatMessageList';
import { supabase } from '../../../lib/supabase';
import { formatActivityTimestamp } from '../../../../shared/utils/admin-timestamp';
import { useIsAdmin } from '../../../hooks/use-is-admin';

export default function AdminMessageThreadScreen() {
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const scrollRef = useRef<ScrollView>(null);
  const { isAdmin } = useIsAdmin();
  const [userName, setUserName] = useState('User');
  const [myId, setMyId] = useState<string | null>(null);
  const { data: messages = [], isLoading, refetch } = useDirectMessages(userId);

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession();
      setMyId(session?.user?.id ?? null);

      const { data: profile } = await supabase
        .from('user_profiles')
        .select('full_name, email')
        .eq('id', userId)
        .maybeSingle();

      setUserName(profile?.full_name?.trim() || profile?.email?.split('@')[0] || 'User');
    }
    if (userId) void load();
  }, [userId]);

  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`admin-dm-${userId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'user_direct_messages', filter: `thread_user_id=eq.${userId}` },
        () => { void refetch(); }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, refetch]);

  const scrollToEnd = useCallback(() => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  }, []);

  useEffect(() => {
    if (messages.length) scrollToEnd();
  }, [messages.length, scrollToEnd]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={8}
      >
        <View style={styles.headerWrap}>
          <AdminScreenHeader title={userName} subtitle="Direct message thread" showBack />
        </View>

        {isLoading ? (
          <ActivityIndicator size="large" color={Colors.gold} style={{ marginTop: 40 }} />
        ) : (
          <ScrollView
            ref={scrollRef}
            style={styles.messages}
            contentContainerStyle={styles.messagesContent}
            onContentSizeChange={scrollToEnd}
          >
            {messages.length === 0 ? (
              <Text style={styles.empty}>No messages yet. Send the first message below.</Text>
            ) : (
              <ChatMessageList
                messages={messages}
                myUserId={myId}
                theirLabel={userName}
                formatTime={formatActivityTimestamp}
              />
            )}
          </ScrollView>
        )}

        {userId && isAdmin ? (
          <View style={styles.composerWrap}>
            <DirectMessageComposer
              threadUserId={userId}
              onSent={() => { void refetch(); scrollToEnd(); }}
            />
          </View>
        ) : null}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000000' },
  flex: { flex: 1 },
  headerWrap: { paddingHorizontal: 16 },
  messages: { flex: 1 },
  messagesContent: { padding: 16, paddingBottom: 8 },
  empty: { color: Colors.rainyGrey, fontFamily: 'Axiforma-Regular', textAlign: 'center', marginTop: 24 },
  composerWrap: { padding: 16, paddingTop: 8 },
});
