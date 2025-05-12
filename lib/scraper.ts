// lib/scraper.ts
import axios, { AxiosResponse } from 'axios';
import { load } from 'cheerio';

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
                // Name extrahieren & normalisieren
                const rawName = $(elem).find('td:nth-child(2) h4 a').text().trim();
                const name = normalizeName(rawName);

                // Prozent oder 0
                const statusText = $(elem).find('.available-seats-table-status span').text().trim();
                const percentage = statusText.includes('%') ? parseInt(statusText.replace('%', ''), 10) : 0;

                // Chunk basierend auf Berlin-Zeit
                const chunk = computeChunk(hour, minute);

                return { percentage, name, year, month, day, chunk, iat, ttl };
            } catch {
                // Im Fehlerfall: occupancy = 0, aber sonst gleiche Meta-Daten
                return { percentage: 0, name: '', year, month, day, chunk: 0, iat, ttl };
            }
        });

    return rows;
}
