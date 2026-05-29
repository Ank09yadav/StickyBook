import { Redirect } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { Colors } from '../constants/theme';

export default function Index() {
  const { isLoading, isAuthenticated, hasSeenOnboarding, isRegistered } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.background }}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (!hasSeenOnboarding) return <Redirect href="/onboarding" />;
  if (!isRegistered) return <Redirect href="/(auth)/sign-up" />;
  if (!isAuthenticated) return <Redirect href="/(auth)/sign-in" />;
  return <Redirect href="/(app)/(tabs)/home" />;
}
