import { useState } from 'react';
import { TextInput, View } from 'react-native';
import { Icon } from './icon';
import { tokens, useTheme } from '../theme/theme';

export function SearchBar({
  value,
  onChange,
  label,
}: {
  value: string;
  onChange: (next: string) => void;
  label: string;
}) {
  const { c } = useTheme();
  const [focused, setFocused] = useState(false);
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        height: 46,
        paddingHorizontal: 14,
        borderRadius: tokens.radius.button,
        // The design's input, focused and at rest (as on sign-in): raised with
        // a 2px accent edge while typing, the plain surface otherwise.
        backgroundColor: focused ? c.surfaceRaised : c.surface,
        borderWidth: 2,
        borderColor: focused ? c.accent : 'transparent',
      }}
    >
      <Icon name="search" size={18} color={c.textSecondary} />
      <TextInput
        value={value}
        onChangeText={onChange}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={label}
        placeholderTextColor={c.textSecondary}
        accessibilityLabel={label}
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="search"
        clearButtonMode="while-editing"
        style={{
          flexGrow: 1,
          flexShrink: 1,
          height: '100%',
          color: c.text,
          fontFamily: tokens.fontFamily.sansRegular,
          fontSize: tokens.type.body.size,
        }}
      />
    </View>
  );
}
