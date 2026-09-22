import * as SecureStore from 'expo-secure-store';

/**
 * Where the session token lives between launches.
 *
 * The Keychain, not plain storage: it is the one credential the app holds and
 * PLAN.md §5 keeps credentials out of anything that can be read off the disk.
 * Nothing else is kept here — who the person is comes back from the server on
 * every launch, so there is no stale copy of an account lying about.
 */
const KEY = 'alke.session.token';

export async function readToken(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(KEY);
  } catch {
    // A device that cannot open the Keychain simply has no session.
    return null;
  }
}

export async function writeToken(token: string): Promise<void> {
  try {
    await SecureStore.setItemAsync(KEY, token, {
      keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    });
  } catch {
    // Not fatal: the session lasts as long as the app is open.
  }
}

export async function clearToken(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(KEY);
  } catch {
    // Nothing to do; the token is already unreachable.
  }
}
