// app/api/cron/scrape-calendar/route.ts
import { NextRequest, NextResponse } from 'next/server';
import dotenv from 'dotenv';
dotenv.config();

import { fetchCalendarEvents, CalendarEventRow } from '@/lib/scraper';
import { CalendarEvent } from '@/drizzle/schema';
import { db } from '@/drizzle';

const CALENDAR_URL = 'https://www.uni-mannheim.de/studium/termine/semesterzeiten#c117059';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
    const API_KEY = process.env.API_KEY;

    if (!API_KEY) {
        return NextResponse.json({ error: 'API_KEY not configured' }, { status: 500 });
    }

    // Auth
    if (req.headers.get('x-api-key') !== API_KEY) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const events: CalendarEventRow[] = await fetchCalendarEvents(CALENDAR_URL);

        let inserted = 0;
        for (const ev of events) {
            // onConflict → schon vorhandene Events (gleicher name + start) überspringen
            await db
                .insert(CalendarEvent)
                .values(ev)
                .onConflictDoNothing({
                    target: [CalendarEvent.name, CalendarEvent.start],
                });
            inserted++;
        }

        return NextResponse.json({ status: 'ok', inserted });
    } catch (err: any) {
        console.error('Calendar scrape failed:', err);
        return NextResponse.json({ status: 'error', message: err.message }, { status: 500 });
    }
}
