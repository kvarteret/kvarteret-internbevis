export type AuthErrorCode =
  | "NETWORK_ERROR"
  | "INVALID_AUTH"
  | "EMAIL_NOT_FOUND"
  | "REQUEST_FAILED"
  | "UNEXPECTED_RESPONSE"
  | "UNKNOWN_ERROR";

export interface AuthServiceError extends Error {
  code: AuthErrorCode;
  status?: number;
  cause?: unknown;
}

interface CreateAuthServiceErrorArgs {
  code: AuthErrorCode;
  message: string;
  status?: number;
  cause?: unknown;
}

export function createAuthServiceError({ code, message, status, cause }: CreateAuthServiceErrorArgs): AuthServiceError {
  const error = new Error(message) as AuthServiceError;
  error.code = code;
  error.status = status;
  error.cause = cause;
  return error;
}

export function isAuthServiceError(error: unknown): error is AuthServiceError {
  return error instanceof Error && typeof (error as Partial<AuthServiceError>).code === "string";
}

export function toAuthServiceError(error: unknown): AuthServiceError {
  if (isAuthServiceError(error)) {
    return error;
  }

  if (error instanceof Error) {
    return createAuthServiceError({
      code: "UNKNOWN_ERROR",
      message: error.message,
      cause: error,
    });
  }

  return createAuthServiceError({
    code: "UNKNOWN_ERROR",
    message: String(error),
    cause: error,
  });
}

export function isInvalidAuthError(error: unknown): boolean {
  const authError = toAuthServiceError(error);
  return authError.code === "INVALID_AUTH";
}

export function isTransientAuthError(error: unknown): boolean {
  const authError = toAuthServiceError(error);
  return authError.code === "NETWORK_ERROR" || authError.code === "REQUEST_FAILED";
}
