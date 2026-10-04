import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { ActionSheetIOS, Alert, Pressable, ScrollView, Share, View } from 'react-native';
import { askDuplicate } from '../../library/duplicate';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useBack } from '../../navigation/use-back';
import { useAuth } from '../../auth/auth';
import { useLibrary } from '../../library/library';
import { useSession } from '../../session/session';
import {
  deleteProgram,
  getProgram,
  trainingDays,
  updateProgram,
  type ProgramDay,
  type ProgramRecord,
  type ProgramWorkout,
} from '../../backend/programs';
import { listMuscleCategories } from '../../backend/muscles';
import { cachedExercisesIn, listExercisesIn, weightsCollection, type Exercise } from '../../backend/exercises';
import { EmptyState, PrimaryButton } from '../../components/surfaces';
import { Icon } from '../../components/icon';
import { DayDots, weekLine } from '../../components/program-card';
import { WorkoutBody } from '../../components/workout-body';
import { MicroCaps, Txt } from '../../theme/text';
import { tokens, useTheme } from '../../theme/theme';
import backIcon from '../../../assets/images/back.png';

const WEEK = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;

/**
 * A program, opened from its card (Stavros, 4 October 2026, after the
 * programs in Lyfta): what it trains as the whole figure, front and back, its
 * muscles lit — the emphasis design page 04 gives a program; its name, its
 * week, and its numbers as Home's week draws them; then its workouts, one row
 * per workout, a repeated one shown once with its days.
 *
 * The same page serves every program. Someone else's — a template, or one a
 * person published — is looked at and duplicated. The person's own carries
 * the "…" menu top right (Start program, Share, Edit, Publish program,
 * Delete), "Add workout to program", and on each workout a play button and its
 * own "…" (Rename, Remove).
 */
