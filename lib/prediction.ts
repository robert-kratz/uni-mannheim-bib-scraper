// lib/prediction.ts
// live‑aware regression (v2): identical behaviour, leaner for faster page‑load
// – single DB query instead of two, fewer passes over data, micro‑optimised loops
import { and, eq, or } from 'drizzle-orm';
import { DateTime } from 'luxon';
import { db } from '@/drizzle';
import { BibData } from '@/drizzle/schema';
import { DailyOccupancyData, OccupancyDataPoint } from '@/utils/types';

/* ------------------------------------------------------------------ */
/*  CONFIG                                                            */
/* ------------------------------------------------------------------ */

const WEEKS_LOOKBACK = 8;
const MIN_DAY_AVG = 10;
const OUTLIER_Z_THRESHOLD = 1.5;
const MIN_VALID_OCC = 1;

/* ------------------------------------------------------------------ */
/*  CONSTS                                                            */
/* ------------------------------------------------------------------ */

const SLOTS = 24 * 6; // 144 × 10‑Minuten‑Slots
const ALL_LIBS = ['A3', 'A5', 'Jura', 'Schloss', 'BWL'] as const;

type DayKey = `${number}-${number}-${number}`;
type ChunkKey = `${DayKey}-${number}`;

/* ------------------------------------------------------------------ */
/*  HELPERS                                                           */
/* ------------------------------------------------------------------ */

const chunkToTime = (c: number) =>
    `${(c / 6).toFixed(0).padStart(2, '0')}:${((c % 6) * 10).toString().padStart(2, '0')}`;

const historyDays = (iso: string) => {
    const base = DateTime.fromISO(iso, { zone: 'Europe/Berlin' }).startOf('day');
    return Array.from({ length: WEEKS_LOOKBACK }, (_, i) => base.minus({ weeks: i + 1 })).filter((d) => d.year >= 2000);
};

function linearRegression(xs: number[], ys: number[]): { a: number; b: number } | null {
    if (xs.length < 2) return null;
    let sumX = 0,
        sumY = 0,
        sumXY = 0,
        sumXX = 0;
    for (let i = 0; i < xs.length; i++) {
        const x = xs[i];
        const y = ys[i];
        sumX += x;
        sumY += y;
        sumXY += x * y;
        sumXX += x * x;
    }
    const n = xs.length;
    const denom = n * sumXX - sumX * sumX;
    if (!denom) return null;
    const b = (n * sumXY - sumX * sumY) / denom;
    return { b, a: (sumY - b * sumX) / n };
}

function filterOutliers(xs: number[], ys: number[], z = OUTLIER_Z_THRESHOLD): [number[], number[]] {
    if (ys.length < 3) return [xs, ys];
    const mean = ys.reduce((a, b) => a + b, 0) / ys.length;
    const sd = Math.sqrt(ys.reduce((s, v) => s + (v - mean) ** 2, 0) / ys.length) || 1;
    const fXs: number[] = [];
    const fYs: number[] = [];
    for (let i = 0; i < ys.length; i++) {
        if (Math.abs(ys[i] - mean) / sd <= z) {
            fXs.push(xs[i]);
            fYs.push(ys[i]);
        }
    }
    return [fXs, fYs];
}

