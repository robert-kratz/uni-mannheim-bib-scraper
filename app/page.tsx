// app/page.tsx
import IndexPage from '@/components/pages/IndexPage';
import { DailyOccupancyData, EventType, OccupancyDataPoint } from '@/utils/types';
import { getDailyOccupancy } from '@/lib/occupancy';
import { getPrediction } from '@/lib/prediction';
import { getCalendarEvents } from '@/lib/calendar';
import { OccupancyProvider } from '@/hooks/use-occupancy';
import { getWeather } from '@/lib/weather';
import { WeatherProvider } from '@/hooks/use-weather';

export const metadata = {
    title: 'Uni Mannheim - Bibliotheksbelegung',
    description: 'Live-Belegung der Bibliotheken der Universität Mannheim',
};

/* ------------------------------------------------------------------ */
/*  Prediction-Dataset umbenennen: "A3" → "A3-pred"                    */
/* ------------------------------------------------------------------ */
const addPredSuffix = (src: DailyOccupancyData): DailyOccupancyData => {
    const out: DailyOccupancyData = { date: src.date, occupancy: {} };

    Object.entries(src.occupancy).forEach(([lib, points]) => {
        out.occupancy[`${lib}-pred`] = points.map((p) => {
            // occupancy immer null lassen, prediction beibehalten
            const base: OccupancyDataPoint = {
                time: p.time,
                occupancy: null,
            };
            if (p.prediction !== undefined) base.prediction = p.prediction;
            return base;
        });
    });

    return out;
};

/* ------------------------------------------------------------------ */
/*  Page Component                                                     */
/* ------------------------------------------------------------------ */
type Search = { searchParams?: Promise<{ date?: string }> };

export default async function DailyOccupancyPage({ searchParams }: Search) {
    /* 1 · Datum bestimmen & normalisieren */
    const isoToday = new Date().toISOString().slice(0, 10);
    const raw = (await searchParams)?.date ?? isoToday;

    let dateObj = new Date(raw);
    if (isNaN(dateObj.getTime())) dateObj = new Date();
    const dateStr = dateObj.toISOString().slice(0, 10);

    /* 2 · Daten parallel laden */
    const [weather, liveData, predRaw, calendar] = await Promise.all([
        getWeather(dateStr),
        getDailyOccupancy(dateStr, 48, 138), // 08:00–23:00
        getPrediction(dateStr, 48, 138),
        getCalendarEvents(),
    ]);

    /* 3 · Prediction-Datensatz umbenennen & zusammenführen */
    const predData = addPredSuffix(predRaw);

    const merged: DailyOccupancyData = {
        date: liveData.date,
        occupancy: { ...liveData.occupancy, ...predData.occupancy },
    };

    /* 4 · Semester-Events formen */
    const semesterPeriods =
        calendar?.map((e) => ({
            id: Number(e.id),
            name: e.name ?? '',
            type: e.type as EventType,
            start: e.start ? e.start.toISOString().slice(0, 10) : '',
            end: e.end ? e.end.toISOString().slice(0, 10) : '',
        })) ?? [];

    /* 5 · Render mit Providern */
    return (
        <OccupancyProvider initialData={merged} initialDate={dateStr}>
            <WeatherProvider initialData={weather} initialDate={dateStr}>
                <IndexPage semesterPeriods={semesterPeriods} />
            </WeatherProvider>
        </OccupancyProvider>
    );
}
