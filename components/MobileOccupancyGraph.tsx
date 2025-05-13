import { AlertTriangle, ChevronLeft, ChevronRight } from 'lucide-react';
import {
    CartesianGrid,
    Legend,
    Line,
    LineChart,
    ReferenceLine,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';
import { DailyOccupancyData, Library } from '@/utils/types';
import { addDays, format, isFuture, isToday, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';
import { useRouter } from 'next/navigation';
import { getDisplayName } from '@/lib/libraryNames';
import { useOccupancy } from '@/hooks/use-occupancy';
import { useIsMobile } from '@/hooks/use-mobile';
import { useEffect, useRef, useState } from 'react';

const ENABLE_PREDICTION = false; // Set to true to enable prediction lines, only here until we have a prediction API
const ANIMATION_DURATION = 800; // Duration of the animation in milliseconds

interface MobileOccupancyGraphProps {
    libraries: Library[];
    favorites: string[];
    showOnlyFavorites: boolean;
}

const MobileCustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white dark:bg-card p-2 border border-border rounded-lg shadow-md text-xs">
                <p className="font-medium">{label}</p>
                <div className="mt-1 space-y-0.5">
                    {payload.map((entry: any, index: number) => (
                        <div key={index} className="flex items-center">
                            <div className="w-2 h-2 rounded-full mr-1.5" style={{ backgroundColor: entry.color }} />
                            <span className="mr-1.5">{getDisplayName(entry.name)}:</span>
                            <span className="font-medium">{entry.value}%</span>
                        </div>
                    ))}
                </div>
            </div>
        );
    }
    return null;
};

