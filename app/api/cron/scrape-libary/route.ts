// app/api/cron/update-data/route.ts
import { NextRequest, NextResponse } from 'next/server';
import dotenv from 'dotenv';
dotenv.config();
import { fetchScrapedData, BibDataRow } from '@/lib/scraper';
import { BibData } from '@/drizzle/schema';
import { db } from '@/drizzle';

const ALLOWED_LIBS = new Set(['A3', 'A5', 'Jura', 'Schloss', 'BWL']);

// Dieses Secret muss in deiner .env stehen:
// API_KEY=dein-geheimes-token
const API_KEY = process.env.API_KEY;
// Die URL, die gescrapt werden soll:
//const SCRAPE_URL = 'https://www.bib.uni-mannheim.de/standorte/freie-sitzplaetze/';
const SCRAPE_URL =
    'https://web.archive.org/web/20250409175544/https://www.bib.uni-mannheim.de/standorte/freie-sitzplaetze/';

if (!API_KEY) {
    throw new Error('API_KEY is not set in your environment');
}
if (!SCRAPE_URL) {
    throw new Error('SCRAPE_URL is not set in your environment');
}

function computeTTL(iat: Date): Date {
    const t = new Date(iat);
    t.setUTCFullYear(t.getUTCFullYear() + 1);
    return t;
}

export async function GET(request: NextRequest) {
    // 1) Authentifiziere den Cron-Job
    const key = request.headers.get('x-api-key');
    console.log('Cron job called with key:', key);
    console.log('API_KEY:', API_KEY);
    if (!key || key !== API_KEY) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        // 2) Scrape die Roh-Daten
        const scraped: BibDataRow[] = await fetchScrapedData(SCRAPE_URL);

        console.log('Scraped data:', scraped);

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
                // falls etwas schiefgeht bei genau diesem Datensatz,
                // einfach weiter – wir wollen keinen kompletten Cron-Abbruch.
                console.error('Insert error for', row, e);
            }
        }

        return NextResponse.json({ status: 'ok', inserted });
    } catch (err: any) {
        console.error('Cron update failed', err);
        return NextResponse.json({ status: 'error', message: err.message }, { status: 500 });
    }
}
