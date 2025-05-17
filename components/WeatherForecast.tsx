'use client';

import React, { useRef, useState } from 'react';
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
    ChevronsDown,
    ChevronsUp,
} from 'lucide-react';
import { DateTime } from 'luxon';
import { useWeather } from '@/hooks/use-weather';
import type { WeatherData } from '@/lib/weather';

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

/** 🔄 Map met.no `symbol_code` → German label */
const LABEL_DE: Record<string, string> = {
    clearsky_day: 'Sonnig',
    clearsky_night: 'Klar',
    fair_day: 'Sonnig',
    fair_night: 'Heiter',
    partlycloudy_day: 'Teilweise bewölkt',
    partlycloudy_night: 'Teilweise bewölkt',
    cloudy: 'Bewölkt',
    lightrain: 'Nieselregen',
    rain: 'Regnerisch',
    heavyrain: 'Starker Regen',
    lightsnow: 'Leichter Schneefall',
    snow: 'Schneefall',
    fog: 'Nebel',
};

/** ⌚ Berlin-Zeit für einen ISO-String */
const berlinDate = (iso: string) => DateTime.fromISO(iso).setZone('Europe/Berlin');

/** 🌗 Tag-/Nacht-abhängige Icon-Wahl */
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
/*  Component                                                          */
/* ------------------------------------------------------------------ */
const WeatherForecast = () => {
    const { weatherData, date, loading } = useWeather();

    /* ------------------------- early exits -------------------------- */
    if (!weatherData?.length) return null;

    const selectedDate = date ? parseISO(date) : new Date();
    const formattedDate = format(selectedDate, 'EEEE, d. MMMM yyyy', { locale: de });

    const today = new Date();
    const isToday =
        today.getFullYear() === selectedDate.getFullYear() &&
        today.getMonth() === selectedDate.getMonth() &&
        today.getDate() === selectedDate.getDate();
    const dateStatus = isToday ? 'heute' : 'am ausgewählten Tag';

    /* ------------------  TIME WINDOWS  ------------------------------ */
    const berlinNow = DateTime.now().setZone('Europe/Berlin');

    // Mobile: initially show next 12 h
    const mobileEnd = berlinNow.plus({ hours: 12 });

    // Desktop: show full next 24 h
    const desktopStart = isToday
        ? berlinNow
        : DateTime.fromJSDate(selectedDate).setZone('Europe/Berlin').startOf('day');
    const desktopEnd = desktopStart.plus({ hours: 24 });

    /* ------------------  FILTER + SORT DATA  ------------------------ */
    const byTime = (a: WeatherData, b: WeatherData) => new Date(a.time).getTime() - new Date(b.time).getTime();

    // rows for mobile (full 24 h, we'll slice later)
    const allRows = [...weatherData].sort(byTime);

    const initialMobileRows = allRows.filter((d) => {
        const dt = berlinDate(d.time);
        return dt >= berlinNow && dt <= mobileEnd;
    });

    const desktopSlots = allRows.filter((d) => {
        const dt = berlinDate(d.time);
        return dt >= desktopStart && dt < desktopEnd;
    });

    /* ----------------------  MOBILE STATE  -------------------------- */
    const [expanded, setExpanded] = useState(false);
    const mobileRows = expanded ? desktopSlots : initialMobileRows;

    /* ------------------------- render helpers ----------------------- */
    const TableRow = (d: WeatherData) => {
        const dt = berlinDate(d.time);
        const hour = dt.hour;
        const timeLabel = dt.toFormat('HH:mm');

        return (
            <div
                key={d.time}
                className="grid grid-cols-[60px_40px_1fr_auto] items-center gap-2 bg-secondary/20 dark:bg-secondary/10 rounded-lg px-3 py-2 hover:bg-secondary/30 dark:hover:bg-secondary/20">
                <span className="text-sm font-medium text-muted-foreground">{timeLabel}</span>

                <span className="flex items-center justify-center">{iconFor(d.condition, hour)}</span>

                <div className="flex flex-col">
                    <span className="text-sm font-semibold">{Math.round(d.temperature)}°C</span>
                    <span className="text-xs text-muted-foreground">{germanLabel(d.condition)}</span>
                </div>

                <span className="flex items-center gap-1 text-xs text-muted-foreground justify-end">
                    <Wind size={14} /> {d.windSpeed.toFixed(0)} m/s
                </span>
            </div>
        );
    };

    const SlimHourBox = (d: WeatherData) => {
        const dt = berlinDate(d.time);
        const hour = dt.hour;
        const timeLabel = dt.toFormat('HH');

        return (
            <div
                key={d.time}
                className="flex flex-col items-center justify-between space-y-2 py-4 bg-secondary/20 dark:bg-secondary/10 rounded-lg w-16 shrink-0 select-none">
                <span className="text-xs text-muted-foreground min-w-10">{timeLabel} Uhr</span>
                {iconFor(d.condition, hour)}
                <span className="text-sm font-medium">{Math.round(d.temperature)}°</span>
            </div>
        );
    };

    /* ------------------ Drag-to-Scroll logic ----------------------- */
    const sliderRef = useRef<HTMLDivElement | null>(null);
    const [isGrab, setGrab] = useState(false);

    const onPointerDown = (e: React.PointerEvent) => {
        const slider = sliderRef.current;
        if (!slider) return;
        setGrab(true);
        slider.setPointerCapture(e.pointerId);
        (slider as any)._startX = e.clientX;
        (slider as any)._scrollLeft = slider.scrollLeft;
    };

    const onPointerMove = (e: React.PointerEvent) => {
        const slider = sliderRef.current;
        if (!slider || !isGrab) return;
        const dx = e.clientX - (slider as any)._startX;
        slider.scrollLeft = (slider as any)._scrollLeft - dx;
    };

    const endDrag = (e: React.PointerEvent) => {
        const slider = sliderRef.current;
        if (!slider) return;
        slider.releasePointerCapture(e.pointerId);
        setGrab(false);
    };

    if (loading) return null;

    /* ------------------------------ JSX ----------------------------- */
    return (
        <div className="w-full bg-white dark:bg-card rounded-xl border border-border p-4 shadow-sm mb-8 animate-fadeIn transition-all duration-1000">
            {/* Header */}
            <header className="pb-2 flex items-center justify-between">
                <h2 className="text-xl font-medium">Wetter für {dateStatus}</h2>
                <p className="text-sm text-muted-foreground">{formattedDate}</p>
            </header>

            {/* Mobile (<md): tabellarische Liste */}
            <div className="flex flex-col gap-2 md:hidden">
                {mobileRows.map((d) => TableRow(d))}
                {/* Toggle button */}
                <button
                    onClick={() => setExpanded((v) => !v)}
                    className="mt-1 flex items-center justify-center gap-1 text-sm text-primary hover:underline">
                    {expanded ? (
                        <>
                            Weniger anzeigen <ChevronsUp size={16} />
                        </>
                    ) : (
                        <>
                            Mehr anzeigen <ChevronsDown size={16} />
                        </>
                    )}
                </button>
            </div>

            {/* Desktop (≥md): horizontale Leiste 24 h – drag-to-scroll */}
            {desktopSlots.length > 0 && (
                <div className="hidden md:block overflow-x-auto">
                    <div
                        ref={sliderRef}
                        onPointerDown={onPointerDown}
                        onPointerMove={onPointerMove}
                        onPointerUp={endDrag}
                        onPointerLeave={endDrag}
                        className={`flex gap-2 min-w-max cursor-${isGrab ? 'grabbing' : 'grab'}`}>
                        {desktopSlots.map((d) => SlimHourBox(d))}
                    </div>
                </div>
            )}

            <div className="mt-2 text-xs text-muted-foreground text-center">
                <a
                    href="https://api.met.no/"
                    target="_blank"
                    className="mt-4 text-sm text-muted-foreground text-center">
                    Wettervorhersage · Standort Universität&nbsp;Mannheim
                </a>
            </div>

            {loading && (
                <p className="mt-2 text-xs text-muted-foreground text-center animate-pulse">
                    Daten werden aktualisiert …
                </p>
            )}
        </div>
    );
};

export default WeatherForecast;
