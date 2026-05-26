import React, { createContext, useContext, useEffect, useState } from 'react';
import { secureStorage, asyncStorage, STORAGE_KEYS } from '../services/storage';
import type { User, AuthContextType } from '../types/auth';

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState<boolean | null>(null);

  useEffect(() => {
    loadAuthState();
  }, []);

  async function loadAuthState() {
    try {
      const [token, onboardingFlag] = await Promise.all([
        secureStorage.get(STORAGE_KEYS.AUTH_TOKEN),
        asyncStorage.get(STORAGE_KEYS.HAS_SEEN_ONBOARDING),
      ]);

      setHasSeenOnboarding(onboardingFlag === 'true');

      if (token) {
        const raw = await asyncStorage.get(STORAGE_KEYS.USER_DATA);
        if (raw) setUser(JSON.parse(raw));
      }
    } catch {
      // storage unavailable — proceed unauthenticated
    } finally {
      setIsLoading(false);
    }
  }

  async function signIn(email: string, _password: string) {
    const mockUser: User = { id: '1', email, name: email.split('@')[0] };
    const token = 'mock_token_' + Date.now();
    await Promise.all([
      secureStorage.set(STORAGE_KEYS.AUTH_TOKEN, token),
      asyncStorage.set(STORAGE_KEYS.USER_DATA, JSON.stringify(mockUser)),
    ]);
    setUser(mockUser);
  }

  async function signUp(name: string, email: string, _password: string) {
    const mockUser: User = { id: '1', email, name };
    const token = 'mock_token_' + Date.now();
    await Promise.all([
      secureStorage.set(STORAGE_KEYS.AUTH_TOKEN, token),
      asyncStorage.set(STORAGE_KEYS.USER_DATA, JSON.stringify(mockUser)),
    ]);
    setUser(mockUser);
  }

  async function signOut() {
    await Promise.all([
      secureStorage.delete(STORAGE_KEYS.AUTH_TOKEN),
      asyncStorage.delete(STORAGE_KEYS.USER_DATA),
    ]);
    setUser(null);
  }

  async function sendPasswordReset(_email: string) {
    // Stub — wire to real API later
    await new Promise((r) => setTimeout(r, 1000));
  }

  async function completeOnboarding() {
    await asyncStorage.set(STORAGE_KEYS.HAS_SEEN_ONBOARDING, 'true');
    setHasSeenOnboarding(true);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        hasSeenOnboarding,
        signIn,
        signUp,
        signOut,
        sendPasswordReset,
        completeOnboarding,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
