// app/api/cron/update-data/route.ts
import { NextRequest, NextResponse } from 'next/server';
import dotenv from 'dotenv';
dotenv.config();
import { fetchScrapedData, BibDataRow } from '@/lib/scraper';
import { BibData } from '@/drizzle/schema';
import { db } from '@/drizzle';
import { ALLOWED_LIBS } from '@/utils/constants';

const SCRAPE_URL = 'https://www.bib.uni-mannheim.de/standorte/freie-sitzplaetze/';
//const SCRAPE_URL = ('https://web.archive.org/web/20250409175544/https://www.bib.uni-mannheim.de/standorte/freie-sitzplaetze/'); # Only for testing

function computeTTL(iat: Date): Date {
    const t = new Date(iat);
    t.setUTCFullYear(t.getUTCFullYear() + 1);
    return t;
}

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
    const API_KEY = process.env.API_KEY;

    if (!API_KEY) {
        return NextResponse.json({ error: 'API_KEY not configured' }, { status: 500 });
    }

    const key = request.headers.get('x-api-key');
    if (!key || key !== API_KEY) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const scraped: BibDataRow[] = await fetchScrapedData(SCRAPE_URL);

        let inserted = 0;
        for (const row of scraped) {
            // 3) Filter: nur erlaubte Bibliotheken & valid row.name
            if (!row.name || !ALLOWED_LIBS.has(row.name)) {
                continue;
            }

            // 4) Versuche Insert, ignoriere Duplikate
            try {
                await db.insert(BibData).values({
                    ...row,
                    iat: new Date(),
                    ttl: computeTTL(new Date(row.iat)),
                });
                inserted++;
            } catch (e) {
                console.error('Insert error for', row, e);
            }
        }

        return NextResponse.json({ status: 'ok', inserted });
    } catch (err: any) {
        console.error('Cron update failed', err);
        return NextResponse.json({ status: 'error', message: err.message }, { status: 500 });
    }
}
