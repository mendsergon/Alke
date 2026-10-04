import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Alert, Pressable, ScrollView, TextInput, View } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { Icon } from '../components/icon';
import { Rung } from '../components/rung';
import { Card, EmptyState, PrimaryButton, SecondaryButton } from '../components/surfaces';
import { ReorderList } from '../components/reorder-list';
import { ExerciseIcon } from '../figure/figure';
import { useAuth } from '../auth/auth';
import { MicroCaps, Txt } from '../theme/text';
import { tokens, useTheme } from '../theme/theme';
import {
  amount,
  elapsed,
  totals,
  useElapsed,
  useSession,
  type SessionExercise,
  type SessionSet,
} from '../session/session';

/** How long an exercise's sets take to open or close. */
const OPEN_MS = 220;

/**
 * The workout being done (Stavros, 4 October 2026): a page of its own, not
 * the preview it was started from. Laid out as the reference he showed, in
 * Alke's design: minimise on the left; Finish, and a "…" holding Discard
 * workout, on the right — nothing here edits the program. The session's
 * numbers on the page (the duration counting up in the accent, the volume,
 * the sets done over a rung of the sets planned); then every exercise as its
 * card, its sets one line each, opening smoothly to a table to fill in; an
 * exercise is put elsewhere in the order by pressing it until it lifts and
 * dragging it; Add exercise closes the list. Finished, the page shows what
 * the workout came to, and Done ends it.
 *
 * OPEN: a finished workout is not stored yet, so Previous has nothing to
 * show and the summary is gone once Done is pressed.
 */
export default function WorkoutScreen() {
  const { c } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { account } = useAuth();
  const { session, categories, finish, discard, move, added } = useSession();
  const [open, setOpen] = useState<ReadonlySet<string>>(new Set());
  // What the workout came to, kept once it is finished.
  const [summary, setSummary] = useState<{ time: string; volume: number; done: number; planned: number } | null>(null);
  const scroller = useRef<ScrollView>(null);
  const ready = categories.length > 0;
  const shown = session && ready ? session.exercises.filter((x) => x.info) : [];
  const first = shown[0]?.key;
  const unit = account?.units === 'lb' ? 'lb' : 'kg';

  // The work begins with the first exercise, open.
  useEffect(() => {
    if (first) setOpen((now) => (now.size === 0 ? new Set([first]) : now));
  }, [first]);

  // An exercise just added opens, at the end of the list.
  useEffect(() => {
    if (!added) return;
    setOpen((now) => new Set(now).add(added));
    const t = setTimeout(() => scroller.current?.scrollToEnd({ animated: true }), 0);
    return () => clearTimeout(t);
  }, [added]);

  const padTop = insets.top + tokens.sizing.tapTarget.ios + tokens.space[16];

  if (summary) {
    return (
      <View style={{ flex: 1, backgroundColor: c.bg }}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingTop: padTop, paddingHorizontal: tokens.space[24], gap: tokens.space[24] }}
          showsVerticalScrollIndicator={false}
        >
          <View>
            <Txt variant="screenTitle" family="serif" weight={500}>
              Workout done
            </Txt>
            <Txt variant="captionTight" color={c.textSecondary} style={{ marginTop: 2 }}>
              {session?.program.name ?? ''}
            </Txt>
          </View>
          <View>
            <View style={{ flexDirection: 'row', gap: tokens.space[16] }}>
              <Stat label="Duration" value={summary.time} accent />
              <Stat label="Volume" value={String(Math.round(summary.volume))} suffix={unit} />
              <Stat label="Sets" value={String(summary.done)} suffix={`of ${summary.planned}`} />
            </View>
            <View style={{ marginTop: tokens.space[12] }}>
              <Rung value={summary.done} target={Math.max(summary.planned, 1)} />
            </View>
          </View>
        </ScrollView>
        <View
          style={{
            paddingTop: tokens.space[16],
            paddingHorizontal: tokens.space[20],
            paddingBottom: Math.max(tokens.space[24], insets.bottom),
            borderTopWidth: 1,
            borderTopColor: c.border,
            backgroundColor: c.bg,
          }}
        >
          <PrimaryButton
            label="Done"
            icon="check"
            onPress={() => {
              finish();
              router.back();
            }}
          />
        </View>
      </View>
    );
  }

  if (!session) return <View style={{ flex: 1, backgroundColor: c.bg }} />;

  const workout = session.program.days[session.day]?.workouts[session.workout];
  const toggle = (key: string) =>
    setOpen((now) => {
      const next = new Set(now);
      if (!next.delete(key)) next.add(key);
      return next;
    });

  const askFinish = () => {
    Alert.alert('Finish workout?', 'The time stops here.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Finish',
        isPreferred: true,
        onPress: () => {
          const t = totals(shown);
          setSummary({
            time: elapsed(session.startedAt == null ? 0 : Date.now() - session.startedAt),
            volume: t.volume,
            done: t.done,
            planned: t.planned,
          });
        },
      },
    ]);
  };

  const askDiscard = () => {
    Alert.alert('Discard this workout?', 'Nothing from it is kept.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Discard',
        style: 'destructive',
        onPress: () => {
          discard();
          router.back();
        },
      },
    ]);
  };

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <ScrollView
        ref={scroller}
        style={{ flex: 1 }}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        automaticallyAdjustKeyboardInsets
        contentContainerStyle={{
          // Under the native header, as the category screen sits.
          paddingTop: padTop,
          paddingHorizontal: tokens.space[20],
          paddingBottom: insets.bottom + tokens.space[24],
          gap: tokens.space[12],
        }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ paddingHorizontal: tokens.space[4] }}>
          <Txt variant="screenTitle" family="serif" weight={500}>
            {workout?.name ?? session.program.name}
          </Txt>
          <Txt variant="captionTight" color={c.textSecondary} style={{ marginTop: 2 }}>
            {session.program.name}
          </Txt>
        </View>
        <Numbers exercises={shown} startedAt={session.startedAt} unit={unit} />
        {ready && shown.length === 0 ? <EmptyState line="No exercises yet." /> : null}
        <ReorderList
          items={shown}
          keyOf={(x) => x.key}
          gap={tokens.space[12]}
          onReorder={(from, to) => {
            const a = session.exercises.findIndex((x) => x.key === shown[from]?.key);
            const b = session.exercises.findIndex((x) => x.key === shown[to]?.key);
            move(a, b);
          }}
          renderItem={(x) => (
            <ExerciseCard exercise={x} unit={unit} open={open.has(x.key)} onToggle={() => toggle(x.key)} />
          )}
        />
        <AddExerciseRow onPress={() => router.push('/add-exercise')} />
      </ScrollView>

      {/* The app's native header buttons, as the category screen has them. */}
      <Stack.Toolbar placement="left">
        <Stack.Toolbar.Button
          icon="chevron.down"
          tintColor={c.text}
          accessibilityLabel="Minimise workout"
          onPress={() => router.back()}
        />
      </Stack.Toolbar>
      <Stack.Toolbar placement="right">
        <Stack.Toolbar.Menu icon="ellipsis" tintColor={c.text} accessibilityLabel="Workout options">
          <Stack.Toolbar.MenuAction icon="trash" destructive onPress={askDiscard}>
            Discard workout
          </Stack.Toolbar.MenuAction>
        </Stack.Toolbar.Menu>
        <Stack.Toolbar.Button tintColor={c.accent} accessibilityLabel="Finish" onPress={askFinish}>
          Finish
        </Stack.Toolbar.Button>
      </Stack.Toolbar>
    </View>
  );
}

