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
import { Picker } from '@react-native-picker/picker';
import * as ImagePicker from 'expo-image-picker';
import { Colors } from '../../shared/constants/colors';
import type { SignalPostAudience, SignalPostType } from '../../shared/types/signal';
import {
  SIGNAL_POST_AUDIENCE_OPTIONS,
  USER_SIGNAL_POST_TYPE_OPTIONS,
  SIGNAL_POST_TYPE_OPTIONS,
  SIGNAL_POST_MAX_IMAGE_BYTES,
  buildSignalPostAttachmentPath,
} from '../../shared/utils/signal-posts';
import {
  extensionForSignalPostMime,
  normalizeSignalPostImageMime,
  uploadSignalPostImage,
} from '../../shared/utils/signal-post-image';
import { readLocalImageBytes } from '../lib/read-local-image';
import { supabase } from '../lib/supabase';
import { ImagePlus, X, Send } from 'lucide-react-native';

interface SignalPostFormProps {
  signalId: string;
  isAdmin: boolean;
  onPosted: () => void;
}

export function SignalPostForm({ signalId, isAdmin, onPosted }: SignalPostFormProps) {
  const [postType, setPostType] = useState<SignalPostType>('feedback');
  const [audience, setAudience] = useState<SignalPostAudience>('all_users');
  const [summary, setSummary] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [imageMime, setImageMime] = useState<string>('image/jpeg');
  const [submitting, setSubmitting] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const typeOptions = isAdmin ? SIGNAL_POST_TYPE_OPTIONS : USER_SIGNAL_POST_TYPE_OPTIONS;

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
      if (asset.fileSize && asset.fileSize > SIGNAL_POST_MAX_IMAGE_BYTES) {
        Alert.alert('Image too large', 'Please choose an image under 5 MB.');
        return;
      }
      setImageUri(asset.uri);
      setImageMime(asset.mimeType || 'image/jpeg');
    }
  };

  const clearImage = () => {
    setImageUri(null);
    setImageMime('image/jpeg');
  };

  const resetForm = () => {
    setPostType('feedback');
    setAudience('all_users');
    setSummary('');
    clearImage();
    setExpanded(false);
  };

  const handleSubmit = async () => {
    const trimmed = summary.trim();
    if (!trimmed) {
      Alert.alert('Summary required', 'Please enter a summary for your post.');
      return;
    }

    setSubmitting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        Alert.alert('Sign in required', 'Please sign in to post.');
        return;
      }

      let attachmentPath: string | null = null;

      if (imageUri) {
        const normalizedMime = normalizeSignalPostImageMime(imageMime);
        const ext = extensionForSignalPostMime(normalizedMime);
        attachmentPath = buildSignalPostAttachmentPath(session.user.id, signalId, ext);

        const bytes = await readLocalImageBytes(imageUri);

        if (bytes.byteLength > SIGNAL_POST_MAX_IMAGE_BYTES) {
          Alert.alert('Image too large', 'Please choose an image under 5 MB.');
          return;
        }

        await uploadSignalPostImage(supabase, attachmentPath, bytes, normalizedMime);
      }

      const displayName =
        session.user.user_metadata?.full_name?.trim() ||
        session.user.email?.split('@')[0] ||
        'User';

      const { error } = await supabase.from('signal_posts').insert({
        signal_id: signalId,
        author_id: session.user.id,
        post_type: postType,
        audience,
        summary: trimmed,
        attachment_path: attachmentPath,
        author_display_name: displayName,
      });

      if (error) throw error;

      resetForm();
      onPosted();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to post';
      Alert.alert('Could not post', message);
    } finally {
      setSubmitting(false);
    }
  };

  if (!expanded) {
    return (
      <TouchableOpacity style={styles.collapsedButton} onPress={() => setExpanded(true)}>
        <Send size={16} color={Colors.gold} strokeWidth={2} />
        <Text style={styles.collapsedButtonText}>Post feedback or question</Text>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>New post</Text>
        <TouchableOpacity onPress={() => setExpanded(false)} hitSlop={8}>
          <X size={20} color="#9A9A9A" />
        </TouchableOpacity>
      </View>

      <Text style={styles.label}>Type</Text>
      <View style={styles.pickerWrap}>
        <Picker
          selectedValue={postType}
          onValueChange={(v) => setPostType(v as SignalPostType)}
          style={styles.picker}
          dropdownIconColor={Colors.gold}
        >
          {typeOptions.map((opt) => (
            <Picker.Item key={opt.value} label={opt.label} value={opt.value} color="#FFFFFF" />
          ))}
        </Picker>
      </View>

      <Text style={styles.label}>Audience</Text>
      <View style={styles.pickerWrap}>
        <Picker
          selectedValue={audience}
          onValueChange={(v) => setAudience(v as SignalPostAudience)}
          style={styles.picker}
          dropdownIconColor={Colors.gold}
        >
          {SIGNAL_POST_AUDIENCE_OPTIONS.map((opt) => (
            <Picker.Item key={opt.value} label={opt.label} value={opt.value} color="#FFFFFF" />
          ))}
        </Picker>
      </View>
      <Text style={styles.hint}>
        {SIGNAL_POST_AUDIENCE_OPTIONS.find((o) => o.value === audience)?.description}
      </Text>

      <Text style={styles.label}>Summary</Text>
      <TextInput
        style={styles.input}
        value={summary}
        onChangeText={setSummary}
        placeholder="Share feedback, a question, or an update..."
        placeholderTextColor="#6A6A6A"
        multiline
        textAlignVertical="top"
      />

      <Text style={styles.label}>Attachment (optional, images only)</Text>
      {imageUri ? (
        <View style={styles.imagePreviewWrap}>
          <Image source={{ uri: imageUri }} style={styles.imagePreview} resizeMode="cover" />
          <TouchableOpacity style={styles.removeImageBtn} onPress={clearImage}>
            <X size={16} color="#FFF" />
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity style={styles.attachButton} onPress={pickImage}>
          <ImagePlus size={18} color={Colors.gold} strokeWidth={2} />
          <Text style={styles.attachButtonText}>Add image</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity
        style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
        onPress={handleSubmit}
        disabled={submitting}
      >
        {submitting ? (
          <ActivityIndicator color="#000" />
        ) : (
          <>
            <Send size={16} color="#000" strokeWidth={2.5} />
            <Text style={styles.submitButtonText}>Post</Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  collapsedButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.gold,
    borderRadius: 12,
    paddingVertical: 14,
    marginBottom: 16,
  },
  collapsedButtonText: {
    color: Colors.gold,
    fontFamily: 'Axiforma-Medium',
    fontSize: 14,
  },
  container: {
    backgroundColor: '#1E1E1E',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#3A3A3A',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    color: '#FFFFFF',
    fontFamily: 'Axiforma-Bold',
    fontSize: 16,
  },
  label: {
    color: '#A0A0A0',
    fontFamily: 'Axiforma-Regular',
    fontSize: 12,
    marginBottom: 6,
    marginTop: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  hint: {
    color: '#6A6A6A',
    fontFamily: 'Axiforma-Regular',
    fontSize: 11,
    marginTop: 4,
    marginBottom: 4,
  },
  pickerWrap: {
    backgroundColor: '#2A2A2A',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#3A3A3A',
    overflow: 'hidden',
  },
  picker: {
    color: '#FFFFFF',
  },
  input: {
    backgroundColor: '#2A2A2A',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#3A3A3A',
    color: '#FFFFFF',
    fontFamily: 'Axiforma-Regular',
    fontSize: 14,
    minHeight: 96,
    padding: 12,
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
  },
  imagePreview: {
    width: '100%',
    height: 160,
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
  submitButton: {
    marginTop: 16,
    backgroundColor: Colors.gold,
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: '#000000',
    fontFamily: 'Axiforma-Bold',
    fontSize: 15,
  },
});
