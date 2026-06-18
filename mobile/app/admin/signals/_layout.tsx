import { Stack } from 'expo-router';

export default function AdminSignalsLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="[id]" options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="preview/[id]" options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="discussion/[signalId]" options={{ animation: 'slide_from_right' }} />
    </Stack>
  );
}
