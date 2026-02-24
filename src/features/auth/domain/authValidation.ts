export const normalizeEmail = (email: string): string => email.trim()

export const isEmailValid = (email: string): boolean => {
    const normalized = normalizeEmail(email)
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)
}

export const normalizePhone = (phone: string): string => {
    const digits = phone.replace(/\D/g, "")
    if (digits.length === 8) {
        return `+47${digits}`
    }
    if (digits.startsWith("47") && digits.length === 10) {
        return `+${digits}`
    }
    return phone.trim().startsWith("+") ? phone.trim() : `+${digits}`
}

export const isPhoneValid = (phone: string): boolean =>
    /^\+\d{7,15}$/.test(normalizePhone(phone))
