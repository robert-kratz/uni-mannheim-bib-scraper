// lib/prediction.ts
import { and, eq, or } from 'drizzle-orm';
import { DateTime } from 'luxon';
import { db } from '@/drizzle';
import { BibData } from '@/drizzle/schema';
import { DailyOccupancyData, OccupancyDataPoint } from '@/utils/types';

/* ------------------------------------------------------------------ */
/*  CONFIG                                                             */
/* ------------------------------------------------------------------ */

/** wie viele *vergangene Wochen* (gleicher Wochentag) als Trainings­basis */
const WEEKS_LOOKBACK = 8;

/** nur Tage verwenden, deren *Tages-Ø* der Bibliothek ≥ 10 % ist           */
const MIN_DAY_AVG = 10;

/* ------------------------------------------------------------------ */
/*  CONSTS                                                             */
/* ------------------------------------------------------------------ */

const SLOTS = 24 * 6; // 144 × 10 min
const ALL_LIBS = ['A3', 'A5', 'Jura', 'Schloss', 'BWL'] as const;

/* ------------------------------------------------------------------ */
/*  HELPERS                                                            */
/* ------------------------------------------------------------------ */

const chunkToTime = (c: number) =>
    `${String(Math.floor(c / 6)).padStart(2, '0')}:${String((c % 6) * 10).padStart(2, '0')}`;

const historyDays = (iso: string) => {
    const base = DateTime.fromISO(iso, { zone: 'Europe/Berlin' }).startOf('day');
    return Array.from({ length: WEEKS_LOOKBACK }, (_, i) => base.minus({ weeks: i + 1 })).filter((d) => d.year >= 2000);
};

function linearRegression(xs: number[], ys: number[]): { a: number; b: number } | null {
    const n = xs.length;
    if (n < 2) return null;
    const sumX = xs.reduce((a, b) => a + b, 0);
    const sumY = ys.reduce((a, b) => a + b, 0);
    const sumXY = xs.reduce((s, x, i) => s + x * ys[i], 0);
    const sumXX = xs.reduce((s, x) => s + x * x, 0);

    const denom = n * sumXX - sumX * sumX;
    if (denom === 0) return null;

    const b = (n * sumXY - sumX * sumY) / denom; // slope
    const a = (sumY - b * sumX) / n; // intercept
    return { a, b };
}

/* ------------------------------------------------------------------ */
/*  MAIN                                                               */
/* ------------------------------------------------------------------ */
export async function getPrediction(date: string, startChunk = 0, endChunk = SLOTS - 1): Promise<DailyOccupancyData> {
    const target = DateTime.fromISO(date, { zone: 'Europe/Berlin' });
    if (!target.isValid) throw new Error(`invalid date '${date}'`);

    const today = DateTime.now().setZone('Europe/Berlin');
    const isToday = target.hasSame(today, 'day');
    const currentChunk = Math.floor((today.hour * 60 + today.minute) / 10);

    /* ---------- 1 · Trainings­tage holen ---------------------------- */
    const days = historyDays(date);
    if (!days.length) return blank(date, startChunk, endChunk);

    /* ---------- 2 · SQL-Pull ---------------------------------------- */
    const clauses = days.map((d) => and(eq(BibData.year, d.year), eq(BibData.month, d.month), eq(BibData.day, d.day)));

    const rows = await db
        .select({
            lib: BibData.name,
            chunk: BibData.chunk,
            occ: BibData.percentage,
            y: BibData.year,
            m: BibData.month,
            d: BibData.day,
        })
        .from(BibData)
        .where(or(...clauses));

    /* ---------- 3 · Averagen pro Tag & Lib (Filter <10 %) ----------- */
    type DayKey = string; // `${y}-${m}-${d}`
    const daySum = new Map<string, Map<DayKey, { sum: number; n: number }>>();

    rows.forEach(({ lib, y, m, d, occ }) => {
        if (!lib || occ == null) return;
        const k: DayKey = `${y}-${m}-${d}`;
        if (!daySum.has(lib)) daySum.set(lib, new Map());
        const inner = daySum.get(lib)!;
        if (!inner.has(k)) inner.set(k, { sum: 0, n: 0 });
        const s = inner.get(k)!;
        s.sum += occ;
        s.n++;
    });

    const allowedDaysPerLib = new Map<string, Set<DayKey>>();
    daySum.forEach((map, lib) => {
        const okSet = new Set<DayKey>();
        map.forEach(({ sum, n }, key) => {
            if (n && sum / n >= MIN_DAY_AVG) okSet.add(key);
        });
        allowedDaysPerLib.set(lib, okSet);
    });

    /* ---------- 4 · Datenstruktur für Regression -------------------- */
    const series = new Map<
        string,
        Map<
            number,
            {
                xs: number[]; // t index
                ys: number[]; // occupancy
                max: number;
            }
        >
    >();

    rows.forEach(({ lib, chunk, occ, y, m, d }) => {
        if (!lib || chunk == null || occ == null) return;
        const k: DayKey = `${y}-${m}-${d}`;
        if (!allowedDaysPerLib.get(lib)?.has(k)) return; // skip low-occupancy days

        const t = days.findIndex((dt) => dt.year === y && dt.month === m && dt.day === d);
        if (t === -1) return;

        if (!series.has(lib)) series.set(lib, new Map());
        const inner = series.get(lib)!;
        if (!inner.has(chunk)) inner.set(chunk, { xs: [], ys: [], max: 0 });
        const cell = inner.get(chunk)!;

        cell.xs.push(t);
        cell.ys.push(occ);
        cell.max = Math.max(cell.max, occ);
    });

    /* ---------- 5 · Vorhersage berechnen ---------------------------- */
    const occupancy: Record<string, OccupancyDataPoint[]> = {};

    ALL_LIBS.forEach((lib) => {
        const libSer = series.get(lib) ?? new Map<number, { xs: number[]; ys: number[]; max: number }>();
        const pts: OccupancyDataPoint[] = [];

        for (let c = startChunk; c <= endChunk; c++) {
            const data = libSer.get(c);
            let pred: number | null = null;

            if (data && data.xs.length >= 2) {
                const lr = linearRegression(data.xs, data.ys);
                if (lr) {
                    pred = Math.round(Math.min(lr.a + lr.b * data.xs.length, data.max, 100));
                }
            } else if (data && data.ys.length) {
                // fallback → Mittelwert der vorhandenen Werte
                const mean = data.ys.reduce((a, b) => a + b, 0) / data.ys.length;
                pred = Math.round(Math.min(mean, data.max, 100));
            }

            const inFuture = (isToday && c > currentChunk) || target > today.startOf('day');

            pts.push({
                time: chunkToTime(c),
                occupancy: null,
                prediction: inFuture ? pred || 0 : undefined,
            });
        }
        occupancy[lib] = pts;
    });

    return { date, occupancy };
}

/* ------------------------------------------------------------------ */
/*  Fallback                                                           */
/* ------------------------------------------------------------------ */
function blank(date: string, start: number, end: number): DailyOccupancyData {
    return {
        date,
        occupancy: Object.fromEntries(
            ALL_LIBS.map((lib) => [
                lib,
                Array.from({ length: end - start + 1 }, (_, i) => ({
                    time: chunkToTime(start + i),
                    occupancy: null,
                })),
            ])
        ),
    };
}
