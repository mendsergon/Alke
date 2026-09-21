import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

type SessionState = {
  /** A workout is open. It is either full screen or minimised to the mini-bar. */
  active: boolean;
  minimised: boolean;
  start: () => void;
  minimise: () => void;
  resume: () => void;
  end: () => void;
};

const Ctx = createContext<SessionState | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [active, setActive] = useState(false);
  const [minimised, setMinimised] = useState(false);

  const value = useMemo<SessionState>(
    () => ({
      active,
      minimised,
      start: () => {
        setActive(true);
        setMinimised(false);
      },
      minimise: () => setMinimised(true),
      resume: () => setMinimised(false),
      end: () => {
        setActive(false);
        setMinimised(false);
      },
    }),
    [active, minimised],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useSession(): SessionState {
  const v = useContext(Ctx);
  if (!v) throw new Error('useSession used outside SessionProvider');
  return v;
}
