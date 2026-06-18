import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Colors } from '../../shared/constants/colors';
import { ChevronLeft, MessageSquare } from 'lucide-react-native';
import { supabase } from '../lib/supabase';
import { useDirectMessages } from '../hooks/use-direct-messages';
import { DirectMessageComposer } from '../components/DirectMessageComposer';
import { ChatMessageList } from '../components/ChatMessageList';
import { checkIsAdmin } from '../lib/admin';

export default function UserMessagesScreen() {
  const scrollRef = useRef<ScrollView>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const { data: messages = [], isLoading, refetch } = useDirectMessages(userId ?? undefined);

  useEffect(() => {
    async function init() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        router.replace('/auth/login');
        return;
      }
      if (await checkIsAdmin(session.user.id)) {
        router.replace('/admin/messages');
        return;
      }
      setUserId(session.user.id);
    }
    void init();
  }, []);

  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`user-dm-${userId}`)
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
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <ChevronLeft size={24} color={Colors.gold} strokeWidth={2} />
          </TouchableOpacity>
          <View style={styles.headerText}>
            <MessageSquare size={20} color={Colors.gold} strokeWidth={2} />
            <Text style={styles.headerTitle}>Messages from AllyTZ</Text>
          </View>
        </View>

        {isLoading || !userId ? (
          <ActivityIndicator size="large" color={Colors.gold} style={{ marginTop: 40 }} />
        ) : (
          <ScrollView
            ref={scrollRef}
            style={styles.messages}
            contentContainerStyle={styles.messagesContent}
            onContentSizeChange={scrollToEnd}
          >
            {messages.length === 0 ? (
              <Text style={styles.empty}>
                No messages yet. When the team contacts you, you can reply here with feedback or questions.
              </Text>
            ) : (
              <ChatMessageList messages={messages} myUserId={userId} theirLabel="AllyTZ" />
            )}
          </ScrollView>
        )}

        {userId ? (
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
  header: { flexDirection: 'row', alignItems: 'center', padding: 16, paddingBottom: 8 },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerText: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerTitle: { color: '#FFF', fontFamily: 'Axiforma-Bold', fontSize: 17 },
  messages: { flex: 1 },
  messagesContent: { padding: 16, paddingBottom: 8 },
  empty: { color: Colors.rainyGrey, fontFamily: 'Axiforma-Regular', textAlign: 'center', marginTop: 24, lineHeight: 22, paddingHorizontal: 12 },
  composerWrap: { padding: 16, paddingTop: 8 },
});
