let pendingDeepLinkToken: string | null = null

export const setPendingDeepLinkToken = (token: string): void => {
    pendingDeepLinkToken = token
}

export const consumePendingDeepLinkToken = (): string | null => {
    const value = pendingDeepLinkToken
    pendingDeepLinkToken = null
    return value
}

export const clearPendingDeepLinkToken = (): void => {
    pendingDeepLinkToken = null
}
