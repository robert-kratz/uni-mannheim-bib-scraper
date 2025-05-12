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
import { format, parseISO, isToday, isFuture, addDays } from 'date-fns';
import { de } from 'date-fns/locale';
import { useRouter } from 'next/navigation';

const ENABLE_PREDICTION = false; // Set to true to enable prediction lines, only here until we have a prediction API

interface MobileOccupancyGraphProps {
    libraries: Library[];
    data: DailyOccupancyData;
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
                            <span className="mr-1.5">{entry.name}:</span>
                            <span className="font-medium">{entry.value}%</span>
                        </div>
                    ))}
                </div>
            </div>
        );
    }
    return null;
};

export default function MobileOccupancyGraph({
    libraries,
    data,
    favorites,
    showOnlyFavorites,
}: MobileOccupancyGraphProps) {
    const selectedDay = data;

    const router = useRouter();

    // Prepare chart data - simplified for mobile
    const chartData = selectedDay
        ? (() => {
              const result: any = [];
              // Get the first library to determine time points
              const firstLibraryId = Object.keys(selectedDay.occupancy)[0];
              // For mobile, use fewer data points (hourly instead of every 10 minutes)
              const timePoints = selectedDay.occupancy[firstLibraryId]
                  .filter((point, index) => index % 6 === 0) // Every hour (every 6th point)
                  .map((point) => point.time);

              // For each time point, gather all libraries' data
              timePoints.forEach((time, timeIndex) => {
                  const dataPoint: any = { time };

                  // Add data for each library
                  libraries.forEach((library) => {
                      if (showOnlyFavorites && !favorites.includes(library.id)) return;

                      const libraryData = selectedDay.occupancy[library.id][timeIndex * 6]; // Every hour
                      if (libraryData) {
                          dataPoint[library.id] = libraryData.occupancy;
                          // We don't need predictions on mobile view for simplicity
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
        if (chartData.length === 0) return false;
        const last = chartData[chartData.length - 1];
        return visibleLibraries.every((lib) => {
            const val = last[lib.id as keyof typeof last] as number | null | undefined;
            return val === null || val === -1 || val === undefined;
        });
    })();

    return (
        <>
            {!isToday(data.date) && (
                <div className="flex items-center justify-end mb-4 w-full">
                    <button
                        onClick={() => router.push('/')}
                        className="text-sm px-3 py-1 rounded-full transition-all duration-200 bg-accent text-white">
                        Zurück zur Heute
                    </button>
                </div>
            )}
            {scrapeFailed && (
                <div className="mb-4 flex items-start space-x-2 p-3 rounded-md bg-amber-100 dark:bg-amber-900/40 text-amber-900 dark:text-amber-100 text-sm">
                    <AlertTriangle className="w-5 h-5 mt-0.5 shrink-0" />
                    <p>
                        Die aktuellsten Daten konnten nicht von der Website geladen werden. Sollte das Problem weiterhin
                        bestehen, kontaktieren Sie bitte unser Team.
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
            <div className="w-full bg-white dark:bg-card rounded-xl border border-border p-3 shadow-sm mb-6 animate-fadeIn">
                <div className="flex sm:items-center sm:justify-between flex-col sm:flex-row mb-4 gap-2">
                    <h2 className="text-xl font-medium">Bibliotheksauslastung</h2>
                </div>

                <div className="h-[20rem] w-full">
                    <ResponsiveContainer width="100%" height="100%">
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
                            <YAxis domain={[0, 100]} tickCount={5} unit="%" tick={{ fontSize: 10 }} tickMargin={5} />
                            {/* Horizontal threshold line at 75% */}
                            <ReferenceLine y={75} stroke="red" strokeDasharray="3 3" strokeWidth={1} />
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
                                    name={library.name}
                                    stroke={library.color}
                                    strokeWidth={2}
                                    dot={false}
                                    activeDot={{ r: 4 }}
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
