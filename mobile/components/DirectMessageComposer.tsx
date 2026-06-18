import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Image,
  Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { ImagePlus, Send, X } from 'lucide-react-native';
import { Colors } from '../../shared/constants/colors';
import {
  buildDirectMessageAttachmentPath,
  DIRECT_MESSAGE_BUCKET,
  DIRECT_MESSAGE_MAX_IMAGE_BYTES,
} from '../../shared/utils/direct-messages';
import { extensionFromMime, uploadImageToBucket } from '../lib/upload-storage-image';
import { formatSupabaseError } from '../lib/supabase-error';
import { supabase } from '../lib/supabase';

type Props = {
  threadUserId: string;
  onSent: () => void;
};

export function DirectMessageComposer({ threadUserId, onSent }: Props) {
  const [body, setBody] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [imageMime, setImageMime] = useState('image/jpeg');
  const [submitting, setSubmitting] = useState(false);

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Allow photo library access to attach an image.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.85,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      if (asset.fileSize && asset.fileSize > DIRECT_MESSAGE_MAX_IMAGE_BYTES) {
        Alert.alert('Image too large', 'Please choose an image under 5 MB.');
        return;
      }
      setImageUri(asset.uri);
      setImageMime(asset.mimeType || 'image/jpeg');
    }
  };

  const handleSend = async () => {
    const trimmed = body.trim();
    if (!trimmed) {
      Alert.alert('Message required', 'Please enter a message.');
      return;
    }

    setSubmitting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        Alert.alert('Sign in required', 'Please sign in to send messages.');
        return;
      }

      let attachmentPath: string | null = null;

      if (imageUri) {
        const ext = extensionFromMime(imageMime);
        attachmentPath = buildDirectMessageAttachmentPath(
          session.user.id,
          threadUserId,
          ext
        );
        await uploadImageToBucket(DIRECT_MESSAGE_BUCKET, attachmentPath, imageUri, imageMime);
      }

      const displayName =
        session.user.user_metadata?.full_name?.trim() ||
        session.user.email?.split('@')[0] ||
        'User';

      const { error } = await supabase.from('user_direct_messages').insert({
        thread_user_id: threadUserId,
        author_id: session.user.id,
        body: trimmed,
        attachment_path: attachmentPath,
        author_display_name: displayName,
      });

      if (error) throw error;

      setBody('');
      setImageUri(null);
      setImageMime('image/jpeg');
      onSent();
    } catch (err: unknown) {
      Alert.alert('Could not send', formatSupabaseError(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        value={body}
        onChangeText={setBody}
        placeholder="Write a message..."
        placeholderTextColor="#6A6A6A"
        multiline
        textAlignVertical="top"
        selectionColor={Colors.gold}
      />

      {imageUri ? (
        <View style={styles.imagePreviewWrap}>
          <Image source={{ uri: imageUri }} style={styles.imagePreview} resizeMode="cover" />
          <TouchableOpacity style={styles.removeImageBtn} onPress={() => setImageUri(null)}>
            <X size={16} color="#FFF" />
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity style={styles.attachButton} onPress={pickImage}>
          <ImagePlus size={18} color={Colors.gold} strokeWidth={2} />
          <Text style={styles.attachButtonText}>Attach image</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity
        style={[styles.sendButton, submitting && styles.sendButtonDisabled]}
        onPress={handleSend}
        disabled={submitting}
      >
        {submitting ? (
          <ActivityIndicator color="#000" />
        ) : (
          <>
            <Send size={16} color="#000" strokeWidth={2.5} />
            <Text style={styles.sendButtonText}>Send</Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1E1E1E',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#3A3A3A',
  },
  input: {
    backgroundColor: '#2A2A2A',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#3A3A3A',
    color: '#FFFFFF',
    fontFamily: 'Axiforma-Regular',
    fontSize: 14,
    minHeight: 80,
    padding: 12,
    marginBottom: 10,
  },
  attachButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#3A3A3A',
    borderRadius: 10,
    padding: 12,
    borderStyle: 'dashed',
    marginBottom: 10,
  },
  attachButtonText: {
    color: Colors.gold,
    fontFamily: 'Axiforma-Regular',
    fontSize: 14,
  },
  imagePreviewWrap: {
    position: 'relative',
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 10,
  },
  imagePreview: {
    width: '100%',
    height: 140,
    backgroundColor: '#2A2A2A',
  },
  removeImageBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.65)',
    borderRadius: 14,
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButton: {
    backgroundColor: Colors.gold,
    borderRadius: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  sendButtonDisabled: {
    opacity: 0.7,
  },
  sendButtonText: {
    color: '#000000',
    fontFamily: 'Axiforma-Bold',
    fontSize: 15,
  },
});