/* ------------------------------------------------------------------ */
/*  MAIN                                                              */
/* ------------------------------------------------------------------ */
export async function getPrediction(
    date: string,
    startChunk: number = 0,
    endChunk: number = SLOTS - 1
): Promise<DailyOccupancyData> {
    const target = DateTime.fromISO(date, { zone: 'Europe/Berlin' });
    if (!target.isValid) throw new Error(`invalid date '${date}'`);

    const now = DateTime.now().setZone('Europe/Berlin');
    const isToday = target.hasSame(now, 'day');
    const currentChunk = Math.floor((now.hour * 60 + now.minute) / 10);

    /* ---------- 1 · Relevante Tage bestimmen ---------------------- */
    const histDays = historyDays(date);
    if (!histDays.length) return blank(date, startChunk, endChunk);
    const allDays = [...histDays, ...(isToday ? [target] : [])]; // **ein** Query reicht

    /* ---------- 2 · Datenbank‑Pull (ein Aufruf) ------------------- */
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
        .where(
            or(...allDays.map((d) => and(eq(BibData.year, d.year), eq(BibData.month, d.month), eq(BibData.day, d.day))))
        );

    /* ---------- 3 · Maps initialisieren --------------------------- */
    const daySum = new Map<string, Map<DayKey, { sum: number; n: number }>>();
    const positivePerChunk = new Map<ChunkKey, number>();
    const liveOcc: Record<string, Record<number, number>> = Object.fromEntries(
        ALL_LIBS.map((l) => [l, Object.create(null)])
    );

    /* ---------- 4 · Erste Pass: daySum + positiveChunk + liveOcc -- */
    rows.forEach(({ lib, chunk, occ, y, m, d }) => {
        if (!lib || chunk == null) return;
        const dk = `${y}-${m}-${d}` as DayKey;
        const ck = `${dk}-${chunk}` as ChunkKey;

        if ((occ ?? 0) >= MIN_VALID_OCC) {
            positivePerChunk.set(ck, (positivePerChunk.get(ck) ?? 0) + 1);
            if (isToday && y === target.year && m === target.month && d === target.day) {
                liveOcc[lib][chunk] = occ!;
            }
        }

        // daySum aufbauen
        if (!daySum.has(lib)) daySum.set(lib, new Map());
        const inner = daySum.get(lib)!;
        if (!inner.has(dk)) inner.set(dk, { sum: 0, n: 0 });
        if ((occ ?? 0) >= MIN_VALID_OCC) {
            const s = inner.get(dk)!;
            s.sum += occ!;
            s.n++;
        }
    });

    /* ---------- 5 · Erlaubte Tage pro Bibliothek berechnen -------- */
    const allowedDays = new Map<string, Set<DayKey>>();
    daySum.forEach((inner, lib) => {
        const ok = new Set<DayKey>();
        inner.forEach(({ sum, n }, dk) => {
            if (n && sum / n >= MIN_DAY_AVG) ok.add(dk);
        });
        allowedDays.set(lib, ok);
    });

    /* ---------- 6 · Series + missingChunks in einem Durchgang ----- */
    const missingChunks = new Set<ChunkKey>(
        [...positivePerChunk.entries()].filter(([, cnt]) => cnt === 0).map(([k]) => k)
    );

    const series = new Map<string, Map<number, { xs: number[]; ys: number[]; max: number }>>();

    rows.forEach(({ lib, chunk, occ, y, m, d }) => {
        if (!lib || chunk == null || (occ ?? 0) < MIN_VALID_OCC) return;

        if (y == null || m == null || d == null) return; // safety check
        const dk = `${y}-${m}-${d}` as DayKey;
        if (!allowedDays.get(lib)?.has(dk)) return;
        const ck = `${dk}-${chunk}` as ChunkKey;
        if (missingChunks.has(ck)) return;

        const offsetWeeks = Math.round(
            target
                .startOf('week')
                .diff(
                    DateTime.fromObject({ year: y, month: m, day: d }, { zone: 'Europe/Berlin' }).startOf('week'),
                    'weeks'
                ).weeks
        );

        if (!series.has(lib)) series.set(lib, new Map());
        const inner = series.get(lib)!;
        if (!inner.has(chunk)) inner.set(chunk, { xs: [], ys: [], max: 0 });
        const cell = inner.get(chunk)!;
        cell.xs.push(offsetWeeks);
        cell.ys.push(occ!);
        cell.max = occ! > cell.max ? occ! : cell.max;
    });

    /* ---------- 7 · Vorhersage ------------------------------------ */
    const occupancy: Record<string, OccupancyDataPoint[]> = Object.create(null);

    for (const lib of ALL_LIBS) {
        const libSer = series.get(lib) ?? new Map();
        const predBase: number[] = Array(endChunk - startChunk + 1).fill(0);
        const pts: OccupancyDataPoint[] = [];

        // 7.1 Baseline berechnen
        for (let c = startChunk; c <= endChunk; c++) {
            const data = libSer.get(c);
            if (!data) continue;
            const [fXs, fYs] = filterOutliers(data.xs, data.ys);
            if (fYs.length >= 2) {
                const lr = linearRegression(fXs, fYs);
                if (lr) {
                    predBase[c - startChunk] = Math.round(Math.min(lr.a, Math.max(...fYs, 0), 100));
                    continue;
                }
            }
            if (fYs.length)
                predBase[c - startChunk] = Math.round(Math.min(fYs.reduce((a, b) => a + b, 0) / fYs.length, 100));
        }

        // 7.2 Live‑Delta ermitteln
        const liveVal =
            isToday && currentChunk >= startChunk && currentChunk <= endChunk ? liveOcc[lib][currentChunk] : undefined;
        const delta = liveVal != null ? liveVal - predBase[currentChunk - startChunk] : 0;

        // 7.3 Fertige Punkte
        for (let c = startChunk; c <= endChunk; c++) {
            const idx = c - startChunk;
            const occNow = isToday ? (liveOcc[lib][c] ?? null) : null;
            let pred: number | undefined;
            if (occNow == null) {
                pred = Math.round(Math.min(Math.max(predBase[idx] + delta, 0), 100));
                if (isToday && c <= currentChunk) pred = undefined;
            }
            pts.push({ time: chunkToTime(c), occupancy: occNow, prediction: pred });
        }
        occupancy[lib] = pts;
    }

    return { date, occupancy };
}

/* ------------------------------------------------------------------ */
/*  Fallback                                                          */
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
    } as DailyOccupancyData;
}
