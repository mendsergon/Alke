import { useState } from 'react';
import { useRouter } from 'expo-router';
import { Screen, ScreenHeader } from '../../components/screen';
import { Card, EmptyState, Segmented } from '../../components/surfaces';
import { BodyMap } from '../../components/body-map';
import { useLibrary } from '../../library/library';
import { USER_HISTORY, USER_MUSCLE_SCORES, USER_REPORTS } from '../../mock/mock-data';

const TABS = ['Overview', 'Exercises', 'History', 'Reports'] as const;
type Tab = (typeof TABS)[number];

const SUBTITLE: Record<Tab, string> = {
  Overview: 'Where you are strongest',
  Exercises: 'Estimated 1RM · Epley',
  History: 'Every session you have logged',
  Reports: 'Weekly reports',
};

/**
 * Nothing has been logged, so every tab shows what is missing and how to get
 * it. The body map still draws — with no volume, every muscle sits in the
 * neutral body tone rather than on the heat scale.
 */
export default function Progress() {
  const [tab, setTab] = useState<Tab>('Overview');
  const router = useRouter();
  const { programs } = useLibrary();
  const hasProgram = programs.length > 0;

  // With no program, both ways of getting one are offered, not just browsing.
  const start = hasProgram
    ? undefined
    : {
        action: 'Build my program',
        icon: 'sparkle' as const,
        disabled: true,
        secondary: 'Browse templates',
        secondaryIcon: 'compass' as const,
        go: () => router.push('/explore'),
      };

  return (
    <Screen gap={14}>
      <ScreenHeader title="Progress" subtitle={SUBTITLE[tab]} />
      <Segmented options={TABS} value={tab} onChange={setTab} />

      {tab === 'Overview' ? (
        <>
          <Card padding={16}>
            <BodyMap scores={USER_MUSCLE_SCORES} />
          </Card>
          <EmptyState
            line="No volume yet."
            action={start?.action}
            icon={start?.icon}
            actionDisabled={start?.disabled}
            secondary={start?.secondary}
            secondaryIcon={start?.secondaryIcon}
            onSecondary={start?.go}
          />
        </>
      ) : null}

      {tab === 'Exercises' ? (
        <EmptyState
          line="No exercise history yet."
          action={start?.action}
          icon={start?.icon}
          actionDisabled={start?.disabled}
          secondary={start?.secondary}
          secondaryIcon={start?.secondaryIcon}
          onSecondary={start?.go}
        />
      ) : null}

      {tab === 'History' ? (
        USER_HISTORY.length > 0 ? null : (
          <EmptyState
            line="No sessions logged yet."
            action={start?.action}
            icon={start?.icon}
            actionDisabled={start?.disabled}
            secondary={start?.secondary}
            secondaryIcon={start?.secondaryIcon}
            onSecondary={start?.go}
          />
        )
      ) : null}

      {tab === 'Reports' ? (
        USER_REPORTS.latest === null ? (
          <EmptyState line="No report yet." />
        ) : null
      ) : null}
    </Screen>
  );
}
