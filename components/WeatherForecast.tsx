'use client';

import React, { useRef, useState, useMemo } from 'react';
import { format, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';
import {
    Cloud,
    CloudDrizzle,
    CloudLightning,
    CloudMoon,
    CloudRain,
    CloudSnow,
    CloudSun,
    Moon,
    Sun,
    Wind,
} from 'lucide-react';
import { DateTime } from 'luxon';
import { useWeather } from '@/hooks/use-weather';
import type { WeatherData } from '@/lib/weather';

/* ------------------------------------------------------------------ */
/*  Symbol-Helpers                                                    */
/* ------------------------------------------------------------------ */
const LABEL_DE: Record<string, string> = {
    clearsky_day: 'Sonnig',
    clearsky_night: 'Klar',
    fair_day: 'Sonnig',
    fair_night: 'Heiter',
    partlycloudy_day: 'Teilweise bewölkt',
    partlycloudy_night: 'Teilweise bewölkt',
    cloudy: 'Bewölkt',
    lightrain: 'Nieselregen',
    rain: 'Regen',
    heavyrain: 'Starker Regen',
    lightsnow: 'Leichter Schneefall',
    snow: 'Schneefall',
    fog: 'Nebel',
};

const PRIORITY = [
    'thunder', // includes thunder/lightning
    'heavyrain',
    'rain',
    'lightrain',
    'snow',
    'lightsnow',
    'cloudy',
    'partlycloudy',
    'clearsky',
    'fair',
];

const berlin = (iso: string) => DateTime.fromISO(iso).setZone('Europe/Berlin');

const iconFor = (code: string, hour: number) => {
    const night = hour >= 21 || hour < 6 || code.includes('_night');

    if (code.includes('clearsky') || code.includes('fair'))
        return night ? <Moon className="text-blue-300" /> : <Sun className="text-amber-500" />;

    if (code.includes('partlycloudy'))
        return night ? <CloudMoon className="text-amber-300" /> : <CloudSun className="text-amber-400" />;

    if (code.includes('cloudy')) return <Cloud className="text-gray-400" />;

    if (code.includes('heavyrain')) return <CloudRain className="text-blue-600" />;
    if (code.includes('lightrain')) return <CloudDrizzle className="text-blue-400" />;
    if (code.includes('rain')) return <CloudRain className="text-blue-500" />;

    if (code.includes('thunder') || code.includes('lightning')) return <CloudLightning className="text-purple-500" />;

    if (code.includes('snow') || code.includes('sleet')) return <CloudSnow className="text-blue-200" />;

    if (code.includes('fog')) return <Cloud className="text-gray-400" />;

    return night ? <Moon className="text-blue-300" /> : <Sun className="text-amber-500" />;
};

const germanLabel = (code: string) => LABEL_DE[code] ?? code;

/* ------------------------------------------------------------------ */
/*  Component                                                         */
/* ------------------------------------------------------------------ */
export default function WeatherForecast() {
    const { weatherData, date, loading } = useWeather();

    const selectedDate = date ? parseISO(date) : new Date();
    const formattedDate = format(selectedDate, 'EEEE, d. MMMM yyyy', { locale: de });
    const isToday = selectedDate.toDateString() === new Date().toDateString();
    const dateStatus = isToday ? 'heute' : 'am ausgewählten Tag';

    /* ---------- next 12 h in 3-Stunden-Fenstern (mobile) ---------- */
    const now = DateTime.now().setZone('Europe/Berlin').startOf('hour');
    const MOBILE_WINDOWS = 4; // 4 × 3 h = 12 h

    const mobileRows = useMemo(() => {
        const rows: WeatherData[] = [];

        for (let i = 0; i < MOBILE_WINDOWS; i++) {
            const winStart = now.plus({ hours: i * 3 });
            const winEnd = winStart.plus({ hours: 3 });

            const slice = weatherData.filter((d) => {
                const dt = berlin(d.time);
                return dt >= winStart && dt < winEnd;
            });

            if (!slice.length) continue;

            // --- pick "worst" condition by PRIORITY ---
            let chosen = slice[0];
            slice.forEach((s) => {
                const pri = PRIORITY.findIndex((p) => s.condition.includes(p));
                const curr = PRIORITY.findIndex((p) => chosen.condition.includes(p));
                if (pri !== -1 && (curr === -1 || pri < curr)) chosen = s;
            });

            // avg temp / wind within window
            const avg = <K extends keyof WeatherData>(k: K) =>
                slice.reduce((sum, v) => sum + (v[k] as number), 0) / slice.length;

            rows.push({
                ...chosen,
                time: winStart.toISO()!,
                temperature: avg('temperature'),
                windSpeed: avg('windSpeed'),
            });
        }
        return rows;
    }, [weatherData, now]);

    /* ---------- desktop slots (24 h) ------------------------------ */
    const deskStart = isToday ? now : DateTime.fromJSDate(selectedDate).setZone('Europe/Berlin').startOf('day');
    const deskEnd = deskStart.plus({ hours: 24 });
    const desktopSlots = weatherData
        .filter((d) => {
            const dt = berlin(d.time);
            return dt >= deskStart && dt < deskEnd;
        })
        .sort((a, b) => berlin(a.time).toMillis() - berlin(b.time).toMillis());

    /* ---------- render helpers ------------------------------------ */
    const TableRow = (d: WeatherData) => {
        const dt = berlin(d.time);
        const hour = dt.hour;
        const label = dt.toFormat('HH:mm');

        return (
            <div
                key={d.time}
                className="grid grid-cols-[60px_40px_1fr_auto] items-center gap-2 bg-secondary/20 dark:bg-secondary/10 rounded-lg px-3 py-2">
                <span className="text-sm font-medium text-muted-foreground">{label}</span>

                <span className="flex items-center justify-center">{iconFor(d.condition, hour)}</span>

                <div className="flex flex-col">
                    <span className="text-sm font-semibold">{Math.round(d.temperature)}°C</span>
                    <span className="text-xs text-muted-foreground">{germanLabel(d.condition)}</span>
                </div>

                <span className="flex items-center gap-1 text-xs text-muted-foreground justify-end">
                    <Wind size={14} /> {Math.round(d.windSpeed)} m/s
                </span>
            </div>
        );
    };

    const SlimBox = (d: WeatherData) => {
        const dt = berlin(d.time);
        const hour = dt.hour;
        return (
            <div
                key={d.time}
                className="flex flex-col items-center space-y-2 py-4 w-16 bg-secondary/20 dark:bg-secondary/10 rounded-lg shrink-0">
                <span className="text-xs text-muted-foreground">{dt.toFormat('HH')} h</span>
                {iconFor(d.condition, hour)}
                <span className="text-sm font-medium">{Math.round(d.temperature)}°</span>
            </div>
        );
    };

    /* ---------- drag-scroll (desktop) ----------------------------- */
    const sliderRef = useRef<HTMLDivElement>(null);
    const [grab, setGrab] = useState(false);

    const startDrag = (e: React.PointerEvent) => {
        const s = sliderRef.current;
        if (!s) return;
        setGrab(true);
        s.setPointerCapture(e.pointerId);
        (s as any)._x = e.clientX;
        (s as any)._scroll = s.scrollLeft;
    };
    const moveDrag = (e: React.PointerEvent) => {
        const s = sliderRef.current;
        if (!s || !grab) return;
        s.scrollLeft = (s as any)._scroll - (e.clientX - (s as any)._x);
    };
    const endDrag = (e: React.PointerEvent) => {
        sliderRef.current?.releasePointerCapture(e.pointerId);
        setGrab(false);
    };

    if (!weatherData?.length || loading) return null;

    /* ---------- JSX ----------------------------------------------- */
    return (
        <div className="w-full bg-white dark:bg-card rounded-xl border border-border p-4 shadow-sm mb-8">
            {/* header */}
            <header className="flex justify-between pb-2">
                <h2 className="text-xl font-medium">Wettervorhersage Mannheim</h2>
                <p className="text-sm text-muted-foreground hidden md:block">{formattedDate}</p>
            </header>

            {/* mobile list (4× 3 h) */}
            <div className="flex flex-col gap-2 md:hidden">{mobileRows.map(TableRow)}</div>

            {/* desktop slider */}
            {!!desktopSlots.length && (
                <div className="hidden md:block overflow-x-auto">
                    <div
                        ref={sliderRef}
                        onPointerDown={startDrag}
                        onPointerMove={moveDrag}
                        onPointerUp={endDrag}
                        onPointerLeave={endDrag}
                        className={`flex gap-2 min-w-max cursor-${grab ? 'grabbing' : 'grab'}`}>
                        {desktopSlots.map(SlimBox)}
                    </div>
                </div>
            )}

            <p className="mt-3 text-xs text-muted-foreground text-center">
                Quelle&nbsp;
                <a href="https://api.met.no" target="_blank" className="underline hover:no-underline">
                    api.met.no
                </a>{' '}
                · Standort Universität Mannheim
            </p>
        </div>
    );
}
