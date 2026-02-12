import * as Haptics from "expo-haptics"
import { AccessibilityInfo, Platform } from "react-native"

export type HapticFeedback = "none" | "selection" | "impactLight"

let reduceMotionCache = false
let lastCheckedAtMs = 0
const REDUCE_MOTION_CACHE_TTL_MS = 15_000

async function shouldSkipHaptics(): Promise<boolean> {
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

export async function runHapticFeedback(mode: HapticFeedback): Promise<void> {
    if (mode === "none" || (await shouldSkipHaptics())) {
        return
    }

    try {
        if (mode === "selection") {
            await Haptics.selectionAsync()
            return
        }

        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    } catch {
        // Ignore hardware/runtime failures; tactile feedback is optional.
    }
}
