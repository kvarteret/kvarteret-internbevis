import AsyncStorage from "@react-native-async-storage/async-storage"

export const getStoredValue = async (key: string): Promise<string | null> =>
    AsyncStorage.getItem(key)

export const setStoredValue = async (key: string, value: string): Promise<void> => {
    await AsyncStorage.setItem(key, value)
}

export const removeStoredValue = async (key: string): Promise<void> => {
    await AsyncStorage.removeItem(key)
}
