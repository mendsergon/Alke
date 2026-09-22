import { View } from 'react-native';
import Svg, { Circle, Ellipse, Path } from 'react-native-svg';
import { useTheme } from '../theme/theme';
import { PREFER_NOT_TO_SAY, type Gender } from '../account/account-fields';

/**
 * The account's figure: head and shoulders, drawn the way the exercise icons
 * are drawn.
 *
 * `design/rungs-ui.pdf` pages 30 and 31 set that style — a flat silhouette in
 * the icon-body tone, no stroke, cropped to the part being shown, sitting on
 * the raised surface the tone is contrasted against. Page 30's last row is
 * that crop exactly: "Crops, at reference size … upper torso". The figures
 * here are that crop, at three genders, and the accent is used the one way
 * that sheet uses it — to mark the part being pointed at.
 *
 * The body's own figure is one anatomical silhouette with no sex to it, so
 * these are drawn rather than cropped out of it: same tones, same flat fill,
 * same bottom-anchored framing.
 */
export function PersonFigure({ gender, size }: { gender: Gender | ''; size: number }) {
  const { c } = useTheme();
  const body = c.iconBody;
  return (
    <View style={{ width: size, height: size, overflow: 'hidden' }}>
      <Svg width={size} height={size} viewBox="0 0 100 100">
        {gender === 'Female' ? (
          <>
            {/* Head and hair are one mass, the way a flat silhouette carries
                them — the bell is wider than a head, which is what reads as
                hair down past the jaw. */}
            <Path
              d="M50 13c-11 0-16 7.5-16 17 0 8-3 14-7 20-2.4 3.6-4 6-4 7.2 0 1 .8 1.6 2 1.6h50c1.2 0 2-.6 2-1.6 0-1.2-1.6-3.6-4-7.2-4-6-7-12-7-20 0-9.5-5-17-16-17Z"
              fill={body}
            />
            <Path
              d="M50 61c-16 0-29 11-33.5 28-1.1 4-1.7 7.5-1.9 11h70.8c-.2-3.5-.8-7-1.9-11C79 72 66 61 50 61Z"
              fill={body}
            />
          </>
        ) : (
          <>
            <Ellipse cx={50} cy={34} rx={17.5} ry={20} fill={body} />
            <Path
              d="M50 56c-16.5 0-30 11-34.5 28.5-1.4 5.4-2.1 10.6-2.3 15.5h73.6c-.2-4.9-.9-10.1-2.3-15.5C80 67 66.5 56 50 56Z"
              fill={body}
            />
          </>
        )}

        {gender === PREFER_NOT_TO_SAY ? (
          <>
            <Path
              d="M43.5 29.5c0-4.6 2.8-7.8 6.9-7.8 4.1 0 6.9 2.8 6.9 6.6 0 4.1-4.2 5.5-5.6 8.6-.5 1.1-.6 2-.6 3"
              stroke={c.accent}
              strokeWidth={4.4}
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
            <Circle cx={51.1} cy={45.6} r={2.7} fill={c.accent} />
          </>
        ) : null}
      </Svg>
    </View>
  );
}

/**
 * The figure in the disc the design's Profile header draws (page 13): a
 * circle, on the raised surface the icon body is contrasted against, with the
 * figure filling it from the bottom edge the way an exercise icon fills its
 * tile.
 */
export function PersonAvatar({ gender, size }: { gender: Gender | ''; size: number }) {
  const { c } = useTheme();
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size,
        backgroundColor: c.surfaceRaised,
        alignItems: 'center',
        justifyContent: 'flex-end',
        overflow: 'hidden',
      }}
    >
      <PersonFigure gender={gender} size={size} />
    </View>
  );
}
