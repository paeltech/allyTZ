import React, { useEffect, useMemo, useState } from 'react';
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
import { ImagePlus, X, Send } from 'lucide-react-native';
import { Colors } from '../../../shared/constants/colors';
import type { SignalPostAudience, SignalPostType } from '../../../shared/types/signal';
import type { UserWithRole } from '../../lib/admin';
import {
  ADMIN_SIGNAL_POST_AUDIENCE_OPTIONS,
  SIGNAL_POST_BUCKET,
  SIGNAL_POST_MAX_IMAGE_BYTES,
  SIGNAL_POST_TYPE_OPTIONS,
  buildSignalPostAttachmentPath,
  getSignalPostTypeLabel,
} from '../../../shared/utils/signal-posts';
import { extensionFromMime, uploadImageToBucket } from '../../lib/upload-storage-image';
import { supabase } from '../../lib/supabase';
import { formatSupabaseError } from '../../lib/supabase-error';

export type ReplyTarget = {
  parentPostId: string;
  parentPostType: SignalPostType;
  replyToAuthorId: string;
  replyToAuthorName: string;
  mode: 'all_users' | 'specific_user';
};

type Props = {
  signalId: string;
  traders: UserWithRole[];
  replyTarget?: ReplyTarget | null;
  onClearReply?: () => void;
  onPosted: () => void;
};

