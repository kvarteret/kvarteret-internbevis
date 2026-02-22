import * as Localization from "expo-localization"
import React, {
    createContext,
    PropsWithChildren,
    useContext,
    useEffect,
    useMemo,
    useState,
} from "react"
import i18n from "@/app/localization/i18n"
import { getStoredValue, setStoredValue } from "@/core/storage/asyncStorage"

export type SupportedLanguage = "no" | "en"

interface LanguageContextValue {
    language: SupportedLanguage
    isHydrating: boolean
    changeLanguage: (nextLanguage: SupportedLanguage) => Promise<void>
}

const STORAGE_KEY = "selected_language"

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined)

const getInitialLanguage = (): SupportedLanguage => {
    const locale = Localization.getLocales()[0]?.languageCode ?? "no"
    return locale === "en" ? "en" : "no"
}

export const LanguageProvider = ({ children }: PropsWithChildren): React.JSX.Element => {
    const [language, setLanguage] = useState<SupportedLanguage>(getInitialLanguage())
    const [isHydrating, setIsHydrating] = useState(true)

    useEffect(() => {
        const hydrateLanguage = async (): Promise<void> => {
            try {
                const stored = await getStoredValue(STORAGE_KEY)
                const nextLanguage: SupportedLanguage = stored === "en" ? "en" : "no"
                setLanguage(nextLanguage)
                await i18n.changeLanguage(nextLanguage)
            } finally {
                setIsHydrating(false)
            }
        }

        void hydrateLanguage()
    }, [])

    const changeLanguage = async (nextLanguage: SupportedLanguage): Promise<void> => {
        setLanguage(nextLanguage)
        await setStoredValue(STORAGE_KEY, nextLanguage)
        await i18n.changeLanguage(nextLanguage)
    }

    const value = useMemo(
        () => ({
            language,
            isHydrating,
            changeLanguage,
        }),
        [language, isHydrating],
    )

    return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

export const useLanguage = (): LanguageContextValue => {
    const context = useContext(LanguageContext)
    if (!context) {
        throw new Error("useLanguage must be used within a LanguageProvider")
    }

    return context
}
