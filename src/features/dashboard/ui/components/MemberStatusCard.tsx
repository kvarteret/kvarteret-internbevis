import React, { useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { Animated, Image, Pressable, View } from "react-native"
import { getHighestTier, User } from "@/shared/types/user"
import { Text } from "@/shared/ui/Text"

interface MemberStatusCardProps {
    user: User
    onBadgePress: () => void
}

export const MemberStatusCard = ({
    user,
    onBadgePress,
}: MemberStatusCardProps): React.JSX.Element => {
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
    let tierClass: string
    if (!active) {
        tierClass = "bg-state-danger"
    } else {
        switch (tier) {
            case 1:
                tierClass = "bg-[#16A34A]"
                break
            case 2:
                tierClass = "bg-[#C2410C]"
                break
            case 3:
                tierClass = "bg-[#0F766E]"
                break
            case 4:
                tierClass = "bg-[#1D4ED8]"
                break
            default:
                tierClass = "bg-[#334155]"
        }
    }

    return (
        <View className="w-full gap-2.5">
            <Pressable
                className={[
                    "w-full flex-row items-center justify-between rounded-2xl border border-[#FFFFFF33] px-5 py-3.5",
                    tierClass,
                ].join(" ")}
                onPress={handleTap}
            >
                <Text className="text-lg leading-6 text-surface font-bold">
                    {t("tierLabel", { tier })}
                </Text>
                <Text className="text-lg leading-6 text-surface font-bold">
                    {active ? t("validProof") : t("invalidProof")}
                </Text>
            </Pressable>

            {showPenguin ? (
                <Animated.View
                    className="mt-1 items-center justify-center"
                    style={{ opacity: opacityAnim }}
                >
                    <Pressable onPress={resetPenguin}>
                        <Image
                            className="h-24 w-24"
                            source={require("@assets/images/penguin-eg.png")}
                        />
                    </Pressable>
                </Animated.View>
            ) : null}
        </View>
    )
}
