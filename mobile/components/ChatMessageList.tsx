import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../../shared/constants/colors';
import { formatRelativeTime } from '../../shared/utils/notifications';
import { DirectMessageAttachment } from './DirectMessageAttachment';

export type ChatMessage = {
  id: string;
  author_id: string;
  author_display_name?: string | null;
  body: string;
  created_at: string;
  attachment_path?: string | null;
};

type Props = {
  messages: ChatMessage[];
  myUserId: string | null;
  theirLabel?: string;
  formatTime?: (iso: string) => string;
};

type BubbleGroup = {
  isMine: boolean;
  authorName: string;
  messages: ChatMessage[];
};

function groupMessages(messages: ChatMessage[], myUserId: string | null): BubbleGroup[] {
  const groups: BubbleGroup[] = [];
  for (const msg of messages) {
    const isMine = msg.author_id === myUserId;
    const authorName = msg.author_display_name?.trim() || (isMine ? 'You' : 'AllyTZ');
    const last = groups[groups.length - 1];
    if (last && last.isMine === isMine) {
      last.messages.push(msg);
    } else {
      groups.push({ isMine, authorName, messages: [msg] });
    }
  }
  return groups;
}

export function ChatMessageList({
  messages,
  myUserId,
  theirLabel = 'AllyTZ',
  formatTime = formatRelativeTime,
}: Props) {
  const groups = useMemo(() => groupMessages(messages, myUserId), [messages, myUserId]);

  if (messages.length === 0) {
    return null;
  }

  return (
    <View style={styles.list}>
      {groups.map((group) => (
        <View
          key={group.messages[0].id}
          style={[styles.group, group.isMine ? styles.groupMine : styles.groupTheirs]}
        >
          {!group.isMine ? (
            <Text style={styles.groupAuthor}>{group.authorName || theirLabel}</Text>
          ) : null}
          {group.messages.map((msg, index) => {
            const isLast = index === group.messages.length - 1;
            return (
              <View
                key={msg.id}
                style={[
                  styles.bubble,
                  group.isMine ? styles.bubbleMine : styles.bubbleTheirs,
                  index > 0 && styles.bubbleStacked,
                  group.isMine ? styles.bubbleMineStack : styles.bubbleTheirsStack,
                ]}
              >
                <Text style={styles.body}>{msg.body}</Text>
                {msg.attachment_path ? (
                  <DirectMessageAttachment attachmentPath={msg.attachment_path} />
                ) : null}
                {isLast ? (
                  <Text style={[styles.time, group.isMine && styles.timeMine]}>
                    {formatTime(msg.created_at)}
                  </Text>
                ) : null}
              </View>
            );
          })}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: 10 },
  group: { maxWidth: '88%', marginBottom: 4 },
  groupMine: { alignSelf: 'flex-end', alignItems: 'flex-end' },
  groupTheirs: { alignSelf: 'flex-start', alignItems: 'flex-start' },
  groupAuthor: {
    color: Colors.gold,
    fontFamily: 'Axiforma-Bold',
    fontSize: 11,
    marginBottom: 4,
    marginLeft: 4,
  },
  bubble: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    maxWidth: '100%',
  },
  bubbleMine: {
    backgroundColor: 'rgba(244, 196, 100, 0.22)',
    borderWidth: 1,
    borderColor: 'rgba(244, 196, 100, 0.4)',
    borderTopRightRadius: 4,
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  bubbleTheirs: {
    backgroundColor: '#2A2A2A',
    borderTopLeftRadius: 4,
    borderTopRightRadius: 16,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  bubbleStacked: { marginTop: 2 },
  bubbleMineStack: { borderTopRightRadius: 16 },
  bubbleTheirsStack: { borderTopLeftRadius: 16 },
  body: { color: '#FFF', fontFamily: 'Axiforma-Regular', fontSize: 14, lineHeight: 20 },
  time: {
    color: '#888',
    fontFamily: 'Axiforma-Regular',
    fontSize: 10,
    marginTop: 4,
    alignSelf: 'flex-start',
  },
  timeMine: { alignSelf: 'flex-end' },
});
