import { MaterialIcons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import { Image, KeyboardAvoidingView, Platform, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LoginBox } from '../components/login/LoginBox';
import { VerifyCodeBox } from '../components/login/VerifyCodeBox';
import { LanguageSelectorModal } from '../components/LanguageSelectorModal';
import { RootStackParamList } from '../navigation/types';
import { clearDeepLinkToken } from '../services/authService';
import { useUser } from '../state/UserContext';
import { createDemoUser } from '../types/user';

export function LoginScreen({ navigation }: NativeStackScreenProps<RootStackParamList, 'Login'>): React.JSX.Element {
  const [sentOtp, setSentOtp] = useState(false);
  const [email, setEmail] = useState('');
  const [languageSelectorVisible, setLanguageSelectorVisible] = useState(false);
  const { setUser, loginWithToken } = useUser();

  const handleTokenLogin = async (nextEmail: string, accessToken: string): Promise<boolean> => {
    const success = await loginWithToken(nextEmail, accessToken);
    if (success) {
      await clearDeepLinkToken();
    }
    return success;
  };

  return (
    <SafeAreaView style={styles.container}>
      <Image source={require('../../assets/images/bg-image.png')} style={styles.backgroundImage} resizeMode="cover" />

      <TouchableOpacity
        accessibilityLabel="Change language"
        style={styles.languageButton}
        onPress={() => setLanguageSelectorVisible(true)}
      >
        <MaterialIcons name="language" size={28} color="#FFFFFF" />
      </TouchableOpacity>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 12 : 0}
        style={styles.centerContainer}
      >
        <View style={styles.contentContainer}>
          {!sentOtp ? (
            <LoginBox
              onDemoLogin={() => {
                setUser(createDemoUser());
              }}
              onOtpRequested={(nextEmail) => {
                setSentOtp(true);
                setEmail(nextEmail);
              }}
              onPrivacyPress={() => navigation.navigate('Privacy')}
              onLoginWithToken={handleTokenLogin}
            />
          ) : (
            <VerifyCodeBox
              email={email}
              onBack={() => {
                setSentOtp(false);
              }}
              onLoginWithToken={(accessToken) => handleTokenLogin(email, accessToken)}
            />
          )}
        </View>
      </KeyboardAvoidingView>

      <LanguageSelectorModal visible={languageSelectorVisible} onClose={() => setLanguageSelectorVisible(false)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  backgroundImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  languageButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 52 : 24,
    right: 12,
    zIndex: 2,
    padding: 8,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  contentContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
