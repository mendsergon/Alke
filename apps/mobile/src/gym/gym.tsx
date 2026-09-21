import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { MOCK_GYMS, type Gym } from '../mock/mock-data';

type GymState = {
  gym: Gym;
  gyms: Gym[];
  /** PLAN.md §2: the chip switches gym in one tap. */
  switchGym: () => void;
};

const Ctx = createContext<GymState | null>(null);

export function GymProvider({ children }: { children: ReactNode }) {
  const [index, setIndex] = useState(0);
  const switchGym = useCallback(() => {
    setIndex((i) => (i + 1) % MOCK_GYMS.length);
  }, []);
  const value = useMemo<GymState>(
    () => ({ gym: MOCK_GYMS[index] ?? MOCK_GYMS[0]!, gyms: MOCK_GYMS, switchGym }),
    [index, switchGym],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useGym(): GymState {
  const v = useContext(Ctx);
  if (!v) throw new Error('useGym used outside GymProvider');
  return v;
}
