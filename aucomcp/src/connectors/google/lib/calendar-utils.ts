export interface CalendarEventOverrides {
  summary?: string;
  description?: string;
  location?: string;
  start?: { dateTime?: string; date?: string; timeZone?: string };
  end?: { dateTime?: string; date?: string; timeZone?: string };
  attendees?: string[];
  attachments?: { fileUrl: string; title?: string; mimeType?: string }[];
}

export function buildCalendarEventUpdate(existing: Record<string, unknown>, overrides: CalendarEventOverrides) {
  const existingAttendees = existing.attendees as Array<{ email?: string }> | undefined;
  return {
    summary: overrides.summary !== undefined ? overrides.summary : existing.summary,
    description: overrides.description !== undefined ? overrides.description : existing.description,
    location: overrides.location !== undefined ? overrides.location : existing.location,
    start: overrides.start || existing.start,
    end: overrides.end || existing.end,
    attendees:
      overrides.attendees !== undefined ?
        overrides.attendees.map((email) => ({ email }))
      : existingAttendees,
    attachments: overrides.attachments !== undefined ? overrides.attachments : existing.attachments,
    recurrence: existing.recurrence,
    visibility: existing.visibility,
    reminders: existing.reminders,
  };
}
