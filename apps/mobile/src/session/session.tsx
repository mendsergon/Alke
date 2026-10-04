import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useAuth } from '../auth/auth';
import { useLibrary } from '../library/library';
import { listMuscleCategories, type MuscleCategory } from '../backend/muscles';
import { cachedExercisesIn, listExercisesIn, weightsCollection, type Exercise } from '../backend/exercises';
import { updateProgramDays, type PlannedExercise, type ProgramDay, type ProgramRecord } from '../backend/programs';

/** A set as it is filled in: the load and reps typed, and whether it is done. */
export type SessionSet = { load: string; reps: string; done: boolean };

/** An exercise in the session, with what a row draws once it is known. */
export type SessionExercise = {
  /** Unique in the session: the same exercise can be in it twice. */
  key: string;
  collection: string;
  exercise: string;
  rows: SessionSet[];
  info?: Exercise;
  /** The muscle group it is filed under. */
  group?: string;
};

/**
 * A workout being done. Before it starts it is an overview of what is
 * planned; started, it counts up from `startedAt` until it is finished.
 */
export type Session = {
  program: ProgramRecord;
  /** The day of the program it is, and its workout. */
  day: number;
  workout: number;
  exercises: SessionExercise[];
  startedAt: number | null;
};

type SessionState = {
  session: Session | null;
  /** Every muscle group, and each group's exercises, for the session to add from. */
  categories: MuscleCategory[];
  exercisesIn: (category: string) => Exercise[];
  /**
   * Opens a program's workout: the given day's, or today's, or the next day it
   * trains. A started session is kept.
   */
  open: (program: ProgramRecord, day?: number) => void;
  start: () => void;
  finish: () => void;
  add: (exercise: Exercise, category: MuscleCategory) => void;
  addSet: (key: string) => void;
  /** Sets an exercise's number of sets, one at least: a set taken off goes from the end. */
  setSets: (key: string, sets: number) => void;
  /** Takes an exercise out. */
  remove: (key: string) => void;
  /** Changes a set's load, reps or whether it is done. */
  setRow: (key: string, index: number, change: Partial<SessionSet>) => void;
  /** The exercise most recently added, so the screen can open it. */
  added: string | null;
};

const Ctx = createContext<SessionState | null>(null);

const WEEK = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

/** Today's training day in the program, or the next one after it. */
function dayFor(program: ProgramRecord, now: Date): number {
  // getDay() counts from Sunday; the program's week starts on Monday.
  const today = (now.getDay() + 6) % 7;
  for (let ahead = 0; ahead < WEEK.length; ahead++) {
    const weekday = WEEK[(today + ahead) % WEEK.length];
    const i = program.days.findIndex((d) => d.weekday === weekday);
    if (i >= 0) return i;
  }
  return 0;
}

const EMPTY: SessionSet = { load: '', reps: '', done: false };

let made = 0;
const keyed = (x: PlannedExercise): SessionExercise => ({
  key: `${x.collection}/${x.exercise}/${made++}`,
  collection: x.collection,
  exercise: x.exercise,
  rows: Array.from({ length: x.sets }, () => EMPTY),
});

/** What the program keeps of the session's exercises: each one and its number of sets. */
const planOf = (exercises: SessionExercise[]): PlannedExercise[] =>
  exercises.map((x) => ({ collection: x.collection, exercise: x.exercise, sets: x.rows.length }));

