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
  invalid = false,
}: {
  value: DateOfBirth;
  /** Which of the three has its list down, if any. */
  open: DatePart | null;
  onToggle: (part: DatePart) => void;
  onChange: (next: DateOfBirth) => void;
  /** Marked because the date is missing or impossible. */
  invalid?: boolean;
}) {
  const years = yearOptions();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: tokens.space[8] }}>
      <Box
        label="Day"
        placeholder="Day"
        part="day"
        options={DAY_OPTIONS}
        value={value.day}
        open={open}
        onToggle={onToggle}
        onSelect={(day) => onChange({ ...value, day })}
        invalid={invalid && !value.day}
      />
      <Box
        label="Month"
        placeholder="Month"
        part="month"
        options={MONTH_OPTIONS}
        value={value.month}
        // The list names the month in full; the box shows it short, because
        // four boxes share one line.
        display={shortMonth(value.month)}
        open={open}
        onToggle={onToggle}
        onSelect={(month) => onChange({ ...value, month })}
        invalid={invalid && !value.month}
        grow={1.15}
      />
      <Box
        label="Year"
        placeholder="Year"
        part="year"
        options={years}
        value={value.year}
        open={open}
        onToggle={onToggle}
        onSelect={(year) => onChange({ ...value, year })}
        invalid={invalid && !value.year}
        grow={1.25}
      />
    </View>
  );
}

/** A four-digit year is the widest thing on the row, so that box is widest. */
function shortMonth(month: string): string {
  return month.slice(0, 3);
}

function Box({
  label,
  placeholder,
  part,
  options,
  value,
  display,
  open,
  onToggle,
  onSelect,
  invalid = false,
  grow = 1,
}: {
  label: string;
  placeholder: string;
  part: DatePart;
  options: readonly string[];
  value: string;
  display?: string;
  open: DatePart | null;
  onToggle: (part: DatePart) => void;
  onSelect: (next: string) => void;
  invalid?: boolean;
  grow?: number;
}) {
  return (
    <View style={{ flexGrow: grow, flexBasis: 0 }}>
      <SelectField
        align="center"
        invalid={invalid}
        accessibilityLabel={label}
        placeholder={placeholder}
        value={value}
        display={display}
        options={options}
        open={open === part}
        onToggle={() => onToggle(part)}
        onSelect={onSelect}
      />
    </View>
  );
}
