let pendingDeepLinkToken: string | null = null

export function setPendingDeepLinkToken(token: string): void {
    pendingDeepLinkToken = token
}

export function consumePendingDeepLinkToken(): string | null {
    const value = pendingDeepLinkToken
    pendingDeepLinkToken = null
    return value
}

export function clearPendingDeepLinkToken(): void {
    pendingDeepLinkToken = null
}
