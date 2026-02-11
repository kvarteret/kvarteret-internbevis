import { MaterialIcons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import { ActivityIndicator, Linking, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BottomContainer } from '../components/home/BottomContainer';
import { MenuSheet } from '../components/home/MenuSheet';
import { UserAvatar } from '../components/home/UserAvatar';
import { UserInfoCard } from '../components/home/UserInfoCard';
import { LanguageSelectorModal } from '../components/LanguageSelectorModal';
import { colors } from '../constants/theme';
import { RootStackParamList } from '../navigation/types';
import { useUser } from '../state/UserContext';
import { NotRegisteredScreen } from './NotRegisteredScreen';

export function HomeScreen({ navigation }: NativeStackScreenProps<RootStackParamList, 'Home'>): React.JSX.Element {
  const { t } = useTranslation();
  const { user, isLoading, logout } = useUser();
  const { height } = useWindowDimensions();
  const [menuVisible, setMenuVisible] = useState(false);
  const [languageSelectorVisible, setLanguageSelectorVisible] = useState(false);
  const [animationTrigger, setAnimationTrigger] = useState(0);

  const isSmallScreen = height < 600;
  const handleOpenVolunteerPage = (): void => {
    void Linking.openURL('https://blifrivillig.no');
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primaryText} />
      </SafeAreaView>
    );
  }

  if (!user) {
    return <NotRegisteredScreen />;
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text
          adjustsFontSizeToFit
          minimumFontScale={0.72}
          numberOfLines={1}
          style={styles.headerTitle}
        >
          {t('homeTitle')}
        </Text>
        <TouchableOpacity
          accessibilityLabel="Open menu"
          style={styles.headerMenuButton}
          onPress={() => setMenuVisible(true)}
        >
          <MaterialIcons name="menu" size={28} color={colors.primaryText} />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <View style={[styles.avatarSection, { flex: isSmallScreen ? 30 : 35 }]}>
          <UserAvatar animationTrigger={animationTrigger} imageUrl={user.bildeUrl} />
        </View>
        <View style={[styles.infoSection, { flex: 25 }]}>
          <UserInfoCard
            birthDate={user.fodselsdato}
            dagensOrd={user.dagensOrd}
            firstName={user.fornavn}
            lastName={user.etternavn}
            pingvinPoengSum={user.pingvinPoengSum}
          />
        </View>
        <View style={[styles.bottomSection, { flex: isSmallScreen ? 45 : 40 }]}>
          <BottomContainer
            user={user}
            onSemesterBoxTap={() => {
              setAnimationTrigger((previous) => previous + 1);
            }}
          />
        </View>
      </View>

      <View style={styles.footer}>
        <View style={styles.footerTopRow}>
          <Text style={styles.footerText}>{t('homeFooterPrefix')}</Text>
          <Text style={styles.footerSeparator}>|</Text>
        </View>
        <TouchableOpacity accessibilityRole="link" onPress={handleOpenVolunteerPage}>
          <Text style={styles.footerLink}>{t('homeFooterVolunteer')}</Text>
        </TouchableOpacity>
      </View>

      <MenuSheet
        visible={menuVisible}
        onClose={() => setMenuVisible(false)}
        onOpenLanguage={() => setLanguageSelectorVisible(true)}
        onOpenGames={() => navigation.navigate('Games')}
        onOpenKvarteretSkjerm={() => navigation.navigate('KvarteretSkjerm')}
        onOpenPrivacy={() => navigation.navigate('Privacy')}
        onLogout={() => {
          void logout();
        }}
      />
      <LanguageSelectorModal visible={languageSelectorVisible} onClose={() => setLanguageSelectorVisible(false)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    height: 68,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 6,
  },
  headerTitle: {
    fontSize: 38,
    fontWeight: '800',
    lineHeight: 42,
    letterSpacing: 0.3,
    color: colors.primaryText,
    maxWidth: '78%',
    textAlign: 'center',
  },
  headerMenuButton: {
    position: 'absolute',
    right: 16,
    top: 20,
  },
  content: {
    flex: 1,
    paddingTop: 6,
  },
  avatarSection: {
    justifyContent: 'center',
    paddingBottom: 8,
  },
  infoSection: {
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  bottomSection: {
    justifyContent: 'center',
    paddingBottom: 4,
  },
  footer: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 18,
  },
  footerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  footerText: {
    color: colors.primaryText,
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  footerSeparator: {
    color: colors.primaryText,
    fontSize: 24,
    fontWeight: '300',
    lineHeight: 28,
  },
  footerLink: {
    color: colors.primaryText,
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '800',
    letterSpacing: 0.2,
    textDecorationLine: 'underline',
  },
});
