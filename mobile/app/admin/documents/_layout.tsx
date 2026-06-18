import { Stack } from 'expo-router';

export default function AdminDocumentsLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="[id]" options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="preview/[id]" options={{ animation: 'slide_from_right' }} />
    </Stack>
  );
}
