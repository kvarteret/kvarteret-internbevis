import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Localization from 'expo-localization';
import React, { createContext, PropsWithChildren, useContext, useEffect, useMemo, useState } from 'react';
import i18n from '../localization/i18n';

export type SupportedLanguage = 'no' | 'en';

interface LanguageContextValue {
  language: SupportedLanguage;
  isHydrating: boolean;
  changeLanguage: (nextLanguage: SupportedLanguage) => Promise<void>;
}

const STORAGE_KEY = 'selected_language';

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

function getInitialLanguage(): SupportedLanguage {
  const locale = Localization.getLocales()[0]?.languageCode ?? 'no';
  return locale === 'en' ? 'en' : 'no';
}

export function LanguageProvider({ children }: PropsWithChildren): React.JSX.Element {
  const [language, setLanguage] = useState<SupportedLanguage>(getInitialLanguage());
  const [isHydrating, setIsHydrating] = useState(true);

  useEffect(() => {
    async function hydrateLanguage(): Promise<void> {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        const nextLanguage: SupportedLanguage = stored === 'en' ? 'en' : 'no';
        setLanguage(nextLanguage);
        await i18n.changeLanguage(nextLanguage);
      } finally {
        setIsHydrating(false);
      }
    }

    void hydrateLanguage();
  }, []);

  const changeLanguage = async (nextLanguage: SupportedLanguage): Promise<void> => {
    setLanguage(nextLanguage);
    await AsyncStorage.setItem(STORAGE_KEY, nextLanguage);
    await i18n.changeLanguage(nextLanguage);
  };

  const value = useMemo(
    () => ({
      language,
      isHydrating,
      changeLanguage,
    }),
    [language, isHydrating],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage(): LanguageContextValue {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }

  return context;
}
