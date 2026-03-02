import { BlurTargetView } from "@/shared/ui/interop"
import React, { createContext, PropsWithChildren, useContext, useRef } from "react"
import { Platform, UIManager, View } from "react-native"

type BlurTargetRef = React.RefObject<View | null>

const BlurTargetContext = createContext<BlurTargetRef | null>(null)
const hasBlurTargetView =
    Platform.OS !== "android" || Boolean(UIManager.getViewManagerConfig?.("ExpoBlurTargetView"))

export const BlurTargetProvider = ({ children }: PropsWithChildren): React.JSX.Element => {
    const blurTargetRef = useRef<View | null>(null)

    if (!hasBlurTargetView) {
        return (
            <BlurTargetContext.Provider value={null}>
                <View className="flex-1">{children}</View>
            </BlurTargetContext.Provider>
        )
    }

    return (
        <BlurTargetContext.Provider value={blurTargetRef}>
            <BlurTargetView ref={blurTargetRef} className="flex-1">
                {children}
            </BlurTargetView>
        </BlurTargetContext.Provider>
    )
}

export const useBlurTargetRef = (): BlurTargetRef | null => useContext(BlurTargetContext)
