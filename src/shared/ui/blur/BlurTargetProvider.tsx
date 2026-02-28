import { BlurTargetView } from "expo-blur"
import React, { createContext, PropsWithChildren, useContext, useRef } from "react"
import { View } from "react-native"

type BlurTargetRef = React.RefObject<View | null>

const BlurTargetContext = createContext<BlurTargetRef | null>(null)

export const BlurTargetProvider = ({ children }: PropsWithChildren): React.JSX.Element => {
    const blurTargetRef = useRef<View | null>(null)

    return (
        <BlurTargetContext.Provider value={blurTargetRef}>
            <BlurTargetView ref={blurTargetRef} className="flex-1">
                {children}
            </BlurTargetView>
        </BlurTargetContext.Provider>
    )
}

export const useBlurTargetRef = (): BlurTargetRef | null => useContext(BlurTargetContext)
