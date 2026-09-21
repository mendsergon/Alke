import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { MOCK_SESSION, type SessionSet } from '../mock/mock-data';

/** The designed rest is 2:30; the export draws it part-way through. */
const REST_SECONDS = 150;

export type SessionState = {
  /** A workout is open. It is either full screen or minimised to the mini-bar. */
  active: boolean;
  minimised: boolean;
  /** The live set list. Seeded from the mock, then driven by the session. */
  sets: SessionSet[];
  /** 1-based index of the set being worked, or null when every set is done. */
  currentSet: number | null;
  /** Seconds left on the rest timer; 0 when it is not running. */
  restLeft: number;
  restTotal: number;
  start: () => void;
  minimise: () => void;
  resume: () => void;
  end: () => void;
  completeSet: () => void;
  addSet: () => void;
  skipRest: () => void;
};

const Ctx = createContext<SessionState | null>(null);

/** "1:42" — the export's format, minutes with a zero-padded second. */
export function formatRest(seconds: number): string {
  const s = Math.max(0, Math.round(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

function seedSets(): SessionSet[] {
  return MOCK_SESSION.sets.map((s) => ({ ...s }));
}

/** The rest already elapsed when the export was drawn, so it opens as designed. */
const SEED_REST_LEFT = Math.round(
  REST_SECONDS * (1 - MOCK_SESSION.restDone / MOCK_SESSION.restTarget),
);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [active, setActive] = useState(false);
  const [minimised, setMinimised] = useState(false);
  const [sets, setSets] = useState<SessionSet[]>(seedSets);
  const [restLeft, setRestLeft] = useState(SEED_REST_LEFT);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  // One interval for the whole session; it stops when the rest reaches zero.
  useEffect(() => {
    if (!active || restLeft <= 0) return;
    timer.current = setInterval(() => {
      setRestLeft((left) => (left <= 1 ? 0 : left - 1));
    }, 1000);
    return () => {
      if (timer.current) clearInterval(timer.current);
      timer.current = null;
    };
  }, [active, restLeft > 0]);

  const currentSet = useMemo(() => {
    const next = sets.find((s) => s.state !== 'done');
    return next ? next.index : null;
  }, [sets]);

  const start = useCallback(() => {
    setSets(seedSets());
    setRestLeft(SEED_REST_LEFT);
    setActive(true);
    setMinimised(false);
  }, []);

  const end = useCallback(() => {
    setActive(false);
    setMinimised(false);
    setSets(seedSets());
    setRestLeft(SEED_REST_LEFT);
  }, []);

  const completeSet = useCallback(() => {
    setSets((prev) => {
      const i = prev.findIndex((s) => s.state !== 'done');
      if (i === -1) return prev;
      const next = prev.map((s) => ({ ...s }));
      next[i]!.state = 'done';
      const after = next[i + 1];
      if (after) {
        after.state = 'current';
        // An untouched set has no numbers yet; carry the last load forward.
        if (after.weight === '—') {
          after.weight = next[i]!.weight;
          after.reps = next[i]!.reps;
          after.rir = next[i]!.rir;
          after.fill = next[i]!.fill;
        }
      }
      return next;
    });
    setRestLeft(REST_SECONDS);
  }, []);

  const addSet = useCallback(() => {
    setSets((prev) => {
      const last = prev[prev.length - 1];
      return [
        ...prev,
        {
          index: (last?.index ?? 0) + 1,
          state: 'empty',
          weight: '—',
          reps: '—',
          rir: '—',
          fill: 0,
          target: last?.target ?? 100,
        },
      ];
    });
  }, []);

  const value = useMemo<SessionState>(
    () => ({
      active,
      minimised,
      sets,
      currentSet,
      restLeft,
      restTotal: REST_SECONDS,
      start,
      minimise: () => setMinimised(true),
      resume: () => setMinimised(false),
      end,
      completeSet,
      addSet,
      skipRest: () => setRestLeft(0),
    }),
    [active, minimised, sets, currentSet, restLeft, start, end, completeSet, addSet],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useSession(): SessionState {
  const v = useContext(Ctx);
  if (!v) throw new Error('useSession used outside SessionProvider');
  return v;
}
