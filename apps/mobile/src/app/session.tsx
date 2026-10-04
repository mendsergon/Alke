import { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '../components/icon';
import { Card, EmptyState } from '../components/surfaces';
import { ReorderList } from '../components/reorder-list';
import { WorkoutBody } from '../components/workout-body';
import { ExerciseIcon } from '../figure/figure';
import { MicroCaps, Txt } from '../theme/text';
import { tokens, useTheme } from '../theme/theme';
import { totals, useSession, type SessionExercise } from '../session/session';

/**
 * A workout before it starts (PLAN.md §2; Stavros, 4 October 2026): what is
 * planned, and nothing else. Across the top the app's native glass buttons —
 * minimise, and on the person's own program Edit and Start; the workout's
 * name as the screen's title; its exercises and sets as Home's week draws its
 * numbers, with what it trains beside them; then every exercise in order, its
 * own card led by its icon. Editing, each exercise takes a set fewer or more,
 * comes out, or is pressed until it lifts and dragged to a new place, and
 * exercises can be added; Start cannot be pressed while editing.
 *
 * Start opens the workout itself (app/workout.tsx), a page of its own.
 */
export default function SessionScreen() {
  const { c } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { session, categories, start, move, added } = useSession();
  const [editing, setEditing] = useState(false);
  const scroller = useRef<ScrollView>(null);
  const started = session?.startedAt != null;
  const ready = categories.length > 0;
  const shown = session && ready ? session.exercises.filter((x) => x.info) : [];

  // A workout already under way is the workout page, not its preview.
  useEffect(() => {
    if (started) router.replace('/workout');
  }, [started, router]);

  // An exercise just added shows, at the end of the list.
  useEffect(() => {
    if (!added) return;
    const t = setTimeout(() => scroller.current?.scrollToEnd({ animated: true }), 0);
    return () => clearTimeout(t);
  }, [added]);

  if (!session || started) return <View style={{ flex: 1, backgroundColor: c.bg }} />;

  const template = session.program.owner === '';
  const workout = session.program.days[session.day]?.workouts[session.workout];
  const padTop = insets.top + tokens.sizing.tapTarget.ios + tokens.space[16];
  const { planned } = totals(shown);

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <ScrollView
        ref={scroller}
        style={{ flex: 1 }}
        contentContainerStyle={{
          // Under the native header, as the category screen sits: content
          // scrolls up beneath its glass buttons and blurs at the top edge.
          paddingTop: padTop,
          paddingHorizontal: tokens.space[20],
          paddingBottom: insets.bottom + tokens.space[24],
          gap: tokens.space[12],
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* What the workout trains sits in the empty space beside its title
            and numbers, laid over it so nothing moves. */}
        <View pointerEvents="none" style={{ position: 'absolute', top: padTop, right: tokens.space[20] + tokens.space[4] }}>
          <WorkoutBody
            exercises={shown.flatMap((x) => (x.info ? [x.info] : []))}
            // As tall as the title, its line, the gap and the numbers together.
            height={
              tokens.type.screenTitle.lineHeight +
              2 +
              tokens.type.captionTight.lineHeight +
              tokens.space[12] +
              2 * tokens.space[8] +
              tokens.type.microCaps.lineHeight +
              tokens.space[8] +
              tokens.type.numeralM.lineHeight
            }
          />
        </View>
        {/* The workout's name is the screen's title, as every tab's is. */}
        <View style={{ paddingHorizontal: tokens.space[4] }}>
          <Txt variant="screenTitle" family="serif" weight={500}>
            {workout?.name ?? session.program.name}
          </Txt>
          <Txt variant="captionTight" color={c.textSecondary} style={{ marginTop: 2 }}>
            {session.program.name}
          </Txt>
        </View>
        {/* What is planned, as Home's week draws its numbers. */}
        <View style={{ paddingHorizontal: tokens.space[4], paddingVertical: tokens.space[8], flexDirection: 'row', gap: tokens.space[16] }}>
          <Stat label="Exercises" value={String(shown.length)} />
          <Stat label="Sets" value={String(planned)} />
          <View style={{ flexGrow: 1, flexBasis: 0 }} />
        </View>
        {ready && shown.length === 0 ? <EmptyState line="No exercises planned yet." /> : null}
        {editing ? (
          <ReorderList
            items={shown}
            keyOf={(x) => x.key}
            gap={tokens.space[12]}
            onReorder={(from, to) => {
              const a = session.exercises.findIndex((x) => x.key === shown[from]?.key);
              const b = session.exercises.findIndex((x) => x.key === shown[to]?.key);
              move(a, b);
            }}
            renderItem={(x) => <ExerciseCard exercise={x} editing />}
          />
        ) : (
          shown.map((x) => <ExerciseCard key={x.key} exercise={x} editing={false} />)
        )}
        {editing ? <AddExerciseRow onPress={() => router.push('/add-exercise')} /> : null}
      </ScrollView>

      {/* The app's native header buttons, as the category screen has them:
          glass on iOS 26, and the scroll edge blurs under them. */}
      <Stack.Toolbar placement="left">
        <Stack.Toolbar.Button
          icon="chevron.down"
          tintColor={c.text}
          accessibilityLabel="Minimise session"
          onPress={() => router.back()}
        />
      </Stack.Toolbar>
      {/* A template is everyone's: its workout is only looked at, and the
          program is duplicated from its page (Stavros, 4 October 2026). */}
      {template ? null : (
        <Stack.Toolbar placement="right">
          <Stack.Toolbar.Button
            icon={editing ? 'checkmark' : 'pencil'}
            tintColor={c.text}
            accessibilityLabel={editing ? 'Done editing' : 'Edit workout'}
            onPress={() => setEditing((now) => !now)}
          />
          {/* Not while editing: the workout is changed first, then started. */}
          <Stack.Toolbar.Button
            tintColor={c.accent}
            accessibilityLabel="Start"
            disabled={editing}
            onPress={() => {
              start();
              router.replace('/workout');
            }}
          >
            Start
          </Stack.Toolbar.Button>
        </Stack.Toolbar>
      )}
    </View>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flexGrow: 1, flexBasis: 0 }}>
      <MicroCaps>{label}</MicroCaps>
      <View style={{ flexDirection: 'row', alignItems: 'baseline', marginTop: tokens.space[8] }}>
        <Txt variant="numeralM" weight={600} tnum>
          {value}
        </Txt>
      </View>
    </View>
  );
}

