import * as Linking from 'expo-linking';

export function extractAccessTokenFromUrl(url: string): string | null {
  const trimmed = url.trim();
  if (!trimmed) {
    return null;
  }

  let token: unknown = null;

  try {
    const parsed = Linking.parse(trimmed);
    token = parsed.queryParams?.accessToken;
  } catch {
    token = null;
  }

  if (!token) {
    try {
      const parsed = new URL(trimmed);
      token = parsed.searchParams.get('accessToken');
    } catch {
      token = null;
    }
  }

  if (!token && trimmed.includes('accessToken=')) {
    const [, queryPart] = trimmed.split('accessToken=');
    token = queryPart?.split('&')[0];
  }

  if (typeof token === 'string' && token.length > 0) {
    return token;
  }

  if (!trimmed.includes('://') && !trimmed.includes(' ') && !trimmed.includes('=')) {
    return trimmed;
  }

  return null;
}
