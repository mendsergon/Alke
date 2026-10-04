import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useBack } from '../../navigation/use-back';
import { useAuth } from '../../auth/auth';
import { useLibrary } from '../../library/library';
import { useSession } from '../../session/session';
import { getProgram, trainingDays, type ProgramRecord } from '../../backend/programs';
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
 * a training day, each opening that workout to look at. Save sits at the
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
              {program.days.map((d, i) => {
                const w = d.workouts[0];
                const xs = w?.exercises ?? [];
                const n = xs.reduce((s, x) => s + x.sets, 0);
                return (
                  <Pressable
                    key={d.weekday}
                    accessibilityRole="button"
                    accessibilityLabel={`${w?.name ?? 'Workout'}, ${d.weekday}`}
                    onPress={() => {
                      open(program, i);
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
                            <MicroCaps color={c.accent}>{d.weekday.slice(0, 3)}</MicroCaps>
                          </View>
                          <View style={{ flexGrow: 1, flexShrink: 1 }}>
                            <Txt variant="rowLabel" color={c.text}>
                              {w?.name ?? 'Workout'}
                            </Txt>
                            <Txt variant="captionTight" color={c.textSecondary} tnum style={{ marginTop: 1 }}>
                              {xs.length > 0
                                ? `${xs.length} ${xs.length === 1 ? 'exercise' : 'exercises'} · ${n} ${n === 1 ? 'set' : 'sets'}`
                                : 'No exercises yet'}
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

      {/* Save, at the foot of the screen, as the program's one action. */}
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
        <PrimaryButton
          label="Save"
          icon="plus"
          disabled={!program || saving}
          onPress={() => {
            if (!program) return;
            setSaving(true);
            void save(program).finally(() => setSaving(false));
          }}
        />
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
    </View>
  );
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

