import React from "react"
import { Image, View, ViewStyle } from "react-native"
import { Text } from "@/shared/ui/Text"

const BRUTAL_HERO_STYLE: ViewStyle = {
    boxShadow: "8px 8px 0px #111827",
}

interface LoginHeroProps {
    isCompactWidth: boolean
}

export const LoginHero = ({ isCompactWidth }: LoginHeroProps): React.JSX.Element => (
    <View
        className="w-full max-w-xl overflow-hidden border-2 border-editorial-ink bg-brand-primary"
        style={[
            BRUTAL_HERO_STYLE,
            {
                paddingHorizontal: isCompactWidth ? 18 : 20,
                paddingVertical: isCompactWidth ? 18 : 20,
            },
        ]}
    >
        <View className={isCompactWidth ? "gap-3" : "gap-2.5"}>
            <Text
                className={`font-black uppercase text-editorial-ink ${isCompactWidth ? "text-lg leading-6" : "text-xl"}`}
            >
                Det er os en Glæde at byde Dem velkommen til
            </Text>
            <View className={`flex-row items-center ${isCompactWidth ? "gap-3" : "gap-4"}`}>
                <View
                    className="shrink-0 items-center justify-center"
                    style={{
                        width: isCompactWidth ? 86 : 112,
                    }}
                >
                    <Image
                        accessible={false}
                        resizeMode="contain"
                        source={require("@assets/images/nobg.png")}
                        style={{
                            height: isCompactWidth ? 86 : 112,
                            width: isCompactWidth ? 86 : 112,
                        }}
                    />
                </View>
                <View className="flex-1 justify-center gap-0.5">
                    <Text
                        className={`font-black uppercase tracking-wider text-editorial-ink ${isCompactWidth ? "text-xl leading-6" : "text-2xl leading-none"}`}
                    >
                        DET
                    </Text>
                    <Text
                        className={`font-black uppercase tracking-wider text-editorial-ink ${isCompactWidth ? "text-xl leading-6" : "text-2xl leading-none"}`}
                    >
                        AKADEMISKE
                    </Text>
                    <Text
                        className={`font-black uppercase tracking-wider text-editorial-ink ${isCompactWidth ? "text-xl leading-6" : "text-2xl leading-none"}`}
                    >
                        KVARTER
                    </Text>
                </View>
            </View>
        </View>
    </View>
)
