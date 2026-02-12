import React from 'react';
import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { AppButton } from '../components/common/AppButton';
import { useUser } from '../state/UserContext';

export function NotRegisteredScreen(): React.JSX.Element {
  const { t } = useTranslation();
  const { logout } = useUser();

  return (
    <View className="flex-1 items-center justify-center bg-background px-4">
      <Text className="font-inter-medium text-lg text-text-primary">{t('notRegistered')}</Text>
      <View className="mt-4 w-56">
        <AppButton
          text={t('logout')}
          onPress={() => {
            void logout();
          }}
        />
      </View>
    </View>
  );
}
