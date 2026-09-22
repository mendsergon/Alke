import {
  toIsoDate,
  type Account,
  type AccountErrors,
} from '../account/account-fields';

/**
 * The thinnest possible client for the one thing the app writes today: a row
 * in `users`. No SDK — one `fetch` against the REST API, so there is no
 * dependency to license and nothing to keep in step with.
 *
 * OPEN: the address is a constant. It is the local PocketBase from
 * `backend/`, which the iOS simulator reaches on the host's own loopback. A
 * real build needs this to come from the environment, and PLAN.md fixes no
 * hosting yet.
 */
export const POCKETBASE_URL = 'http://127.0.0.1:8090';

/**
 * PocketBase's `users` is an auth collection, so a row cannot exist without a
 * password — but Alke's sign-in is a link sent to an address, and the person
 * never chooses one. This fills the column so the row can be written.
 *
 * It is NOT a credential and must never be treated as one: it is thrown away
 * the moment it is sent, nothing can sign in with it, and it is not from a
 * cryptographic source.
 *
 * OPEN: PocketBase v0.40.4 has an OTP flow (`otp.enabled` on the collection,
 * currently false). Turning that on is what removes this.
 */
function unusedPasswordColumn(): string {
  let filler = '';
  while (filler.length < 40) filler += Math.random().toString(36).slice(2);
  return filler.slice(0, 40);
}

/** What the server said was wrong, in the app's own field names. */
export type ServerRejection = { fields: AccountErrors; message: string | null };

const FIELD_NAMES: Record<string, keyof Account | 'email'> = {
  name: 'name',
  surname: 'surname',
  username: 'username',
  date_of_birth: 'dateOfBirth',
  gender: 'gender',
  subscription_status: 'subscriptionStatus',
  email: 'email',
};

/**
 * Writes the account. Resolves with null when the row was created, or with
 * what the server objected to — the uniqueness of a username is the one rule
 * only it can answer, so its answer is shown on the same line as the rest.
 */
export async function createAccount(
  account: Account,
  email: string,
): Promise<ServerRejection | null> {
  const body = {
    email: email.trim(),
    password: unusedPasswordColumn(),
    passwordConfirm: '',
    name: account.name.trim(),
    surname: account.surname.trim(),
    username: account.username.trim(),
    date_of_birth: toIsoDate(account.dateOfBirth),
    gender: account.gender,
    subscription_status: account.subscriptionStatus,
  };
  body.passwordConfirm = body.password;

  let response: Response;
  try {
    response = await fetch(`${POCKETBASE_URL}/api/collections/users/records`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch {
    return { fields: {}, message: 'Alke could not reach the server.' };
  }

  if (response.ok) return null;

  const payload = (await response.json().catch(() => null)) as
    | { message?: string; data?: Record<string, { message?: string }> }
    | null;

  const fields: AccountErrors = {};
  const elsewhere: string[] = [];
  for (const [column, detail] of Object.entries(payload?.data ?? {})) {
    const field = FIELD_NAMES[column];
    if (field && field !== 'email') {
      fields[field] = detail?.message ?? '';
    } else if (detail?.message) {
      // Something this form does not own — the address, say. Its own words are
      // worth more than "Failed to create record".
      elsewhere.push(detail.message);
    }
  }

  if (elsewhere.length > 0) return { fields, message: elsewhere[0] ?? null };
  if (Object.keys(fields).length > 0) return { fields, message: null };
  return { fields, message: payload?.message ?? 'That did not save.' };
}
