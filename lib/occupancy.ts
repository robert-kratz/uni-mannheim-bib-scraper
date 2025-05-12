// lib/occupancy.ts
import { eq, and } from 'drizzle-orm';
import { DailyOccupancyData, OccupancyDataPoint } from '@/utils/types';
import { BibData, BibPredictionData } from '@/drizzle/schema';
import { db } from '@/drizzle';

const CHUNKS_PER_DAY = 24 * 6; // 144

/**
 * Liefert für ein gegebenes Datum (YYYY-MM-DD) die Zeitreihe
 * aller 10-Minuten-Slots jeder Bibliothek, inkl. prediction falls vorhanden.
 * Du kannst mit startChunk/endChunk einschränken, welche Slot-Indizes zurückkommen.
 *
 * @param date       Datum im Format YYYY-MM-DD
 * @param startChunk Index des ersten Chunks (0-basierend), default 0
 * @param endChunk   Index des letzten Chunks, default CHUNKS_PER_DAY-1
 */
export async function getDailyOccupancy(
    date: string,
    startChunk: number = 0,
    endChunk: number = CHUNKS_PER_DAY - 1
): Promise<DailyOccupancyData> {
    const [year, month, day] = date.split('-').map((n) => parseInt(n, 10));

    // 1) Rohdaten abfragen
    const dataRows = await db
        .select({
            name: BibData.name,
            chunk: BibData.chunk,
            occupancy: BibData.percentage,
        })
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

    // 2) Alle Bibliotheksnamen sammeln
    const libSet = new Set<string>();
    dataRows.forEach((r) => libSet.add(r.name ?? ''));
    predRows.forEach((r) => libSet.add(r.name ?? ''));
    const libs = Array.from(libSet).sort();

    // 3) Maps für schnellen Zugriff bauen
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

    // 4) Helper: Chunk → "HH:MM"
    const formatTime = (chunk: number): string => {
        const hh = Math.floor(chunk / 6);
        const mm = (chunk % 6) * 10;
        return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
    };

    // 5) Ergebnis aufbauen mit Einschränkung auf startChunk…endChunk
    const occupancy: Record<string, OccupancyDataPoint[]> = {};
    libs.forEach((lib) => {
        const oMap = occMap.get(lib) ?? new Map();
        const pMap = predMap.get(lib) ?? new Map();

        const points: OccupancyDataPoint[] = [];
        for (let chunk = startChunk; chunk <= endChunk; chunk++) {
            const point: OccupancyDataPoint = {
                time: formatTime(chunk),
                occupancy: oMap.get(chunk) ?? 0,
            };
            const pred = pMap.get(chunk);
            if (pred !== undefined) {
                point.prediction = pred;
            }
            points.push(point);
        }
        occupancy[lib] = points;
    });

    return { date, occupancy };
}
