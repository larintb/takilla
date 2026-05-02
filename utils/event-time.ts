/**
 * Returns the effective end time of an event.
 * If event_end_date is set, use it.
 * Otherwise: event_date + 24 hours.
 */
export function effectiveEndDate(
  event_date: string,
  event_end_date?: string | null,
): Date {
  if (event_end_date) return new Date(event_end_date)
  return new Date(new Date(event_date).getTime() + 24 * 60 * 60 * 1000)
}

/**
 * True when the event has fully ended (not just started).
 */
export function isEventOver(
  event_date: string,
  event_end_date?: string | null,
): boolean {
  return effectiveEndDate(event_date, event_end_date) < new Date()
}
