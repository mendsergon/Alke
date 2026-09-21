import Svg, { Path } from 'react-native-svg';

/**
 * Vendor marks, kept out of components/icon.tsx because that set is stroked
 * and never filled. These are filled, and the Google G carries its own four
 * brand colours — the one place PLAN.md §3's "no third hue" does not hold,
 * because Google's branding rules require the mark exactly as published.
 */

export function AppleMark({ size, color }: { size: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="M17.05 12.53c-.02-2.4 1.96-3.55 2.05-3.61-1.12-1.64-2.86-1.86-3.48-1.89-1.48-.15-2.89.87-3.64.87-.75 0-1.91-.85-3.14-.83-1.61.02-3.1.94-3.93 2.38-1.68 2.91-.43 7.21 1.2 9.57.8 1.16 1.75 2.46 3 2.41 1.2-.05 1.66-.78 3.11-.78 1.45 0 1.86.78 3.13.75 1.29-.02 2.11-1.18 2.9-2.34.91-1.34 1.29-2.64 1.31-2.71-.03-.01-2.51-.96-2.53-3.82z"
        fill={color}
      />
      <Path
        d="M14.94 5.36c.66-.8 1.11-1.92.99-3.03-.95.04-2.1.63-2.79 1.43-.61.71-1.15 1.85-1.01 2.94 1.06.08 2.14-.54 2.81-1.34z"
        fill={color}
      />
    </Svg>
  );
}

export function GoogleMark({ size }: { size: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="M23.06 12.25c0-.85-.08-1.67-.22-2.45H12v4.63h6.2c-.27 1.44-1.08 2.66-2.3 3.48v2.9h3.72c2.18-2 3.44-4.96 3.44-8.56z"
        fill="#4285F4"
      />
      <Path
        d="M12 23.5c3.11 0 5.72-1.03 7.62-2.79l-3.72-2.9c-1.03.69-2.35 1.1-3.9 1.1-3 0-5.54-2.03-6.45-4.75H1.7v2.99C3.59 20.9 7.5 23.5 12 23.5z"
        fill="#34A853"
      />
      <Path
        d="M5.55 14.16c-.23-.69-.36-1.43-.36-2.19s.13-1.5.36-2.19V6.79H1.7A11.5 11.5 0 0 0 .5 11.97c0 1.86.44 3.62 1.2 5.18l3.85-2.99z"
        fill="#FBBC05"
      />
      <Path
        d="M12 4.75c1.69 0 3.21.58 4.4 1.72l3.3-3.3C17.72 1.3 15.11.25 12 .25 7.5.25 3.59 2.85 1.7 6.79l3.85 2.99C6.46 7.07 9 4.75 12 4.75z"
        fill="#EA4335"
      />
    </Svg>
  );
}
