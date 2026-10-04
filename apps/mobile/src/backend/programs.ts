import { POCKETBASE_URL } from './pocketbase';

/**
 * The `programs` collection (`backend/migrations/1790164322_programs.go`).
 * A row with no owner is a template; a row with an owner is that person's.
 */

/**
 * An exercise a workout plans: the collection it lives in (weights_chest, …),
 * its id there, and how many sets.
 */
export type PlannedExercise = { collection: string; exercise: string; sets: number };

/** A workout: a name, an icon, and the exercises it plans, in order. */
export type ProgramWorkout = { name: string; icon: string; exercises?: PlannedExercise[] };

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

/** Deletes one of the caller's own programs; whether it went. The delete rule refuses anyone else's. */
export async function deleteProgram(token: string, id: string): Promise<boolean> {
  try {
    const response = await fetch(`${POCKETBASE_URL}/api/collections/programs/records/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: { Authorization: token },
    });
    return response.ok;
  } catch {
    return false;
  }
}

/** One program by id: a template, or one of the caller's own. */
export async function getProgram(id: string, token: string | null): Promise<ProgramRecord | null> {
  try {
    const response = await fetch(`${POCKETBASE_URL}/api/collections/programs/records/${encodeURIComponent(id)}`, {
      headers: token ? { Authorization: token } : {},
    });
    if (!response.ok) return null;
    return (await response.json()) as ProgramRecord;
  } catch {
    return null;
  }
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

/**
 * Writes a program's days. Only the person's own programs can be written; the
 * collection's update rule refuses a template or anyone else's.
 */
export async function updateProgramDays(
  token: string,
  program: ProgramRecord,
  days: ProgramDay[],
): Promise<ProgramRecord | null> {
  try {
    const response = await fetch(`${POCKETBASE_URL}/api/collections/programs/records/${program.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: token },
      body: JSON.stringify({ days }),
    });
    if (!response.ok) return null;
    return (await response.json()) as ProgramRecord;
  } catch {
    return null;
  }
}