/**
 * Add exercise: the screen's one action at the end of the list, as the
 * reference has it — the design's accent primary button, full width.
 */
function AddExerciseRow({ onPress }: { onPress: () => void }) {
  return (
    <View style={{ marginTop: tokens.space[8] }}>
      <PrimaryButton label="Add exercise" icon="plus" onPress={onPress} />
    </View>
  );
}

/**
 * The session's numbers, as Home's week draws its own: the duration counting
 * up in the accent, the volume, and the sets done over a rung of the sets
 * planned.
 */
function Numbers({ exercises, startedAt, unit }: { exercises: SessionExercise[]; startedAt: number | null; unit: string }) {
  const { done, planned, volume } = totals(exercises);
  return (
    <View style={{ paddingHorizontal: tokens.space[4], paddingVertical: tokens.space[8] }}>
      <View style={{ flexDirection: 'row', gap: tokens.space[16] }}>
        <Duration startedAt={startedAt ?? Date.now()} />
        <Stat label="Volume" value={String(Math.round(volume))} suffix={unit} />
        <Stat label="Sets" value={String(done)} suffix={`of ${planned}`} />
      </View>
      <View style={{ marginTop: tokens.space[12] }}>
        <Rung value={done} target={Math.max(planned, 1)} />
      </View>
    </View>
  );
}

function Stat({ label, value, suffix, accent = false }: { label: string; value: string; suffix?: string; accent?: boolean }) {
  const { c } = useTheme();
  return (
    <View style={{ flexGrow: 1, flexBasis: 0 }}>
      <MicroCaps>{label}</MicroCaps>
      <View style={{ flexDirection: 'row', alignItems: 'baseline', marginTop: tokens.space[8] }}>
        <Txt variant="numeralM" weight={600} tnum color={accent ? c.accent : c.text}>
          {value}
        </Txt>
        {suffix ? (
          <Txt variant="unitSmall" color={c.textSecondary} tnum style={{ marginLeft: 3 }}>
            {suffix}
          </Txt>
        ) : null}
      </View>
    </View>
  );
}

