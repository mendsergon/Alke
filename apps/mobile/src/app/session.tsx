import { useEffect, useRef } from 'react';
import { FlatList, Pressable, ScrollView, View, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '../components/icon';
import { Rung } from '../components/rung';
import { Card, Chip, EmptyState, PrimaryButton, Row, SecondaryButton } from '../components/surfaces';
import { ExerciseIcon } from '../figure/figure';
import { MicroCaps, Txt } from '../theme/text';
import { tokens, useTheme } from '../theme/theme';
import { useElapsed, useSession, type Session, type SessionExercise } from '../session/session';

/**
 * A workout, full screen over the tabs (PLAN.md §2).
 *
 * Before it starts it is the workout's overview (Stavros, 4 October 2026):
 * Home's "Next session" card from design page 01 — the day, the program, the
 * exercises and sets as chips, and Start workout at the top — then the
 * planned exercises as Library's exercise rows on page 05, each led by its
 * icon. No timer yet.
 *
 * Started, it is design page 06: the minimise chevron and "Exercise 2 of 5"
 * across the top; the exercise's 56pt icon, its name and its sets, one
 * exercise to a page, swiped between in order; and the footer, where the
 * timer counts up from the start until Finish, over a rung of the sets done
 * against the sets planned, and Complete set. Add exercise sits where page 06
 * puts Add set.
 *
 * OPEN: entering a set's weight, reps and RIR is not designed (PLAN.md §3).
 * A set is completed with its numbers left as page 06 draws a set not yet
 * logged, and its load rung stays empty; nothing is stored once the session
 * is finished.
 */
export default function SessionScreen() {
  const { c } = useTheme();
  const { session } = useSession();
  if (!session) return <View style={{ flex: 1, backgroundColor: c.bg }} />;
  return session.startedAt == null ? <Overview session={session} /> : <Running session={session} />;
}

const count = (n: number, noun: string) => `${n} ${noun}${n === 1 ? '' : 's'}`;
const capitalised = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** The exercises whose name and icon are known: the ones a screen can draw. */
function drawable(session: Session, ready: boolean): SessionExercise[] {
  return ready ? session.exercises.filter((x) => x.info) : [];
}

/** Page 06's top row: the minimise chevron, and a centred line. */
function TopRow({ label, onClose }: { label: string; onClose: () => void }) {
  const { c } = useTheme();
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
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Minimise session"
        onPress={onClose}
        style={{ width: tap, height: tap, justifyContent: 'center' }}
      >
        <Icon name="chevronDown" size={24} color={c.textSecondary} width={1.7} />
      </Pressable>
      <MicroCaps>{label}</MicroCaps>
      <View style={{ width: tap, height: tap }} />
    </View>
  );
}

// ---------------------------------------------------------------------------
// Before the start
// ---------------------------------------------------------------------------

function Overview({ session }: { session: Session }) {
  const { c } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { categories, start } = useSession();
  const ready = categories.length > 0;
  const shown = drawable(session, ready);
  const sets = shown.reduce((n, x) => n + x.sets, 0);
  const day = session.program.days[session.day];
  const workout = day?.workouts[session.workout];
  const next = tokens.session.next;

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <TopRow label="" onClose={() => router.back()} />
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingTop: tokens.space[8],
          paddingHorizontal: tokens.space[24],
          paddingBottom: insets.bottom + tokens.space[24],
          gap: tokens.space[16],
        }}
        showsVerticalScrollIndicator={false}
      >
        <Card>
          <MicroCaps color={c.accent}>{day ? capitalised(day.weekday) : 'Workout'}</MicroCaps>
          <Txt variant="section" family="serif" weight={500} style={{ marginTop: next.titleTop }}>
            {session.program.name}
          </Txt>
          <Txt variant="label" weight={400} color={c.textSecondary} style={{ marginTop: next.subtitleTop }}>
            {workout?.name ?? ''}
          </Txt>
          <View
            style={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              gap: tokens.templateCard.chipGap,
              marginTop: next.chipsTop,
              marginBottom: next.chipsBottom,
            }}
          >
            <Chip>{count(shown.length, 'exercise')}</Chip>
            <Chip>{count(sets, 'set')}</Chip>
          </View>
          <PrimaryButton label="Start workout" icon="play" onPress={start} />
        </Card>

        <MicroCaps>Exercises</MicroCaps>
        {ready && shown.length === 0 ? <EmptyState line="No exercises planned yet." /> : null}
        {shown.length > 0 ? (
          <Card>
            {shown.map((x, i) => (
              <Row key={x.key} first={i === 0}>
                <ExerciseLead exercise={x} size={tokens.iconTile.size.listRow} />
                <View style={{ flexGrow: 1, flexShrink: 1 }}>
                  <Txt variant="rowLabel" color={c.text} numberOfLines={2}>
                    {x.info?.name}
                  </Txt>
                  <Txt variant="captionTight" color={c.textSecondary} tnum style={{ marginTop: 1 }}>
                    {[x.group, x.info?.type, count(x.sets, 'set')].filter(Boolean).join(' · ')}
                  </Txt>
                </View>
              </Row>
            ))}
          </Card>
        ) : null}
      </ScrollView>
    </View>
  );
}