export function AdminSignalPostForm({
  signalId,
  traders,
  replyTarget,
  onClearReply,
  onPosted,
}: Props) {
  const [postType, setPostType] = useState<SignalPostType>('update');
  const [audience, setAudience] = useState<SignalPostAudience>('all_users');
  const [recipientUserId, setRecipientUserId] = useState('');
  const [summary, setSummary] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [imageMime, setImageMime] = useState('image/jpeg');
  const [submitting, setSubmitting] = useState(false);
  const [expanded, setExpanded] = useState(Boolean(replyTarget));

  const isReply = Boolean(replyTarget);
  const effectivePostType = isReply ? replyTarget!.parentPostType : postType;
  const effectiveAudience: SignalPostAudience = isReply ? replyTarget!.mode : audience;
  const parentPostId = replyTarget?.parentPostId ?? null;

  useEffect(() => {
    if (replyTarget) {
      setExpanded(true);
      setAudience(replyTarget.mode);
      if (replyTarget.mode === 'specific_user') {
        setRecipientUserId(replyTarget.replyToAuthorId);
      }
    }
  }, [replyTarget]);

  const traderOptions = useMemo(
    () => traders.filter((t) => t.role === 'user'),
    [traders]
  );

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Allow photo library access to attach an image.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.85 });
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

  const handleSubmit = async () => {
    const trimmed = summary.trim();
    if (!trimmed) {
      Alert.alert('Message required', 'Please enter a message.');
      return;
    }
    const recipient =
      effectiveAudience === 'specific_user'
        ? recipientUserId || replyTarget?.replyToAuthorId || null
        : null;
    if (effectiveAudience === 'specific_user' && !recipient) {
      Alert.alert('Select user', 'Choose a user for this targeted post.');
      return;
    }

    setSubmitting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        Alert.alert('Sign in required', 'Please sign in.');
        return;
      }

      let attachmentPath: string | null = null;
      if (imageUri) {
        const ext = extensionFromMime(imageMime);
        attachmentPath = buildSignalPostAttachmentPath(session.user.id, signalId, ext);
        await uploadImageToBucket(SIGNAL_POST_BUCKET, attachmentPath, imageUri, imageMime);
      }

      const displayName =
        session.user.user_metadata?.full_name?.trim() ||
        session.user.email?.split('@')[0] ||
        'Admin';

      const payload: Record<string, unknown> = {
        signal_id: signalId,
        author_id: session.user.id,
        post_type: effectivePostType,
        audience: effectiveAudience,
        summary: trimmed,
        attachment_path: attachmentPath,
        author_display_name: displayName,
        parent_post_id: parentPostId,
        recipient_user_id: recipient,
      };

      const { error } = await supabase.from('signal_posts').insert(payload);
      if (error) throw error;

      setSummary('');
      setImageUri(null);
      setAudience('all_users');
      setRecipientUserId('');
      setExpanded(false);
      onClearReply?.();
      onPosted();
    } catch (err: unknown) {
      Alert.alert('Could not post', formatSupabaseError(err));
    } finally {
      setSubmitting(false);
    }
  };

  if (!expanded && !replyTarget) {
    return (
      <TouchableOpacity style={styles.collapsedButton} onPress={() => setExpanded(true)}>
        <Send size={16} color={Colors.gold} strokeWidth={2} />
        <Text style={styles.collapsedButtonText}>Post update or feedback</Text>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.container}>
      {replyTarget ? (
        <View style={styles.replyBanner}>
          <Text style={styles.replyBannerText}>
            Replying as {getSignalPostTypeLabel(replyTarget.parentPostType)} to {replyTarget.replyToAuthorName}
            {' '}({replyTarget.mode === 'all_users' ? 'all users' : 'author only'})
          </Text>
          {onClearReply ? (
            <TouchableOpacity onPress={onClearReply}>
              <X size={18} color={Colors.rainyGrey} />
            </TouchableOpacity>
          ) : null}
        </View>
      ) : null}

      {!isReply ? (
        <>
          <Text style={styles.label}>Type</Text>
          <View style={styles.pickerWrap}>
            <Picker selectedValue={postType} onValueChange={(v) => setPostType(v as SignalPostType)} style={styles.picker} dropdownIconColor={Colors.gold}>
              {SIGNAL_POST_TYPE_OPTIONS.map((opt) => (
                <Picker.Item key={opt.value} label={opt.label} value={opt.value} color="#FFFFFF" />
              ))}
            </Picker>
          </View>

          <Text style={styles.label}>Audience</Text>
          <View style={styles.pickerWrap}>
            <Picker
              selectedValue={audience}
              onValueChange={(v) => {
                setAudience(v as SignalPostAudience);
                if (v !== 'specific_user') setRecipientUserId('');
              }}
              style={styles.picker}
              dropdownIconColor={Colors.gold}
            >
              {ADMIN_SIGNAL_POST_AUDIENCE_OPTIONS.map((opt) => (
                <Picker.Item key={opt.value} label={opt.label} value={opt.value} color="#FFFFFF" />
              ))}
            </Picker>
          </View>
          <Text style={styles.hint}>
            {ADMIN_SIGNAL_POST_AUDIENCE_OPTIONS.find((o) => o.value === audience)?.description}
          </Text>

          {audience === 'specific_user' ? (
            <>
              <Text style={styles.label}>Recipient</Text>
              <View style={styles.pickerWrap}>
                <Picker selectedValue={recipientUserId} onValueChange={setRecipientUserId} style={styles.picker} dropdownIconColor={Colors.gold}>
                  <Picker.Item label="Select user..." value="" color="#FFFFFF" />
                  {traderOptions.map((u) => (
                    <Picker.Item key={u.user_id} label={u.full_name?.trim() || u.email || u.user_id.slice(0, 8)} value={u.user_id} color="#FFFFFF" />
                  ))}
                </Picker>
              </View>
            </>
          ) : null}
        </>
      ) : null}

      <Text style={styles.label}>Message</Text>
      <TextInput
        style={styles.input}
        value={summary}
        onChangeText={setSummary}
        placeholder="Share an update, feedback, or reply..."
        placeholderTextColor="#6A6A6A"
        multiline
        textAlignVertical="top"
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
          <Text style={styles.attachButtonText}>Add image</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity style={[styles.submitButton, submitting && styles.submitButtonDisabled]} onPress={handleSubmit} disabled={submitting}>
        {submitting ? <ActivityIndicator color="#000" /> : (
          <>
            <Send size={16} color="#000" strokeWidth={2.5} />
            <Text style={styles.submitButtonText}>Publish</Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  collapsedButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1, borderColor: Colors.gold, borderRadius: 12, paddingVertical: 14, marginBottom: 16 },
  collapsedButtonText: { color: Colors.gold, fontFamily: 'Axiforma-Medium', fontSize: 14 },
  container: { backgroundColor: '#1E1E1E', borderRadius: 16, padding: 16, marginBottom: 20, borderWidth: 1, borderColor: '#3A3A3A' },
  replyBanner: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'rgba(244,196,100,0.1)', borderRadius: 8, padding: 10, marginBottom: 12 },
  replyBannerText: { color: Colors.gold, fontFamily: 'Axiforma-Medium', fontSize: 12, flex: 1 },
  label: { color: '#A0A0A0', fontSize: 12, fontFamily: 'Axiforma-Regular', marginBottom: 6, marginTop: 8, textTransform: 'uppercase', letterSpacing: 0.6 },
  hint: { color: '#6A6A6A', fontSize: 11, fontFamily: 'Axiforma-Regular', marginTop: 4, marginBottom: 4 },
  pickerWrap: { backgroundColor: '#2A2A2A', borderRadius: 10, borderWidth: 1, borderColor: '#3A3A3A', overflow: 'hidden' },
  picker: { color: '#FFFFFF' },
  input: { backgroundColor: '#2A2A2A', borderRadius: 10, borderWidth: 1, borderColor: '#3A3A3A', color: '#FFFFFF', fontFamily: 'Axiforma-Regular', fontSize: 14, minHeight: 96, padding: 12 },
  attachButton: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderColor: '#3A3A3A', borderRadius: 10, padding: 12, borderStyle: 'dashed', marginTop: 10 },
  attachButtonText: { color: Colors.gold, fontFamily: 'Axiforma-Regular', fontSize: 14 },
  imagePreviewWrap: { position: 'relative', borderRadius: 10, overflow: 'hidden', marginTop: 10 },
  imagePreview: { width: '100%', height: 160, backgroundColor: '#2A2A2A' },
  removeImageBtn: { position: 'absolute', top: 8, right: 8, backgroundColor: 'rgba(0,0,0,0.65)', borderRadius: 14, width: 28, height: 28, alignItems: 'center', justifyContent: 'center' },
  submitButton: { marginTop: 16, backgroundColor: Colors.gold, borderRadius: 12, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  submitButtonDisabled: { opacity: 0.7 },
  submitButtonText: { color: '#000000', fontFamily: 'Axiforma-Bold', fontSize: 15 },
});
