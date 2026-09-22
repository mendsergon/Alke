import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

export type User = { name: string; initials: string; email: string };

/** Apple and Google are drawn but not wired; PLAN.md §8 #6 is still open. */
export type Provider = 'apple' | 'google';

type AuthState = {
  /** Always set once past the gate — there is no way in without signing in. */
  user: User | null;
  /**
   * Continue has been pressed. Until there is a backend it is the only thing
   * standing between the gate and the app, so it lets you through with or
   * without an address. With no address there is no account, and Profile says
   * so rather than inventing one.
   */
  entered: boolean;
  /**
   * Past the gate but not finished: the glass has lifted so the register page
   * can be on top of the app, and the app behind it is still suspended. It
   * arrives when the account is made, not before.
   */
  registering: boolean;
  /** The screen opens on an empty field; there is no account to prefill. */
  defaultEmail: string;
  signInWithEmail: (email: string, opts?: { registering?: boolean }) => void;
  finishRegistering: () => void;
  signOut: () => void;
};

const Ctx = createContext<AuthState | null>(null);

/**
 * The name comes from the address the person typed, not from a stored account
 * — there is no backend yet. Continue works with an empty field so the app can
 * be tested, and that account simply has no address on it yet. Nothing is
 * invented either way.
 */
function userFromEmail(email: string): User {
  const trimmed = email.trim();
  if (trimmed.length === 0) return { name: 'Account', initials: '', email: '' };
  const local = trimmed.split('@')[0] ?? trimmed;
  const name = local.charAt(0).toUpperCase() + local.slice(1);
  return { name, initials: name.charAt(0).toUpperCase(), email: trimmed };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [entered, setEntered] = useState(false);
  const [registering, setRegistering] = useState(false);

  const signInWithEmail = useCallback(
    (email: string, opts?: { registering?: boolean }) => {
      setUser(userFromEmail(email));
      setRegistering(opts?.registering ?? false);
      setEntered(true);
    },
    [],
  );

  const finishRegistering = useCallback(() => setRegistering(false), []);

  const value = useMemo<AuthState>(
    () => ({
      user,
      entered,
      registering,
      defaultEmail: '',
      signInWithEmail,
      finishRegistering,
      signOut: () => {
        setUser(null);
        setEntered(false);
        setRegistering(false);
      },
    }),
    [user, entered, registering, signInWithEmail, finishRegistering],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth(): AuthState {
  const v = useContext(Ctx);
  if (!v) throw new Error('useAuth used outside AuthProvider');
  return v;
}
