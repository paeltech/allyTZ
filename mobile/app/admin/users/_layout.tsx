import { Stack } from 'expo-router';

export default function AdminUsersLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="[userId]" options={{ animation: 'slide_from_right' }} />
    </Stack>
  );
}
