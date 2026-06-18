import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors } from '../../shared/constants/colors';
import type { SignalPost } from '../../shared/types/signal';
import {
  getSignalPostAudienceLabel,
  getSignalPostTypeLabel,
} from '../../shared/utils/signal-posts';
import { buildSignalPostThreads } from '../../shared/utils/signal-post-threads';
import { formatActivityTimestamp } from '../../shared/utils/admin-timestamp';
import { Lock, Users, User } from 'lucide-react-native';
import { SignalPostAttachment } from './SignalPostAttachment';

type Props = {
  posts: SignalPost[];
  currentUserId: string | null;
  recipientNames?: Record<string, string>;
  isAdminView?: boolean;
  onReplyToAll?: (post: SignalPost) => void;
  onReplyToAuthor?: (post: SignalPost) => void;
  emptyText?: string;
};

function PostBubble({
  post,
  currentUserId,
  recipientNames,
  isAdminView,
  isReply,
  onReplyToAll,
  onReplyToAuthor,
}: {
  post: SignalPost;
  currentUserId: string | null;
  recipientNames: Record<string, string>;
  isAdminView?: boolean;
  isReply?: boolean;
  onReplyToAll?: (post: SignalPost) => void;
  onReplyToAuthor?: (post: SignalPost) => void;
}) {
  const isOwn = currentUserId === post.author_id;
  const isPrivate = post.audience === 'admin_only';
  const isTargeted = post.audience === 'specific_user';
  const recipientName = post.recipient_user_id ? recipientNames[post.recipient_user_id] : null;
  const authorLabel = post.author_display_name || (isOwn ? 'You' : isAdminView ? 'User' : 'AllyTZ');

  return (
    <View style={[styles.bubbleWrap, isReply && styles.replyWrap, isOwn && styles.bubbleWrapOwn]}>
      <View
        style={[
          styles.bubble,
          isOwn ? styles.bubbleOwn : styles.bubbleOther,
          isReply && styles.bubbleReply,
        ]}
      >
        <View style={styles.bubbleHeader}>
          <Text style={styles.author}>{authorLabel}</Text>
          <Text style={styles.time}>{formatActivityTimestamp(post.created_at)}</Text>
        </View>

        {!isReply ? (
          <View style={styles.badges}>
            <View style={styles.typeBadge}>
              <Text style={styles.typeBadgeText}>{getSignalPostTypeLabel(post.post_type)}</Text>
            </View>
            <View
              style={[
                styles.audienceBadge,
                isPrivate && styles.audiencePrivate,
                isTargeted && styles.audienceTargeted,
              ]}
            >
              {isPrivate ? (
                <Lock size={10} color="#F59E0B" />
              ) : isTargeted ? (
                <User size={10} color="#A78BFA" />
              ) : (
                <Users size={10} color="#60A5FA" />
              )}
              <Text
                style={[
                  styles.audienceText,
                  isPrivate && styles.audiencePrivateText,
                  isTargeted && styles.audienceTargetedText,
                ]}
              >
                {getSignalPostAudienceLabel(post.audience, recipientName)}
              </Text>
            </View>
          </View>
        ) : null}

        <Text style={styles.summary}>{post.summary}</Text>

        {post.attachment_path ? (
          <SignalPostAttachment attachmentPath={post.attachment_path} />
        ) : null}

        {isAdminView && onReplyToAll && onReplyToAuthor ? (
          <View style={styles.replyActions}>
            <TouchableOpacity style={styles.replyBtn} onPress={() => onReplyToAll(post)}>
              <Text style={styles.replyBtnText}>Reply to all</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.replyBtnOutline} onPress={() => onReplyToAuthor(post)}>
              <Text style={styles.replyBtnOutlineText}>Reply to author</Text>
            </TouchableOpacity>
          </View>
        ) : null}
      </View>
    </View>
  );
}

