import { POCKETBASE_URL } from './pocketbase';

/**
 * The `programs` collection (`backend/migrations/1790164322_programs.go`).
 * A row with no owner is a template; a row with an owner is that person's.
 */

/** A placeholder: a name and an icon. It holds no exercises. */
export type ProgramWorkout = { name: string; icon: string };

/** One entry per training day, in week order. Rest days have none. */
export type ProgramDay = { weekday: string; workouts: ProgramWorkout[] };

export type ProgramRecord = {
  id: string;
  name: string;
  owner: string;
  copied_from: string;
  /** Seven entries, Monday first. */
  schedule: ('training' | 'rest')[];
  days: ProgramDay[];
  active: boolean;
};

type ListPage = { items: ProgramRecord[] };

export function trainingDays(program: ProgramRecord): number {
  return program.schedule.filter((d) => d === 'training').length;
}

async function list(filter: string, token: string | null): Promise<ProgramRecord[] | null> {
  try {
    const response = await fetch(
      `${POCKETBASE_URL}/api/collections/programs/records?perPage=200&filter=${encodeURIComponent(filter)}`,
      { headers: token ? { Authorization: token } : {} },
    );
    if (!response.ok) return null;
    return ((await response.json()) as ListPage).items;
  } catch {
    return null;
  }
}

/**
 * The templates, fewest training days first. All three are written in the
 * same instant, so the server has no order of its own to give them.
 */
export async function listTemplates(token: string | null): Promise<ProgramRecord[] | null> {
  const items = await list('owner = ""', token);
  return items ? [...items].sort((a, b) => trainingDays(a) - trainingDays(b)) : null;
}

/**
 * The person's own programs. A client filter cannot name `@request.auth.id`
 * (PocketBase keeps that for superusers), so it asks by id; the collection's
 * list rule is what stops anyone reading another person's rows.
 */
export async function listOwnPrograms(token: string, ownerId: string): Promise<ProgramRecord[] | null> {
  return list(`owner = "${ownerId}"`, token);
}

/**
 * Saving a template: a new row, owned by the person, with the template's
 * schedule and days copied in. Later edits to the template never reach it.
 */
export async function saveTemplate(
  token: string,
  ownerId: string,
  template: ProgramRecord,
): Promise<ProgramRecord | null> {
  try {
    const response = await fetch(`${POCKETBASE_URL}/api/collections/programs/records`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: token },
      body: JSON.stringify({
        name: template.name,
        owner: ownerId,
        copied_from: template.id,
        schedule: template.schedule,
        days: template.days,
      }),
    });
    if (!response.ok) return null;
    return (await response.json()) as ProgramRecord;
  } catch {
    return null;
  }
}
