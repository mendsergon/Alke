/**
 * The `users` rules, PLAN.md §7 Phase 2.
 *
 * These are the same rules the collection enforces, written once so the app
 * and PocketBase cannot drift. Each constant below has a counterpart in the
 * live collection:
 *
 *   name, surname          text,   required, pattern ^\p{L}+$
 *   username               text,   required, English, unique index idx_users_username
 *   date_of_birth          date,   required, a real date, 15 to 100 today
 *   gender                 select, required, GENDER_OPTIONS
 *   subscription_status    select, required, SUBSCRIPTION_OPTIONS
 *
 * Uniqueness of `username` is the one rule the app cannot decide on its own —
 * only the server knows the other rows — so it is checked there and its error
 * is shown on the same line as the rest.
 */

/**
 * A field that is simply missing does not need a sentence — the box is marked
 * and the person can see it is empty. This is that: present in the errors, with
 * nothing to say. Only a rule that was actually broken gets words.
 */
export const MISSING = '';

/** Letters from any alphabet, nothing else. Unicode-aware, so Ελένη passes. */
export const LETTERS_ONLY = /^\p{L}+$/u;

/**
 * A username is English. Names carry whatever alphabet the person's name is
 * written in; a handle is typed, shared and searched by other people, so it
 * stays in the one alphabet everyone can reach.
 */
export const ENGLISH_ONLY = /^[A-Za-z0-9]+$/;

/**
 * An address the server will accept: something, an @, a domain with a dot in
 * it. Deliberately not a full grammar — the link that gets sent is what really
 * decides whether an address exists.
 */
export const LOOKS_LIKE_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function checkEmail(value: string): string | null {
  const v = value.trim();
  if (v.length === 0) return MISSING;
  if (!LOOKS_LIKE_EMAIL.test(v)) return 'That is not an email address.';
  return null;
}

export const PREFER_NOT_TO_SAY = 'Prefer not to say';

/** The youngest and oldest Alke accepts, in years, today. */
export const MIN_AGE = 15;
export const MAX_AGE = 100;

export const DAY_OPTIONS: readonly string[] = Array.from({ length: 31 }, (_, i) =>
  String(i + 1),
);

export const MONTH_OPTIONS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
] as const;

/** Every year that can still put somebody inside the range, newest first. */
export function yearOptions(today = new Date()): readonly string[] {
  const newest = today.getFullYear() - MIN_AGE;
  const oldest = today.getFullYear() - MAX_AGE;
  return Array.from({ length: newest - oldest + 1 }, (_, i) => String(newest - i));
}

export const GENDER_OPTIONS = ['Male', 'Female', PREFER_NOT_TO_SAY] as const;

export const SUBSCRIPTION_OPTIONS = ['free', 'premium'] as const;

/** Weights are always stored in kg; this is only how they are shown (§1.3). */
export const UNIT_OPTIONS = ['kg', 'lb'] as const;
export const THEME_OPTIONS = ['light', 'dark', 'system'] as const;

export type Gender = (typeof GENDER_OPTIONS)[number];
export type SubscriptionStatus = (typeof SUBSCRIPTION_OPTIONS)[number];
export type Units = (typeof UNIT_OPTIONS)[number];
export type ThemePreference = (typeof THEME_OPTIONS)[number];

/** The three boxes the date is given in, each empty until it is chosen. */
export type DateOfBirth = { day: string; month: string; year: string };

export type Account = {
  name: string;
  surname: string;
  username: string;
  dateOfBirth: DateOfBirth;
  gender: Gender | '';
  subscriptionStatus: SubscriptionStatus;
};

export const EMPTY_ACCOUNT: Account = {
  name: '',
  surname: '',
  username: '',
  dateOfBirth: { day: '', month: '', year: '' },
  gender: '',
  subscriptionStatus: 'free',
};

/** A person-name field: required, letters only. `label` names it in the message. */
function checkLetters(value: string, label: string): string | null {
  const v = value.trim();
  if (v.length === 0) return MISSING;
  if (!LETTERS_ONLY.test(v)) return `${label} takes letters only — no numbers.`;
  return null;
}

export function checkName(value: string): string | null {
  return checkLetters(value, 'Name');
}

export function checkSurname(value: string): string | null {
  return checkLetters(value, 'Surname');
}

export function checkUsername(value: string): string | null {
  const v = value.trim();
  if (v.length === 0) return MISSING;
  if (!ENGLISH_ONLY.test(v)) return 'Username takes English letters and numbers.';
  return null;
}

/**
 * The date has to exist and it has to put the person inside the range today.
 * February the 31st is caught by building the date and asking it what it
 * became: a Date given an impossible day rolls into the next month.
 */
export function checkDateOfBirth(dob: DateOfBirth, today = new Date()): string | null {
  if (!dob.day || !dob.month || !dob.year) return MISSING;

  const monthIndex = (MONTH_OPTIONS as readonly string[]).indexOf(dob.month);
  const day = Number(dob.day);
  const year = Number(dob.year);
  if (monthIndex < 0 || !Number.isInteger(day) || !Number.isInteger(year)) {
    return 'Pick a day, a month and a year.';
  }

  const born = new Date(year, monthIndex, day);
  if (
    born.getFullYear() !== year ||
    born.getMonth() !== monthIndex ||
    born.getDate() !== day
  ) {
    return 'That day is not in that month.';
  }

  const age = ageOn(born, today);
  if (age < MIN_AGE) return `You have to be ${MIN_AGE} to use Alke.`;
  if (age > MAX_AGE) return 'Check the year.';
  return null;
}

/** Whole years between two dates, counting the birthday itself. */
export function ageOn(born: Date, today: Date): number {
  let years = today.getFullYear() - born.getFullYear();
  const beforeBirthday =
    today.getMonth() < born.getMonth() ||
    (today.getMonth() === born.getMonth() && today.getDate() < born.getDate());
  if (beforeBirthday) years -= 1;
  return years;
}

/** The value PocketBase stores: a plain calendar date. */
export function toIsoDate(dob: DateOfBirth): string {
  const monthIndex = (MONTH_OPTIONS as readonly string[]).indexOf(dob.month);
  const month = String(monthIndex + 1).padStart(2, '0');
  const day = dob.day.padStart(2, '0');
  return `${dob.year}-${month}-${day}`;
}

export function checkGender(value: string): string | null {
  if (value.length === 0) return MISSING;
  if (!(GENDER_OPTIONS as readonly string[]).includes(value)) {
    return 'Pick a gender from the list.';
  }
  return null;
}

export function checkSubscriptionStatus(value: string): string | null {
  if (!(SUBSCRIPTION_OPTIONS as readonly string[]).includes(value)) {
    return 'Subscription status is free or premium.';
  }
  return null;
}

export type AccountErrors = Partial<Record<keyof Account, string>>;

/** Every rule at once, for the moment Continue is pressed. */
export function checkAccount(a: Account): AccountErrors {
  const errors: AccountErrors = {};
  const pairs: [keyof Account, string | null][] = [
    ['name', checkName(a.name)],
    ['surname', checkSurname(a.surname)],
    ['username', checkUsername(a.username)],
    ['dateOfBirth', checkDateOfBirth(a.dateOfBirth)],
    ['gender', checkGender(a.gender)],
    ['subscriptionStatus', checkSubscriptionStatus(a.subscriptionStatus)],
  ];
  for (const [key, message] of pairs) {
    if (message !== null) errors[key] = message;
  }
  return errors;
}
