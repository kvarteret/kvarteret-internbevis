import AsyncStorage from '@react-native-async-storage/async-storage';
import { parseUser, User } from '../types/user';

const BASE_URL = 'https://api.kvarteret.no/api/DigitalInternkort';

const STORAGE_KEYS = {
  email: 'email',
  accessToken: 'accessToken',
  deepLinkToken: 'deep_link_token',
};

interface ApiError extends Error {
  status?: number;
}

function createApiError(message: string, status?: number): ApiError {
  const error = new Error(message) as ApiError;
  error.status = status;
  return error;
}

async function postJson(path: string, body: Record<string, unknown>): Promise<Response> {
  return fetch(`${BASE_URL}/${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

export async function requestAccessToken(email: string): Promise<boolean> {
  let response: Response;
  try {
    response = await postJson('RequestAccessTokenOnEmail', { email });
  } catch (error) {
    throw createApiError(`Network error: ${String(error)}`);
  }

  if (response.status === 200) {
    return true;
  }

  if (response.status === 404) {
    throw createApiError('Email not found in the database', 404);
  }

  throw createApiError(`Failed to request access token: ${response.status}`, response.status);
}

export async function getInternkortInformation(
  email: string,
  accessToken: string,
): Promise<User> {
  let response: Response;
  try {
    response = await postJson('GetInternkortInformation', {
      email,
      accessToken,
    });
  } catch (error) {
    throw createApiError(`Network error: ${String(error)}`);
  }

  if (response.status === 200) {
    const payload = await response.json();
    return parseUser(payload);
  }

  if (response.status === 401) {
    throw createApiError('Invalid or expired access token', 401);
  }

  if (response.status === 404) {
    throw createApiError('User not found', 404);
  }

  throw createApiError(`Failed to fetch user information: ${response.status}`, response.status);
}

export async function saveAccessToken(email: string, accessToken: string): Promise<void> {
  await AsyncStorage.multiSet([
    [STORAGE_KEYS.email, email],
    [STORAGE_KEYS.accessToken, accessToken],
  ]);
}

export async function getSavedCredentials(): Promise<{
  email: string | null;
  accessToken: string | null;
}> {
  const values = await AsyncStorage.multiGet([STORAGE_KEYS.email, STORAGE_KEYS.accessToken]);
  const map = new Map(values);
  return {
    email: map.get(STORAGE_KEYS.email) ?? null,
    accessToken: map.get(STORAGE_KEYS.accessToken) ?? null,
  };
}

export async function clearCredentials(): Promise<void> {
  await AsyncStorage.multiRemove([STORAGE_KEYS.email, STORAGE_KEYS.accessToken]);
}

export async function saveDeepLinkToken(token: string): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEYS.deepLinkToken, token);
}

export async function getDeepLinkToken(): Promise<string | null> {
  return AsyncStorage.getItem(STORAGE_KEYS.deepLinkToken);
}

export async function clearDeepLinkToken(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEYS.deepLinkToken);
}

export function extractFriendlyErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    const prefix = 'Network error: Error: ';
    if (error.message.startsWith(prefix)) {
      return error.message.replace(prefix, '');
    }
    return error.message;
  }

  return String(error);
}