/** The duration on its own, so only it redraws each second. */
function Duration({ startedAt }: { startedAt: number }) {
  const time = useElapsed(startedAt);
  return <Stat label="Duration" value={time} accent />;
}

/**
 * What opens and closes: its height follows what it holds, from nothing to
 * all of it, so the cards under it move with it rather than jumping.
 */
function Collapse({ open, children }: { open: boolean; children: ReactNode }) {
  const height = useSharedValue(0);
  const measured = useSharedValue(false);
  const progress = useSharedValue(open ? 1 : 0);

  useEffect(() => {
    progress.value = withTiming(open ? 1 : 0, { duration: OPEN_MS, easing: Easing.out(Easing.cubic) });
  }, [open, progress]);

  // What it holds is laid out on its own, out of the clipping box's flow, so
  // its full height is measured whatever height the box is at; the box alone
  // animates, from nothing to that height.
  const style = useAnimatedStyle(() => ({
    height: measured.value ? height.value * progress.value : 0,
    opacity: progress.value,
  }));

  return (
    <Animated.View style={[{ overflow: 'hidden' }, style]}>
      <View
        style={{ position: 'absolute', top: 0, left: 0, right: 0 }}
        onLayout={(e) => {
          height.value = e.nativeEvent.layout.height;
          measured.value = true;
        }}
      >
        {children}
      </View>
    </Animated.View>
  );
}

/**
 * An exercise, its own card led by its icon. Closed, its sets sit under its
 * name, one line each; open, they are a table to fill in.
 */
function ExerciseCard({
  exercise,
  unit,
  open,
  onToggle,
}: {
  exercise: SessionExercise;
  unit: string;
  open: boolean;
  onToggle: () => void;
}) {
  const { c } = useTheme();
  const { addSet } = useSession();
  const info = exercise.info;
  if (!info) return null;
  return (
    <Card padding={tokens.space[16]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={info.name}
        accessibilityState={{ expanded: open }}
        onPress={onToggle}
        style={{ flexDirection: 'row', alignItems: 'flex-start', gap: tokens.space[12] }}
      >
        {info.icon ? (
          <ExerciseIcon icon={info.icon} main={info.main} secondary={info.secondary} size={tokens.iconTile.size.listRow} seamAll />
        ) : null}
        <View style={{ flexGrow: 1, flexShrink: 1 }}>
          <Txt variant="rowTitle" color={c.text} numberOfLines={2}>
            {info.name}
          </Txt>
          <Txt variant="captionTight" color={c.textSecondary} style={{ marginTop: tokens.space[4] }}>
            {[exercise.group, info.type].filter(Boolean).join(' · ')}
          </Txt>
          <Collapse open={!open}>
            <View style={{ marginTop: tokens.space[8], gap: tokens.space[4] }}>
              {exercise.rows.map((r, i) => (
                <SetLine key={i} n={i + 1} row={r} unit={unit} />
              ))}
            </View>
          </Collapse>
        </View>
        <Icon name={open ? 'chevronUp' : 'chevronDown'} size={20} color={c.textSecondary} />
      </Pressable>
      <Collapse open={open}>
        <View style={{ paddingTop: tokens.space[16] }}>
          <SetTable exercise={exercise} unit={unit} />
          <SecondaryButton
            label="Add set"
            icon="plus"
            dashed
            height={tokens.sizing.tapTarget.ios}
            onPress={() => addSet(exercise.key)}
            style={{ marginTop: tokens.space[12] }}
          />
        </View>
      </Collapse>
    </Card>
  );
}

/** A set under a closed exercise: its number, then its load × reps, or a dash. */
function SetLine({ n, row, unit }: { n: number; row: SessionSet; unit: string }) {
  const { c } = useTheme();
  const load = amount(row.load);
  const reps = amount(row.reps);
  return (
    <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: tokens.space[12] }}>
      <Txt variant="label" weight={600} tnum color={row.done ? c.accent : c.textSecondary} style={{ minWidth: tokens.session.table.setColumn / 2 }}>
        {n}
      </Txt>
      {load != null || reps != null ? (
        <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
          <Txt variant="rowLabel" tnum color={c.text}>
            {load ?? '—'}
          </Txt>
          <Txt variant="unitSmall" color={c.textSecondary} style={{ marginLeft: 3 }}>
            {unit}
          </Txt>
          <Txt variant="captionTight" color={c.textSecondary} style={{ marginHorizontal: tokens.space[8] }}>
            ×
          </Txt>
          <Txt variant="rowLabel" tnum color={c.text}>
            {reps ?? '—'}
          </Txt>
        </View>
      ) : (
        <Txt variant="rowLabel" color={c.textSecondary}>
          —
        </Txt>
      )}
    </View>
  );
}

