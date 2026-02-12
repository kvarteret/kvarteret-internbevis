import { MaterialIcons } from "@expo/vector-icons"
import { NativeStackScreenProps } from "@react-navigation/native-stack"
import React, { useCallback, useState } from "react"
import { useTranslation } from "react-i18next"
import {
    ActivityIndicator,
    Linking,
    Text,
    TouchableOpacity,
    useWindowDimensions,
    View,
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { BottomContainer } from "../components/home/BottomContainer"
import { MenuSheet } from "../components/home/MenuSheet"
import { UserAvatar } from "../components/home/UserAvatar"
import { UserInfoCard } from "../components/home/UserInfoCard"
import { LanguageSelectorModal } from "../components/LanguageSelectorModal"
import { colors } from "../constants/theme"
import { RootStackParamList } from "../navigation/types"
import { useUser } from "../state/UserContext"
import { NotRegisteredScreen } from "./NotRegisteredScreen"

export function HomeScreen({
    navigation,
}: NativeStackScreenProps<RootStackParamList, "Home">): React.JSX.Element {
    const { t } = useTranslation()
    const { user, isLoading, logout } = useUser()
    const { height } = useWindowDimensions()
    const [menuVisible, setMenuVisible] = useState(false)
    const [languageSelectorVisible, setLanguageSelectorVisible] = useState(false)
    const [animationTrigger, setAnimationTrigger] = useState(0)

    const isSmallScreen = height < 600

    const handleOpenVolunteerPage = useCallback((): void => {
        void Linking.openURL("https://blifrivillig.no")
    }, [])

    const handleOpenMenu = useCallback((): void => {
        setMenuVisible(true)
    }, [])

    const handleCloseMenu = useCallback((): void => {
        setMenuVisible(false)
    }, [])

    const handleOpenLanguage = useCallback((): void => {
        setLanguageSelectorVisible(true)
    }, [])

    const handleCloseLanguage = useCallback((): void => {
        setLanguageSelectorVisible(false)
    }, [])

    const handleOpenGames = useCallback((): void => {
        navigation.navigate("Games")
    }, [navigation])

    const handleOpenKvarteretSkjerm = useCallback((): void => {
        navigation.navigate("KvarteretSkjerm")
    }, [navigation])

    const handleOpenPrivacy = useCallback((): void => {
        navigation.navigate("Privacy")
    }, [navigation])

    const handleLogout = useCallback((): void => {
        void logout()
    }, [logout])

    const handleSemesterBoxTap = useCallback((): void => {
        setAnimationTrigger(previous => previous + 1)
    }, [])

    if (isLoading) {
        return (
            <SafeAreaView className="flex-1 items-center justify-center bg-background">
                <ActivityIndicator color={colors.primaryText} size="large" />
            </SafeAreaView>
        )
    }

    if (!user) {
        return <NotRegisteredScreen />
    }

    return (
        <SafeAreaView className="flex-1 bg-background">
            <View className="h-18 flex-row items-center px-4 pt-1.5">
                <View className="w-10" />

                <Text
                    adjustsFontSizeToFit
                    className="flex-1 px-2 text-center font-inter-extrabold text-4xl leading-10 tracking-[0.3px] text-text-primary"
                    minimumFontScale={0.72}
                    numberOfLines={1}
                >
                    {t("homeTitle")}
                </Text>

                <TouchableOpacity
                    accessibilityLabel={t("openMenu")}
                    className="w-10 items-end"
                    onPress={handleOpenMenu}
                >
                    <MaterialIcons color={colors.primaryText} name="menu" size={28} />
                </TouchableOpacity>
            </View>

            <View className="flex-1 pt-1.5">
                <View
                    className={
                        isSmallScreen
                            ? "flex-[30] justify-center pb-2"
                            : "flex-[35] justify-center pb-2"
                    }
                >
                    <UserAvatar animationTrigger={animationTrigger} imageUrl={user.bildeUrl} />
                </View>

                <View className="flex-[25] justify-center px-2">
                    <UserInfoCard
                        birthDate={user.fodselsdato}
                        dagensOrd={user.dagensOrd}
                        firstName={user.fornavn}
                        lastName={user.etternavn}
                        pingvinPoengSum={user.pingvinPoengSum}
                    />
                </View>

                <View
                    className={
                        isSmallScreen
                            ? "flex-[45] justify-center pb-1"
                            : "flex-[40] justify-center pb-1"
                    }
                >
                    <BottomContainer user={user} onSemesterBoxTap={handleSemesterBoxTap} />
                </View>
            </View>

            <View className="w-full items-center justify-center pb-4 pt-2">
                <View className="w-full flex-row flex-nowrap items-center justify-center px-1">
                    <Text
                        adjustsFontSizeToFit
                        className="shrink font-inter-medium text-lg leading-6 text-text-primary"
                        ellipsizeMode="tail"
                        minimumFontScale={0.72}
                        numberOfLines={1}
                    >
                        {t("homeFooterPrefix")}
                    </Text>
                    <Text
                        className="px-1.5 font-inter text-2xl leading-8 text-text-primary"
                        numberOfLines={1}
                    >
                        |
                    </Text>
                    <TouchableOpacity
                        accessibilityRole="link"
                        className="shrink"
                        onPress={handleOpenVolunteerPage}
                    >
                        <Text
                            adjustsFontSizeToFit
                            className="font-inter-extrabold text-lg leading-6 text-text-primary underline"
                            ellipsizeMode="tail"
                            minimumFontScale={0.72}
                            numberOfLines={1}
                        >
                            {t("homeFooterVolunteer")}
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>

            <MenuSheet
                visible={menuVisible}
                onClose={handleCloseMenu}
                onOpenLanguage={handleOpenLanguage}
                onOpenGames={handleOpenGames}
                onOpenKvarteretSkjerm={handleOpenKvarteretSkjerm}
                onOpenPrivacy={handleOpenPrivacy}
                onLogout={handleLogout}
            />

            <LanguageSelectorModal
                visible={languageSelectorVisible}
                onClose={handleCloseLanguage}
            />
        </SafeAreaView>
    )
}
