// E-mail validation lives in shared/domain so non-auth features (feedback)
// can use it without a cross-feature import; re-exported here for auth callers.
export { isEmailValid, normalizeEmail } from "@/shared/domain/emailValidation"
