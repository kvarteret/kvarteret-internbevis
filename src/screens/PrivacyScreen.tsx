import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useLayoutEffect } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import Markdown from 'react-native-markdown-display';
import { useTranslation } from 'react-i18next';
import { colors } from '../constants/theme';
import { PRIVACY_POLICY_MARKDOWN } from '../constants/privacyPolicy';
import { RootStackParamList } from '../navigation/types';
import { useLanguage } from '../state/LanguageContext';

export function PrivacyScreen({ navigation }: NativeStackScreenProps<RootStackParamList, 'Privacy'>): React.JSX.Element {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const markdown = PRIVACY_POLICY_MARKDOWN[language];

  useLayoutEffect(() => {
    navigation.setOptions({ title: t('privacy') });
  }, [navigation, t]);

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Markdown style={markdownStyles}>{markdown}</Markdown>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 16,
    backgroundColor: colors.white,
  },
});

const markdownStyles = {
  body: {
    color: colors.primaryText,
    fontSize: 16,
    lineHeight: 24,
  },
  heading1: {
    fontSize: 28,
    lineHeight: 34,
    marginBottom: 10,
  },
  heading2: {
    fontSize: 22,
    lineHeight: 30,
    marginTop: 10,
  },
};
