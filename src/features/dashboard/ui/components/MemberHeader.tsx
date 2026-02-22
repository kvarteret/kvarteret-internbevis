import { MaterialIcons } from "@expo/vector-icons"
import React, { useEffect, useMemo, useRef } from "react"
import { Animated, Easing, Image, useWindowDimensions, View } from "react-native"
import { Text } from "@/shared/ui/Text"

interface MemberHeaderProps {
    imageUrl?: string
    animationTrigger: number
    firstName: string
    lastName: string
    roleGroup: string
    roleTitle: string
    wordOfTheDay: string
}

const localImageMap: Record<string, number> = {
    "assets/images/demopingvin.png": require("@assets/images/demopingvin.png"),
}

export const MemberHeader = ({
    imageUrl,
    animationTrigger,
    firstName,
    lastName,
    roleGroup,
    roleTitle,
    wordOfTheDay,
}: MemberHeaderProps): React.JSX.Element => {
    const { width } = useWindowDimensions()
    const avatarSize = useMemo(() => Math.min(92, Math.max(64, width * 0.22)), [width])
    const roleText = `${roleGroup} ${roleTitle}`.trim() || "-"
    const displayName = `${firstName} ${lastName}`.trim() || "-"

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
        <View className="w-full rounded-card px-3 py-3">
            <View className="w-full flex-row items-center">
                <View className="w-1/3 items-start justify-center pl-1">
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
                            style={{
                                width: avatarSize,
                                height: avatarSize,
                                borderRadius: avatarSize / 2,
                            }}
                        >
                            {localImageSource ? (
                                <Image
                                    className="h-full w-full"
                                    resizeMode="cover"
                                    source={localImageSource}
                                />
                            ) : null}

                            {!localImageSource && hasRemoteImage ? (
                                <Image
                                    className="h-full w-full"
                                    resizeMode="cover"
                                    source={{ uri: imageUrl }}
                                />
                            ) : null}

                            {!localImageSource && !hasRemoteImage ? (
                                <View className="h-full w-full items-center justify-center">
                                    <MaterialIcons
                                        color="#4B5563"
                                        name="person"
                                        size={avatarSize * 0.54}
                                    />
                                </View>
                            ) : null}
                        </View>
                    </Animated.View>
                </View>

                <View className="w-2/3 gap-0.5 pr-1">
                    <Text
                        className="text-xl leading-7 font-extrabold"
                        ellipsizeMode="tail"
                        numberOfLines={1}
                    >
                        {displayName}
                    </Text>
                    <Text
                        className="text-base leading-6 text-text-secondary font-medium"
                        ellipsizeMode="tail"
                        numberOfLines={1}
                    >
                        {roleText}
                    </Text>
                    <Text
                        className="text-lg leading-6 italic font-semibold"
                        ellipsizeMode="tail"
                        numberOfLines={1}
                    >
                        {wordOfTheDay}
                    </Text>
                </View>
            </View>
        </View>
    )
}