/**
 * Add exercise, as the program page's "Add workout to program" row: a raised
 * 56pt tile with a plus, and the label beside it.
 */
function AddExerciseRow({ onPress }: { onPress: () => void }) {
  const { c } = useTheme();
  const size = tokens.iconTile.size.sessionHeader;
  return (
    <Pressable accessibilityRole="button" accessibilityLabel="Add exercise" onPress={onPress}>
      {({ pressed }) => (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: tokens.space[16],
            opacity: pressed ? 0.6 : 1,
            paddingHorizontal: tokens.space[4],
            marginTop: tokens.space[4],
          }}
        >
          <View
            style={{
              width: size,
              height: size,
              borderRadius: tokens.iconTile.radius,
              backgroundColor: c.surfaceRaised,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icon name="plus" size={24} color={c.text} />
          </View>
          <Txt variant="rowTitle" color={c.text} style={{ flexGrow: 1, flexShrink: 1 }}>
            Add exercise
          </Txt>
        </View>
      )}
    </Pressable>
  );
}

/**
 * An exercise planned, its own card led by its icon: its group, type and
 * sets, as a Library row says them. Editing, its sets go one fewer or one
 * more, and it can come out.
 */
function ExerciseCard({ exercise, editing }: { exercise: SessionExercise; editing: boolean }) {
  const { c } = useTheme();
  const { setSets, remove } = useSession();
  const info = exercise.info;
  if (!info) return null;
  return (
    <Card padding={tokens.space[16]}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: tokens.space[12] }}>
        {info.icon ? (
          <ExerciseIcon icon={info.icon} main={info.main} secondary={info.secondary} size={tokens.iconTile.size.listRow} seamAll />
        ) : null}
        <View style={{ flexGrow: 1, flexShrink: 1 }}>
          <Txt variant="rowTitle" color={c.text} numberOfLines={2}>
            {info.name}
          </Txt>
          {editing ? (
            <Stepper sets={exercise.rows.length} name={info.name} onChange={(n) => setSets(exercise.key, n)} />
          ) : (
            <Txt variant="captionTight" color={c.textSecondary} tnum style={{ marginTop: tokens.space[4] }}>
              {[exercise.group, info.type, `${exercise.rows.length} ${exercise.rows.length === 1 ? 'set' : 'sets'}`]
                .filter(Boolean)
                .join(' · ')}
            </Txt>
          )}
        </View>
        {editing ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Remove ${info.name}`}
            hitSlop={tokens.space[12]}
            onPress={() => remove(exercise.key)}
          >
            <Icon name="close" size={20} color={c.destructive} />
          </Pressable>
        ) : null}
      </View>
    </Card>
  );
}

/** Editing: the exercise's number of sets, one fewer or one more. */
function Stepper({ sets, name, onChange }: { sets: number; name: string; onChange: (n: number) => void }) {
  const { c } = useTheme();
  const step = (icon: 'minus' | 'plus', label: string, n: number, disabled: boolean) => (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      hitSlop={tokens.space[8]}
      onPress={() => onChange(n)}
      style={({ pressed }) => ({
        width: tokens.session.table.stepper,
        height: tokens.session.table.stepper,
        borderRadius: tokens.radius.rung,
        backgroundColor: c.surfaceRaised,
        opacity: disabled ? 0.45 : pressed ? 0.8 : 1,
        alignItems: 'center',
        justifyContent: 'center',
      })}
    >
      <Icon name={icon} size={16} color={c.text} width={1.8} />
    </Pressable>
  );
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: tokens.space[12], marginTop: tokens.space[8] }}>
      {step('minus', `One set fewer of ${name}`, sets - 1, sets <= 1)}
      <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
        <Txt variant="numeralS" weight={600} tnum>
          {sets}
        </Txt>
        <Txt variant="unitSmall" color={c.textSecondary} style={{ marginLeft: 3 }}>
          {sets === 1 ? 'set' : 'sets'}
        </Txt>
      </View>
      {step('plus', `One set more of ${name}`, sets + 1, false)}
    </View>
  );
}
