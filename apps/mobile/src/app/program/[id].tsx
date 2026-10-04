import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, Share, View } from 'react-native';
import { askDuplicate } from '../../library/duplicate';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useBack } from '../../navigation/use-back';
import { useAuth } from '../../auth/auth';
import { useLibrary } from '../../library/library';
import { useSession } from '../../session/session';
import { getProgram, trainingDays, type ProgramRecord, type ProgramWorkout } from '../../backend/programs';
import { listMuscleCategories } from '../../backend/muscles';
import { cachedExercisesIn, listExercisesIn, weightsCollection, type Exercise } from '../../backend/exercises';
import { Card, PrimaryButton, Row } from '../../components/surfaces';
import { Icon } from '../../components/icon';
import { DayDots, weekLine } from '../../components/program-card';
import { WorkoutBody } from '../../components/workout-body';
import { MicroCaps, Txt } from '../../theme/text';
import { tokens, useTheme } from '../../theme/theme';
import backIcon from '../../../assets/images/back.png';

/**
 * A program, opened from its card (Stavros, 4 October 2026, after the
 * programs in Lyfta): what it trains as the whole figure, front and back, its
 * muscles lit — the emphasis design page 04 gives a program; its name, its
 * week, and its numbers as Home's week draws them; then its workouts, one row
 * a training day, each opening that workout to look at. Duplicate sits at the
 * foot of the screen and makes the person's own copy in Library.
 */
export default function ProgramScreen() {
  const { c } = useTheme();
  const router = useRouter();
  const back = useBack('/explore');
  const insets = useSafeAreaInsets();
  const { token } = useAuth();
  const { save } = useLibrary();
  const { open } = useSession();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [program, setProgram] = useState<ProgramRecord | null>(null);
  const [byKey, setByKey] = useState<ReadonlyMap<string, Exercise>>(new Map());
  const [saving, setSaving] = useState(false);

  const askSave = () => {
    if (!program || saving) return;
    askDuplicate(program.name, () => {
      setSaving(true);
      void save(program).finally(() => setSaving(false));
    });
  };

  useEffect(() => {
    let live = true;
    void getProgram(id, token).then((p) => {
      if (live && p) setProgram(p);
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

  const padTop = insets.top + tokens.sizing.tapTarget.ios + tokens.space[16];
  const workouts = program ? trainingDays(program) : 0;
  const sets = planned.reduce((n, x) => n + x.sets, 0);

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
                {weekLine(program)}
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
            <Card>
              {/* A workout that repeats is one row, with the days it falls on. */}
              {repeats(program).map((r, i) => {
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
                      <View style={{ opacity: pressed ? 0.6 : 1 }}>
                        <Row first={i === 0}>
                          <View
                            style={{
                              width: tokens.iconTile.size.listRow,
                              height: tokens.iconTile.size.listRow,
                              borderRadius: tokens.iconTile.radius,
                              backgroundColor: c.surfaceRaised,
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <Txt variant="label" weight={600} tnum color={c.accent}>
                              {`${r.days.length}×`}
                            </Txt>
                          </View>
                          <View style={{ flexGrow: 1, flexShrink: 1 }}>
                            <Txt variant="rowLabel" color={c.text}>
                              {w.name}
                            </Txt>
                            <Txt variant="captionTight" color={c.textSecondary} tnum style={{ marginTop: 1 }}>
                              {xs.length > 0
                                ? `${xs.length} ${xs.length === 1 ? 'exercise' : 'exercises'} · ${n} ${n === 1 ? 'set' : 'sets'}`
                                : 'No exercises yet'}
                            </Txt>
                            <Txt variant="captionTight" color={c.textSecondary} style={{ marginTop: 1 }}>
                              {r.days.map((d) => d.charAt(0).toUpperCase() + d.slice(1, 3)).join(' · ')}
                            </Txt>
                          </View>
                          <Icon name="chevronRight" size={20} color={c.textSecondary} />
                        </Row>
                      </View>
                    )}
                  </Pressable>
                );
              })}
            </Card>
          </>
        ) : null}
      </ScrollView>

      {/* Duplicate, at the foot of the screen, as the program's one action. */}
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
        <PrimaryButton label="Duplicate" icon="duplicate" disabled={!program || saving} onPress={askSave} />
      </View>

      <Stack.Toolbar placement="left">
        <Stack.Toolbar.Button
          icon={backIcon}
          iconRenderingMode="template"
          tintColor={c.text}
          accessibilityLabel="Back"
          onPress={back}
        />
      </Stack.Toolbar>
      {/* Share, top right, as the reference has it: the system's share sheet
          with a link that opens this program. */}
      {program ? (
        <Stack.Toolbar placement="right">
          {/* Duplicate, beside Share. */}
          <Stack.Toolbar.Button
            icon="plus.square.on.square"
            tintColor={c.text}
            accessibilityLabel={`Duplicate ${program.name}`}
            onPress={askSave}
          />
          <Stack.Toolbar.Button
            icon="square.and.arrow.up"
            tintColor={c.text}
            accessibilityLabel={`Share ${program.name}`}
            onPress={() => {
              void Share.share({ message: `${program.name} on Alke: alke://program/${program.id}` });
            }}
          />
        </Stack.Toolbar>
      ) : null}
    </View>
  );
}

/**
 * The program's workouts, each once: the same workout on several days is one
 * entry with those days, in week order, and the first of them to open.
 */
function repeats(program: ProgramRecord): { workout: ProgramWorkout; days: string[]; first: number }[] {
  const out: { key: string; workout: ProgramWorkout; days: string[]; first: number }[] = [];
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

