import { MaterialIcons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';
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
  const { user, isLoading, logout } = useUser();
  const { height } = useWindowDimensions();
  const [menuVisible, setMenuVisible] = useState(false);
  const [languageSelectorVisible, setLanguageSelectorVisible] = useState(false);
  const [animationTrigger, setAnimationTrigger] = useState(0);

  const isSmallScreen = height < 600;

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
        <Text style={styles.headerTitle}>Kvarteret</Text>
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

      <MenuSheet
        visible={menuVisible}
        onClose={() => setMenuVisible(false)}
        onOpenLanguage={() => setLanguageSelectorVisible(true)}
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
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  headerTitle: {
    fontSize: 25,
    fontWeight: '600',
    color: colors.primaryText,
  },
  headerMenuButton: {
    position: 'absolute',
    right: 16,
    top: 14,
  },
  content: {
    flex: 1,
  },
  avatarSection: {
    justifyContent: 'center',
  },
  infoSection: {
    justifyContent: 'center',
  },
  bottomSection: {
    justifyContent: 'center',
    paddingBottom: 10,
  },
});
