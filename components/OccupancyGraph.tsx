'use client';

import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
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

interface OccupancyGraphProps {
    libraries: Library[];
    data: DailyOccupancyData[];
    favorites: string[];
    showOnlyFavorites: boolean;
    selectedDateIndex?: number;
    setSelectedDateIndex?: (index: number) => void;
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

export default function OccupancyGraph({
    libraries,
    data,
    favorites,
    showOnlyFavorites,
    selectedDateIndex: propSelectedDateIndex,
    setSelectedDateIndex: propSetSelectedDateIndex,
}: OccupancyGraphProps) {
    console.log('OccupancyGraph rendered');
    console.log('Libraries:', libraries);
    console.log('Data:', data);

    const router = useRouter();

    const [localSelectedDateIndex, setLocalSelectedDateIndex] = useState<number>(() => {
        // Find today's index in the data array
        return data.findIndex((day) => isToday(parseISO(day.date))) || 0;
    });

    // Animation states
    const [isVisible, setIsVisible] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    // Use either prop value or local state
    const selectedDateIndex = propSelectedDateIndex !== undefined ? propSelectedDateIndex : localSelectedDateIndex;
    const setSelectedDateIndex = propSetSelectedDateIndex || setLocalSelectedDateIndex;

    const isMobile = useIsMobile();

    const selectedDay = data[selectedDateIndex];

    useEffect(() => {
        // Delay the graph card appearance to come after library cards
        // Assuming 5 library cards with 100ms stagger = ~500ms total
        // Add extra delay for smoother sequence
        const timer = setTimeout(() => {
            setIsLoading(false);

            setTimeout(() => {
                setIsVisible(true);
            }, 0);
        }, 0); // Delay after libraries are loaded

        return () => clearTimeout(timer);
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
                          dataPoint[`${library.id}-prediction`] = libraryData.prediction;
                      }
                  });

                  result.push(dataPoint);
              });

              return result;
          })()
        : [];

    const navigateDate = (direction: 'prev' | 'next') => {
        /*if (direction === 'prev' && selectedDateIndex > 0) {
            setSelectedDateIndex(selectedDateIndex - 1);
        } else if (direction === 'next' && selectedDateIndex < data.length - 1) {
            // Check if next date is in the future
            const nextDate = parseISO(data[selectedDateIndex + 1].date);
            if (!isFuture(nextDate)) {
                setSelectedDateIndex(selectedDateIndex + 1);
            }
        }*/

        //get the current date from the data array, if pressing next or previous navigate to ?date=YYYY-MM-DD . do not allow the future
        const currentDate = parseISO(data[selectedDateIndex].date);
        const newDate = direction === 'prev' ? addDays(currentDate, -1) : addDays(currentDate, 1);

        // Check if the new date is in the future
        if (isFuture(newDate)) {
            return;
        }

        router.push(`?date=${format(newDate, 'yyyy-MM-dd')}`);
    };

    // Format the displayed date
    const formattedDate = selectedDay ? format(parseISO(selectedDay.date), 'EEEE, d. MMMM yyyy', { locale: de }) : '';

    // Determine which libraries to show
    const visibleLibraries = libraries.filter((lib) => !showOnlyFavorites || favorites.includes(lib.id));

    // Format time labels on X-axis
    const formatXAxis = (time: string) => {
        // Only show full hours
        return time.endsWith(':00') ? time : '';
    };

    // If on mobile, we'll render the mobile version of the graph from the parent component
    if (isMobile) {
        return null;
    }

    console.log('selectedDateIndex:', selectedDateIndex);

    return (
        <>
            {selectedDateIndex === 0 && (
                <div className="flex items-center justify-end mb-4 w-full">
                    <button
                        onClick={() => router.push('/')}
                        className="text-sm px-3 py-1 rounded-full transition-all duration-200 bg-secondary hover:bg-secondary/80">
                        Zurück zur Übersicht
                    </button>
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
                            onClick={() => navigateDate('prev')}
                            className="p-1.5 rounded-lg bg-secondary/50 hover:bg-secondary transition-all duration-200"
                            aria-label="Previous day">
                            <ChevronLeft className="w-5 h-5" />
                        </button>

                        <span className="text-sm font-medium px-2">{formattedDate}</span>

                        <button
                            onClick={() => navigateDate('next')}
                            className={`p-1.5 rounded-lg transition-all duration-200 ${
                                selectedDateIndex < data.length - 1 &&
                                !isFuture(parseISO(data[selectedDateIndex + 1].date))
                                    ? 'bg-secondary/50 hover:bg-secondary'
                                    : 'bg-secondary/20 text-muted-foreground cursor-not-allowed'
                            }`}
                            disabled={
                                selectedDateIndex >= data.length - 1 ||
                                isFuture(parseISO(data[selectedDateIndex + 1].date))
                            }
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
                            <ReferenceLine
                                y={75}
                                stroke="red"
                                strokeDasharray="3 3"
                                strokeWidth={1}
                                label={{ value: '75%', position: 'left', fill: 'red', fontSize: 12 }}
                            />
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

                            {visibleLibraries.map((library) => (
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
