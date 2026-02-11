import { MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { colors, getTierBackgroundColor } from '../../constants/theme';

interface SemesterBoxProps {
  status: string;
  semester: string;
  isValid: boolean;
  tier: number;
  onPress: () => void;
}

function getTierIconName(tier: number): keyof typeof MaterialIcons.glyphMap {
  switch (tier) {
    case 1:
      return 'school';
    case 2:
      return 'groups';
    case 3:
      return 'home';
    case 4:
      return 'business';
    default:
      return 'person';
  }
}

export function SemesterBox({ status, semester, isValid, tier, onPress }: SemesterBoxProps): React.JSX.Element {
  const { width } = useWindowDimensions();
  const containerWidth = width < 600 ? width * 0.9 : width * 0.7;

  return (
    <Pressable onPress={onPress} style={[styles.container, { width: containerWidth, backgroundColor: getTierBackgroundColor(tier, isValid) }]}>
      <View style={styles.row}>
        <MaterialIcons name={getTierIconName(tier)} size={24} color={colors.white} />
        <Text style={styles.tierText}>{`Trinn ${tier}`}</Text>
      </View>
      <Text style={styles.statusText}>{status}</Text>
      <Text style={styles.semesterText}>{semester}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 15,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tierText: {
    color: colors.white,
    fontSize: 18,
    fontWeight: '700',
  },
  statusText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 16,
    fontWeight: '500',
  },
  semesterText: {
    color: colors.white,
    fontSize: 20,
    fontWeight: '700',
  },
});
