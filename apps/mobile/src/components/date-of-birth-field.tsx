import { View } from 'react-native';
import { SelectField } from './select-field';
import { tokens } from '../theme/theme';
import {
  DAY_OPTIONS,
  MONTH_OPTIONS,
  yearOptions,
  type DateOfBirth,
} from '../account/account-fields';

/**
 * A date of birth as three boxes on one line, day then month then year.
 *
 * The row is the design's code row (`design/rungs-ui.pdf`, "Join a gym"):
 * equal boxes under one micro-caps eyebrow, 12px radius, the app's surface
 * and border, the value centred in each, and the box being worked in carrying
 * the 2px accent edge that sheet gives the focused box. Each box opens its own
 * list in the same form the rest of the app's lists take.
 */
export type DatePart = 'day' | 'month' | 'year';

export function DateOfBirthField({
  value,
  open,
  onToggle,
  onChange,
}: {
  value: DateOfBirth;
  /** Which of the three has its list down, if any. */
  open: DatePart | null;
  onToggle: (part: DatePart) => void;
  onChange: (next: DateOfBirth) => void;
}) {
  const years = yearOptions();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: tokens.space[8] }}>
      <Box
        label="Day"
        part="day"
        options={DAY_OPTIONS}
        value={value.day}
        open={open}
        onToggle={onToggle}
        onSelect={(day) => onChange({ ...value, day })}
      />
      <Box
        label="Month"
        part="month"
        options={MONTH_OPTIONS}
        value={value.month}
        open={open}
        onToggle={onToggle}
        onSelect={(month) => onChange({ ...value, month })}
        grow={1.5}
      />
      <Box
        label="Year"
        part="year"
        options={years}
        value={value.year}
        open={open}
        onToggle={onToggle}
        onSelect={(year) => onChange({ ...value, year })}
      />
    </View>
  );
}

/** Month names are long, so that box takes half again the width of the others. */
function Box({
  label,
  part,
  options,
  value,
  open,
  onToggle,
  onSelect,
  grow = 1,
}: {
  label: string;
  part: DatePart;
  options: readonly string[];
  value: string;
  open: DatePart | null;
  onToggle: (part: DatePart) => void;
  onSelect: (next: string) => void;
  grow?: number;
}) {
  return (
    <View style={{ flexGrow: grow, flexBasis: 0 }}>
      <SelectField
        align="center"
        accessibilityLabel={label}
        placeholder={label}
        value={value}
        options={options}
        open={open === part}
        onToggle={() => onToggle(part)}
        onSelect={onSelect}
      />
    </View>
  );
}
