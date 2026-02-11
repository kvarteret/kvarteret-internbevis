import React, { createContext, PropsWithChildren, useContext, useEffect, useMemo, useState } from 'react';
import {
  clearCredentials,
  getInternkortInformation,
  getSavedCredentials,
  saveAccessToken,
} from '../services/authService';
import { User } from '../types/user';

interface UserContextValue {
  user: User | null;
  isHydrating: boolean;
  isLoading: boolean;
  error: string | null;
  setUser: (nextUser: User | null) => void;
  loginWithToken: (email: string, accessToken: string) => Promise<boolean>;
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
        const credentials = await getSavedCredentials();
        if (credentials.email && credentials.accessToken) {
          const nextUser = await getInternkortInformation(credentials.email, credentials.accessToken);
          setUser(nextUser);
          setError(null);
        }
      } catch (nextError) {
        setUser(null);
        setError(nextError instanceof Error ? nextError.message : String(nextError));
      } finally {
        setIsHydrating(false);
      }
    }

    void hydrateUser();
  }, []);

  const loginWithToken = async (email: string, accessToken: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      const nextUser = await getInternkortInformation(email, accessToken);
      await saveAccessToken(email, accessToken);
      setUser(nextUser);
      return true;
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : String(nextError));
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    await clearCredentials();
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
    throw new Error('useUser must be used within a UserProvider');
  }

  return context;
}
