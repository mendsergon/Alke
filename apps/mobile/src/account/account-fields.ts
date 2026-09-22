/**
 * The `users` rules, PLAN.md §7 Phase 2.
 *
 * These are the same rules the collection enforces, written once so the app
 * and PocketBase cannot drift. Each constant below has a counterpart in the
 * live collection:
 *
 *   name, surname          text,   required, pattern ^\p{L}+$
 *   username               text,   required, unique index idx_users_username
 *   age                    select, required, AGE_OPTIONS
 *   gender                 select, required, GENDER_OPTIONS
 *   subscription_status    select, required, SUBSCRIPTION_OPTIONS
 *
 * Uniqueness of `username` is the one rule the app cannot decide on its own —
 * only the server knows the other rows — so it is checked there and its error
 * is shown on the same line as the rest.
 */

/** Letters from any alphabet, nothing else. Unicode-aware, so Ελένη passes. */
export const LETTERS_ONLY = /^\p{L}+$/u;

export const PREFER_NOT_TO_SAY = 'Prefer not to say';

/** 15 to 100 inclusive, then the opt-out, in the order the list shows them. */
export const AGE_OPTIONS: readonly string[] = [
  ...Array.from({ length: 100 - 15 + 1 }, (_, i) => String(15 + i)),
  PREFER_NOT_TO_SAY,
];

export const GENDER_OPTIONS = ['Male', 'Female', PREFER_NOT_TO_SAY] as const;

export const SUBSCRIPTION_OPTIONS = ['free', 'premium'] as const;

export type Gender = (typeof GENDER_OPTIONS)[number];
export type SubscriptionStatus = (typeof SUBSCRIPTION_OPTIONS)[number];

export type Account = {
  name: string;
  surname: string;
  username: string;
  age: string;
  gender: Gender | '';
  subscriptionStatus: SubscriptionStatus;
};

export const EMPTY_ACCOUNT: Account = {
  name: '',
  surname: '',
  username: '',
  age: '',
  gender: '',
  subscriptionStatus: 'free',
};

/** A person-name field: required, letters only. `label` names it in the message. */
function checkLetters(value: string, label: string): string | null {
  const v = value.trim();
  if (v.length === 0) return `${label} is required.`;
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
  if (value.trim().length === 0) return 'Username is required.';
  return null;
}

export function checkAge(value: string): string | null {
  if (value.length === 0) return 'Age is required.';
  if (!AGE_OPTIONS.includes(value)) return 'Pick an age from the list.';
  return null;
}

export function checkGender(value: string): string | null {
  if (value.length === 0) return 'Gender is required.';
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
    ['age', checkAge(a.age)],
    ['gender', checkGender(a.gender)],
    ['subscriptionStatus', checkSubscriptionStatus(a.subscriptionStatus)],
  ];
  for (const [key, message] of pairs) {
    if (message) errors[key] = message;
  }
  return errors;
}
