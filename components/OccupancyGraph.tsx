'use client';

import { useState, useEffect } from 'react';
import { AlertTriangle, ChevronLeft, ChevronRight } from 'lucide-react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
    ReferenceLine,
} from 'recharts';
import { Library, DailyOccupancyData } from '@/utils/types';
import { format, parseISO, isToday, addDays, isFuture } from 'date-fns';
import { de } from 'date-fns/locale';
import { useIsMobile } from '@/hooks/use-mobile';
import { useRouter } from 'next/navigation';

const ENABLE_PREDICTION = false; // Set to true to enable prediction lines, only here until we have a prediction API

interface OccupancyGraphProps {
    libraries: Library[];
    data: DailyOccupancyData;
    favorites: string[];
    showOnlyFavorites: boolean;
}

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white dark:bg-card p-3 border border-border rounded-lg shadow-md">
                <p className="font-medium text-sm">{label}</p>
                <div className="mt-1.5 space-y-1">
                    {payload.map((entry: any, index: number) => (
                        <div key={index} className="flex items-center text-sm">
                            <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: entry.color }} />
                            <span className="mr-2">{entry.name}:</span>
                            <span className="font-medium">{entry.value}%</span>
                        </div>
                    ))}
                </div>
            </div>
        );
    }
    return null;
};

