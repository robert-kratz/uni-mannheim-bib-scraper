// lib/occupancy.ts
import { eq, and } from 'drizzle-orm';
import { DailyOccupancyData, OccupancyDataPoint } from '@/utils/types';
import { BibData, BibPredictionData } from '@/drizzle/schema';
import { db } from '@/drizzle';

const CHUNKS_PER_DAY = 24 * 6; // 144

// Immer diese fünf Bibliotheken zurückliefern, auch wenn keine DB-Daten existieren
const ALL_LIBS = ['A3', 'A5', 'Jura', 'Schloss', 'BWL'] as const;

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
    // Beginne immer mit ALL_LIBS
    const libsSet = new Set<string>(ALL_LIBS);

    // Ergänze um alle Bibliotheken, die tatsächlich Daten haben (falls DB mal mehr enthält)
    dataRows.forEach((r) => {
        if (r.name) libsSet.add(r.name);
    });
    predRows.forEach((r) => {
        if (r.name) libsSet.add(r.name);
    });

    const occMap = new Map<string, Map<number, number>>();
    dataRows.forEach(({ name, chunk, occupancy }) => {
        if (!name || chunk == null || occupancy == null) return;
        if (!occMap.has(name)) occMap.set(name, new Map());
        occMap.get(name)!.set(chunk, occupancy);
    });

    const predMap = new Map<string, Map<number, number>>();
    predRows.forEach(({ name, chunk, prediction }) => {
        if (!name || chunk == null || prediction == null) return;
        if (!predMap.has(name)) predMap.set(name, new Map());
        predMap.get(name)!.set(chunk, prediction);
    });

    /* --------------------- Heutigen Berlin-Chunk ermitteln ----------------- */
    const now = new Date();
    const parts = new Intl.DateTimeFormat('de-DE', {
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

    const todayStr = `${parts.year}-${parts.month}-${parts.day}`;
    const isToday = date === todayStr;
    const currentChunk = Math.floor((+parts.hour * 60 + +parts.minute) / 10);

    /* ------------------------- Chunk → "HH:MM" Helper ---------------------- */
    const formatTime = (chunk: number): string => {
        const h = Math.floor(chunk / 6);
        const m = (chunk % 6) * 10;
        return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    };

    /* -------------------- Interpolation für Datenlücken -------------------- */
    const interpolateGaps = (dataMap: Map<number, number>): Map<number, number> => {
        if (dataMap.size <= 1) return dataMap; // Keine Interpolation möglich bei 0 oder 1 Datenpunkt

        const result = new Map(dataMap);

        // Sortiere die vorhandenen Chunks
        const existingChunks = Array.from(dataMap.keys()).sort((a, b) => a - b);

        // Finde die erste und letzte Chunk mit Daten
        const firstChunk = existingChunks[0];
        const lastChunk = existingChunks[existingChunks.length - 1];

        // Interpoliere nur zwischen dem ersten und letzten existierenden Datenpunkt
        for (let i = 0; i < existingChunks.length - 1; i++) {
            const currentChunk = existingChunks[i];
            const nextChunk = existingChunks[i + 1];

            // Überprüfe, ob es eine Lücke gibt
            if (nextChunk - currentChunk > 1) {
                const currentValue = dataMap.get(currentChunk)!;
                const nextValue = dataMap.get(nextChunk)!;

                // Fülle die Lücke mit interpolierten Werten
                for (let gap = currentChunk + 1; gap < nextChunk; gap++) {
                    // Berechne den Median (Durchschnitt) zwischen den beiden benachbarten Punkten
                    const interpolatedValue = Math.round((currentValue + nextValue) / 2);
                    result.set(gap, interpolatedValue);
                }
            }
        }

        return result;
    };

    /* ----------------------- Result pro Bibliothek ------------------------- */
    const occupancy: Record<string, OccupancyDataPoint[]> = {};

    // Sortiert alphabetisch nach ALL_LIBS-Reihenfolge
    Array.from(libsSet)
        .sort((a, b) => ALL_LIBS.indexOf(a as any) - ALL_LIBS.indexOf(b as any))
        .forEach((lib) => {
            // Holen und interpolieren der Occupancy-Daten
            const oMap = occMap.has(lib) ? interpolateGaps(occMap.get(lib)!) : new Map();
            const pMap = predMap.get(lib) ?? new Map();

            const points: OccupancyDataPoint[] = [];
            for (let chunk = startChunk; chunk <= endChunk; chunk++) {
                const inFuture = isToday && chunk > currentChunk;
                // Wenn in der Zukunft oder nicht vorhanden: null, sonst den Wert
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