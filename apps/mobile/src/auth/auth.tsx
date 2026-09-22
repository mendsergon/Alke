import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { authenticate, refreshSession, type Session } from '../backend/pocketbase';
import { clearToken, readToken, writeToken } from '../backend/session-store';

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
  /**
   * The stored session has not been checked yet. The gate waits rather than
   * showing itself for a frame to somebody who is already signed in.
   */
  restoring: boolean;
  /** The screen opens on an empty field; there is no account to prefill. */
  defaultEmail: string;
  /** Takes the session the server just handed back and keeps it. */
  signInWithSession: (session: Session) => void;
  /** An address and its password, the way every app does it. */
  signInWithPassword: (email: string, password: string) => Promise<boolean>;
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
  const [restoring, setRestoring] = useState(true);

  const signInWithSession = useCallback((session: Session) => {
    setUser(userFromSession(session));
    setRegistering(false);
    setEntered(true);
    void writeToken(session.token);
  }, []);

  const signInWithPassword = useCallback(
    async (email: string, password: string) => {
      const session = await authenticate(email.trim(), password);
      if (!session) return false;
      signInWithSession(session);
      return true;
    },
    [signInWithSession],
  );

  // One question on launch: is the token still good? The server answers, and
  // whatever it says is the truth — not what was on disk.
  useEffect(() => {
    let alive = true;
    (async () => {
      const token = await readToken();
      const session = token ? await refreshSession(token) : null;
      if (!alive) return;
      if (session) {
        setUser(userFromSession(session));
        setEntered(true);
        void writeToken(session.token);
      } else if (token) {
        void clearToken();
      }
      setRestoring(false);
    })();
    return () => {
      alive = false;
    };
  }, []);

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
      restoring,
      defaultEmail: '',
      signInWithEmail,
      signInWithSession,
      signInWithPassword,
      finishRegistering,
      signOut: () => {
        setUser(null);
        setEntered(false);
        setRegistering(false);
        void clearEverything();
      },
    }),
    [
      user,
      entered,
      registering,
      restoring,
      signInWithEmail,
      signInWithSession,
      signInWithPassword,
      finishRegistering,
    ],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

/** The account as the server describes it, not as an address was parsed. */
function userFromSession(session: Session): User {
  const name = session.record.name || session.record.username || 'Account';
  return {
    name,
    initials: name.charAt(0).toUpperCase(),
    email: session.record.email,
  };
}

export function useAuth(): AuthState {
  const v = useContext(Ctx);
  if (!v) throw new Error('useAuth used outside AuthProvider');
  return v;
}
