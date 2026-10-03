import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useAuth } from '../auth/auth';
import { useLibrary } from '../library/library';
import { listMuscleCategories, type MuscleCategory } from '../backend/muscles';
import { cachedExercisesIn, listExercisesIn, weightsCollection, type Exercise } from '../backend/exercises';
import { updateProgramDays, type PlannedExercise, type ProgramDay, type ProgramRecord } from '../backend/programs';

/** An exercise in the session, with what a row draws once it is known. */
export type SessionExercise = PlannedExercise & {
  /** Unique in the session: the same exercise can be in it twice. */
  key: string;
  /** Sets completed in this session. */
  done: number;
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
  /** The exercise being done, by position. */
  current: number;
};

type SessionState = {
  session: Session | null;
  /** Every muscle group, and each group's exercises, for the session to add from. */
  categories: MuscleCategory[];
  exercisesIn: (category: string) => Exercise[];
  /** Opens a program's workout for today, or the next day it trains. A started session is kept. */
  open: (program: ProgramRecord) => void;
  start: () => void;
  finish: () => void;
  add: (exercise: Exercise, category: MuscleCategory) => void;
  /** Completes the current exercise's next set; done with it, on to the next one not done. */
  complete: () => void;
  /** Makes an exercise the current one. */
  go: (index: number) => void;
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

let made = 0;
const keyed = (x: PlannedExercise): SessionExercise => ({ ...x, key: `${x.collection}/${x.exercise}/${made++}`, done: 0 });

export function SessionProvider({ children }: { children: ReactNode }) {
  const { token, account } = useAuth();
  const { replace } = useLibrary();
  const [session, setSession] = useState<Session | null>(null);
  const [categories, setCategories] = useState<MuscleCategory[]>([]);
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

  const open = useCallback((program: ProgramRecord) => {
    setSession((now) => {
      if (now?.startedAt != null) return now;
      const day = dayFor(program, new Date());
      const planned = program.days[day]?.workouts[0]?.exercises ?? [];
      return { program, day, workout: 0, exercises: planned.map(keyed), startedAt: null, current: 0 };
    });
  }, []);

  const start = useCallback(() => {
    setSession((now) => (now && now.startedAt == null ? { ...now, startedAt: Date.now() } : now));
  }, []);

  const finish = useCallback(() => setSession(null), []);

  const complete = useCallback(() => {
    setSession((now) => {
      if (!now || now.startedAt == null) return now;
      const at = now.exercises[now.current];
      if (!at || at.done >= at.sets) return now;
      const exercises = now.exercises.map((x, i) => (i === now.current ? { ...x, done: x.done + 1 } : x));
      let current = now.current;
      if (exercises[current]!.done >= exercises[current]!.sets) {
        const next = exercises.findIndex((x, i) => i > current && x.done < x.sets);
        const any = next >= 0 ? next : exercises.findIndex((x) => x.done < x.sets);
        if (any >= 0) current = any;
      }
      return { ...now, exercises, current };
    });
  }, []);

  const go = useCallback((index: number) => {
    setSession((now) => (now && index >= 0 && index < now.exercises.length ? { ...now, current: index } : now));
  }, []);

  const add = useCallback(
    (exercise: Exercise, category: MuscleCategory) => {
      if (!session) return;
      const planned: PlannedExercise = { collection: weightsCollection(category.name), exercise: exercise.id, sets: 1 };
      const exercises = [...session.exercises, keyed(planned)];
      // The added exercise is the one shown next.
      setSession({ ...session, exercises, current: exercises.length - 1 });

      // The person's own program takes the exercise too: this is how they
      // edit it. A template is everyone's and never changes; there it stays
      // in this session only.
      const { program, day, workout } = session;
      if (!token || !account || program.owner !== account.id) return;
      const days: ProgramDay[] = program.days.map((d, i) =>
        i !== day
          ? d
          : {
              ...d,
              workouts: d.workouts.map((w, j) =>
                j !== workout ? w : { ...w, exercises: exercises.map(({ collection, exercise: id, sets }) => ({ collection, exercise: id, sets })) },
              ),
            },
      );
      void updateProgramDays(token, program, days).then((saved) => {
        if (!saved) return;
        replace(saved);
        setSession((now) => (now && now.program.id === saved.id ? { ...now, program: saved } : now));
      });
    },
    [session, token, account, replace],
  );

  const value = useMemo<SessionState>(
    () => ({ session: resolved, categories, exercisesIn, open, start, finish, add, complete, go }),
    [resolved, categories, exercisesIn, open, start, finish, add, complete, go],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useSession(): SessionState {
  const v = useContext(Ctx);
  if (!v) throw new Error('useSession used outside SessionProvider');
  return v;
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
