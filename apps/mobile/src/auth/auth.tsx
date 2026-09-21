import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

export type User = { name: string; initials: string; email: string };

/** Apple and Google are drawn but not wired; PLAN.md §8 #6 is still open. */
export type Provider = 'apple' | 'google';

type AuthState = {
  user: User | null;
  /** The screen opens on an empty field; there is no account to prefill. */
  defaultEmail: string;
  signInWithEmail: (email: string) => void;
  signOut: () => void;
};

const Ctx = createContext<AuthState | null>(null);

/**
 * The name comes from the address the person typed, not from a stored account
 * — there is no backend yet. Nothing is invented: an empty address signs
 * nobody in.
 */
function userFromEmail(email: string): User | null {
  const trimmed = email.trim();
  if (trimmed.length === 0) return null;
  const local = trimmed.split('@')[0] ?? trimmed;
  const name = local.charAt(0).toUpperCase() + local.slice(1);
  return { name, initials: name.charAt(0).toUpperCase(), email: trimmed };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  const signInWithEmail = useCallback((email: string) => {
    setUser(userFromEmail(email));
  }, []);

  const value = useMemo<AuthState>(
    () => ({
      user,
      defaultEmail: '',
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
