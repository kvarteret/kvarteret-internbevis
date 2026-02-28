import { Platform } from "react-native"

export const IOS_SCROLL_EDGE_VERSION = 26

export const getMajorIOSVersion = (): number | null => {
    if (Platform.OS !== "ios") return null

    if (typeof Platform.Version === "number") {
        return Number.isFinite(Platform.Version) ? Math.trunc(Platform.Version) : null
    }

    if (typeof Platform.Version === "string") {
        const [major = ""] = Platform.Version.split(".")
        const parsed = Number.parseInt(major, 10)
        return Number.isFinite(parsed) ? parsed : null
    }

    return null
}

export const getIOSCapabilities = (): {
    supportsScrollEdgeEffects: boolean
    supportsHeaderBlurFallback: boolean
    isLegacyIOS: boolean
} => {
    const major = getMajorIOSVersion()
    const isIOS = Platform.OS === "ios"
    const isLegacyIOS = isIOS && major !== null && major < IOS_SCROLL_EDGE_VERSION

    return {
        supportsScrollEdgeEffects: isIOS && major !== null && major >= IOS_SCROLL_EDGE_VERSION,
        supportsHeaderBlurFallback: isIOS && isLegacyIOS,
        isLegacyIOS,
    }
}
