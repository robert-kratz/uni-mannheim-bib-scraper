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
/*  Symbol-& Text-Mapping                                             */
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
    'thunder',
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

    /* ----------  MOBILE: 4 × 3-h-Fenster --------------------------- */
    const now = DateTime.now().setZone('Europe/Berlin').startOf('hour');
    const mobileRows = useMemo(() => {
        const out: WeatherData[] = [];

        for (let w = 0; w < 4; w++) {
            const winStart = now.plus({ hours: 3 * w });
            const winEnd = winStart.plus({ hours: 3 });

            const slice = weatherData.filter((d) => {
                const dt = berlin(d.time);
                return dt >= winStart && dt < winEnd;
            });
            if (!slice.length) continue;

            // wichtigstes Wetter innerhalb des Fensters
            let chosen = slice[0];
            slice.forEach((s) => {
                const priS = PRIORITY.findIndex((p) => s.condition.includes(p));
                const priC = PRIORITY.findIndex((p) => chosen.condition.includes(p));
                if (priS !== -1 && (priC === -1 || priS < priC)) chosen = s;
            });

            const avg = <K extends keyof WeatherData>(k: K) =>
                slice.reduce((sum, v) => sum + (v[k] as number), 0) / slice.length;

            out.push({
                ...chosen,
                time: winStart.toISO()!, // label = Fensterbeginn
                temperature: avg('temperature'),
                windSpeed: avg('windSpeed'),
            });
        }
        return out;
    }, [weatherData, now]);

    /* ----------  DESKTOP: nächste 12 Stunden (12 Slots) ----------- */
    const deskStart = isToday ? now : DateTime.fromJSDate(selectedDate).setZone('Europe/Berlin').startOf('day');
    const deskEnd = deskStart.plus({ hours: 12 });
    const desktopSlots = weatherData.sort((a, b) => berlin(a.time).toMillis() - berlin(b.time).toMillis());

    /* ---------- list row & slim box ------------------------------- */
    const TableRow = (d: WeatherData) => {
        const dt = berlin(d.time);
        const h = dt.hour;
        return (
            <div
                key={d.time}
                className="grid grid-cols-[60px_40px_1fr_auto] items-center gap-2 bg-secondary/20 dark:bg-secondary/10 rounded-lg px-3 py-2">
                <span className="text-sm font-medium text-muted-foreground">{dt.toFormat('HH:mm')}</span>
                <span className="flex justify-center">{iconFor(d.condition, h)}</span>
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
        const h = dt.hour;
        return (
            <div
                key={d.time}
                className="flex flex-col items-center space-y-2 py-4 w-16 shrink-0 bg-secondary/20 dark:bg-secondary/10 rounded-lg">
                <span className="text-xs text-muted-foreground">{dt.toFormat('HH')} h</span>
                {iconFor(d.condition, h)}
                <span className="text-sm font-medium">{Math.round(d.temperature)}°</span>
            </div>
        );
    };

    /* ---------- drag-scroll handling ------------------------------ */
    const sliderRef = useRef<HTMLDivElement>(null);
    const [grab, setGrab] = useState(false);

    const handleDown = (e: React.PointerEvent) => {
        const s = sliderRef.current;
        if (!s) return;
        setGrab(true);
        s.setPointerCapture(e.pointerId);
        (s as any)._start = e.clientX;
        (s as any)._scroll = s.scrollLeft;
    };
    const handleMove = (e: React.PointerEvent) => {
        const s = sliderRef.current;
        if (!s || !grab) return;
        s.scrollLeft = (s as any)._scroll - (e.clientX - (s as any)._start);
    };
    const handleUp = (e: React.PointerEvent) => {
        sliderRef.current?.releasePointerCapture(e.pointerId);
        setGrab(false);
    };

    if (!weatherData?.length || loading) return null;

    /* ---------- JSX ------------------------------------------------ */
    return (
        <div className="w-full bg-white dark:bg-card rounded-xl border border-border p-4 shadow-sm mb-8">
            <header className="flex justify-between pb-2">
                <h2 className="text-xl font-medium">Wettervorhersage Mannheim</h2>
                <p className="hidden md:block text-sm text-muted-foreground">{formattedDate}</p>
            </header>

            {/* mobile – 4 Fenster */}
            <div className="flex flex-col gap-2 md:hidden">{mobileRows.map(TableRow)}</div>

            {/* desktop – 12 Slots */}
            {desktopSlots.length > 0 && (
                <div className="hidden md:block overflow-x-auto">
                    <div
                        ref={sliderRef}
                        onPointerDown={handleDown}
                        onPointerMove={handleMove}
                        onPointerUp={handleUp}
                        onPointerLeave={handleUp}
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
                · Standort&nbsp;Universität Mannheim
            </p>
        </div>
    );
}
