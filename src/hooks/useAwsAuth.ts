import { useState, useCallback, useEffect } from "react";
import {
  AuthUser,
  AuthSession,
  LoginCredentials,
  SignupCredentials,
  login as awsLogin,
  signup as awsSignup,
  logout as awsLogout,
  getStoredSession,
  getCurrentUser,
} from "@/lib/aws/auth";

interface UseAwsAuthReturn {
  user: AuthUser | null;
  session: AuthSession | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  signup: (credentials: SignupCredentials) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

export function useAwsAuth(): UseAwsAuthReturn {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<AuthSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize from stored session
  useEffect(() => {
    const stored = getStoredSession();
    if (stored) {
      setSession(stored);
      setUser(stored.user);
    }
    setIsLoading(false);
  }, []);

  const login = useCallback(async (credentials: LoginCredentials) => {
    setIsLoading(true);
    setError(null);

    try {
      const newSession = await awsLogin(credentials);
      setSession(newSession);
      setUser(newSession.user);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Login failed";
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const signup = useCallback(async (credentials: SignupCredentials) => {
    setIsLoading(true);
    setError(null);

    try {
      const newSession = await awsSignup(credentials);
      setSession(newSession);
      setUser(newSession.user);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Signup failed";
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      await awsLogout();
      setSession(null);
      setUser(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Logout failed";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    user,
    session,
    isLoading,
    isAuthenticated: !!session && !!user,
    error,
    login,
    signup,
    logout,
    clearError,
  };
}
