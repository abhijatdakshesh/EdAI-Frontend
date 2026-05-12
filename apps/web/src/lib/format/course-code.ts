/**
 * Course code + display formatters used across the Student portal.
 *
 * VTU course codes use the form `<DEPT><SEM><SEQUENCE>` e.g. `CS501`,
 * `CS601`. UI convention: render as `CS5-01`, `CS6-01` with a dash to
 * separate semester from the per-semester sequence so students can read
 * them at a glance.
 */
export function formatCourseCode(raw: string | null | undefined): string {
  if (!raw) return "";
  const trimmed = raw.trim().toUpperCase();
  // Match: 2-4 letter dept prefix, 1 digit semester, 2 digit sequence.
  const m = trimmed.match(/^([A-Z]{2,4})(\d)(\d{2})$/);
  if (!m) return trimmed; // already formatted or non-standard — leave as-is.
  return `${m[1]}${m[2]}-${m[3]}`;
}

/**
 * Render `<courseCode> - <credits> Credits`, used on course cards and
 * attendance rows. Falls back gracefully when credits are missing.
 */
export function formatCourseLine(
  code: string | null | undefined,
  credits: number | null | undefined,
): string {
  const c = formatCourseCode(code);
  if (credits == null) return c;
  const label = credits === 1 ? "Credit" : "Credits";
  return `${c} - ${credits} ${label}`;
}

/**
 * Convert a 24-hour `HH:MM` (or `H:MM`) clock string into a 12-hour
 * display with AM/PM. Used by the dashboard "Next class" line which the
 * QA report flagged as ambiguous (`09:00` could be evening for some).
 */
export function formatTimeWithAmPm(time: string | null | undefined): string {
  if (!time) return "";
  const m = time.trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return time;
  const hour24 = parseInt(m[1] ?? "", 10);
  const minute = m[2] ?? "00";
  if (Number.isNaN(hour24) || hour24 < 0 || hour24 > 23) return time;
  const period = hour24 >= 12 ? "PM" : "AM";
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;
  return `${hour12}:${minute} ${period}`;
}

/**
 * Append AM/PM to any free-form schedule string that contains an
 * `HH:MM` time. Leaves anything that does not look like a clock alone.
 *
 * Examples:
 *   "Monday 09:00"        -> "Monday 09:00 AM"
 *   "Mon 14:30 - 15:30"   -> "Mon 14:30 PM - 15:30 PM"
 *   "Self-study"          -> "Self-study"
 */
export function appendAmPmToSchedule(label: string | null | undefined): string {
  if (!label) return "";
  return label.replace(/\b(\d{1,2}):(\d{2})\b/g, (_full, h: string, mm: string) => {
    const hour24 = parseInt(h, 10);
    if (Number.isNaN(hour24) || hour24 < 0 || hour24 > 23) return `${h}:${mm}`;
    const period = hour24 >= 12 ? "PM" : "AM";
    return `${h}:${mm} ${period}`;
  });
}
