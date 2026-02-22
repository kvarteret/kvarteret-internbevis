import * as SecureStore from "expo-secure-store"

export const setSecureValue = async (key: string, value: string): Promise<void> => {
    await SecureStore.setItemAsync(key, value)
}

export const getSecureValue = async (key: string): Promise<string | null> =>
    SecureStore.getItemAsync(key)

export const removeSecureValue = async (key: string): Promise<void> => {
    await SecureStore.deleteItemAsync(key)
}