/** An open exercise's sets: set, previous, load, reps, and the check. */
function SetTable({ exercise, unit }: { exercise: SessionExercise; unit: string }) {
  const { c } = useTheme();
  const { setRow } = useSession();
  const t = tokens.session.table;
  return (
    <View style={{ gap: tokens.space[8] }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: tokens.space[8], paddingHorizontal: tokens.space[4] }}>
        <MicroCaps style={{ width: t.setColumn }}>Set</MicroCaps>
        <MicroCaps style={{ flexGrow: 1, flexBasis: 0 }}>Previous</MicroCaps>
        <MicroCaps style={{ width: t.input.width, textAlign: 'center' }}>{unit}</MicroCaps>
        <MicroCaps style={{ width: t.input.width, textAlign: 'center' }}>Reps</MicroCaps>
        <View style={{ width: t.check }} />
      </View>
      {exercise.rows.map((r, i) => (
        <View
          key={i}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: tokens.space[8],
            padding: tokens.space[4],
            borderRadius: tokens.radius.row,
            // A done set takes the accent's soft tone: the person's own work.
            backgroundColor: r.done ? c.accentSoft : 'transparent',
          }}
        >
          <Txt variant="label" weight={600} tnum color={c.accent} style={{ width: t.setColumn }}>
            {i + 1}
          </Txt>
          <Txt variant="captionTight" color={c.textSecondary} style={{ flexGrow: 1, flexBasis: 0 }}>
            —
          </Txt>
          <SetInput
            label={`Set ${i + 1} ${unit}`}
            value={r.load}
            decimal
            onChange={(load) => setRow(exercise.key, i, { load })}
          />
          <SetInput label={`Set ${i + 1} reps`} value={r.reps} onChange={(reps) => setRow(exercise.key, i, { reps })} />
          <Pressable
            accessibilityRole="checkbox"
            accessibilityLabel={`Set ${i + 1} done`}
            accessibilityState={{ checked: r.done }}
            onPress={() => setRow(exercise.key, i, { done: !r.done })}
            style={({ pressed }) => ({
              width: t.check,
              height: t.check,
              borderRadius: tokens.radius.button,
              backgroundColor: r.done ? c.accent : c.surfaceRaised,
              opacity: pressed ? 0.8 : 1,
              alignItems: 'center',
              justifyContent: 'center',
            })}
          >
            <Icon name="check" size={20} color={r.done ? c.onAccent : c.textSecondary} width={2} />
          </Pressable>
        </View>
      ))}
    </View>
  );
}

/**
 * A number to type: the design's input — raised, with a 2pt accent edge while
 * it is being typed in — holding a tabular numeral, with the number pad.
 */
function SetInput({
  label,
  value,
  decimal = false,
  onChange,
}: {
  label: string;
  value: string;
  decimal?: boolean;
  onChange: (text: string) => void;
}) {
  const { c } = useTheme();
  const [focused, setFocused] = useState(false);
  const t = tokens.session.table.input;
  return (
    <TextInput
      accessibilityLabel={label}
      value={value}
      onChangeText={(text) => onChange(decimal ? decimalOnly(text) : text.replace(/[^0-9]/g, ''))}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      keyboardType={decimal ? 'decimal-pad' : 'number-pad'}
      maxLength={decimal ? 6 : 3}
      placeholder="—"
      placeholderTextColor={c.textSecondary}
      selectTextOnFocus
      style={{
        width: t.width,
        height: t.height,
        borderRadius: tokens.radius.button,
        backgroundColor: c.surfaceRaised,
        borderWidth: 2,
        borderColor: focused ? c.accent : 'transparent',
        color: c.text,
        fontFamily: tokens.fontFamily.sansSemiBold,
        fontSize: tokens.type.numeralS.size,
        fontVariant: ['tabular-nums'],
        textAlign: 'center',
        padding: 0,
      }}
    />
  );
}

/** Digits and one decimal point; a comma is taken as the point. */
function decimalOnly(text: string): string {
  const cleaned = text.replace(',', '.').replace(/[^0-9.]/g, '');
  const dot = cleaned.indexOf('.');
  return dot < 0 ? cleaned : cleaned.slice(0, dot + 1) + cleaned.slice(dot + 1).replace(/\./g, '');
}
