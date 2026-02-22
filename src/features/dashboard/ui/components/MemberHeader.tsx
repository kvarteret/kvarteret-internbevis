import { MaterialIcons } from "@expo/vector-icons"
import React, { useEffect, useMemo, useRef } from "react"
import { Animated, Easing, Image, useWindowDimensions, View } from "react-native"
import { Text } from "@/shared/ui/Text"

interface MemberHeaderProps {
    imageUrl?: string
    animationTrigger: number
    firstName: string
    lastName: string
    birthDateText: string
    points: number
    wordOfTheDay: string
}

const localImageMap: Record<string, number> = {
    "assets/images/demopingvin.png": require("../../../../../assets/images/demopingvin.png"),
}

export const MemberHeader = ({
    imageUrl,
    animationTrigger,
    firstName,
    lastName,
    birthDateText,
    points,
    wordOfTheDay,
}: MemberHeaderProps): React.JSX.Element => {
    const { height } = useWindowDimensions()
    const radius = useMemo(() => height * 0.1, [height])

    const scaleAnim = useRef(new Animated.Value(1)).current
    const rotationAnim = useRef(new Animated.Value(0)).current

    useEffect(() => {
        if (animationTrigger === 0) {
            return
        }

        Animated.parallel([
            Animated.sequence([
                Animated.timing(scaleAnim, {
                    toValue: 1.3,
                    duration: 500,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
                Animated.timing(scaleAnim, {
                    toValue: 0.9,
                    duration: 500,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
                Animated.timing(scaleAnim, {
                    toValue: 1,
                    duration: 500,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
            ]),
            Animated.sequence([
                Animated.timing(rotationAnim, {
                    toValue: 0.2,
                    duration: 250,
                    useNativeDriver: true,
                }),
                Animated.timing(rotationAnim, {
                    toValue: -0.2,
                    duration: 500,
                    useNativeDriver: true,
                }),
                Animated.timing(rotationAnim, {
                    toValue: 0.2,
                    duration: 500,
                    useNativeDriver: true,
                }),
                Animated.timing(rotationAnim, {
                    toValue: 0,
                    duration: 250,
                    useNativeDriver: true,
                }),
            ]),
        ]).start()
    }, [animationTrigger, rotationAnim, scaleAnim])

    const localImageSource = imageUrl ? localImageMap[imageUrl] : undefined
    const hasRemoteImage = Boolean(imageUrl && !localImageSource)

    return (
        <View className="w-full items-center">
            <Animated.View
                style={{
                    transform: [
                        { scale: scaleAnim },
                        {
                            rotate: rotationAnim.interpolate({
                                inputRange: [-1, 1],
                                outputRange: ["-1rad", "1rad"],
                            }),
                        },
                    ],
                }}
            >
                <View
                    className="overflow-hidden bg-surface-muted"
                    style={{ width: radius * 2, height: radius * 2, borderRadius: radius }}
                >
                    {localImageSource ? (
                        <Image className="h-full w-full" resizeMode="cover" source={localImageSource} />
                    ) : null}

                    {!localImageSource && hasRemoteImage ? (
                        <Image className="h-full w-full" resizeMode="cover" source={{ uri: imageUrl }} />
                    ) : null}

                    {!localImageSource && !hasRemoteImage ? (
                        <View className="h-full w-full items-center justify-center">
                            <MaterialIcons color="#4B5563" name="person" size={radius} />
                        </View>
                    ) : null}
                </View>
            </Animated.View>

            <View className="w-full max-w-md items-center rounded-card px-5 py-4">
                <Text className="text-center text-2xl leading-8 font-extrabold">{`${firstName} ${lastName}`}</Text>
                <Text className="text-center text-xl leading-6 text-text-secondary font-medium">{birthDateText}</Text>
                <Text className="mt-1.5 text-center text-lg font-bold">{`Pingvin Poeng: ${points}`}</Text>
                <Text className="mt-1.5 text-center text-xl italic font-semibold">{wordOfTheDay}</Text>
            </View>
        </View>
    )
}
