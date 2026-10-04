import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Pressable, ScrollView, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '../components/icon';
import { Rung } from '../components/rung';
import { Card, EmptyState, SecondaryButton } from '../components/surfaces';
import { ExerciseIcon } from '../figure/figure';
import { useAuth } from '../auth/auth';
import { MicroCaps, Txt } from '../theme/text';
import { tokens, useTheme } from '../theme/theme';
import { amount, totals, useElapsed, useSession, type SessionExercise, type SessionSet } from '../session/session';

/**
 * A workout, full screen over the tabs (PLAN.md §2), laid out as Stavros
 * showed it (4 October 2026) and drawn in Alke's design: across the top the
 * minimise chevron, the workout and the action; then the session's numbers
 * in a card — duration, volume and sets, over a rung of the sets done against
 * the sets planned; then every exercise in order, each its own card led by its
 * icon, with its sets under its name. An exercise opens to its sets as a
 * table — set, previous, load, reps and the check that marks it done — with
 * Add set under it. Add exercise closes the list.
 *
 * Before it starts it shows only what is planned: the exercises, their sets,
 * and Start. The duration starts counting at Start and stops at Finish.
 *
 * OPEN: nothing is stored when the session is finished, so Previous has
 * nothing to show yet.
 */
export default function SessionScreen() {
  const { c } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { account } = useAuth();
  const { session, categories, start, finish, added } = useSession();
  const [open, setOpen] = useState<ReadonlySet<string>>(new Set());
  const scroller = useRef<ScrollView>(null);
  const started = session?.startedAt != null;
  const ready = categories.length > 0;
  const shown = session && ready ? session.exercises.filter((x) => x.info) : [];
  const first = shown[0]?.key;

  // Started, the first exercise is open, as the work begins with it.
  useEffect(() => {
    if (started && first) setOpen((now) => (now.size === 0 ? new Set([first]) : now));
  }, [started, first]);

  // An exercise just added opens, at the end of the list.
  useEffect(() => {
    if (!added) return;
    setOpen((now) => new Set(now).add(added));
    const t = setTimeout(() => scroller.current?.scrollToEnd({ animated: true }), 0);
    return () => clearTimeout(t);
  }, [added]);

  if (!session) return <View style={{ flex: 1, backgroundColor: c.bg }} />;

  const unit = account?.units === 'lb' ? 'lb' : 'kg';
  const workout = session.program.days[session.day]?.workouts[session.workout];
  const toggle = (key: string) =>
    setOpen((now) => {
      const next = new Set(now);
      if (!next.delete(key)) next.add(key);
      return next;
    });

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <TopRow
        title={workout?.name ?? session.program.name}
        action={
          started ? (
            <TopAction
              label="Finish"
              onPress={() => {
                finish();
                router.back();
              }}
            />
          ) : (
            <TopAction label="Start" onPress={start} />
          )
        }
      />
      <ScrollView
        ref={scroller}
        style={{ flex: 1 }}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        automaticallyAdjustKeyboardInsets
        contentContainerStyle={{
          paddingTop: tokens.space[16],
          paddingHorizontal: tokens.space[20],
          paddingBottom: insets.bottom + tokens.space[24],
          gap: tokens.space[12],
        }}
        showsVerticalScrollIndicator={false}
      >
        <Numbers exercises={shown} startedAt={session.startedAt} unit={unit} />
        {ready && shown.length === 0 ? <EmptyState line="No exercises planned yet." /> : null}
        {shown.map((x) => (
          <ExerciseCard
            key={x.key}
            exercise={x}
            unit={unit}
            open={started && open.has(x.key)}
            onToggle={started ? () => toggle(x.key) : undefined}
          />
        ))}
        {started ? (
          <SecondaryButton
            label="Add exercise"
            icon="plus"
            dashed
            onPress={() => router.push('/add-exercise')}
            style={{ marginTop: tokens.space[4] }}
          />
        ) : null}
      </ScrollView>
    </View>
  );
}

