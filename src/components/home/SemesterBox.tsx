import { MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, useWindowDimensions } from 'react-native';
import { colors, getTierBackgroundColor } from '../../constants/theme';
import { AppText } from '../ui/AppText';
import { Box } from '../ui/Box';

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
    <Pressable
      className="items-center justify-center gap-[7px] rounded-[15px] px-5 py-3.5"
      onPress={onPress}
      style={{ width: containerWidth, backgroundColor: getTierBackgroundColor(tier, isValid) }}
    >
      <Box className="flex-row items-center gap-2">
        <MaterialIcons name={getTierIconName(tier)} size={24} color={colors.white} />
        <AppText className="text-white" style={{ fontSize: 18, lineHeight: 24 }} variant="meta">
          {`Trinn ${tier}`}
        </AppText>
      </Box>

      <AppText className="text-white/80" style={{ fontSize: 16, lineHeight: 22 }} variant="body">
        {status}
      </AppText>

      <AppText className="text-white" style={{ fontSize: 20, lineHeight: 26 }} variant="subtitle">
        {semester}
      </AppText>
    </Pressable>
  );
}
