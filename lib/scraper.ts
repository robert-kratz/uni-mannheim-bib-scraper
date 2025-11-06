// lib/scraper.ts
import axios, { AxiosResponse } from 'axios';
import { load } from 'cheerio';
import { CalendarEvent, EventType } from '@/drizzle/schema';
import { InferInsertModel } from 'drizzle-orm';

/**
 * Ein DB-Row für die Tabelle "BibData".
 */
export interface BibDataRow {
    percentage: number; // occupancy
    name: string;
    year: number;
    month: number;
    day: number;
    chunk: number;
    iat: string; // ISO-Timestamp jetzt (UTC)
    ttl: string; // ISO-Timestamp jetzt + 1 Jahr
}

/**
 * Keyword-Mapping für Bibliotheksnamen.
 */
const nameMapping: { keyword: string; target: string }[] = [
    { keyword: 'A3', target: 'A3' },
    { keyword: 'A5', target: 'A5' },
    { keyword: 'Ehrenhof', target: 'Jura' },
    { keyword: 'Westflügel', target: 'Schloss' },
    { keyword: 'Schneckenhof', target: 'BWL' },
];

function normalizeName(rawName: string): string {
    for (const { keyword, target } of nameMapping) {
        if (rawName.includes(keyword)) return target;
    }
    return rawName;
}

/**
 * Berechnet aus Stunde und Minute (Berlin) den 10-Minuten-Chunk (0–143).
 */
function computeChunk(hour: number, minute: number): number {
    return Math.floor((hour * 60 + minute) / 10);
}

/**
 * TTL = iat + 1 Jahr, als ISO-String.
 */
function computeTTL(iatISO: string): string {
    const d = new Date(iatISO);
    d.setUTCFullYear(d.getUTCFullYear() + 1);
    return d.toISOString();
}

/**
 * Scrapt die Auslastungs-Tabelle von einer URL und
 * liefert ein Array von BibDataRow, ready für den Bulk-Insert.
 * Im Fehlerfall wird für die jeweilige Zeile occupancy = 0 gesetzt.
 */
export async function fetchScrapedData(url: string): Promise<BibDataRow[]> {
    // 1) HTML laden
    const resp: AxiosResponse<string> = await axios.get<string>(url);
    const $ = load(resp.data);

    // 2) Formatter für Berlin-Datumsteile und Zeit
    const dtf = new Intl.DateTimeFormat('en', {
        timeZone: 'Europe/Berlin',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
    });

    const now = new Date();
    const parts = dtf.formatToParts(now).reduce<Record<string, string>>((acc, cur) => {
        if (cur.type !== 'literal') acc[cur.type] = cur.value;
        return acc;
    }, {});

    const year = parseInt(parts.year, 10);
    const month = parseInt(parts.month, 10);
    const day = parseInt(parts.day, 10);
    const hour = parseInt(parts.hour, 10);
    const minute = parseInt(parts.minute, 10);

    // iat & ttl (UTC ISO-Strings)
    const iat = new Date().toISOString();
    const ttl = computeTTL(iat);

    // 3) Jede Tabellenzeile in einen BibDataRow umwandeln
    const rows: BibDataRow[] = $('.available-seats-table tbody tr')
        .toArray()
        .map((elem) => {
            try {
                const rawName = $(elem)
                    .find('td:nth-child(2) h4 a')
                    .text()
                    .trim();
                const name = normalizeName(rawName);

                const rawText = $(elem)
                    .find('.available-seats-table-status span[aria-hidden="true"]')
                    .first()
                    .text();
                const digitsOnly = rawText.replace(/\D/g, '');
                const percentage = digitsOnly ? parseInt(digitsOnly, 10) : 0;

                const chunk = computeChunk(hour, minute);

                return { percentage, name, year, month, day, chunk, iat, ttl };
            } catch {
                return { percentage: 0, name: '', year, month, day, chunk: 0, iat, ttl };
            }
        });

    console.log(`Scraped ${rows.length} rows from ${url}`);

    return rows;
}

export type CalendarEventRow = InferInsertModel<typeof CalendarEvent>;

/** daraus der Enum-Typ nur für die Spalte `type` */
type EventKind = CalendarEventRow['type']; // 'lecture' | 'exam' | ...

/** Label-Text → Enum-Value-Mapping */
const typeMap: Record<string, EventKind> = {
    vorlesungszeit: 'lecture',
    prüfungszeit: 'exam',
    'zweittermin prüfungen': 'exam',
    osterferien: 'holiday',
    semester: 'info',
    rückmeldung: 'info',
};

/** Wandelt "1.2.2025" → Date(2025-02-01) (UTC 00:00) */
function parseDMY(dmy: string): Date {
    const [d, m, y] = dmy.split('.').map((n) => parseInt(n, 10));
    return new Date(Date.UTC(y, m - 1, d));
}
/** normalisiert Label → lowerCase ohne geschützte Trenner/Soft-Hyphens */
function normalizeLabel(raw: string): string {
    return raw
        .replace(/\u00AD/g, '') // Soft-Hyphen (­)
        .replace(/[:–\u2013]/g, '') // Doppelpkt + EnDash
        .trim()
        .toLowerCase();
}

export async function fetchCalendarEvents(url: string): Promise<CalendarEventRow[]> {
    const html = (await axios.get(url)).data;
    const $ = load(html);

    const events: CalendarEventRow[] = [];

    $('table.ce-table').each((_i, tbl) => {
        $(tbl)
            .find('tr')
            .each((_j, row) => {
                const rawLabel = $(row).find('td:first-child').text();
                const label = normalizeLabel(rawLabel);

                const rangeText = $(row).find('td:nth-child(2)').text().trim();
                if (!label || !rangeText) return;

                const [from, to] = rangeText.split(/–|-/).map((s) => s.trim());
                if (!from || !to) return;

                // passenden Typ suchen (Substring-Match)
                const foundKey = Object.keys(typeMap).find((key) => label.includes(key));
                const type: EventKind = foundKey ? typeMap[foundKey] : 'info';

                events.push({
                    name: `${rawLabel.trim()} ${from.split('.').pop()}`, // vollständige Überschrift im Namen
                    type,
                    start: parseDMY(from),
                    end: parseDMY(to),
                });
            });
    });

    return events;
}
