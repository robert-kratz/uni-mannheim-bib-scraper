// lib/weather.ts
import { DateTime } from 'luxon';
import { z } from 'zod';

/**
 * ---------------------------------------------------------------------------
 *  Coordinates & API endpoint (met.no Locationforecast 2.0 · Mannheim, DE)
 * ---------------------------------------------------------------------------
 */
const LAT = 49.4875;
const LON = 8.466;
const API_URL = `https://api.met.no/weatherapi/locationforecast/2.0/compact?lat=${LAT}&lon=${LON}`;

/**
 * ---------------------------------------------------------------------------
 *  Domain types
 * ---------------------------------------------------------------------------
 */
export type WeatherCondition =
    | 'clearsky_day'
    | 'clearsky_night'
    | 'fair_day'
    | 'fair_night'
    | 'partlycloudy_day'
    | 'partlycloudy_night'
    | 'cloudy'
    | 'lightrain'
    | 'rain'
    | 'heavyrain'
    | 'lightsnow'
    | 'snow'
    | 'fog'
    | string; // ↓  fallback for codes you haven’t mapped yet

export interface WeatherData {
    /** Local ISO timestamp (Europe/Berlin, incl. offset) */
    time: string;
    temperature: number;
    condition: WeatherCondition;
    windSpeed: number;
}

/**
 * ---------------------------------------------------------------------------
 *  Runtime validation for the API response
 * ---------------------------------------------------------------------------
 */
const PointSchema = z.object({
    time: z.string(),
    data: z.object({
        instant: z.object({
            details: z.object({
                air_temperature: z.number(),
                wind_speed: z.number().optional(),
            }),
        }),
        next_1_hours: z
            .object({
                summary: z.object({ symbol_code: z.string() }),
            })
            .optional(),
    }),
});

const ApiSchema = z.object({
    properties: z.object({
        timeseries: z.array(PointSchema),
    }),
});

/**
 * ---------------------------------------------------------------------------
 *  Tiny in-memory cache (per runtime) to avoid duplicate fetches
 * ---------------------------------------------------------------------------
 */
const cache = new Map<string, Promise<WeatherData[]>>();

/**
 * Fetch *all* available hourly slices for a given date (local time, Europe/Berlin).
 *
 * The underlying fetch is cached by **Next.js** (`revalidate: 1800`) **and**
 * in-memory for the current server runtime/Lambda to prevent double-fetching.
 *
 * @param date  `YYYY-MM-DD` string or `Date`
 * @param zone  IANA timezone (defaults to `Europe/Berlin`)
 */
export async function getWeather(date: string | Date, zone = 'Europe/Berlin'): Promise<WeatherData[]> {
    const target =
        typeof date === 'string' ? DateTime.fromISO(date, { zone }) : DateTime.fromJSDate(date).setZone(zone);

    if (!target.isValid) {
        throw new Error(`getWeather(): invalid date "${date}"`);
    }

    try {
        const dayKey = target.toISODate()!; // e.g. "2025-05-17"
        if (cache.has(dayKey)) return cache.get(dayKey)!;

        const promise = (async () => {
            const res = await fetch(API_URL, {
                headers: {
                    'User-Agent': 'https://github.com/robert-kratz/uni-mannheim-bib-scraper (robert.kratz@rjks.us)',
                },
                // Next.js App Router caching: revalidate every 30 min
                next: { revalidate: 60 * 30 },
            });

            if (!res.ok) {
                throw new Error(`met.no: ${res.status} ${res.statusText}`);
            }

            const parsed = ApiSchema.parse(await res.json());

            console.log(`getWeather(): ${dayKey} (${zone})`, parsed.properties);

            const list: WeatherData[] = parsed.properties.timeseries
                .map(({ time, data }: z.infer<typeof PointSchema>) => {
                    const dt = DateTime.fromISO(time, { zone: 'utc' }).setZone(zone);

                    //if (dt.toISODate() !== dayKey) return null;

                    const details = data.instant.details;
                    const condition = data.next_1_hours?.summary.symbol_code ?? 'clearsky_day';

                    return {
                        time: dt.toISO(),
                        temperature: details.air_temperature,
                        condition: condition as WeatherCondition,
                        windSpeed: details.wind_speed ?? 0,
                    };
                })
                .filter(Boolean) as WeatherData[];

            // defensive sort – API is usually chronological, but better be sure
            list.sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());

            return list;
        })();

        cache.set(dayKey, promise);
        return promise;
    } catch (error: any) {
        console.error('getWeather():', error);
        return [];
    }
}
