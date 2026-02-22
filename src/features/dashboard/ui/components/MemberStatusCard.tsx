import { MaterialIcons } from "@expo/vector-icons"
import { format } from "date-fns"
import React, { useEffect, useRef, useState } from "react"
import { Animated, Image, Pressable, View } from "react-native"
import { useTranslation } from "react-i18next"
import { getHighestTier, getHighestTierGroup, getHighestTierName, User } from "@/shared/types/user"
import { Text } from "@/shared/ui/Text"

interface MemberStatusCardProps {
    user: User
    onBadgePress: () => void
}

export const MemberStatusCard = ({ user, onBadgePress }: MemberStatusCardProps): React.JSX.Element => {
    const { t } = useTranslation()
    const [tapCount, setTapCount] = useState(0)
    const [showPenguin, setShowPenguin] = useState(false)
    const opacityAnim = useRef(new Animated.Value(0)).current

    const active = user.aktiveVerv.length > 0

    useEffect(() => {
        Animated.timing(opacityAnim, {
            toValue: showPenguin ? 1 : 0,
            duration: 300,
            useNativeDriver: true,
        }).start()
    }, [opacityAnim, showPenguin])

    const handleTap = (): void => {
        onBadgePress()
        setTapCount(previous => {
            const next = previous + 1
            if (next >= 10) {
                setShowPenguin(true)
            }
            return next
        })
    }

    const resetPenguin = (): void => {
        setTapCount(0)
        setShowPenguin(false)
    }

    const tier = getHighestTier(user)
    const tierClass = !active
        ? "bg-state-danger"
        : tier === 1
          ? "bg-[#16A34A]"
          : tier === 2
            ? "bg-[#C2410C]"
            : tier === 3
              ? "bg-[#0F766E]"
              : tier === 4
                ? "bg-[#1D4ED8]"
                : "bg-[#334155]"

    return (
        <View className="w-full items-center justify-center gap-3.5">
            <View className="items-center gap-0.5 px-4">
                <Text className="text-center text-2xl leading-7 font-extrabold">{getHighestTierGroup(user)}</Text>
                <Text className="text-center text-xl leading-6 text-text-secondary font-medium">{getHighestTierName(user)}</Text>
            </View>

            <Pressable
                className={[
                    "w-[90%] items-center justify-center gap-1.5 rounded-2xl border border-[#FFFFFF33] px-5 py-3.5",
                    tierClass,
                ].join(" ")}
                onPress={handleTap}
            >
                <View className="flex-row items-center gap-2">
                    <MaterialIcons
                        color="#FFFFFF"
                        name={tier === 1 ? "school" : tier === 2 ? "groups" : tier === 3 ? "home" : tier === 4 ? "business" : "person"}
                        size={24}
                    />
                    <Text className="text-lg leading-6 text-surface font-bold">{t("tierLabel", { tier })}</Text>
                </View>

                <Text className="text-base leading-6 text-[#FFFFFFCC] font-medium">{t("status")}</Text>
                <Text className="text-xl leading-7 text-surface font-extrabold">
                    {active ? t("validProof") : t("invalidProof")}
                </Text>
            </Pressable>

            <Text className="text-center text-base leading-6 font-bold">
                {active ? t("validUntil", { date: format(user.gyldigTil, "d.M.yyyy") }) : ""}
            </Text>

            {showPenguin ? (
                <Animated.View className="mt-1 items-center justify-center" style={{ opacity: opacityAnim }}>
                    <Pressable onPress={resetPenguin}>
                        <Image
                            className="h-24 w-24"
                            source={require("../../../../../assets/images/penguin-eg.png")}
                        />
                    </Pressable>
                </Animated.View>
            ) : null}
        </View>
    )
}
