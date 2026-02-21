import { Linking } from "react-native"

function normalizeUrl(rawUrl: string): string {
    const trimmed = rawUrl.trim()
    if (trimmed.length === 0) {
        return ""
    }

    try {
        return new URL(trimmed).toString()
    } catch {
        return trimmed
    }
}

export async function tryOpenExternalUrl(rawUrl: string | null | undefined): Promise<boolean> {
    if (!rawUrl) {
        return false
    }

    const normalizedUrl = normalizeUrl(rawUrl)
    if (!normalizedUrl) {
        return false
    }

    try {
        const canOpen = await Linking.canOpenURL(normalizedUrl)
        if (!canOpen) {
            return false
        }

        await Linking.openURL(normalizedUrl)
        return true
    } catch {
        return false
    }
}
