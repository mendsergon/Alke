import { Alert } from 'react-native';

/**
 * Taking a template as the person's own copy is "Duplicate" (Stavros,
 * 4 October 2026: saving read as confusing). Every press makes another copy,
 * and asks first in the system's own alert — Liquid Glass on iOS 26.
 */
export function askDuplicate(name: string, run: () => void) {
  Alert.alert(`Duplicate ${name}?`, 'A copy goes into your Library, yours to change.', [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Duplicate', style: 'default', isPreferred: true, onPress: run },
  ]);
}
