import { MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors } from '../../constants/theme';

interface MenuSheetProps {
  visible: boolean;
  onClose: () => void;
  onOpenPrivacy: () => void;
  onOpenGames: () => void;
  onOpenKvarteretSkjerm: () => void;
  onOpenLanguage: () => void;
  onLogout: () => void;
}

interface Action {
  key: 'privacy' | 'games' | 'kvarteretSkjerm' | 'language' | 'logout';
  label: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  destructive?: boolean;
  onPress: () => void;
}

export function MenuSheet({
  visible,
  onClose,
  onOpenPrivacy,
  onOpenGames,
  onOpenKvarteretSkjerm,
  onOpenLanguage,
  onLogout,
}: MenuSheetProps): React.JSX.Element {
  const { t } = useTranslation();

  const actions: Action[] = [
    {
      key: 'privacy',
      label: t('privacy'),
      icon: 'privacy-tip',
      onPress: onOpenPrivacy,
    },
    {
      key: 'language',
      label: t('language'),
      icon: 'language',
      onPress: onOpenLanguage,
    },
    {
      key: 'games',
      label: t('games'),
      icon: 'sports-esports',
      onPress: onOpenGames,
    },
    {
      key: 'kvarteretSkjerm',
      label: t('kvarteretSkjerm'),
      icon: 'tv',
      onPress: onOpenKvarteretSkjerm,
    },
    {
      key: 'logout',
      label: t('logout'),
      icon: 'logout',
      destructive: true,
      onPress: onLogout,
    },
  ];

  const handlePress = (action: Action): void => {
    onClose();
    action.onPress();
  };

  return (
    <Modal animationType="fade" transparent visible={visible} onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={styles.sheet}>
          {actions.map((action) => (
            <Pressable key={action.key} style={styles.row} onPress={() => handlePress(action)}>
              <MaterialIcons
                name={action.icon}
                size={20}
                color={action.destructive ? '#DC2626' : colors.primaryText}
              />
              <Text style={[styles.label, action.destructive ? styles.destructiveLabel : null]}>{action.label}</Text>
            </Pressable>
          ))}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  sheet: {
    backgroundColor: colors.white,
    paddingBottom: 20,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.gray300,
  },
  label: {
    color: colors.primaryText,
    fontSize: 16,
  },
  destructiveLabel: {
    color: '#DC2626',
  },
});
