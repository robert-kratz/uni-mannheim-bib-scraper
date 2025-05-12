// lib/occupancy.ts
import { eq, and } from 'drizzle-orm';
import { DailyOccupancyData, OccupancyDataPoint } from '@/utils/types';
import { BibData, BibPredictionData } from '@/drizzle/schema';
import { db } from '@/drizzle';

const CHUNKS_PER_DAY = 24 * 6; // 144

export async function getDailyOccupancy(
    date: string,
    startChunk = 0,
    endChunk = CHUNKS_PER_DAY - 1
): Promise<DailyOccupancyData> {
    const [year, month, day] = date.split('-').map(Number);

    /* ----------------------------- Daten holen ----------------------------- */
    const dataRows = await db
        .select({ name: BibData.name, chunk: BibData.chunk, occupancy: BibData.percentage })
        .from(BibData)
        .where(and(eq(BibData.year, year), eq(BibData.month, month), eq(BibData.day, day)));

    const predRows = await db
        .select({
            name: BibPredictionData.name,
            chunk: BibPredictionData.chunk,
            prediction: BibPredictionData.percentage,
        })
        .from(BibPredictionData)
        .where(
            and(eq(BibPredictionData.year, year), eq(BibPredictionData.month, month), eq(BibPredictionData.day, day))
        );

    /* ---------------------- Lib-Liste & Maps vorbereiten ------------------- */
    const libs = new Set<string>();
    dataRows.forEach((r) => libs.add(r.name ?? ''));
    predRows.forEach((r) => libs.add(r.name ?? ''));

    const occMap = new Map<string, Map<number, number>>();
    dataRows.forEach(({ name, chunk, occupancy }) => {
        if (name == null || chunk == null || occupancy == null) return;

        if (!occMap.has(name)) occMap.set(name, new Map());
        occMap.get(name)!.set(chunk, occupancy);
    });

    const predMap = new Map<string, Map<number, number>>();
    predRows.forEach(({ name, chunk, prediction }) => {
        if (name == null || chunk == null || prediction == null) return;

        if (!predMap.has(name)) predMap.set(name, new Map());
        predMap.get(name)!.set(chunk, prediction);
    });

    /* --------------------- Heutigen Berlin-Chunk ermitteln ----------------- */
    const now = new Date();
    const nowParts = new Intl.DateTimeFormat('de-DE', {
        timeZone: 'Europe/Berlin',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
    })
        .formatToParts(now)
        .reduce<Record<string, string>>((a, p) => {
            if (p.type !== 'literal') a[p.type] = p.value;
            return a;
        }, {});

    const todayStr = `${nowParts.year}-${nowParts.month}-${nowParts.day}`;
    const isToday = date === todayStr;
    const currentChunk = Math.floor((parseInt(nowParts.hour) * 60 + parseInt(nowParts.minute)) / 10);

    /* ------------------------- Chunk → "HH:MM" Helper ---------------------- */
    const formatTime = (chunk: number): string => {
        const h = Math.floor(chunk / 6);
        const m = (chunk % 6) * 10;
        return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    };

    /* ----------------------- Result pro Bibliothek ------------------------- */
    const occupancy: Record<string, OccupancyDataPoint[]> = {};

    Array.from(libs)
        .sort()
        .forEach((lib) => {
            const oMap = occMap.get(lib) ?? new Map();
            const pMap = predMap.get(lib) ?? new Map();

            const points: OccupancyDataPoint[] = [];
            for (let chunk = startChunk; chunk <= endChunk; chunk++) {
                const inFuture = isToday && chunk > currentChunk;

                const occVal: number | null = inFuture ? null : (oMap.get(chunk) ?? null);

                const point: OccupancyDataPoint = {
                    time: formatTime(chunk),
                    occupancy: occVal,
                };

                if (!inFuture) {
                    const pred = pMap.get(chunk);
                    if (pred !== undefined) point.prediction = pred;
                }

                points.push(point);
            }

            occupancy[lib] = points;
        });

    return { date, occupancy };
}