/** An exercise's icon on its raised tile, at a list row's or the session header's size. */
function ExerciseLead({ exercise, size }: { exercise: SessionExercise; size: number }) {
  const info = exercise.info;
  if (!info?.icon) return <View style={{ width: size, height: size }} />;
  return <ExerciseIcon icon={info.icon} main={info.main} secondary={info.secondary} size={size} seamAll />;
}

// ---------------------------------------------------------------------------
// Started
// ---------------------------------------------------------------------------

function Running({ session }: { session: Session }) {
  const { c } = useTheme();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { categories, go } = useSession();
  const shown = drawable(session, categories.length > 0);
  const pager = useRef<FlatList<SessionExercise>>(null);
  const current = Math.max(0, shown.findIndex((x) => x.key === session.exercises[session.current]?.key));

  // Completing an exercise's last set, or adding one, moves to it.
  useEffect(() => {
    if (shown.length > 0) pager.current?.scrollToIndex({ index: current, animated: true });
  }, [current, shown.length]);

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <TopRow
        label={shown.length > 0 ? `Exercise ${current + 1} of ${shown.length}` : ''}
        onClose={() => router.back()}
      />
      <FlatList
        ref={pager}
        data={shown}
        keyExtractor={(x) => x.key}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        getItemLayout={(_, index) => ({ length: width, offset: width * index, index })}
        initialScrollIndex={shown.length > 0 ? current : undefined}
        onMomentumScrollEnd={(e) => {
          const i = Math.round(e.nativeEvent.contentOffset.x / width);
          const x = shown[i];
          if (x) go(session.exercises.findIndex((y) => y.key === x.key));
        }}
        style={{ flex: 1 }}
        renderItem={({ item }) => (
          <ExercisePage exercise={item} width={width} isCurrent={item.key === shown[current]?.key} />
        )}
        ListEmptyComponent={
          <View style={{ width, paddingHorizontal: tokens.space[20], paddingTop: tokens.space[20], gap: tokens.space[12] }}>
            {categories.length > 0 ? <EmptyState line="No exercises yet." /> : null}
            <AddExercise />
          </View>
        }
      />
      <Footer session={session} shown={shown} current={current} />
    </View>
  );
}

/** One exercise: page 06's header, then its sets, then Add exercise. */
function ExercisePage({ exercise, width, isCurrent }: { exercise: SessionExercise; width: number; isCurrent: boolean }) {
  const { c } = useTheme();
  return (
    <ScrollView style={{ width }} showsVerticalScrollIndicator={false}>
      <View
        style={{
          paddingTop: tokens.session.titleTop,
          paddingHorizontal: tokens.space[24],
          flexDirection: 'row',
          alignItems: 'center',
          gap: tokens.session.rowGap,
        }}
      >
        <ExerciseLead exercise={exercise} size={tokens.iconTile.size.sessionHeader} />
        <View style={{ flexShrink: 1 }}>
          <Txt variant="heading" weight={600} tracking={-0.02} color={c.text}>
            {exercise.info?.name}
          </Txt>
          <Txt variant="captionTight" color={c.textSecondary} tnum style={{ marginTop: tokens.space[4] }}>
            {[exercise.group, exercise.info?.type, count(exercise.sets, 'set')].filter(Boolean).join(' · ')}
          </Txt>
        </View>
      </View>
      <View style={{ paddingTop: tokens.space[20], paddingHorizontal: tokens.space[20], paddingBottom: tokens.space[24], gap: tokens.space[8] }}>
        {Array.from({ length: exercise.sets }, (_, i) => (
          <SetCard
            key={i}
            n={i + 1}
            state={i < exercise.done ? 'done' : i === exercise.done && isCurrent ? 'current' : 'next'}
          />
        ))}
        <View style={{ marginTop: tokens.space[4] }}>
          <AddExercise />
        </View>
      </View>
    </ScrollView>
  );
}

/** Where page 06 puts Add set: the dashed secondary button. */
function AddExercise() {
  const router = useRouter();
  return <SecondaryButton label="Add exercise" icon="plus" dashed onPress={() => router.push('/add-exercise')} />;
}

/**
 * A set as page 06 draws it: done (surface, a filled check), being done
 * (accent soft, its number in an accent ring) or still to come (no surface,
 * its number in a hairline ring). Weight, reps and RIR are not logged yet.
 */
