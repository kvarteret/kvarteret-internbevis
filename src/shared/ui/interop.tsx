import { BlurTargetView as ExpoBlurTargetView } from "expo-blur"
import { GlassView as ExpoGlassView } from "expo-glass-effect"
import React from "react"
import {
    SafeAreaListener,
    SafeAreaProvider,
    SafeAreaView as RNSafeAreaView,
    useSafeAreaFrame,
    useSafeAreaInsets,
} from "react-native-safe-area-context"
import { withUniwind } from "uniwind"

// Exception-only: prefer automatic insets on the first scroll view/list for routed screens.
export const SafeAreaView = withUniwind(RNSafeAreaView)
export const GlassView = withUniwind(ExpoGlassView)
export const BlurTargetView = withUniwind(ExpoBlurTargetView)

export { SafeAreaListener, SafeAreaProvider, useSafeAreaFrame, useSafeAreaInsets }