export function SessionProvider({ children }: { children: ReactNode }) {
  const { token, account } = useAuth();
  const { replace } = useLibrary();
  const [session, setSession] = useState<Session | null>(null);
  const [categories, setCategories] = useState<MuscleCategory[]>([]);
  const [added, setAdded] = useState<string | null>(null);
  // Bumped when a group's exercises arrive, so what reads them draws again.
  const [loaded, setLoaded] = useState(0);

  // The groups and their exercises, fetched once a session is opened.
  const opened = session !== null;
  useEffect(() => {
    if (!opened || categories.length > 0) return;
    let live = true;
    void listMuscleCategories().then(async (items) => {
      if (!live || !items) return;
      setCategories(items);
      await Promise.all(items.filter((k) => !cachedExercisesIn(k.id)).map((k) => listExercisesIn(k, token)));
      if (live) setLoaded((n) => n + 1);
    });
    return () => {
      live = false;
    };
  }, [opened, categories.length, token]);

  const exercisesIn = useCallback((category: string) => cachedExercisesIn(category) ?? [], []);

  // Each planned exercise's name, type and icon, from its group's list.
  const byCollection = useMemo(() => new Map(categories.map((k) => [weightsCollection(k.name), k])), [categories]);
  const resolved = useMemo<Session | null>(() => {
    if (!session) return null;
    return {
      ...session,
      exercises: session.exercises.map((x) => {
        const k = byCollection.get(x.collection);
        return { ...x, info: k ? cachedExercisesIn(k.id)?.find((e) => e.id === x.exercise) : undefined, group: k?.name };
      }),
    };
    // `loaded` changing is what makes the cached lists worth reading again.
  }, [session, byCollection, loaded]);

  const open = useCallback((program: ProgramRecord, at?: number) => {
    setAdded(null);
    setSession((now) => {
      if (now?.startedAt != null) return now;
      const day = at ?? dayFor(program, new Date());
      const planned = program.days[day]?.workouts[0]?.exercises ?? [];
      return { program, day, workout: 0, exercises: planned.map(keyed), startedAt: null };
    });
  }, []);

  const start = useCallback(() => {
    setSession((now) => (now && now.startedAt == null ? { ...now, startedAt: Date.now() } : now));
  }, []);

  const finish = useCallback(() => setSession(null), []);

  // The person's own program takes what they add: this is how they edit it.
  // A template is everyone's and never changes; there it stays in the session.
  const keep = useCallback(
    (now: Session, exercises: SessionExercise[]) => {
      const { program, day, workout } = now;
      if (!token || !account || program.owner !== account.id) return;
      const days: ProgramDay[] = program.days.map((d, i) =>
        i !== day ? d : { ...d, workouts: d.workouts.map((w, j) => (j !== workout ? w : { ...w, exercises: planOf(exercises) })) },
      );
      void updateProgramDays(token, program, days).then((saved) => {
        if (!saved) return;
        replace(saved);
        setSession((s) => (s && s.program.id === saved.id ? { ...s, program: saved } : s));
      });
    },
    [token, account, replace],
  );

  const add = useCallback(
    (exercise: Exercise, category: MuscleCategory) => {
      if (!session) return;
      const x = keyed({ collection: weightsCollection(category.name), exercise: exercise.id, sets: 1 });
      const exercises = [...session.exercises, x];
      setSession({ ...session, exercises });
      setAdded(x.key);
      keep(session, exercises);
    },
    [session, keep],
  );

  const addSet = useCallback(
    (key: string) => {
      if (!session) return;
      const exercises = session.exercises.map((x) => (x.key === key ? { ...x, rows: [...x.rows, EMPTY] } : x));
      setSession({ ...session, exercises });
      keep(session, exercises);
    },
    [session, keep],
  );

  const setSets = useCallback(
    (key: string, sets: number) => {
      if (!session || sets < 1) return;
      const exercises = session.exercises.map((x) =>
        x.key !== key
          ? x
          : { ...x, rows: sets > x.rows.length ? [...x.rows, ...Array.from({ length: sets - x.rows.length }, () => EMPTY)] : x.rows.slice(0, sets) },
      );
      setSession({ ...session, exercises });
      keep(session, exercises);
    },
    [session, keep],
  );

  const remove = useCallback(
    (key: string) => {
      if (!session) return;
      const exercises = session.exercises.filter((x) => x.key !== key);
      setSession({ ...session, exercises });
      keep(session, exercises);
    },
    [session, keep],
  );

  const setRow = useCallback((key: string, index: number, change: Partial<SessionSet>) => {
    setSession((now) =>
      now
        ? {
            ...now,
            exercises: now.exercises.map((x) =>
              x.key !== key ? x : { ...x, rows: x.rows.map((r, i) => (i === index ? { ...r, ...change } : r)) },
            ),
          }
        : now,
    );
  }, []);

  const value = useMemo<SessionState>(
    () => ({ session: resolved, categories, exercisesIn, open, start, finish, add, addSet, setSets, remove, setRow, added }),
    [resolved, categories, exercisesIn, open, start, finish, add, addSet, setSets, remove, setRow, added],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useSession(): SessionState {
  const v = useContext(Ctx);
  if (!v) throw new Error('useSession used outside SessionProvider');
  return v;
}

/** A typed number, or nothing when it is not one. Commas count as points. */
export function amount(text: string): number | null {
  const n = Number(text.replace(',', '.'));
  return text.trim() === '' || !Number.isFinite(n) ? null : n;
}

/** The sets done and planned, and the load moved by the done ones (load × reps). */
export function totals(exercises: SessionExercise[]): { done: number; planned: number; volume: number } {
  let done = 0;
  let planned = 0;
  let volume = 0;
  for (const x of exercises) {
    for (const r of x.rows) {
      planned += 1;
      if (!r.done) continue;
      done += 1;
      volume += (amount(r.load) ?? 0) * (amount(r.reps) ?? 0);
    }
  }
  return { done, planned, volume };
}

/** "12:04", or "1:02:09" past an hour: the time since the session started. */
export function elapsed(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const ss = String(s).padStart(2, '0');
  return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${ss}` : `${m}:${ss}`;
}

/** The time since `startedAt`, redrawn each second. */
export function useElapsed(startedAt: number | null): string {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (startedAt == null) return;
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [startedAt]);
  return startedAt == null ? elapsed(0) : elapsed(now - startedAt);
}
