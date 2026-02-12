import React, { createContext, PropsWithChildren, useContext, useEffect, useMemo, useState } from "react";
import {
  AuthResult,
  authResultFromError,
  clearCredentials,
  clearDeepLinkToken,
  getInternkortInformation,
  getSavedCredentials,
  initializeAuthStorage,
  saveAccessToken,
  saveDeepLinkToken,
} from "../services/authService";
import { User } from "../types/user";
import { getHydrationErrorMessage, shouldClearCredentialsOnHydrationError } from "./authErrorHandling";

interface UserContextValue {
  user: User | null;
  isHydrating: boolean;
  isLoading: boolean;
  error: string | null;
  setUser: (nextUser: User | null) => void;
  loginWithToken: (email: string, accessToken: string) => Promise<AuthResult>;
  logout: () => Promise<void>;
}

const UserContext = createContext<UserContextValue | undefined>(undefined);

export function UserProvider({ children }: PropsWithChildren): React.JSX.Element {
  const [user, setUser] = useState<User | null>(null);
  const [isHydrating, setIsHydrating] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function hydrateUser(): Promise<void> {
      try {
        await initializeAuthStorage();
        const credentials = await getSavedCredentials();

        if (credentials.email && credentials.accessToken) {
          const nextUser = await getInternkortInformation(credentials.email, credentials.accessToken);
          setUser(nextUser);
          setError(null);
        }
      } catch (nextError) {
        if (shouldClearCredentialsOnHydrationError(nextError)) {
          await clearCredentials();
          await clearDeepLinkToken();
        }

        setUser(null);
        setError(getHydrationErrorMessage(nextError));
      } finally {
        setIsHydrating(false);
      }
    }

    void hydrateUser();
  }, []);

  const loginWithToken = async (email: string, accessToken: string): Promise<AuthResult> => {
    setIsLoading(true);
    setError(null);

    try {
      const nextUser = await getInternkortInformation(email, accessToken);
      await saveAccessToken(email, accessToken);
      await saveDeepLinkToken(accessToken);
      setUser(nextUser);
      return { success: true, status: 200 };
    } catch (nextError) {
      if (shouldClearCredentialsOnHydrationError(nextError)) {
        await clearDeepLinkToken();
      }

      const failedResult = authResultFromError(nextError);
      setError(failedResult.message ?? null);
      return failedResult;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    await clearCredentials();
    await clearDeepLinkToken();
    setUser(null);
  };

  const value = useMemo(
    () => ({
      user,
      isHydrating,
      isLoading,
      error,
      setUser,
      loginWithToken,
      logout,
    }),
    [error, isHydrating, isLoading, user],
  );

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useUser(): UserContextValue {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within a UserProvider");
  }

  return context;
}
