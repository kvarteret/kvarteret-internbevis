import { ZodError } from "zod";
import { digitalInternKortRequestSchema, parseInternkortInformation } from "../schemas/internkort";
import { User } from "../types/user";
import {
  cleanupLegacyInsecureTokenStorage,
  getTokenValue,
  removeTokenValue,
  setTokenValue,
  TOKEN_STORAGE_KEYS,
} from "./tokenStorage";
import { createAuthServiceError, toAuthServiceError } from "./authError";

const BASE_URL = "https://api.kvarteret.no/api/DigitalInternkort";

export interface AuthResult {
  success: boolean;
  message?: string;
  status?: number;
}

async function postJson(path: string, body: Record<string, unknown>): Promise<Response> {
  return fetch(`${BASE_URL}/${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export async function initializeAuthStorage(): Promise<void> {
  await cleanupLegacyInsecureTokenStorage();
}

export async function requestAccessToken(email: string): Promise<boolean> {
  const requestBody = digitalInternKortRequestSchema.parse({ email });

  let response: Response;
  try {
    response = await postJson("RequestAccessTokenOnEmail", requestBody);
  } catch (error) {
    throw createAuthServiceError({
      code: "NETWORK_ERROR",
      message: "Network error. Please check your connection and try again.",
      cause: error,
    });
  }

  if (response.status === 200) {
    return true;
  }

  if (response.status === 404) {
    throw createAuthServiceError({
      code: "EMAIL_NOT_FOUND",
      message: "Email not found in the database",
      status: 404,
    });
  }

  throw createAuthServiceError({
    code: "REQUEST_FAILED",
    message: `Failed to request access token: ${response.status}`,
    status: response.status,
  });
}

export async function getInternkortInformation(email: string, accessToken: string): Promise<User> {
  const requestBody = digitalInternKortRequestSchema.parse({
    email,
    accessToken,
  });

  let response: Response;
  try {
    response = await postJson("GetInternkortInformation", requestBody);
  } catch (error) {
    throw createAuthServiceError({
      code: "NETWORK_ERROR",
      message: "Network error. Please check your connection and try again.",
      cause: error,
    });
  }

  if (response.status === 200) {
    let payload: unknown;

    try {
      payload = await response.json();
    } catch (error) {
      throw createAuthServiceError({
        code: "UNEXPECTED_RESPONSE",
        message: "Server returned an unreadable response.",
        status: response.status,
        cause: error,
      });
    }

    try {
      return parseInternkortInformation(payload);
    } catch (error) {
      if (error instanceof ZodError) {
        throw createAuthServiceError({
          code: "UNEXPECTED_RESPONSE",
          message: "Server response format was invalid.",
          status: response.status,
          cause: error,
        });
      }

      throw createAuthServiceError({
        code: "UNEXPECTED_RESPONSE",
        message: "Could not parse server response.",
        status: response.status,
        cause: error,
      });
    }
  }

  if (response.status === 401) {
    throw createAuthServiceError({
      code: "INVALID_AUTH",
      message: "Invalid or expired access token",
      status: 401,
    });
  }

  if (response.status === 404) {
    throw createAuthServiceError({
      code: "INVALID_AUTH",
      message: "User not found",
      status: 404,
    });
  }

  throw createAuthServiceError({
    code: "REQUEST_FAILED",
    message: `Failed to fetch user information: ${response.status}`,
    status: response.status,
  });
}

export async function saveAccessToken(email: string, accessToken: string): Promise<void> {
  await setTokenValue(TOKEN_STORAGE_KEYS.email, email);
  await setTokenValue(TOKEN_STORAGE_KEYS.accessToken, accessToken);
}

export async function getSavedCredentials(): Promise<{ email: string | null; accessToken: string | null }> {
  const [email, accessToken] = await Promise.all([
    getTokenValue(TOKEN_STORAGE_KEYS.email),
    getTokenValue(TOKEN_STORAGE_KEYS.accessToken),
  ]);

  return { email, accessToken };
}

export async function clearCredentials(): Promise<void> {
  await Promise.all([removeTokenValue(TOKEN_STORAGE_KEYS.email), removeTokenValue(TOKEN_STORAGE_KEYS.accessToken)]);
}

export async function saveDeepLinkToken(token: string): Promise<void> {
  await setTokenValue(TOKEN_STORAGE_KEYS.deepLinkToken, token);
}

export async function getDeepLinkToken(): Promise<string | null> {
  return getTokenValue(TOKEN_STORAGE_KEYS.deepLinkToken);
}

export async function clearDeepLinkToken(): Promise<void> {
  await removeTokenValue(TOKEN_STORAGE_KEYS.deepLinkToken);
}

export function authResultFromError(error: unknown): AuthResult {
  const authError = toAuthServiceError(error);
  return {
    success: false,
    message: authError.message,
    status: authError.status,
  };
}

export function extractFriendlyErrorMessage(error: unknown): string {
  const authError = toAuthServiceError(error);
  return authError.message;
}
