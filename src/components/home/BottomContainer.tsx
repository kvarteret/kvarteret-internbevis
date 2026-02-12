import React, { useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { Animated, Image, Pressable, View } from "react-native"
import { Text } from "@/components/ui/text"
import { getHighestTier, getHighestTierGroup, getHighestTierName, User } from "../../types/user"
import { formatDate } from "../../utils/date"
import { SemesterBox } from "./SemesterBox"

interface BottomContainerProps {
    user: User
    onSemesterBoxTap: () => void
}

export function BottomContainer({
    user,
    onSemesterBoxTap,
}: BottomContainerProps): React.JSX.Element {
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
        onSemesterBoxTap()
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

    return (
        <View className="w-full items-center justify-center gap-3.5">
            <View className="items-center gap-0.5 px-4">
                <Text className="text-center font-inter-extrabold text-2xl leading-7 text-foreground">
                    {getHighestTierGroup(user)}
                </Text>
                <Text className="text-center font-inter-medium text-xl leading-6 text-muted-foreground">
                    {getHighestTierName(user)}
                </Text>
            </View>

            <SemesterBox
                isValid={active}
                onPress={handleTap}
                semester={active ? t("validProof") : t("invalidProof")}
                status={t("status")}
                tier={getHighestTier(user)}
            />

            <Text className="text-center font-inter-bold text-base leading-6 text-foreground">
                {active ? t("validUntil", { date: formatDate(user.gyldigTil) }) : ""}
            </Text>

            {showPenguin ? (
                <Animated.View
                    className="mt-1 items-center justify-center"
                    style={{
                        opacity: opacityAnim,
                    }}
                >
                    <Pressable onPress={resetPenguin}>
                        <Image
                            className="h-24 w-24"
                            source={require("../../../assets/images/penguin-eg.png")}
                        />
                    </Pressable>
                </Animated.View>
            ) : null}
        </View>
    )
}
