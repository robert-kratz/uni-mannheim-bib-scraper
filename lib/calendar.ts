// lib/calendar.ts
import { db } from '@/drizzle';
import { CalendarEvent } from '@/drizzle/schema';
import { InferSelectModel, and, gte, lte } from 'drizzle-orm';
import { InferSemesterPeriod, SemesterPeriod } from '@/utils/types';

/**
 * Liefert alle (oder gefilterte) Kalender-Events sortiert nach Startdatum.
 *
 * @param opts.from  – nur Events ab diesem Datum (inkl.)
 * @param opts.to    – nur Events bis zu diesem Datum (inkl.)
 */
export async function getCalendarEvents(opts?: { from?: Date; to?: Date }): Promise<InferSemesterPeriod[]> {
    const { from, to } = opts ?? {};

    // WHERE-Klausel dynamisch zusammenbauen
    let whereClause;
    if (from && to) whereClause = and(gte(CalendarEvent.start, from), lte(CalendarEvent.end, to));
    else if (from) whereClause = gte(CalendarEvent.start, from);
    else if (to) whereClause = lte(CalendarEvent.end, to);

    return db
        .select()
        .from(CalendarEvent)
        .where(whereClause) // undefined → kein Filter
        .orderBy(CalendarEvent.start); // chronologisch
}