export default function MobileOccupancyGraph({ libraries, favorites, showOnlyFavorites }: MobileOccupancyGraphProps) {
    const { occupancyData: data, date, changeDate, loading } = useOccupancy();
    // Animation state
    const [mounted, setMounted] = useState(false);
    const [isAnimating, setIsAnimating] = useState(false);
    const [chartOpacity, setChartOpacity] = useState(1);
    const [chartData, setChartData] = useState<any[]>([]);
    const prevDataRef = useRef<DailyOccupancyData | null>(null);

    // Process chart data
    useEffect(() => {
        if (!data) return;
        setMounted(true);

        // Start animation sequence
        const animateDataChange = async () => {
            // Process new data
            const processedData = prepareChartData(data);
            setChartData(processedData);

            // Only run animation if it's not the initial load and data actually changed
            if (prevDataRef.current && prevDataRef.current.date !== data.date) {
                setIsAnimating(true);
                setChartOpacity(1);

                // Wait for fade out
                await new Promise((resolve) => setTimeout(resolve, 500));
            }

            // If we were animating, fade back in
            if (isAnimating) {
                setTimeout(() => {
                    setChartOpacity(1);
                    setTimeout(() => setIsAnimating(false), ANIMATION_DURATION);
                }, 100);
            }

            // Update ref for next comparison
            prevDataRef.current = data;
        };

        animateDataChange();
        setIsAnimating(false);
    }, [data, showOnlyFavorites, favorites, libraries]);

    const prepareChartData = (selectedDay: DailyOccupancyData) => {
        if (!selectedDay) return [];

        const result: any = [];
        // Get the first library to determine time points
        const firstLibraryId = Object.keys(data.occupancy)[0];
        // For mobile, use fewer data points (hourly instead of every 10 minutes)
        const timePoints = data.occupancy[firstLibraryId]
            //.filter((point, index) => index % 6 === 0) // Every hour (every 6th point)
            .map((point) => point.time);

        // For each time point, gather all libraries' data
        timePoints.forEach((time, timeIndex) => {
            const dataPoint: any = { time };

            // Add data for each library
            libraries.forEach((library) => {
                if (showOnlyFavorites && !favorites.includes(library.id)) return;

                const libraryData = data.occupancy[library.id][timeIndex]; // Every hour
                if (libraryData) {
                    dataPoint[library.id] = libraryData.occupancy;
                    // We don't need predictions on mobile view for simplicity
                    if (ENABLE_PREDICTION) dataPoint[`${library.id}-prediction`] = libraryData.prediction;
                }
            });

            result.push(dataPoint);
        });

        return result;
    };

    const navigateBack = () => {
        const currentDate = parseISO(data.date);
        const newDate = addDays(currentDate, -1);
        changeDate(format(newDate, 'yyyy-MM-dd'));
    };

    const navigateForward = () => {
        const currentDate = parseISO(data.date);
        const newDate = addDays(currentDate, 1);

        // Check if the new date is in the future
        if (isFuture(newDate)) {
            return;
        }

        changeDate(format(newDate, 'yyyy-MM-dd'));
    };

    const canGoForward = () => {
        const currentDate = parseISO(date);
        const newDate = addDays(currentDate, 1);
        return !isFuture(newDate);
    };

    // Format the displayed date
    const formattedDate = data ? format(parseISO(data.date), 'EEEE, d. MMMM yyyy', { locale: de }) : '';

    // Determine which libraries to show
    const visibleLibraries = libraries.filter((lib) => !showOnlyFavorites || favorites.includes(lib.id));

    const scrapeFailed = (() => {
        if (!data || !isToday(data.date)) return false;

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
        const libsToCheck = libraries.filter((lib) => !showOnlyFavorites || favorites.includes(lib.id));

        // True, wenn in ALLEN dieser drei Punkte für ALL libs kein valider Wert kommt
        return lastThree.every((point: any) =>
            libsToCheck.every((lib) => {
                const v = point[lib.id];
                return v === null || v === undefined || v === -1;
            })
        );
    })();

    if ((!mounted && loading) || !mounted) return null;

    return (
        <div className="w-full mb-8 animate-fadeIn delay-900 min-h-0">
            {!isToday(data.date) && (
                <div className="flex items-center justify-end mb-4 w-full">
                    <button
                        onClick={() => changeDate(format(new Date(), 'yyyy-MM-dd'))}
                        className="text-sm px-3 py-1 rounded-full transition-all duration-200 bg-accent text-white">
                        Zurück zu Heute
                    </button>
                </div>
            )}
            {/* Warnung anzeigen, falls Scrape fehlgeschlagen */}
            {scrapeFailed && favorites.length != 0 && (
                <div className="mb-4 flex items-start space-x-2 p-3 rounded-md bg-amber-100 dark:bg-amber-900/40 text-amber-900 dark:text-amber-100 text-sm">
                    <AlertTriangle className="w-5 h-5 mt-0.5 shrink-0" />
                    <p>
                        Die aktuellsten Daten konnten nicht von der Website geladen werden. Sollte das Problem weiterhin
                        bestehen, kontaktieren Sie bitte unser Team.
                    </p>
                </div>
            )}
            {visibleLibraries.length === 0 && favorites.length === 0 && (
                <div className="mb-4 flex items-start space-x-2 p-3 rounded-md bg-amber-100 dark:bg-amber-900/40 text-amber-900 dark:text-amber-100 text-sm">
                    <AlertTriangle className="w-5 h-5 mt-0.5 shrink-0" />
                    <p>
                        Du hast keine Bibliotheken ausgewählt. Bitte wähle mindestens eine Bibliothek aus, um die
                        Auslastung anzuzeigen.
                    </p>
                </div>
            )}
            <div className="flex justify-end items-center mb-4">
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
            <div className="w-full bg-white dark:bg-card rounded-xl border border-border p-3 shadow-sm mb-6 min-h-0">
                <div className="flex sm:items-center sm:justify-between flex-col sm:flex-row mb-4 gap-2">
                    <h2 className="text-xl font-medium">Bibliotheksauslastung</h2>
                </div>

                <div className="h-[22rem] w-full" style={{ opacity: chartOpacity, height: 350 }}>
                    {loading && (
                        <div className="h-full w-full flex items-center justify-center">
                            <div className="h-8 w-8 rounded-full border-4 border-primary/20 border-t-primary animate-spin"></div>
                        </div>
                    )}
                    {!loading && (
                        <ResponsiveContainer width="100%" height="100%" minHeight="300px">
                            <LineChart data={chartData} margin={{ top: 5, right: 5, left: -15, bottom: 15 }}>
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
                                <YAxis
                                    domain={[0, 100]}
                                    tickCount={5}
                                    unit="%"
                                    tick={{ fontSize: 10 }}
                                    tickMargin={5}
                                />
                                {/* Horizontal threshold line at 75% */}
                                {isToday(data.date) && (
                                    <ReferenceLine y={75} stroke="red" strokeDasharray="3 3" strokeWidth={1} />
                                )}
                                <Tooltip content={<MobileCustomTooltip />} />
                                <Legend
                                    wrapperStyle={{ fontSize: '10px', marginTop: '10px' }}
                                    iconSize={8}
                                    iconType="circle"
                                />

                                {visibleLibraries.map((library) => (
                                    <Line
                                        key={library.id}
                                        type="monotone"
                                        dataKey={library.id}
                                        name={getDisplayName(library.name)}
                                        stroke={library.color}
                                        strokeWidth={2}
                                        dot={false}
                                        activeDot={{ r: 4 }}
                                        isAnimationActive={true}
                                        animationDuration={ANIMATION_DURATION}
                                        animationEasing="ease-in-out"
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
                                            isAnimationActive={true}
                                            animationDuration={ANIMATION_DURATION}
                                            animationEasing="ease-in-out"
                                        />
                                    ))}
                            </LineChart>
                        </ResponsiveContainer>
                    )}
                </div>
            </div>
        </div>
    );
}
