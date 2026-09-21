import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { ACTIVE_GYM, GYM_MEMBERSHIPS, type Gym } from '../mock/mock-data';

type GymState = {
  /** The gym in use, or null when the person has not joined one. */
  gym: Gym | null;
  gyms: Gym[];
  /** PLAN.md §2: the chip switches gym in one tap, once there are two. */
  switchGym: () => void;
};

const Ctx = createContext<GymState | null>(null);

export function GymProvider({ children }: { children: ReactNode }) {
  const [index, setIndex] = useState(0);
  const gyms = GYM_MEMBERSHIPS;
  const switchGym = useCallback(() => {
    if (gyms.length < 2) return;
    setIndex((i) => (i + 1) % gyms.length);
  }, [gyms.length]);

  const value = useMemo<GymState>(
    () => ({ gym: gyms[index] ?? ACTIVE_GYM, gyms, switchGym }),
    [index, gyms, switchGym],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useGym(): GymState {
  const v = useContext(Ctx);
  if (!v) throw new Error('useGym used outside GymProvider');
  return v;
}
