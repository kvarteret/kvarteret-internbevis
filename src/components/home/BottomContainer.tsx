import React, { useEffect, useRef, useState } from 'react';
import { Animated, Pressable } from 'react-native';
import { useTranslation } from 'react-i18next';
import { getHighestTier, getHighestTierGroup, getHighestTierName, User } from '../../types/user';
import { formatDate } from '../../utils/date';
import { SemesterBox } from './SemesterBox';
import { AppText } from '../ui/AppText';
import { Box } from '../ui/Box';

interface BottomContainerProps {
  user: User;
  onSemesterBoxTap: () => void;
}

export function BottomContainer({ user, onSemesterBoxTap }: BottomContainerProps): React.JSX.Element {
  const { t } = useTranslation();
  const [tapCount, setTapCount] = useState(0);
  const [showPenguin, setShowPenguin] = useState(false);
  const opacityAnim = useRef(new Animated.Value(0)).current;

  const active = user.aktiveVerv.length > 0;

  useEffect(() => {
    Animated.timing(opacityAnim, {
      toValue: showPenguin ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [opacityAnim, showPenguin]);

  const handleTap = (): void => {
    onSemesterBoxTap();
    setTapCount((previous) => {
      const next = previous + 1;
      if (next >= 10) {
        setShowPenguin(true);
      }
      return next;
    });
  };

  const resetPenguin = (): void => {
    setTapCount(0);
    setShowPenguin(false);
  };

  return (
    <Box className="w-full items-center justify-center gap-3.5">
      <Box className="items-center gap-0.5 px-4">
        <AppText className="text-center text-black" style={{ fontSize: 22, lineHeight: 28 }} variant="subtitle">
          {getHighestTierGroup(user)}
        </AppText>
        <AppText className="text-center text-gray-600" style={{ fontSize: 20, lineHeight: 26 }} variant="body">
          {getHighestTierName(user)}
        </AppText>
      </Box>

      <SemesterBox
        status={t('status')}
        semester={active ? t('validProof') : t('invalidProof')}
        isValid={active}
        tier={getHighestTier(user)}
        onPress={handleTap}
      />

      <AppText className="text-center text-black" variant="meta">
        {active ? t('validUntil', { date: formatDate(user.gyldigTil) }) : ''}
      </AppText>

      {showPenguin ? (
        <Animated.View style={{ opacity: opacityAnim, marginTop: 4, alignItems: 'center', justifyContent: 'center' }}>
          <Pressable onPress={resetPenguin}>
            <Animated.Image source={require('../../../assets/images/penguin-eg.png')} style={{ width: 100, height: 100 }} />
          </Pressable>
        </Animated.View>
      ) : null}
    </Box>
  );
}
