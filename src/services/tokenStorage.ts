import AsyncStorage from "@react-native-async-storage/async-storage"
import * as SecureStore from "expo-secure-store"
import { Platform } from "react-native"

const CLEANUP_MARKER_KEY = "__secure_storage_cleanup_v1"

export const TOKEN_STORAGE_KEYS = {
    email: "email",
    accessToken: "accessToken",
    deepLinkToken: "deep_link_token",
} as const

const LEGACY_KEYS = [
    TOKEN_STORAGE_KEYS.email,
    TOKEN_STORAGE_KEYS.accessToken,
    TOKEN_STORAGE_KEYS.deepLinkToken,
]

function shouldUseSecureStore(): boolean {
    return Platform.OS === "ios" || Platform.OS === "android"
}

export async function cleanupLegacyInsecureTokenStorage(): Promise<void> {
    if (!shouldUseSecureStore()) {
        return
    }

    const alreadyCleaned = await AsyncStorage.getItem(CLEANUP_MARKER_KEY)
    if (alreadyCleaned === "1") {
        return
    }

    await AsyncStorage.multiRemove(LEGACY_KEYS)
    await AsyncStorage.setItem(CLEANUP_MARKER_KEY, "1")
}

export async function setTokenValue(key: string, value: string): Promise<void> {
    if (shouldUseSecureStore()) {
        await SecureStore.setItemAsync(key, value)
        return
    }

    await AsyncStorage.setItem(key, value)
}

export async function getTokenValue(key: string): Promise<string | null> {
    if (shouldUseSecureStore()) {
        return SecureStore.getItemAsync(key)
    }

    return AsyncStorage.getItem(key)
}

export async function removeTokenValue(key: string): Promise<void> {
    if (shouldUseSecureStore()) {
        await SecureStore.deleteItemAsync(key)
        return
    }

    await AsyncStorage.removeItem(key)
}
