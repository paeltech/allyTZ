import React, { useEffect, useState } from 'react';
import { Image, StyleSheet, TouchableOpacity, Linking, View, Text } from 'react-native';
import {
  DIRECT_MESSAGE_BUCKET,
  getDirectMessageAttachmentUrl,
} from '../../shared/utils/direct-messages';
import { supabase } from '../lib/supabase';

type Props = {
  attachmentPath: string;
};

export function DirectMessageAttachment({ attachmentPath }: Props) {
  const [uri, setUri] = useState<string | null>(() => getDirectMessageAttachmentUrl(attachmentPath));
  const [failed, setFailed] = useState(false);
  const [aspectRatio, setAspectRatio] = useState(1);

  useEffect(() => {
    setUri(getDirectMessageAttachmentUrl(attachmentPath));
    setFailed(false);
    setAspectRatio(1);
  }, [attachmentPath]);

  const handleError = async () => {
    if (failed) return;
    setFailed(true);

    const { data, error } = await supabase.storage
      .from(DIRECT_MESSAGE_BUCKET)
      .createSignedUrl(attachmentPath, 60 * 60);

    if (!error && data?.signedUrl) {
      setUri(data.signedUrl);
      return;
    }

    setUri(null);
  };

  if (!uri) {
    return (
      <View style={styles.unavailable}>
        <Text style={styles.unavailableText}>Image unavailable</Text>
      </View>
    );
  }

  return (
    <TouchableOpacity onPress={() => Linking.openURL(uri)} activeOpacity={0.9}>
      <Image
        source={{ uri }}
        style={[styles.attachment, { aspectRatio }]}
        resizeMode="contain"
        onLoad={(e) => {
          const { width, height } = e.nativeEvent.source;
          if (width && height > 0) {
            setAspectRatio(width / height);
          }
        }}
        onError={() => { void handleError(); }}
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  attachment: {
    marginTop: 8,
    width: '100%',
    borderRadius: 10,
    backgroundColor: '#2A2A2A',
  },
  unavailable: {
    marginTop: 8,
    height: 72,
    borderRadius: 10,
    backgroundColor: '#2A2A2A',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#3A3A3A',
  },
  unavailableText: {
    color: '#6A6A6A',
    fontFamily: 'Axiforma-Regular',
    fontSize: 12,
  },
});
