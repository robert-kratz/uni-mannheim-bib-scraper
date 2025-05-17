// lib/prediction.ts
import { and, eq, or } from 'drizzle-orm';
import { DateTime } from 'luxon';

import { db } from '@/drizzle';
import { BibData } from '@/drizzle/schema';
import { DailyOccupancyData, OccupancyDataPoint } from '@/utils/types';

/* ------------------------------------------------------------------ */
/*  Consts                                                             */
/* ------------------------------------------------------------------ */
const CHUNKS_PER_DAY = 24 * 6; // 144 × 10-Minuten-Slots
const ALL_LIBS = ['A3', 'A5', 'Jura', 'Schloss', 'BWL'] as const;

/* ------------------------------------------------------------------ */
/*  Helper: letzte 5 Montage vor (nicht inkl.) targetDate              */
/* ------------------------------------------------------------------ */
const lastFiveMondays = (iso: string) => {
    const list: DateTime[] = [];
    let dt = DateTime.fromISO(iso, { zone: 'Europe/Berlin' }).minus({ days: 1 }); // gestern starten
    while (list.length < 5 && dt.year > 2000) {
        if (dt.weekday === 1) list.push(dt);
        dt = dt.minus({ days: 1 });
    }
    return list;
};

/* ------------------------------------------------------------------ */
/*  Helper: Chunk → "HH:MM"                                            */
/* ------------------------------------------------------------------ */
const chunkToTime = (c: number) => {
    const h = Math.floor(c / 6);
    const m = (c % 6) * 10;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
};

/* ------------------------------------------------------------------ */
/*  Main                                                               */
/* ------------------------------------------------------------------ */
export async function getPrediction(
    date: string,
    startChunk = 0,
    endChunk = CHUNKS_PER_DAY - 1
): Promise<DailyOccupancyData> {
    /* ------------------- 1 · Ziel-, Heute-, Chunk-Info ------------------- */
    const target = DateTime.fromISO(date, { zone: 'Europe/Berlin' });
    if (!target.isValid) throw new Error(`invalid date '${date}'`);

    const today = DateTime.now().setZone('Europe/Berlin');
    const isPastDay = target < today.startOf('day');
    const isToday = target.hasSame(today, 'day');
    const currentChunk = Math.floor((today.hour * 60 + today.minute) / 10);

    /* ------------------- 2 · Datenbasis: Ø der letzten 5 Mo -------------- */
    const mondayDTs = lastFiveMondays(date);

    if (mondayDTs.length === 0) {
        // Nichts in DB → überall null
        return {
            date,
            occupancy: Object.fromEntries(
                ALL_LIBS.map((lib) => [
                    lib,
                    Array.from({ length: endChunk - startChunk + 1 }, (_, i) => ({
                        time: chunkToTime(startChunk + i),
                        occupancy: null,
                    })),
                ])
            ),
        };
    }

    // Query einmalig für *alle* 5 Montage
    const mondayClauses = mondayDTs.map((d) =>
        and(eq(BibData.year, d.year), eq(BibData.month, d.month), eq(BibData.day, d.day))
    );

    const rows = await db
        .select({ name: BibData.name, chunk: BibData.chunk, occupancy: BibData.percentage })
        .from(BibData)
        .where(or(...mondayClauses));

    /* ---------- 2.1 · Aggregation: Summe & Zähler pro Lib + Chunk -------- */
    const sumMap = new Map<string, Map<number, { sum: number; n: number }>>();

    rows.forEach(({ name, chunk, occupancy }) => {
        if (!name || chunk == null || occupancy == null) return;
        if (!sumMap.has(name)) sumMap.set(name, new Map());
        const inner = sumMap.get(name)!;
        if (!inner.has(chunk)) inner.set(chunk, { sum: 0, n: 0 });
        const slot = inner.get(chunk)!;
        slot.sum += occupancy;
        slot.n += 1;
    });

    /* ---------- 2.2 · Ø berechnen --------------------------------------- */
    const avgMap = new Map<string, Map<number, number>>();
    sumMap.forEach((inner, lib) => {
        avgMap.set(
            lib,
            new Map(
                Array.from(inner.entries()).map(([c, { sum, n }]) => [
                    c,
                    Math.round(sum / n), // runden auf ganze Prozent
                ])
            )
        );
    });

    /* ------------------- 3 · Ergebnisstruktur bauen ---------------------- */
    const occupancy: Record<string, OccupancyDataPoint[]> = {};

    [...ALL_LIBS].forEach((lib) => {
        const libMap = avgMap.get(lib) ?? new Map<number, number>();

        const datapoints: OccupancyDataPoint[] = [];
        for (let c = startChunk; c <= endChunk; c++) {
            const inFuture = (isToday && c > currentChunk) || target > today.startOf('day'); // heute-Zukunft ODER zukünftiger Tag

            const predVal = inFuture ? (libMap.get(c) ?? null) : null;

            datapoints.push({
                time: chunkToTime(c),
                occupancy: null, // echte Belegung nicht benötigt
                prediction: predVal ?? undefined,
            });
        }

        occupancy[lib] = datapoints;
    });

    return { date, occupancy };
}
