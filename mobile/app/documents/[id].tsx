import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { Colors } from '../../../shared/constants/colors';
import { ChevronLeft, Bell } from 'lucide-react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { supabase } from '../../lib/supabase';
import type { PanelDocument } from '../../../shared/types/document';
import {
  getPanelDocumentViewHeaders,
  getPanelDocumentViewUrl,
  isImageMimeType,
} from '../../../shared/utils/document-view';
import { useUnreadNotificationsCount } from '../../hooks/use-unread-notifications';

export default function DocumentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [document, setDocument] = useState<PanelDocument | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [imageDataUri, setImageDataUri] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { unreadCount } = useUnreadNotificationsCount();

  useEffect(() => {
    if (id) {
      loadDocument();
    }
  }, [id]);

  const loadDocument = async () => {
    try {
      setIsLoading(true);
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) {
        router.replace('/auth/login');
        return;
      }
      setAccessToken(token);

      const { data, error } = await supabase
        .from('panel_documents')
        .select('*')
        .eq('id', id)
        .eq('published', true)
        .single();

      if (error || !data) {
        Alert.alert('Error', 'Document not found');
        router.back();
        return;
      }

      const doc = data as PanelDocument;
      setDocument(doc);

      if (isImageMimeType(doc.mime_type)) {
        const response = await fetch(getPanelDocumentViewUrl(doc.id), {
          headers: getPanelDocumentViewHeaders(token),
        });
        if (response.ok) {
          const blob = await response.blob();
          const reader = new FileReader();
          reader.onloadend = () => {
            setImageDataUri(reader.result as string);
          };
          reader.readAsDataURL(blob);
        }
      }
    } catch (error) {
      console.error('Error loading document:', error);
      Alert.alert('Error', 'Failed to load document');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.gold} />
        </View>
      </SafeAreaView>
    );
  }

  if (!document || !accessToken) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <Text style={styles.errorText}>Document not available</Text>
        </View>
      </SafeAreaView>
    );
  }

  const viewUrl = getPanelDocumentViewUrl(document.id);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ChevronLeft size={24} color={Colors.gold} strokeWidth={2} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{document.title}</Text>
        <TouchableOpacity style={styles.bellWrap} onPress={() => router.push('/notifications')}>
          <Bell size={22} color={Colors.gold} strokeWidth={2} />
          {unreadCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {document.description ? (
        <Text style={styles.description}>{document.description}</Text>
      ) : null}

      <View style={styles.viewerContainer}>
        {isImageMimeType(document.mime_type) && imageDataUri ? (
          <WebView
            originWhitelist={['*']}
            source={{
              html: `<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width, initial-scale=1"><style>body{margin:0;background:#000;display:flex;align-items:center;justify-content:center;min-height:100vh;}img{max-width:100%;max-height:100vh;object-fit:contain;user-select:none;-webkit-user-select:none;}</style></head><body><img src="${imageDataUri}" /></body></html>`,
            }}
            style={styles.webview}
            scrollEnabled
            showsVerticalScrollIndicator={false}
          />
        ) : (
          <WebView
            source={{
              uri: viewUrl,
              headers: getPanelDocumentViewHeaders(accessToken),
            }}
            style={styles.webview}
            originWhitelist={['*']}
            scrollEnabled
            showsVerticalScrollIndicator={false}
            {...(Platform.OS === 'ios'
              ? {
                  allowsInlineMediaPlayback: true,
                  dataDetectorTypes: 'none' as const,
                }
              : {})}
          />
        )}
      </View>

      <Text style={styles.viewOnlyNote}>View only — downloads are disabled</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000000' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  backButton: { padding: 4 },
  headerTitle: { color: '#FFFFFF', fontSize: 16, fontWeight: '700', flex: 1, textAlign: 'center' },
  bellWrap: { padding: 4, position: 'relative' },
  badge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: Colors.gold,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { color: '#1A1A1A', fontSize: 9, fontWeight: '700' },
  description: {
    color: '#A0A0A0',
    fontSize: 13,
    paddingHorizontal: 16,
    paddingBottom: 8,
    lineHeight: 18,
  },
  viewerContainer: {
    flex: 1,
    marginHorizontal: 12,
    marginBottom: 8,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#3A3A3A',
  },
  webview: { flex: 1, backgroundColor: '#0D0D0D' },
  viewOnlyNote: {
    color: '#666666',
    fontSize: 11,
    textAlign: 'center',
    paddingBottom: 12,
  },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  errorText: { color: '#A0A0A0', fontSize: 15 },
});
