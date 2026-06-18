import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Colors } from '../../../../../shared/constants/colors';
import { PanelDocumentViewer } from '../../../../components/PanelDocumentViewer';

export default function AdminDocumentViewScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <PanelDocumentViewer
      documentId={id}
      requirePublished={false}
      headerRight={
        <TouchableOpacity onPress={() => router.push(`/admin/documents/${id}`)}>
          <Text style={styles.editLink}>Edit</Text>
        </TouchableOpacity>
      }
    />
  );
}

const styles = StyleSheet.create({
  editLink: {
    color: Colors.gold,
    fontFamily: 'Axiforma-Bold',
    fontSize: 14,
  },
});
