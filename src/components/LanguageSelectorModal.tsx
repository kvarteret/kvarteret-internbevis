import { MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors } from '../constants/theme';
import { SupportedLanguage, useLanguage } from '../state/LanguageContext';

interface LanguageSelectorModalProps {
  visible: boolean;
  onClose: () => void;
}

interface LanguageOption {
  code: SupportedLanguage;
  label: string;
  abbreviation: string;
}

export function LanguageSelectorModal({ visible, onClose }: LanguageSelectorModalProps): React.JSX.Element {
  const { t } = useTranslation();
  const { language, changeLanguage } = useLanguage();

  const options: LanguageOption[] = [
    { code: 'no', label: t('norwegian'), abbreviation: 'NO' },
    { code: 'en', label: t('english'), abbreviation: 'EN' },
  ];

  const handleSelect = async (nextLanguage: SupportedLanguage): Promise<void> => {
    await changeLanguage(nextLanguage);
    onClose();
  };

  return (
    <Modal animationType="fade" transparent visible={visible} onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={styles.card}>
          <Text style={styles.title}>{t('language')}</Text>
          {options.map((option) => {
            const selected = option.code === language;
            return (
              <Pressable
                key={option.code}
                style={[styles.row, selected ? styles.rowSelected : null]}
                onPress={() => {
                  void handleSelect(option.code);
                }}
              >
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{option.abbreviation}</Text>
                </View>
                <Text style={[styles.label, selected ? styles.labelSelected : null]}>{option.label}</Text>
                <View style={styles.spacer} />
                {selected ? <MaterialIcons name="check" size={20} color={colors.gray700} /> : null}
              </Pressable>
            );
          })}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
  },
  card: {
    width: '85%',
    backgroundColor: colors.white,
    borderRadius: 16,
    overflow: 'hidden',
  },
  title: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontWeight: '700',
    fontSize: 20,
    textAlign: 'center',
    color: colors.primaryText,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.gray300,
  },
  row: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.gray300,
  },
  rowSelected: {
    backgroundColor: colors.gray100,
  },
  badge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.gray200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: colors.gray700,
    fontWeight: '700',
  },
  label: {
    marginLeft: 16,
    color: colors.primaryText,
    fontSize: 16,
    fontWeight: '400',
  },
  labelSelected: {
    fontWeight: '700',
  },
  spacer: {
    flex: 1,
  },
});