function SetCard({ n, state }: { n: number; state: 'done' | 'current' | 'next' }) {
  const { c } = useTheme();
  const set = tokens.session.set;
  const numeral = state === 'next' ? c.textSecondary : c.text;
  return (
    <View
      style={{
        backgroundColor: state === 'done' ? c.surface : state === 'current' ? c.accentSoft : 'transparent',
        borderRadius: tokens.radius.row,
        paddingTop: set.paddingTop,
        paddingHorizontal: set.paddingHorizontal,
        paddingBottom: set.paddingBottom,
        gap: set.gap,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: tokens.session.rowGap }}>
        <View
          style={{
            width: set.mark,
            height: set.mark,
            borderRadius: tokens.radius.rung,
            backgroundColor: state === 'done' ? c.accent : 'transparent',
            borderWidth: state === 'done' ? 0 : state === 'current' ? tokens.session.currentRing : 1,
            borderColor: state === 'current' ? c.accent : c.border,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {state === 'done' ? (
            <Icon name="check" size={16} color={c.onAccent} width={2} />
          ) : (
            <Txt variant="label" weight={600} tnum color={state === 'current' ? c.accent : c.textSecondary}>
              {n}
            </Txt>
          )}
        </View>
        <View style={{ flexGrow: 1, flexDirection: 'row', alignItems: 'baseline' }}>
          <Txt variant="numeralL" weight={600} tnum tracking={-0.015} color={numeral}>
            —
          </Txt>
          <Txt variant="times" color={c.textSecondary} style={{ marginHorizontal: tokens.space[8] }}>
            ×
          </Txt>
          <Txt variant="numeralL" weight={600} tnum tracking={-0.015} color={numeral}>
            —
          </Txt>
        </View>
        <View style={{ alignItems: 'flex-end', minWidth: set.rirMinWidth }}>
          <MicroCaps>RIR</MicroCaps>
          <Txt variant="dataValue" tnum color={numeral}>
            —
          </Txt>
        </View>
      </View>
      <Rung value={0} target={1} muted={state === 'next'} />
    </View>
  );
}

/**
 * Page 06's footer: the timer's row — counting up since the start, and
 * Finish where page 06 has Skip — over a rung of the sets done against the
 * sets planned, then Complete set.
 */
function Footer({ session, shown, current }: { session: Session; shown: SessionExercise[]; current: number }) {
  const { c } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { finish, complete } = useSession();
  const footer = tokens.session.footer;
  const planned = shown.reduce((n, x) => n + x.sets, 0);
  const done = shown.reduce((n, x) => n + Math.min(x.done, x.sets), 0);
  const at = shown[current];
  const all = planned > 0 && done >= planned;
  const end = () => {
    finish();
    router.back();
  };

  return (
    <View
      style={{
        paddingTop: footer.paddingTop,
        paddingHorizontal: footer.paddingHorizontal,
        paddingBottom: Math.max(footer.paddingBottom, insets.bottom),
        backgroundColor: c.bg,
        borderTopWidth: 1,
        borderTopColor: c.border,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: tokens.space[12], marginBottom: footer.rowBottom }}>
        <Icon name="timer" size={20} color={c.accent} />
        <Elapsed startedAt={session.startedAt} />
        <Txt variant="captionTight" color={c.textSecondary} tnum style={{ flexGrow: 1 }}>
          {`${done} of ${count(planned, 'set')}`}
        </Txt>
        <TopAction label="Finish" onPress={end} />
      </View>
      <Rung value={done} target={Math.max(planned, 1)} />
      <View style={{ height: tokens.space[16] }} />
      {all || !at ? (
        <PrimaryButton label="Finish workout" icon="check" height={tokens.sizing.primaryButtonHeight.max} onPress={end} />
      ) : (
        <PrimaryButton
          label={at.done < at.sets ? `Complete set ${at.done + 1}` : 'Next exercise'}
          icon="check"
          height={tokens.sizing.primaryButtonHeight.max}
          onPress={complete}
        />
      )}
    </View>
  );
}

/** The time since the start, on its own so only it redraws each second. */
function Elapsed({ startedAt }: { startedAt: number | null }) {
  const time = useElapsed(startedAt);
  return (
    <Txt variant="timerValue" tnum accessibilityLabel={`Elapsed ${time}`}>
      {time}
    </Txt>
  );
}

/** Page 06's rounded Skip button. */
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
        borderWidth: 1,
        borderColor: c.border,
        backgroundColor: pressed ? c.surface : 'transparent',
        alignItems: 'center',
        justifyContent: 'center',
      })}
    >
      <Txt variant="captionTight" weight={500} color={c.text}>
        {label}
      </Txt>
    </Pressable>
  );
}
