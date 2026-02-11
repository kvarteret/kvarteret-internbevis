import { MaterialIcons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import { ActivityIndicator, Linking, TouchableOpacity, useWindowDimensions } from 'react-native';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BottomContainer } from '../components/home/BottomContainer';
import { MenuSheet } from '../components/home/MenuSheet';
import { UserAvatar } from '../components/home/UserAvatar';
import { UserInfoCard } from '../components/home/UserInfoCard';
import { AppText } from '../components/ui/AppText';
import { Box } from '../components/ui/Box';
import { LanguageSelectorModal } from '../components/LanguageSelectorModal';
import { colors } from '../constants/theme';
import { RootStackParamList } from '../navigation/types';
import { useUser } from '../state/UserContext';
import { NotRegisteredScreen } from './NotRegisteredScreen';

const safeAreaStyle = {
  flex: 1,
  backgroundColor: colors.background,
} as const;

const loadingContainerStyle = {
  flex: 1,
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: colors.background,
} as const;

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
      <SafeAreaView style={loadingContainerStyle}>
        <ActivityIndicator size="large" color={colors.primaryText} />
      </SafeAreaView>
    );
  }

  if (!user) {
    return <NotRegisteredScreen />;
  }

  return (
    <SafeAreaView style={safeAreaStyle}>
      <Box className="h-[72px] flex-row items-center px-4 pt-1.5">
        <Box className="w-10" />
        <AppText
          adjustsFontSizeToFit
          className="flex-1 px-2 text-center text-black"
          minimumFontScale={0.72}
          numberOfLines={1}
          variant="title"
        >
          {t('homeTitle')}
        </AppText>
        <TouchableOpacity
          accessibilityLabel="Open menu"
          className="w-10 items-end"
          onPress={() => setMenuVisible(true)}
        >
          <MaterialIcons name="menu" size={28} color={colors.primaryText} />
        </TouchableOpacity>
      </Box>

      <Box className="flex-1 pt-1.5">
        <Box className="justify-center pb-2" style={{ flex: isSmallScreen ? 30 : 35 }}>
          <UserAvatar animationTrigger={animationTrigger} imageUrl={user.bildeUrl} />
        </Box>

        <Box className="justify-center px-2" style={{ flex: 25 }}>
          <UserInfoCard
            birthDate={user.fodselsdato}
            dagensOrd={user.dagensOrd}
            firstName={user.fornavn}
            lastName={user.etternavn}
            pingvinPoengSum={user.pingvinPoengSum}
          />
        </Box>

        <Box className="justify-center pb-1" style={{ flex: isSmallScreen ? 45 : 40 }}>
          <BottomContainer
            user={user}
            onSemesterBoxTap={() => {
              setAnimationTrigger((previous) => previous + 1);
            }}
          />
        </Box>
      </Box>

      <Box className="items-center justify-center gap-0.5 px-4 pt-2 pb-[18px]">
        <Box className="flex-row items-center gap-2.5">
          <AppText className="text-black" variant="body">
            {t('homeFooterPrefix')}
          </AppText>
          <AppText className="text-black" style={{ fontSize: 24, lineHeight: 28, fontWeight: '300' }} variant="body">
            |
          </AppText>
        </Box>

        <TouchableOpacity accessibilityRole="link" onPress={handleOpenVolunteerPage}>
          <AppText className="text-black underline" variant="cta">
            {t('homeFooterVolunteer')}
          </AppText>
        </TouchableOpacity>
      </Box>

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