export function ThreadedSignalPostsList({
  posts,
  currentUserId,
  recipientNames = {},
  isAdminView = false,
  onReplyToAll,
  onReplyToAuthor,
  emptyText = 'No posts yet.',
}: Props) {
  const threads = useMemo(() => buildSignalPostThreads(posts), [posts]);

  if (threads.length === 0) {
    return <Text style={styles.emptyText}>{emptyText}</Text>;
  }

  return (
    <View style={styles.list}>
      {threads.map(({ root, replies }) => (
        <View key={root.id} style={styles.thread}>
          <PostBubble
            post={root}
            currentUserId={currentUserId}
            recipientNames={recipientNames}
            isAdminView={isAdminView}
            onReplyToAll={onReplyToAll}
            onReplyToAuthor={onReplyToAuthor}
          />
          {replies.length > 0 ? (
            <View style={styles.replyThread}>
              <View style={styles.threadLine} />
              <View style={styles.repliesCol}>
                {replies.map((reply) => (
                  <PostBubble
                    key={reply.id}
                    post={reply}
                    currentUserId={currentUserId}
                    recipientNames={recipientNames}
                    isAdminView={isAdminView}
                    isReply
                    onReplyToAll={onReplyToAll}
                    onReplyToAuthor={onReplyToAuthor}
                  />
                ))}
              </View>
            </View>
          ) : null}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: 16 },
  emptyText: {
    color: '#6A6A6A',
    fontFamily: 'Axiforma-Regular',
    fontSize: 14,
    textAlign: 'center',
    marginVertical: 12,
    lineHeight: 20,
  },
  thread: { marginBottom: 4 },
  bubbleWrap: { alignSelf: 'flex-start', maxWidth: '96%' },
  bubbleWrapOwn: { alignSelf: 'flex-end' },
  replyWrap: { maxWidth: '92%' },
  bubble: {
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  bubbleOwn: {
    backgroundColor: 'rgba(244, 196, 100, 0.12)',
    borderColor: 'rgba(244, 196, 100, 0.35)',
  },
  bubbleOther: { backgroundColor: '#1E1E1E' },
  bubbleReply: {
    backgroundColor: '#252525',
    borderColor: '#2F2F2F',
    paddingVertical: 10,
  },
  bubbleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
    gap: 8,
  },
  author: { color: Colors.gold, fontFamily: 'Axiforma-Bold', fontSize: 12, flex: 1 },
  time: { color: '#777', fontFamily: 'Axiforma-Regular', fontSize: 10 },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 },
  typeBadge: { backgroundColor: '#2A2A2A', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 3 },
  typeBadgeText: { color: Colors.gold, fontFamily: 'Axiforma-Medium', fontSize: 10, textTransform: 'uppercase' },
  audienceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(96,165,250,0.12)',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  audiencePrivate: { backgroundColor: 'rgba(245,158,11,0.12)' },
  audienceTargeted: { backgroundColor: 'rgba(167,139,250,0.12)' },
  audienceText: { color: '#60A5FA', fontFamily: 'Axiforma-Regular', fontSize: 10 },
  audiencePrivateText: { color: '#F59E0B' },
  audienceTargetedText: { color: '#A78BFA' },
  summary: { color: '#E8E8E8', fontFamily: 'Axiforma-Regular', fontSize: 14, lineHeight: 20 },
  replyThread: { flexDirection: 'row', marginTop: 6, marginLeft: 8 },
  threadLine: {
    width: 3,
    borderRadius: 2,
    backgroundColor: 'rgba(244, 196, 100, 0.35)',
    marginRight: 10,
    marginTop: 4,
    marginBottom: 4,
  },
  repliesCol: { flex: 1, gap: 8 },
  replyActions: { flexDirection: 'row', gap: 8, marginTop: 12 },
  replyBtn: {
    flex: 1,
    backgroundColor: Colors.gold,
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
  },
  replyBtnText: { color: '#000', fontFamily: 'Axiforma-Bold', fontSize: 11 },
  replyBtnOutline: {
    flex: 1,
    borderWidth: 1,
    borderColor: Colors.gold,
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
  },
  replyBtnOutlineText: { color: Colors.gold, fontFamily: 'Axiforma-Bold', fontSize: 11 },
});
