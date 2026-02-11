import * as Linking from 'expo-linking';
import { useFonts } from 'expo-font';
import React, { useEffect } from 'react';
import { ActivityIndicator, LogBox, Platform, StyleSheet, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  Inter_800ExtraBold,
} from '@expo-google-fonts/inter';
import './global.css';
import './src/localization/i18n';
import { colors } from './src/constants/theme';
import { RootStackParamList } from './src/navigation/types';
import { HomeScreen } from './src/screens/HomeScreen';
import { GamesScreen } from './src/screens/GamesScreen';
import { KvarteretSkjermScreen } from './src/screens/KvarteretSkjermScreen';
import { LoginScreen } from './src/screens/LoginScreen';
import { PrivacyScreen } from './src/screens/PrivacyScreen';
import { extractAccessTokenFromUrl } from './src/services/deepLinkService';
import { setPendingDeepLinkToken } from './src/services/pendingDeepLinkToken';
import { LanguageProvider, useLanguage } from './src/state/LanguageContext';
import { UserProvider, useUser } from './src/state/UserContext';

const Stack = createNativeStackNavigator<RootStackParamList>();

LogBox.ignoreLogs([
  "SafeAreaView has been deprecated and will be removed in a future release. Please use 'react-native-safe-area-context' instead.",
]);

function RootNavigator(): React.JSX.Element {
  const { user, isHydrating: userHydrating } = useUser();
  const { isHydrating: languageHydrating } = useLanguage();

  const [webFontsLoaded, webFontsError] = useFonts(
    Platform.OS === 'web'
      ? {
          Inter_400Regular,
          Inter_500Medium,
          Inter_600SemiBold,
          Inter_700Bold,
          Inter_800ExtraBold,
        }
      : {},
  );

  const fontsReady = Platform.OS !== 'web' || webFontsLoaded || Boolean(webFontsError);

  useEffect(() => {
    let mounted = true;

    const handleUrl = async (url: string): Promise<void> => {
      const accessToken = extractAccessTokenFromUrl(url);
      if (mounted && accessToken) {
        setPendingDeepLinkToken(accessToken);
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

  if (userHydrating || languageHydrating || !fontsReady) {
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
        <Stack.Screen
          name="KvarteretSkjerm"
          component={KvarteretSkjermScreen}
          options={{
            headerBackTitle: '',
            headerTintColor: colors.primaryText,
          }}
        />
        <Stack.Screen
          name="Games"
          component={GamesScreen}
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
