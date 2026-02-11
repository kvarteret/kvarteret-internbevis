import React from 'react';
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors } from '../../constants/theme';
import { formatDate } from '../../utils/date';

interface UserInfoCardProps {
  firstName: string;
  lastName: string;
  birthDate: Date | null;
  pingvinPoengSum: number;
  dagensOrd: string;
}

function normalizeWordOfTheDay(value: string): string {
  return value
    .replace(/^dagens ord:\s*/i, '')
    .replace(/^word of the day:\s*/i, '')
    .trim();
}

export function UserInfoCard({
  firstName,
  lastName,
  birthDate,
  pingvinPoengSum,
  dagensOrd,
}: UserInfoCardProps): React.JSX.Element {
  const { t } = useTranslation();
  const { height } = useWindowDimensions();
  const isSmallScreen = height < 600;
  const wordOfTheDayValue = normalizeWordOfTheDay(dagensOrd);
  const birthDateText = birthDate ? formatDate(birthDate) : '-';

  return (
    <View style={styles.container}>
      <Text style={[styles.name, { fontSize: isSmallScreen ? 20 : 24 }]}>{`${firstName} ${lastName}`}</Text>
      <Text style={[styles.birthDate, { fontSize: isSmallScreen ? 18 : 20 }]}>{birthDateText}</Text>
      <Text style={[styles.points, { marginTop: isSmallScreen ? 6 : 10, fontSize: isSmallScreen ? 16 : 18 }]}>
        {`${t('pingvinPoints')}: ${pingvinPoengSum}`}
      </Text>
      <Text style={[styles.wordOfDay, { marginTop: isSmallScreen ? 6 : 10, fontSize: isSmallScreen ? 18 : 20 }]}>
        {`${t('wordOfTheDay')}: ${wordOfTheDayValue}`}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    maxWidth: 420,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  name: {
    textAlign: 'center',
    color: colors.primaryText,
    fontWeight: '800',
    lineHeight: 30,
    letterSpacing: 0.3,
  },
  birthDate: {
    textAlign: 'center',
    color: 'rgba(0, 0, 0, 0.7)',
    lineHeight: 24,
    fontWeight: '500',
  },
  points: {
    textAlign: 'center',
    color: colors.primaryText,
    fontWeight: '800',
    lineHeight: 24,
    letterSpacing: 0.2,
  },
  wordOfDay: {
    textAlign: 'center',
    color: colors.primaryText,
    fontStyle: 'italic',
    lineHeight: 27,
    letterSpacing: 0.1,
  },
});