export default function OccupancyGraph({ libraries, data, favorites, showOnlyFavorites }: OccupancyGraphProps) {
    const router = useRouter();
    // Animation states
    const [isVisible, setIsVisible] = useState(false);
    const isMobile = useIsMobile();

    const selectedDay = data;

    useEffect(() => {
        setIsVisible(true);
    }, []);

    // Prepare chart data
    const chartData = selectedDay
        ? (() => {
              const result: any = [];
              // Get the first library to determine time points (assumes all libraries have same timepoints)
              const firstLibraryId = Object.keys(selectedDay.occupancy)[0];
              const timePoints = selectedDay.occupancy[firstLibraryId].map((point) => point.time);

              // For each time point, gather all libraries' data
              timePoints.forEach((time, index) => {
                  const dataPoint: any = { time };

                  // Add data for each library
                  libraries.forEach((library) => {
                      if (showOnlyFavorites && !favorites.includes(library.id)) return;

                      const libraryData = selectedDay.occupancy[library.id][index];
                      if (libraryData) {
                          dataPoint[library.id] = libraryData.occupancy;
                          if (ENABLE_PREDICTION) dataPoint[`${library.id}-prediction`] = libraryData.prediction;
                      }
                  });

                  result.push(dataPoint);
              });

              return result;
          })()
        : [];

    const navigateBack = () => {
        //go to the previous page
        const currentDate = parseISO(data.date);
        const newDate = addDays(currentDate, -1);

        router.push(`?date=${format(newDate, 'yyyy-MM-dd')}`);
    };

    const navigateForward = () => {
        //go to the next page
        const currentDate = parseISO(data.date);
        const newDate = addDays(currentDate, 1);

        // Check if the new date is in the future
        if (isFuture(newDate)) {
            return;
        }

        router.push(`?date=${format(newDate, 'yyyy-MM-dd')}`);
    };

    const canGoForward = () => {
        // Check if the new date is in the future
        const currentDate = parseISO(data.date);
        const newDate = addDays(currentDate, 1);
        return !isFuture(newDate);
    };

    // Format the displayed date
    const formattedDate = selectedDay ? format(parseISO(selectedDay.date), 'EEEE, d. MMMM yyyy', { locale: de }) : '';

    // Determine which libraries to show
    const visibleLibraries = libraries.filter((lib) => !showOnlyFavorites || favorites.includes(lib.id));

    const scrapeFailed = (() => {
        if (!isToday(data.date)) return false;

        // Wenn weniger als 3 Punkte vorliegen, kein Fehlschlag
        if (chartData.length < 3) return false;

        // Errechne aktuelle Minuten seit Mitternacht
        const now = new Date();
        const currentTotalMin = now.getHours() * 60 + now.getMinutes();

        let lastIdx = -1;
        chartData.forEach((pt: any, i: number) => {
            const [h, m] = pt.time.split(':').map(Number);
            const totalMin = h * 60 + m;
            if (totalMin <= currentTotalMin) {
                lastIdx = i;
            }
        });

        // Wenn weniger als 3 Einträge bis gerade vorhanden, kein Fehlschlag
        if (lastIdx < 2) return false;

        // Nimm genau die 3 letzten vor "now"
        const lastThree = chartData.slice(lastIdx - 2, lastIdx + 1);

        // Welche Libraries prüfen (Favorites-Filter beachten)
        const libsToCheck = libraries.filter(lib => !showOnlyFavorites || favorites.includes(lib.id));

        // True, wenn in ALLEN dieser drei Punkte für ALL libs kein valider Wert kommt
        return lastThree.every((point: any) =>
            libsToCheck.every(lib => {
                const v = point[lib.id];
                return v === null || v === undefined || v === -1;
            }),
        );
    })();

    if (isMobile) {
        return null;
    }

    return (
        <>
            {!isToday(data.date) && (
                <div className="flex items-center justify-end mb-4 w-full">
                    <button
                        onClick={() => router.push('/')}
                        className="text-sm px-3 py-1 rounded-full transition-all duration-200 bg-secondary hover:bg-secondary/80">
                        Zurück zur Übersicht
                    </button>
                </div>
            )}
            {/* ➋ Warnung anzeigen, falls Scrape fehlgeschlagen */}
            {scrapeFailed && (
                <div className="mb-4 flex items-start space-x-2 p-3 rounded-md bg-amber-100 dark:bg-amber-900/40 text-amber-900 dark:text-amber-100 text-sm">
                    <AlertTriangle className="w-5 h-5 mt-0.5 shrink-0" />
                    <p>
                        Die aktuellsten Daten konnten nicht von der Website geladen werden. Sollte das Problem weiterhin
                        bestehen, kontaktieren Sie bitte unser Team.
                    </p>
                </div>
            )}
            <div
                className={`w-full bg-white dark:bg-card rounded-xl border border-border p-4 shadow-sm mb-8 transition-all duration-500 ${
                    isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                }`}>
                <div className="flex sm:items-center sm:justify-between flex-col sm:flex-row mb-4 gap-2">
                    <h2 className="text-xl font-medium">Bibliotheksauslastung</h2>
                    <div className="flex items-center space-x-2">
                        <button
                            onClick={() => navigateBack()}
                            className="p-1.5 rounded-lg bg-secondary/50 hover:bg-secondary transition-all duration-200"
                            aria-label="Previous day">
                            <ChevronLeft className="w-5 h-5" />
                        </button>

                        <span className="text-sm font-medium px-2">{formattedDate}</span>

                        <button
                            onClick={() => navigateForward()}
                            className={`p-1.5 rounded-lg transition-all duration-200 ${
                                canGoForward()
                                    ? 'bg-secondary/50 hover:bg-secondary'
                                    : 'bg-secondary/20 text-muted-foreground cursor-not-allowed'
                            }`}
                            aria-label="Next day">
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                <div className="h-[24rem] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                            <XAxis
                                dataKey="time"
                                tick={{ fontSize: 10 }}
                                tickMargin={5}
                                label={{
                                    value: '',
                                    position: 'insideBottom',
                                    offset: -10,
                                    fontSize: 10,
                                }}
                            />
                            <YAxis domain={[0, 100]} tickCount={6} unit="%" tick={{ fontSize: 12 }} tickMargin={10} />
                            {/* Horizontal threshold line at 75% */}
                            <ReferenceLine y={80} stroke="red" strokeDasharray="3 3" strokeWidth={1} />
                            <Tooltip content={<CustomTooltip />} />
                            <Legend />

                            {visibleLibraries.map((library) => (
                                <Line
                                    key={library.id}
                                    type="monotone"
                                    dataKey={library.id}
                                    name={library.name}
                                    stroke={library.color}
                                    strokeWidth={2}
                                    dot={false}
                                    activeDot={{ r: 6 }}
                                />
                            ))}

                            {ENABLE_PREDICTION &&
                                visibleLibraries.map((library) => (
                                    <Line
                                        key={`${library.id}-prediction`}
                                        type="monotone"
                                        dataKey={`${library.id}-prediction`}
                                        name={`${library.name} (Prognose)`}
                                        stroke={library.color}
                                        strokeWidth={1.5}
                                        strokeDasharray="5 5"
                                        dot={false}
                                        activeDot={{ r: 4 }}
                                    />
                                ))}
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </>
    );
}
