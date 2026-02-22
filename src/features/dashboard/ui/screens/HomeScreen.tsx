import { MaterialIcons } from "@expo/vector-icons"
import { NativeStackScreenProps } from "@react-navigation/native-stack"
import React from "react"
import { useTranslation } from "react-i18next"
import {
    ActivityIndicator,
    Image,
    ScrollView,
    TouchableOpacity,
    View,
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { RootStackParamList } from "@/app/navigation/types"
import { LanguageSelectorModal } from "@/shared/ui/LanguageSelectorModal"
import { Button } from "@/shared/ui/Button"
import { Text } from "@/shared/ui/Text"
import { EventCarousel } from "@/features/dashboard/ui/components/EventCarousel"
import { MemberHeader } from "@/features/dashboard/ui/components/MemberHeader"
import { MemberStatusCard } from "@/features/dashboard/ui/components/MemberStatusCard"
import { MenuSheet } from "@/features/dashboard/ui/components/MenuSheet"
import { useHomeScreenVM } from "@/features/dashboard/vm/useHomeScreenVM"
import { format } from "date-fns"

export const HomeScreen = ({
    navigation,
}: NativeStackScreenProps<RootStackParamList, "Home">): React.JSX.Element => {
    const { t } = useTranslation()
    const { state, actions } = useHomeScreenVM()

    if (state.isLoading) {
        return (
            <SafeAreaView className="flex-1 items-center justify-center bg-background">
                <ActivityIndicator color="#000000" size="large" />
            </SafeAreaView>
        )
    }

    if (!state.user) {
        return (
            <SafeAreaView className="flex-1 items-center justify-center bg-background px-4">
                <Text className="text-lg font-medium">{t("notRegistered")}</Text>
                <View className="mt-4 w-56">
                    <Button onPress={() => void actions.logout()}>
                        <Text className="text-base leading-5 text-surface font-semibold">
                            {t("logout")}
                        </Text>
                    </Button>
                </View>
            </SafeAreaView>
        )
    }

    return (
        <SafeAreaView className="flex-1 bg-background">
            <View className="h-18 flex-row items-center px-4 pt-1.5">
                <View className="w-10" />

                <View className="flex-1 items-center px-2">
                    <Image
                        accessibilityLabel={t("homeTitle")}
                        resizeMode="contain"
                        source={require("../../../../../assets/images/studentersamfunnet-logo.png")}
                        style={{ width: state.headerLogoWidth, height: 34 }}
                    />
                </View>

                <TouchableOpacity
                    accessibilityLabel={t("openMenu")}
                    className="w-10 items-end"
                    onPress={actions.openMenu}
                >
                    <MaterialIcons color="#000000" name="menu" size={28} />
                </TouchableOpacity>
            </View>

            <ScrollView className="flex-1" contentContainerClassName="px-2 pb-4 pt-1.5">
                <View className={state.isSmallScreen ? "pb-2" : "pb-4"}>
                    <View className="items-center pb-2">
                        <MemberHeader
                            animationTrigger={state.animationTrigger}
                            imageUrl={state.user.bildeUrl}
                            firstName={state.user.fornavn}
                            lastName={state.user.etternavn}
                            birthDateText={
                                state.user.fodselsdato ? format(state.user.fodselsdato, "d.M.yyyy") : "-"
                            }
                            points={state.user.pingvinPoengSum}
                            wordOfTheDay={state.user.dagensOrd.trim() || "-"}
                        />
                    </View>

                    <View className="justify-center pb-2 pt-3">
                        <MemberStatusCard
                            user={state.user}
                            onBadgePress={actions.triggerAvatarAnimation}
                        />
                    </View>
                </View>

                <View className="px-2 pb-4">
                    <EventCarousel
                        events={state.events}
                        isPending={state.eventsPending}
                        isError={state.eventsError}
                        onRetry={actions.retryEvents}
                        onEventPress={eventId => navigation.navigate("EventDetails", { eventId })}
                    />
                </View>

                <View className="w-full items-center justify-center pb-4 pt-2">
                    <View className="w-full flex-row flex-nowrap items-center justify-center px-1">
                        <Text
                            adjustsFontSizeToFit
                            className="shrink text-lg leading-6 font-medium"
                            ellipsizeMode="tail"
                            minimumFontScale={0.72}
                            numberOfLines={1}
                        >
                            {t("homeFooterPrefix")}
                        </Text>
                        <Text className="px-1.5 text-2xl leading-8" numberOfLines={1}>
                            |
                        </Text>
                        <TouchableOpacity
                            accessibilityRole="link"
                            className="shrink"
                            onPress={() => void actions.openVolunteerPage()}
                        >
                            <Text
                                adjustsFontSizeToFit
                                className="text-lg leading-6 underline font-extrabold"
                                ellipsizeMode="tail"
                                minimumFontScale={0.72}
                                numberOfLines={1}
                            >
                                {t("homeFooterVolunteer")}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>

            <MenuSheet
                visible={state.menuVisible}
                onClose={actions.closeMenu}
                onOpenLanguage={actions.openLanguage}
                onOpenGames={() => navigation.navigate("Games")}
                onOpenKvarteretSkjerm={() => navigation.navigate("KvarteretSkjerm")}
                onOpenPrivacy={() => navigation.navigate("Privacy")}
                onLogout={() => {
                    void actions.logout()
                }}
            />

            <LanguageSelectorModal
                visible={state.languageSelectorVisible}
                onClose={actions.closeLanguage}
            />
        </SafeAreaView>
    )
}
