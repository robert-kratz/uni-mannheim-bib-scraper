'use client';

import React from 'react';
import RefreshTimer from '@/components/RefreshTimer';
import { useOccupancy } from '@/hooks/use-occupancy';
import { useWeather } from '@/hooks/use-weather';
import { format, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';
import { DateTime } from 'luxon';
import {
    Cloud,
    CloudDrizzle,
    CloudRain,
    CloudSnow,
    CloudSun,
    CloudMoon,
    Moon,
    Sun,
} from 'lucide-react';

interface HeroSectionProps {
    showOnlyFavorites: boolean;
    setShowOnlyFavorites: (show: boolean) => void;
}

const iconFor = (code: string, hour: number) => {
    const night = hour >= 21 || hour < 6 || code.includes('_night');
    const cls = 'w-6 h-6';

    if (code.includes('clearsky') || code.includes('fair'))
        return night ? <Moon className={`${cls} text-blue-300`} /> : <Sun className={`${cls} text-amber-500`} />;
    if (code.includes('partlycloudy'))
        return night
            ? <CloudMoon className={`${cls} text-amber-300`} />
            : <CloudSun className={`${cls} text-amber-400`} />;
    if (code.includes('cloudy')) return <Cloud className={`${cls} text-gray-400`} />;
    if (code.includes('heavyrain') || code.includes('rain')) return <CloudRain className={`${cls} text-blue-500`} />;
    if (code.includes('lightrain')) return <CloudDrizzle className={`${cls} text-blue-400`} />;
    if (code.includes('snow') || code.includes('sleet')) return <CloudSnow className={`${cls} text-blue-200`} />;
    if (code.includes('fog')) return <Cloud className={`${cls} text-gray-400`} />;
    return night ? <Moon className={`${cls} text-blue-300`} /> : <Sun className={`${cls} text-amber-500`} />;
};

export default function HeroSection({ showOnlyFavorites, setShowOnlyFavorites }: HeroSectionProps) {
    const { date } = useOccupancy();
    const { weatherData, loading: weatherLoading } = useWeather();

    const selectedDate = date ? parseISO(date) : new Date();
    const formattedDate = format(selectedDate, 'EEEE, d. MMMM yyyy', { locale: de });

    // Find the current weather entry (closest to now)
    const currentWeather = React.useMemo(() => {
        if (!weatherData || weatherData.length === 0) return null;
        const now = DateTime.now().setZone('Europe/Berlin');
        let closest = weatherData[0];
        let minDiff = Infinity;
        for (const w of weatherData) {
            const diff = Math.abs(DateTime.fromISO(w.time).setZone('Europe/Berlin').diff(now).as('minutes'));
            if (diff < minDiff) {
                minDiff = diff;
                closest = w;
            }
        }
        return closest;
    }, [weatherData]);

    const currentHour = DateTime.now().setZone('Europe/Berlin').hour;

    return (
        <section className="border-2 border-foreground/10 bg-card dot-pattern py-10 px-6 sm:px-10 mb-8">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-6">
                <div className="max-w-4xl">
                    <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground mb-3">
                        Universität Mannheim
                    </p>
                    <h1 className="font-mono text-3xl sm:text-4xl lg:text-5xl font-bold uppercase tracking-tight mb-4">
                        Bibliotheks
                        <br />
                        Manager
                    </h1>
                    <p className="text-muted-foreground text-sm sm:text-base max-w-lg mb-6">
                        Echtzeitauslastung und Vorhersagen der Universitätsbibliotheken
                    </p>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6">
                        <span className="font-mono text-xs border border-foreground/20 px-3 py-1.5 bg-background inline-block">
                            {formattedDate}
                        </span>
                        <RefreshTimer />
                        <button
                            onClick={() => setShowOnlyFavorites(!showOnlyFavorites)}
                            className={`text-xs font-mono uppercase tracking-wider px-3 py-1.5 border-2 transition-all duration-200 ${
                                showOnlyFavorites
                                    ? 'bg-foreground text-background border-foreground'
                                    : 'bg-background border-foreground/10 hover:border-foreground/30'
                            }`}>
                            {showOnlyFavorites ? 'Alle anzeigen' : 'Nur Favoriten'}
                        </button>
                    </div>
                </div>

                {/* Current weather */}
                {!weatherLoading && currentWeather && (
                    <div className="flex items-center gap-3 border border-foreground/20 px-4 py-3 bg-background shrink-0">
                        {iconFor(currentWeather.condition, currentHour)}
                        <div>
                            <p className="font-mono text-lg font-bold leading-tight">
                                {Math.round(currentWeather.temperature)}°C
                            </p>
                            <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                                Mannheim
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </section>
    );
}
