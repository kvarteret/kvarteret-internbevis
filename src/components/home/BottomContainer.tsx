import React, { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors } from '../../constants/theme';
import { getHighestTier, getHighestTierGroup, getHighestTierName, User } from '../../types/user';
import { formatDate } from '../../utils/date';
import { SemesterBox } from './SemesterBox';

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
    <View style={styles.container}>
      <View style={styles.orgInfoContainer}>
        <Text style={styles.group}>{getHighestTierGroup(user)}</Text>
        <Text style={styles.role}>{getHighestTierName(user)}</Text>
      </View>

      <SemesterBox
        status={t('status')}
        semester={active ? t('validProof') : t('invalidProof')}
        isValid={active}
        tier={getHighestTier(user)}
        onPress={handleTap}
      />

      <Text style={styles.validText}>{active ? t('validUntil', { date: formatDate(user.gyldigTil) }) : ''}</Text>

      <Animated.View style={[styles.penguinContainer, { opacity: opacityAnim }]}> 
        <Pressable onPress={resetPenguin}>
          <Animated.Image source={require('../../../assets/images/penguin-eg.png')} style={styles.penguin} />
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'space-evenly',
    gap: 12,
  },
  orgInfoContainer: {
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  group: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.primaryText,
    textAlign: 'center',
  },
  role: {
    fontSize: 20,
    color: 'rgba(0, 0, 0, 0.7)',
    textAlign: 'center',
  },
  validText: {
    color: colors.primaryText,
    fontSize: 16,
  },
  penguinContainer: {
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  penguin: {
    width: 100,
    height: 100,
  },
});
