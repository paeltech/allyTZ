import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import { PanelDocumentViewer } from '../../components/PanelDocumentViewer';

export default function DocumentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return <PanelDocumentViewer documentId={id} requirePublished />;
}
