import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../../shared/constants/colors';
import type { SignalPost } from '../../shared/types/signal';
import {
  getSignalPostAudienceLabel,
  getSignalPostTypeLabel,
} from '../../shared/utils/signal-posts';
import { formatActivityTimestamp } from '../../shared/utils/admin-timestamp';
import { MessageSquare, Lock, Users, User, Reply } from 'lucide-react-native';
import { SignalPostAttachment } from './SignalPostAttachment';

interface SignalPostsListProps {
  posts: SignalPost[];
  currentUserId: string | null;
  parentPostsById?: Record<string, SignalPost>;
  recipientNames?: Record<string, string>;
}

export function SignalPostsList({
  posts,
  currentUserId,
  parentPostsById = {},
  recipientNames = {},
}: SignalPostsListProps) {
  if (posts.length === 0) {
    return (
      <Text style={styles.emptyText}>
        No posts yet. Share feedback with the community or send a question to admin.
      </Text>
    );
  }

  const formatTime = (dateString: string) => formatActivityTimestamp(dateString);

  return (
    <View style={styles.list}>
      {posts.map((post) => {
        const isOwn = currentUserId === post.author_id;
        const isPrivate = post.audience === 'admin_only';
        const isTargeted = post.audience === 'specific_user';
        const parent = post.parent_post_id ? parentPostsById[post.parent_post_id] : null;
        const recipientName = post.recipient_user_id
          ? recipientNames[post.recipient_user_id]
          : null;

        return (
          <View key={post.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.authorRow}>
                <MessageSquare size={14} color={Colors.gold} strokeWidth={2} />
                <Text style={styles.authorName}>
                  {post.author_display_name || (isOwn ? 'You' : 'User')}
                </Text>
                {isOwn && <Text style={styles.youBadge}>You</Text>}
              </View>
              <Text style={styles.time}>{formatTime(post.created_at)}</Text>
            </View>

            {parent ? (
              <View style={styles.replyContext}>
                <Reply size={12} color={Colors.rainyGrey} />
                <Text style={styles.replyContextText} numberOfLines={2}>
                  Reply to {parent.author_display_name || 'user'}: {parent.summary}
                </Text>
              </View>
            ) : null}

            <View style={styles.badges}>
              <View style={styles.typeBadge}>
                <Text style={styles.typeBadgeText}>{getSignalPostTypeLabel(post.post_type)}</Text>
              </View>
              <View style={[styles.audienceBadge, isPrivate && styles.audienceBadgePrivate, isTargeted && styles.audienceBadgeTargeted]}>
                {isPrivate ? (
                  <Lock size={10} color="#F59E0B" strokeWidth={2} />
                ) : isTargeted ? (
                  <User size={10} color="#A78BFA" strokeWidth={2} />
                ) : (
                  <Users size={10} color="#60A5FA" strokeWidth={2} />
                )}
                <Text style={[styles.audienceBadgeText, isPrivate && styles.audiencePrivateText, isTargeted && styles.audienceTargetedText]}>
                  {getSignalPostAudienceLabel(post.audience, recipientName)}
                </Text>
              </View>
            </View>

            <Text style={styles.summary}>{post.summary}</Text>

            {post.attachment_path ? (
              <SignalPostAttachment attachmentPath={post.attachment_path} />
            ) : null}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: 12,
  },
  emptyText: {
    color: '#6A6A6A',
    fontFamily: 'Axiforma-Regular',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 8,
    lineHeight: 20,
  },
  card: {
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
    gap: 8,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  authorName: {
    color: '#FFFFFF',
    fontFamily: 'Axiforma-SemiBold',
    fontSize: 14,
  },
  youBadge: {
    color: Colors.gold,
    fontFamily: 'Axiforma-Regular',
    fontSize: 11,
    marginLeft: 4,
  },
  time: {
    color: Colors.gold,
    fontFamily: 'Axiforma-Medium',
    fontSize: 11,
    textAlign: 'right',
    maxWidth: 130,
  },
  replyContext: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'flex-start',
    backgroundColor: '#2A2A2A',
    borderRadius: 8,
    padding: 8,
    marginBottom: 8,
  },
  replyContextText: {
    flex: 1,
    color: Colors.rainyGrey,
    fontFamily: 'Axiforma-Regular',
    fontSize: 11,
    lineHeight: 15,
  },
  badges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  typeBadge: {
    backgroundColor: '#2A2A2A',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  typeBadgeText: {
    color: Colors.gold,
    fontFamily: 'Axiforma-Medium',
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  audienceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(96,165,250,0.12)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  audienceBadgePrivate: {
    backgroundColor: 'rgba(245,158,11,0.12)',
  },
  audienceBadgeTargeted: {
    backgroundColor: 'rgba(167,139,250,0.12)',
  },
  audienceBadgeText: {
    color: '#60A5FA',
    fontFamily: 'Axiforma-Regular',
    fontSize: 11,
  },
  audiencePrivateText: {
    color: '#F59E0B',
  },
  audienceTargetedText: {
    color: '#A78BFA',
  },
  summary: {
    color: '#E5E5E5',
    fontFamily: 'Axiforma-Regular',
    fontSize: 14,
    lineHeight: 20,
  },
});
