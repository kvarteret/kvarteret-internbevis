import AsyncStorage from "@react-native-async-storage/async-storage"

export const getStoredValue = async (key: string): Promise<string | null> =>
    AsyncStorage.getItem(key)

export const getStoredJson = async <T>(key: string): Promise<T | null> => {
    const rawValue = await AsyncStorage.getItem(key)
    if (!rawValue) {
        return null
    }

    return JSON.parse(rawValue) as T
}

export const setStoredValue = async (key: string, value: string): Promise<void> => {
    await AsyncStorage.setItem(key, value)
}

export const setStoredJson = async (key: string, value: unknown): Promise<void> => {
    await AsyncStorage.setItem(key, JSON.stringify(value))
}

export const removeStoredValue = async (key: string): Promise<void> => {
    await AsyncStorage.removeItem(key)
}
