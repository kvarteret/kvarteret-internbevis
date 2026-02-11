import React from 'react';
import { useWindowDimensions } from 'react-native';
import { useTranslation } from 'react-i18next';
import { AppText } from '../ui/AppText';
import { Box } from '../ui/Box';
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
    <Box className="w-full max-w-[420px] items-center px-5">
      <AppText
        className="text-center text-black"
        style={{
          fontSize: isSmallScreen ? 20 : 24,
          lineHeight: isSmallScreen ? 26 : 30,
        }}
        variant="subtitle"
      >
        {`${firstName} ${lastName}`}
      </AppText>

      <AppText
        className="text-center text-gray-600"
        style={{
          fontSize: isSmallScreen ? 18 : 20,
          lineHeight: isSmallScreen ? 22 : 24,
        }}
        variant="body"
      >
        {birthDateText}
      </AppText>

      <AppText
        className="mt-1.5 text-center text-black"
        style={{ fontSize: isSmallScreen ? 16 : 18 }}
        variant="meta"
      >
        {`${t('pingvinPoints')}: ${pingvinPoengSum}`}
      </AppText>

      <AppText
        className="mt-1.5 text-center text-black italic"
        style={{ fontSize: isSmallScreen ? 18 : 20 }}
        variant="emphasis"
      >
        {`${t('wordOfTheDay')}: ${wordOfTheDayValue}`}
      </AppText>
    </Box>
  );
}