export default function ProgramScreen() {
  const { c } = useTheme();
  const router = useRouter();
  const back = useBack('/explore');
  const insets = useSafeAreaInsets();
  const { token, account } = useAuth();
  const { save, replace, remove } = useLibrary();
  const { open, start } = useSession();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [program, setProgram] = useState<ProgramRecord | null>(null);
  // Asked for and not there: deleted, unpublished, or never one the person can see.
  const [missing, setMissing] = useState(false);
  const [byKey, setByKey] = useState<ReadonlyMap<string, Exercise>>(new Map());
  const [busy, setBusy] = useState(false);
  const own = program !== null && account !== null && program.owner === account.id;

  useEffect(() => {
    let live = true;
    void getProgram(id, token).then((p) => {
      if (!live) return;
      if (p) setProgram(p);
      else setMissing(true);
    });
    return () => {
      live = false;
    };
  }, [id, token]);

  // Each planned exercise's name and muscles, from its group's list.
  useEffect(() => {
    let live = true;
    void listMuscleCategories().then(async (items) => {
      if (!items) return;
      const map = new Map<string, Exercise>();
      await Promise.all(
        items.map(async (k) => {
          const list = cachedExercisesIn(k.id) ?? (await listExercisesIn(k, token)) ?? [];
          for (const e of list) map.set(`${weightsCollection(k.name)}/${e.id}`, e);
        }),
      );
      if (live) setByKey(map);
    });
    return () => {
      live = false;
    };
  }, [token]);

  const planned = useMemo(
    () => program?.days.flatMap((d) => d.workouts.flatMap((w) => w.exercises ?? [])) ?? [],
    [program],
  );
  const trained = useMemo(
    () => [...new Set(planned.map((x) => `${x.collection}/${x.exercise}`))].flatMap((k) => byKey.get(k) ?? []),
    [planned, byKey],
  );

  /** Writes a change to the person's own program and shows it everywhere. */
  const change = (patch: Partial<Pick<ProgramRecord, 'name' | 'published' | 'schedule' | 'days'>>) => {
    if (!token || !program || busy) return;
    setBusy(true);
    void updateProgram(token, program.id, patch)
      .then((saved) => {
        if (!saved) {
          Alert.alert('That did not save.', 'Check your connection and try again.');
          return;
        }
        setProgram(saved);
        replace(saved);
      })
      .finally(() => setBusy(false));
  };

  const duplicate = () => {
    if (!program || busy) return;
    askDuplicate(program.name, () => {
      setBusy(true);
      void save(program).finally(() => setBusy(false));
    });
  };

  const share = () => {
    if (!program) return;
    void Share.share({ message: `${program.name} on Alke: alke://program/${program.id}` });
  };

  // Today's workout, or the next day the program trains, started.
  const startProgram = () => {
    if (!program || program.days.length === 0) return;
    open(program);
    start();
    router.push('/session');
  };

  const startWorkout = (day: number) => {
    if (!program) return;
    open(program, day);
    start();
    router.push('/session');
  };

  const edit = () => {
    if (!program) return;
    Alert.prompt('Edit program', 'Its name.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Save',
        isPreferred: true,
        onPress: (name?: string) => {
          const n = name?.trim();
          if (n) change({ name: n });
        },
      },
    ], 'plain-text', program.name);
  };

  const togglePublish = () => {
    if (!program) return;
    if (program.published) {
      Alert.alert(`Unpublish ${program.name}?`, 'It stops showing to other lifters. Copies they made stay theirs.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Unpublish', style: 'destructive', onPress: () => change({ published: false }) },
      ]);
    } else {
      Alert.alert(`Publish ${program.name}?`, 'Other lifters can see it on Explore and duplicate it. Only you can change it.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Publish', isPreferred: true, onPress: () => change({ published: true }) },
      ]);
    }
  };

  const askDelete = () => {
    if (!program || !token) return;
    Alert.alert(`Delete ${program.name}?`, 'It leaves your Library for good, with every change you made to it.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          setBusy(true);
          void deleteProgram(token, program.id).then((ok) => {
            setBusy(false);
            if (!ok) {
              Alert.alert('That did not delete.', 'Check your connection and try again.');
              return;
            }
            remove(program.id);
            back();
          });
        },
      },
    ]);
  };

  // A new workout goes on the first rest day of the week.
  const addWorkout = () => {
    if (!program) return;
    const rest = program.schedule.findIndex((d) => d === 'rest');
    if (rest < 0) {
      Alert.alert('Every day already trains.', 'Remove a workout to make room for another.');
      return;
    }
    Alert.prompt('Add workout to program', `It goes on ${cap(WEEK[rest]!)}.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Add',
        isPreferred: true,
        onPress: (name?: string) => {
          const n = name?.trim();
          if (!n) return;
          const schedule = program.schedule.map((d, i) => (i === rest ? 'training' : d)) as ProgramRecord['schedule'];
          const days: ProgramDay[] = WEEK.flatMap((weekday, i) => {
            if (schedule[i] !== 'training') return [];
            const had = program.days.find((d) => d.weekday === weekday);
            return [had ?? { weekday, workouts: [{ name: n, icon: 'full_body', exercises: [] }] }];
          });
          change({ schedule, days });
        },
      },
    ], 'plain-text');
  };

  // A workout's "…": rename it, or take it off the days it falls on.
  const workoutOptions = (r: Repeat) => {
    if (!program) return;
    ActionSheetIOS.showActionSheetWithOptions(
      { title: r.workout.name, options: ['Rename', 'Remove', 'Cancel'], destructiveButtonIndex: 1, cancelButtonIndex: 2 },
      (i) => {
        if (i === 0) {
          Alert.prompt('Rename workout', undefined, [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Save',
              isPreferred: true,
              onPress: (name?: string) => {
                const n = name?.trim();
                if (!n) return;
                change({
                  days: program.days.map((d) =>
                    r.days.includes(d.weekday) ? { ...d, workouts: d.workouts.map((w, j) => (j === 0 ? { ...w, name: n } : w)) } : d,
                  ),
                });
              },
            },
          ], 'plain-text', r.workout.name);
        } else if (i === 1) {
          Alert.alert(`Remove ${r.workout.name}?`, `${r.days.map(cap).join(', ')} become rest days.`, [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Remove',
              style: 'destructive',
              onPress: () =>
                change({
                  schedule: program.schedule.map((d, k) => (r.days.includes(WEEK[k]!) ? 'rest' : d)) as ProgramRecord['schedule'],
                  days: program.days.filter((d) => !r.days.includes(d.weekday)),
                }),
            },
          ]);
        }
      },
    );
  };

  const padTop = insets.top + tokens.sizing.tapTarget.ios + tokens.space[16];
  const workouts = program ? trainingDays(program) : 0;
  const sets = planned.reduce((n, x) => n + x.sets, 0);
  const rows = program ? repeats(program) : [];

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingTop: padTop, paddingHorizontal: tokens.space[24], paddingBottom: tokens.space[24], gap: tokens.space[16] }}
        showsVerticalScrollIndicator={false}
      >
        {program ? (
          <>
            {trained.length > 0 ? (
              <View style={{ alignItems: 'center', paddingVertical: tokens.space[8] }}>
                <WorkoutBody exercises={trained} height={tokens.programPage.bodyHeight} />
              </View>
            ) : null}

            <View>
              <Txt variant="screenTitle" family="serif" weight={500}>
                {program.name}
              </Txt>
              <Txt variant="captionTight" color={c.textSecondary} style={{ marginTop: 2 }}>
                {[weekLine(program), own && program.published ? 'Published' : ''].filter(Boolean).join(' · ')}
              </Txt>
              <View style={{ marginTop: tokens.space[12] }}>
                <DayDots schedule={program.schedule} />
              </View>
            </View>

            <View style={{ flexDirection: 'row', gap: tokens.space[16], paddingVertical: tokens.space[8] }}>
              <Stat label="Workouts" value={String(workouts)} suffix="a week" />
              <Stat label="Exercises" value={String(new Set(planned.map((x) => x.exercise)).size)} />
              <Stat label="Sets" value={String(sets)} suffix="a week" />
            </View>

            <Txt variant="section" family="serif" weight={500} style={{ marginTop: tokens.space[8] }}>
              Workouts in program
            </Txt>
            {/* Each workout its own row on the page, as the reference lists them:
                its tile, its name, what it holds and the days it falls on. */}
            <View style={{ gap: tokens.space[16] }}>
              {own ? (
                <Pressable accessibilityRole="button" accessibilityLabel="Add workout to program" onPress={addWorkout}>
                  {({ pressed }) => (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: tokens.space[16], opacity: pressed ? 0.6 : 1 }}>
                      <Tile>
                        <Icon name="plus" size={24} color={c.text} />
                      </Tile>
                      <Txt variant="rowTitle" color={c.text} style={{ flexGrow: 1, flexShrink: 1 }}>
                        Add workout to program
                      </Txt>
                    </View>
                  )}
                </Pressable>
              ) : null}
              {rows.map((r) => {
                const w = r.workout;
                const xs = w.exercises ?? [];
                const n = xs.reduce((s, x) => s + x.sets, 0);
                return (
                  <Pressable
                    key={r.days.join()}
                    accessibilityRole="button"
                    accessibilityLabel={`${w.name}, ${r.days.join(', ')}`}
                    onPress={() => {
                      open(program, r.first);
                      router.push('/session');
                    }}
                  >
                    {({ pressed }) => (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: tokens.space[16], opacity: pressed ? 0.6 : 1 }}>
                        <Tile tone="accent">
                          <Txt variant="serifCardTitle" family="serif" weight={500} color={c.accent}>
                            {initials(w.name)}
                          </Txt>
                        </Tile>
                        <View style={{ flexGrow: 1, flexShrink: 1 }}>
                          <Txt variant="rowTitle" color={c.text} numberOfLines={1}>
                            {w.name}
                          </Txt>
                          <Txt variant="captionTight" color={c.textSecondary} tnum style={{ marginTop: 2 }}>
                            {xs.length > 0
                              ? `${xs.length} ${xs.length === 1 ? 'exercise' : 'exercises'} · ${n} ${n === 1 ? 'set' : 'sets'}`
                              : 'No exercises yet'}
                          </Txt>
                          <Txt variant="captionTight" color={c.textSecondary} style={{ marginTop: 1 }}>
                            {r.days.map((d) => cap(d).slice(0, 3)).join(' · ')}
                          </Txt>
                        </View>
                        {own ? (
                          <>
                            <Pressable
                              accessibilityRole="button"
                              accessibilityLabel={`Start ${w.name}`}
                              hitSlop={tokens.space[4]}
                              onPress={() => startWorkout(r.first)}
                              style={({ pressed: p }) => ({
                                width: tokens.programPage.play,
                                height: tokens.programPage.play,
                                borderRadius: tokens.radius.rung,
                                borderWidth: 1.5,
                                borderColor: c.text,
                                opacity: p ? 0.6 : 1,
                                alignItems: 'center',
                                justifyContent: 'center',
                              })}
                            >
                              <Icon name="play" size={16} color={c.text} width={1.8} />
                            </Pressable>
                            <Pressable
                              accessibilityRole="button"
                              accessibilityLabel={`${w.name} options`}
                              hitSlop={tokens.space[8]}
                              onPress={() => workoutOptions(r)}
                            >
                              {/* Lying flat, as the "…" at the top of the screen does. */}
                              <View style={{ transform: [{ rotate: '90deg' }] }}>
                                <Icon name="dots" size={22} color={c.text} width={1.8} />
                              </View>
                            </Pressable>
                          </>
                        ) : (
                          <Icon name="chevronRight" size={20} color={c.textSecondary} />
                        )}
                      </View>
                    )}
                  </Pressable>
                );
              })}
            </View>
          </>
        ) : missing ? (
          <EmptyState line="This program is no longer here." />
        ) : null}
      </ScrollView>

      {/* Someone else's program: Duplicate, at the foot of the screen. */}
      {program && !own ? (
        <View
          style={{
            paddingTop: tokens.space[16],
            paddingHorizontal: tokens.space[20],
            paddingBottom: Math.max(tokens.space[24], insets.bottom),
            backgroundColor: c.bg,
            borderTopWidth: 1,
            borderTopColor: c.border,
          }}
        >
          {/* Every press makes another copy in Library. */}
          <PrimaryButton label="Duplicate" icon="duplicate" disabled={busy} onPress={duplicate} />
        </View>
      ) : null}

      <Stack.Toolbar placement="left">
        <Stack.Toolbar.Button
          icon={backIcon}
          iconRenderingMode="template"
          tintColor={c.text}
          accessibilityLabel="Back"
          onPress={back}
        />
      </Stack.Toolbar>
      {program && own ? (
        // The person's own program: Share, and its options in the native glass
        // menu, as the reference has them.
        <Stack.Toolbar placement="right">
          <Stack.Toolbar.Button icon="square.and.arrow.up" tintColor={c.text} accessibilityLabel={`Share ${program.name}`} onPress={share} />
          <Stack.Toolbar.Menu icon="ellipsis" tintColor={c.text} accessibilityLabel="Program options">
            <Stack.Toolbar.MenuAction icon="play.fill" onPress={startProgram} disabled={program.days.length === 0}>
              Start program
            </Stack.Toolbar.MenuAction>
            <Stack.Toolbar.MenuAction icon="square.and.arrow.up" onPress={share}>
              Share
            </Stack.Toolbar.MenuAction>
            <Stack.Toolbar.MenuAction icon="pencil" onPress={edit}>
              Edit
            </Stack.Toolbar.MenuAction>
            <Stack.Toolbar.MenuAction icon={program.published ? 'globe.badge.chevron.backward' : 'globe'} onPress={togglePublish}>
              {program.published ? 'Unpublish program' : 'Publish program'}
            </Stack.Toolbar.MenuAction>
            <Stack.Toolbar.MenuAction icon="trash" destructive onPress={askDelete}>
              Delete
            </Stack.Toolbar.MenuAction>
          </Stack.Toolbar.Menu>
        </Stack.Toolbar>
      ) : program ? (
        <Stack.Toolbar placement="right">
          <Stack.Toolbar.Button icon="plus.square.on.square" tintColor={c.text} accessibilityLabel={`Duplicate ${program.name}`} onPress={duplicate} />
          <Stack.Toolbar.Button icon="square.and.arrow.up" tintColor={c.text} accessibilityLabel={`Share ${program.name}`} onPress={share} />
        </Stack.Toolbar>
      ) : null}
    </View>
  );
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** A workout's tile: its initials on the accent's soft tone, or the raised surface for Add. */
function Tile({ tone = 'raised', children }: { tone?: 'raised' | 'accent'; children: ReactNode }) {
  const { c } = useTheme();
  const size = tokens.iconTile.size.sessionHeader;
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: tokens.iconTile.radius,
        backgroundColor: tone === 'accent' ? c.accentSoft : c.surfaceRaised,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {children}
    </View>
  );
}

/** "Full body" → "Fb", "Pull" → "Pu": what a workout's tile carries. */
function initials(name: string): string {
  const words = name.trim().split(/\s+/);
  const first = words[0] ?? '';
  const two = words.length > 1 ? first.charAt(0) + (words[1] ?? '').charAt(0) : first.slice(0, 2);
  return two.charAt(0).toUpperCase() + two.slice(1).toLowerCase();
}

type Repeat = { workout: ProgramWorkout; days: string[]; first: number };

/**
 * The program's workouts, each once: the same workout on several days is one
 * entry with those days, in week order, and the first of them to open.
 */
function repeats(program: ProgramRecord): Repeat[] {
  const out: (Repeat & { key: string })[] = [];
  program.days.forEach((d, i) => {
    const workout = d.workouts[0];
    if (!workout) return;
    const key = JSON.stringify(workout);
    const same = out.find((o) => o.key === key);
    if (same) same.days.push(d.weekday);
    else out.push({ key, workout, days: [d.weekday], first: i });
  });
  return out;
}

function Stat({ label, value, suffix }: { label: string; value: string; suffix?: string }) {
  const { c } = useTheme();
  return (
    <View style={{ flexGrow: 1, flexBasis: 0 }}>
      <MicroCaps>{label}</MicroCaps>
      <View style={{ flexDirection: 'row', alignItems: 'baseline', marginTop: tokens.space[8] }}>
        <Txt variant="numeralM" weight={600} tnum>
          {value}
        </Txt>
        {suffix ? (
          <Txt variant="unitSmall" color={c.textSecondary} style={{ marginLeft: 3 }}>
            {suffix}
          </Txt>
        ) : null}
      </View>
    </View>
  );
}
