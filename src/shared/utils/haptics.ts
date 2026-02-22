import * as Haptics from "expo-haptics"
import { AccessibilityInfo, Platform } from "react-native"

let reduceMotionCache = false
let lastCheckedAtMs = 0
const REDUCE_MOTION_CACHE_TTL_MS = 15_000

const shouldSkipHaptics = async (): Promise<boolean> => {
    if (Platform.OS === "web") {
        return true
    }

    const now = Date.now()
    if (now - lastCheckedAtMs > REDUCE_MOTION_CACHE_TTL_MS) {
        lastCheckedAtMs = now
        try {
            reduceMotionCache = await AccessibilityInfo.isReduceMotionEnabled()
        } catch {
            reduceMotionCache = false
        }
    }

    return reduceMotionCache
}

export const triggerSelectionHaptic = async (): Promise<void> => {
    if (await shouldSkipHaptics()) {
        return
    }

    try {
        await Haptics.selectionAsync()
    } catch {
        // Best effort only.
    }
}

export const triggerSoftImpactHaptic = async (): Promise<void> => {
    if (await shouldSkipHaptics()) {
        return
    }

    try {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    } catch {
        // Best effort only.
    }
}
