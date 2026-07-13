export const normalizeEmail = (email: string): string => email.trim()

export const isEmailValid = (email: string): boolean => {
    const normalized = normalizeEmail(email)
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)
}
