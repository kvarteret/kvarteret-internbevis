import * as Linking from 'expo-linking';
import React, { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import './src/localization/i18n';
import { colors } from './src/constants/theme';
import { RootStackParamList } from './src/navigation/types';
import { HomeScreen } from './src/screens/HomeScreen';
import { LoginScreen } from './src/screens/LoginScreen';
import { PrivacyScreen } from './src/screens/PrivacyScreen';
import { extractAccessTokenFromUrl } from './src/services/deepLinkService';
import { saveDeepLinkToken } from './src/services/authService';
import { LanguageProvider, useLanguage } from './src/state/LanguageContext';
import { UserProvider, useUser } from './src/state/UserContext';

const Stack = createNativeStackNavigator<RootStackParamList>();

function RootNavigator(): React.JSX.Element {
  const { user, isHydrating: userHydrating } = useUser();
  const { isHydrating: languageHydrating } = useLanguage();

  useEffect(() => {
    let mounted = true;

    const handleUrl = async (url: string): Promise<void> => {
      const accessToken = extractAccessTokenFromUrl(url);
      if (mounted && accessToken) {
        await saveDeepLinkToken(accessToken);
      }
    };

    void Linking.getInitialURL().then((url: string | null) => {
      if (url) {
        void handleUrl(url);
      }
    });

    const subscription = Linking.addEventListener('url', (event: { url: string }) => {
      void handleUrl(event.url);
    });

    return () => {
      mounted = false;
      subscription.remove();
    };
  }, []);

  if (userHydrating || languageHydrating) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={colors.primaryText} size="large" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator>
        {user ? (
          <Stack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
        ) : (
          <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
        )}
        <Stack.Screen
          name="Privacy"
          component={PrivacyScreen}
          options={{
            headerBackTitle: '',
            headerTintColor: colors.primaryText,
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App(): React.JSX.Element {
  return (
    <LanguageProvider>
      <UserProvider>
        <RootNavigator />
      </UserProvider>
    </LanguageProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
});
