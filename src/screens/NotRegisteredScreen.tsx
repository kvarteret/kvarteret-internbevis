import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors } from '../constants/theme';
import { useUser } from '../state/UserContext';
import { AppButton } from '../components/common/AppButton';

export function NotRegisteredScreen(): React.JSX.Element {
  const { t } = useTranslation();
  const { logout } = useUser();

  return (
    <View style={styles.container}>
      <Text style={styles.message}>{t('notRegistered')}</Text>
      <View style={styles.buttonContainer}>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    backgroundColor: colors.background,
  },
  message: {
    color: colors.primaryText,
    fontSize: 18,
  },
  buttonContainer: {
    marginTop: 16,
    width: 220,
  },
});
