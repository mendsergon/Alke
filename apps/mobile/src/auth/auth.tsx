import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { MOCK_DEFAULT_USER } from '../mock/mock-data';

export type User = { name: string; initials: string; email: string };

/** Apple and Google are drawn but not wired; PLAN.md §8 #6 is still open. */
export type Provider = 'apple' | 'google';

type AuthState = {
  user: User | null;
  /** The address the screen opens on, so one tap gets you in. */
  defaultEmail: string;
  signInWithEmail: (email: string) => void;
  signOut: () => void;
};

const Ctx = createContext<AuthState | null>(null);

/** "ben@alke.app" → Ben / B. Real names come from the account in Phase 2. */
function userFromEmail(email: string): User {
  const trimmed = email.trim();
  const local = trimmed.split('@')[0] ?? trimmed;
  const name = local.charAt(0).toUpperCase() + local.slice(1);
  return {
    name: name || MOCK_DEFAULT_USER.name,
    initials: (name.charAt(0) || MOCK_DEFAULT_USER.initials).toUpperCase(),
    email: trimmed || MOCK_DEFAULT_USER.email,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  const signInWithEmail = useCallback((email: string) => {
    setUser(userFromEmail(email));
  }, []);

  const value = useMemo<AuthState>(
    () => ({
      user,
      defaultEmail: MOCK_DEFAULT_USER.email,
      signInWithEmail,
      signOut: () => setUser(null),
    }),
    [user, signInWithEmail],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth(): AuthState {
  const v = useContext(Ctx);
  if (!v) throw new Error('useAuth used outside AuthProvider');
  return v;
}
