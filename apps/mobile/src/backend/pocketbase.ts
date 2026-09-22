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

/** A signed-in session: what the server gave back, and who it belongs to. */
/** The stored account, as the collection holds it. */
export type AccountRecord = {
  id: string;
  email: string;
  name: string;
  surname: string;
  username: string;
  date_of_birth: string;
  gender: string;
  subscription_status: string;
  units: string;
  theme: string;
};

export type Session = { token: string; record: AccountRecord };

/**
 * Writes a change back to the row. Everything on Profile that is the person's
 * own — what they are subscribed to, which units they read, which theme the
 * app opens in — is a column, so it is the same on the next device and after
 * the next reinstall.
 */
export async function updateAccount(
  token: string,
  id: string,
  patch: Partial<AccountRecord>,
): Promise<AccountRecord | null> {
  try {
    const response = await fetch(`${POCKETBASE_URL}/api/collections/users/records/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: token },
      body: JSON.stringify(patch),
    });
    if (!response.ok) return null;
    return (await response.json()) as AccountRecord;
  } catch {
    return null;
  }
}

/**
 * Whether this address already has an account. `users` only lets a person read
 * their own row, so the gate cannot look; `backend/main.go` answers instead.
 *
 * A server that cannot be reached answers null, and the gate treats an unknown
 * answer as new rather than turning somebody away.
 */
export async function accountExists(email: string): Promise<boolean | null> {
  try {
    const response = await fetch(
      `${POCKETBASE_URL}/api/alke/account-exists?email=${encodeURIComponent(email)}`,
    );
    if (!response.ok) return null;
    const payload = (await response.json()) as { exists?: boolean };
    return payload.exists === true;
  } catch {
    return null;
  }
}

/**
 * A session for an address that has just been verified.
 *
 * Signing back in has no password to offer, so the server issues the session
 * once the address is proved. `backend/main.go` answers this only while it is
 * started with ALKE_TEST_SESSIONS=1, and the real magic link replaces it.
 */
export async function sessionForVerifiedEmail(email: string): Promise<Session | null> {
  try {
    const response = await fetch(`${POCKETBASE_URL}/api/alke/test-session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.trim() }),
    });
    if (!response.ok) return null;
    return (await response.json()) as Session;
  } catch {
    return null;
  }
}

/** Trades an address and its secret for a token. */
export async function authenticate(
  email: string,
  password: string,
): Promise<Session | null> {
  try {
    const response = await fetch(
      `${POCKETBASE_URL}/api/collections/users/auth-with-password`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identity: email, password }),
      },
    );
    if (!response.ok) return null;
    return (await response.json()) as Session;
  } catch {
    return null;
  }
}

/**
 * Asks whether a token is still good, and takes the fresher one it is given.
 * This is what a restart runs: the app trusts the server about its own
 * session rather than trusting whatever it wrote to disk last time.
 */
export async function refreshSession(token: string): Promise<Session | null> {
  try {
    const response = await fetch(
      `${POCKETBASE_URL}/api/collections/users/auth-refresh`,
      { method: 'POST', headers: { Authorization: token } },
    );
    if (!response.ok) return null;
    return (await response.json()) as Session;
  } catch {
    return null;
  }
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
): Promise<{ rejected: ServerRejection } | { session: Session | null }> {
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
    units: 'kg',
    theme: 'system',
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
    return { rejected: { fields: {}, message: 'Alke could not reach the server.' } };
  }

  // The row exists; now hold a session for it, so a restart does not start
  // over. The column's filler is used once, here, and never kept.
  if (response.ok) return { session: await authenticate(body.email, body.password) };

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

  if (elsewhere.length > 0) return { rejected: { fields, message: elsewhere[0] ?? null } };
  if (Object.keys(fields).length > 0) return { rejected: { fields, message: null } };
  return { rejected: { fields, message: payload?.message ?? 'That did not save.' } };
}
