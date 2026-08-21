/**
 * The icon set of the design, taken verbatim from the `<defs>` block of
 * `design-reference.html`.
 *
 * The design draws every glyph as a 24×24 stroked outline; the previous
 * FontAwesome glyphs were filled and shaped differently, so none of them
 * matched. These are the original paths, rendered with react-native-svg.
 *
 * Stroke width follows the design's default of 2 at a nominal 24px; the design
 * overrides it in two places (the sheet's confirm mark and the stepper), which
 * callers pass through `strokeWidth`.
 */
import React from "react";
import Svg, { Circle, Path, Rect } from "react-native-svg";

export type IconName =
  | "bell"
  | "pin"
  | "in"
  | "out"
  | "clock"
  | "sum"
  | "pause"
  | "stop"
  | "fingerprint"
  | "calendar"
  | "calendarOff"
  | "more"
  | "left"
  | "right"
  | "edit"
  | "info"
  | "x"
  | "check"
  | "minus"
  | "plus"
  | "chevronDown"
  | "note"
  | "mail"
  | "lock"
  | "eye"
  | "face"
  | "signal"
  | "wifi"
  | "battery";

/**
 * One entry per design glyph. Paths are copied unchanged; only the SVG element
 * names differ, since react-native-svg spells them with capitals.
 */
const PATHS: Record<IconName, React.ReactNode> = {
  bell: (
    <>
      <Path d="M10.268 21a2 2 0 0 0 3.464 0" />
      <Path d="M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326" />
    </>
  ),
  pin: (
    <>
      <Path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0" />
      <Circle cx="12" cy="10" r="3" />
    </>
  ),
  in: (
    <>
      <Path d="M17 7 7 17" />
      <Path d="M17 17H7V7" />
    </>
  ),
  out: (
    <>
      <Path d="M7 17 17 7" />
      <Path d="M7 7h10v10" />
    </>
  ),
  clock: (
    <>
      <Circle cx="12" cy="12" r="10" />
      <Path d="M12 6v6l4 2" />
    </>
  ),
  sum: (
    <>
      <Path d="M3 3v16a2 2 0 0 0 2 2h16" />
      <Path d="m19 9-5 5-4-4-3 3" />
    </>
  ),
  pause: (
    <>
      <Rect x="14" y="4" width="4" height="16" rx="1" />
      <Rect x="6" y="4" width="4" height="16" rx="1" />
    </>
  ),
  stop: <Rect x="5" y="5" width="14" height="14" rx="3" />,
  fingerprint: (
    <>
      <Path d="M12 10a2 2 0 0 0-2 2c0 1.02-.1 2.51-.26 4" />
      <Path d="M14 13.12c0 2.38 0 6.38-1 8.88" />
      <Path d="M17.29 21.02c.12-.6.43-2.3.5-3.02" />
      <Path d="M2 12a10 10 0 0 1 18-6" />
      <Path d="M2 16h.01" />
      <Path d="M21.8 16c.2-2 .131-5.354 0-6" />
      <Path d="M5 19.5C5.5 18 6 15 6 12a6 6 0 0 1 .34-2" />
      <Path d="M8.65 22c.21-.66.45-1.32.57-2" />
      <Path d="M9 6.8a6 6 0 0 1 9 5.2v2" />
    </>
  ),
  calendar: (
    <>
      <Path d="M8 2v4" />
      <Path d="M16 2v4" />
      <Rect width="18" height="18" x="3" y="4" rx="2" />
      <Path d="M3 10h18" />
    </>
  ),
  calendarOff: (
    <>
      <Path d="M8 2v4" />
      <Path d="M16 2v4" />
      <Rect width="18" height="18" x="3" y="4" rx="2" />
      <Path d="M3 10h18" />
      <Path d="m14 14 4 4" />
      <Path d="m18 14-4 4" />
    </>
  ),
  more: (
    <>
      <Circle cx="12" cy="12" r="1" />
      <Circle cx="19" cy="12" r="1" />
      <Circle cx="5" cy="12" r="1" />
    </>
  ),
  left: <Path d="m15 18-6-6 6-6" />,
  right: <Path d="m9 18 6-6-6-6" />,
  edit: (
    <>
      <Path d="M12 20h9" />
      <Path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </>
  ),
  info: (
    <>
      <Circle cx="12" cy="12" r="10" />
      <Path d="M12 16v-4" />
      <Path d="M12 8h.01" />
    </>
  ),
  x: (
    <>
      <Path d="M18 6 6 18" />
      <Path d="m6 6 12 12" />
    </>
  ),
  check: <Path d="M20 6 9 17l-5-5" />,
  minus: <Path d="M5 12h14" />,
  plus: (
    <>
      <Path d="M5 12h14" />
      <Path d="M12 5v14" />
    </>
  ),
  chevronDown: <Path d="m6 9 6 6 6-6" />,
  note: (
    <>
      <Path d="M15 3v4a2 2 0 0 0 2 2h4" />
      <Path d="M18 17h-7" />
      <Path d="M18 13h-7" />
      <Path d="M21 7.5V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h9.5z" />
    </>
  ),
  mail: (
    <>
      <Path d="m22 7-8.991 5.727a2 2 0 0 1-2.009 0L2 7" />
      <Rect x="2" y="4" width="20" height="16" rx="2" />
    </>
  ),
  lock: (
    <>
      <Rect width="18" height="11" x="3" y="11" rx="2" />
      <Path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </>
  ),
  eye: (
    <>
      <Path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0" />
      <Circle cx="12" cy="12" r="3" />
    </>
  ),
  face: (
    <>
      <Path d="M4 8V6a2 2 0 0 1 2-2h2" />
      <Path d="M16 4h2a2 2 0 0 1 2 2v2" />
      <Path d="M20 16v2a2 2 0 0 1-2 2h-2" />
      <Path d="M8 20H6a2 2 0 0 1-2-2v-2" />
      <Path d="M9 10h.01" />
      <Path d="M15 10h.01" />
      <Path d="M9.5 14.5s1 1.5 2.5 1.5 2.5-1.5 2.5-1.5" />
    </>
  ),
  signal: (
    <>
      <Path d="M2 20h.01" />
      <Path d="M7 20v-4" />
      <Path d="M12 20v-8" />
      <Path d="M17 20V8" />
      <Path d="M22 4v16" />
    </>
  ),
  wifi: (
    <>
      <Path d="M12 20h.01" />
      <Path d="M2 8.82a15 15 0 0 1 20 0" />
      <Path d="M5 12.859a10 10 0 0 1 14 0" />
      <Path d="M8.5 16.429a5 5 0 0 1 7 0" />
    </>
  ),
  battery: (
    <>
      <Rect x="2" y="7" width="18" height="10" rx="2.5" fill="currentColor" stroke="none" />
      <Path d="M22 11v2" strokeWidth={2.5} />
    </>
  ),
};

export function Icon({
  name,
  size = 20,
  color,
  strokeWidth = 2,
}: {
  name: IconName;
  size?: number;
  /** The stroke colour; the design always draws these as outlines. */
  color: string;
  strokeWidth?: number;
}) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      color={color}
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {PATHS[name]}
    </Svg>
  );
}