/** The minimise chevron, the workout's name, and the action. */
function TopRow({ title, action }: { title: string; action: ReactNode }) {
  const { c } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const tap = tokens.sizing.tapTarget.ios;
  return (
    <View
      style={{
        paddingTop: insets.top + tokens.space[20],
        paddingHorizontal: tokens.space[20],
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      {/* Centred on the screen, whatever the widths either side of it. */}
      <View
        pointerEvents="none"
        style={{ position: 'absolute', left: tap * 2, right: tap * 2, bottom: 0, height: tap, alignItems: 'center', justifyContent: 'center' }}
      >
        <MicroCaps numberOfLines={1}>{title}</MicroCaps>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Minimise session"
        onPress={() => router.back()}
        style={{ width: tap, height: tap, justifyContent: 'center' }}
      >
        <Icon name="chevronDown" size={24} color={c.textSecondary} width={1.7} />
      </Pressable>
      {action}
    </View>
  );
}

/** The accent action across the top: Start, then Finish. */
function TopAction({ label, onPress }: { label: string; onPress: () => void }) {
  const { c } = useTheme();
  const { height, paddingHorizontal } = tokens.session.action;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={(tokens.sizing.tapTarget.ios - height) / 2}
      onPress={onPress}
      style={({ pressed }) => ({
        height,
        paddingHorizontal,
        borderRadius: tokens.radius.rung,
        backgroundColor: c.accent,
        opacity: pressed ? 0.8 : 1,
        alignItems: 'center',
        justifyContent: 'center',
      })}
    >
      <Txt variant="label" weight={600} color={c.onAccent}>
        {label}
      </Txt>
    </Pressable>
  );
}

/**
 * The session's numbers, as Home's week draws its own: a micro-caps label
 * over a numeral with its unit set small beside it. Started, the duration
 * counts up in the accent, and the sets done stand on a rung against the sets
 * planned. Before the start, only what is planned.
 */
function Numbers({ exercises, startedAt, unit }: { exercises: SessionExercise[]; startedAt: number | null; unit: string }) {
  const { done, planned, volume } = totals(exercises);
  return (
    <Card>
      {startedAt == null ? (
        <View style={{ flexDirection: 'row', gap: tokens.space[16] }}>
          <Stat label="Exercises" value={String(exercises.length)} />
          <Stat label="Sets" value={String(planned)} />
        </View>
      ) : (
        <>
          <View style={{ flexDirection: 'row', gap: tokens.space[16] }}>
            <Duration startedAt={startedAt} />
            <Stat label="Volume" value={String(Math.round(volume))} suffix={unit} />
            <Stat label="Sets" value={String(done)} suffix={`of ${planned}`} />
          </View>
          <View style={{ marginTop: tokens.space[16] }}>
            <Rung value={done} target={Math.max(planned, 1)} />
          </View>
        </>
      )}
    </Card>
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
  onToggle?: () => void;
}) {
  const { c } = useTheme();
  const { addSet } = useSession();
  const info = exercise.info;
  if (!info) return null;
  return (
    <Card padding={tokens.space[16]}>
      <Pressable
        accessibilityRole={onToggle ? 'button' : undefined}
        accessibilityLabel={info.name}
        accessibilityState={onToggle ? { expanded: open } : undefined}
        disabled={!onToggle}
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
          {open ? (
            <Txt variant="captionTight" color={c.textSecondary} style={{ marginTop: tokens.space[4] }}>
              {[exercise.group, info.type].filter(Boolean).join(' · ')}
            </Txt>
          ) : (
            <View style={{ marginTop: tokens.space[4], gap: tokens.space[4] }}>
              {exercise.rows.map((r, i) => (
                <SetLine key={i} n={i + 1} row={r} unit={unit} />
              ))}
            </View>
          )}
        </View>
        {onToggle ? (
          <Icon name={open ? 'chevronUp' : 'chevronDown'} size={20} color={c.textSecondary} />
        ) : null}
      </Pressable>
      {open ? (
        <View style={{ marginTop: tokens.space[16] }}>
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
      ) : null}
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
 * it is being typed in — holding a tabular numeral.
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

