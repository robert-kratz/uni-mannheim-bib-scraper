import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Library, DailyOccupancyData } from '../utils/types';
import { format, parseISO, isToday, isFuture } from 'date-fns';
import { de } from 'date-fns/locale';

interface MobileOccupancyGraphProps {
    libraries: Library[];
    data: DailyOccupancyData[];
    favorites: string[];
    showOnlyFavorites: boolean;
    selectedDateIndex: number;
    setSelectedDateIndex: (index: number) => void;
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
    selectedDateIndex,
    setSelectedDateIndex,
}: MobileOccupancyGraphProps) {
    const selectedDay = data[selectedDateIndex];

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
                      }
                  });

                  result.push(dataPoint);
              });

              return result;
          })()
        : [];

    const navigateDate = (direction: 'prev' | 'next') => {
        if (direction === 'prev' && selectedDateIndex > 0) {
            setSelectedDateIndex(selectedDateIndex - 1);
        } else if (direction === 'next' && selectedDateIndex < data.length - 1) {
            // Check if next date is in the future
            const nextDate = parseISO(data[selectedDateIndex + 1].date);
            if (!isFuture(nextDate)) {
                setSelectedDateIndex(selectedDateIndex + 1);
            }
        }
    };

    // Format the displayed date
    const formattedDate = selectedDay ? format(parseISO(selectedDay.date), 'EEEE, d. MMMM yyyy', { locale: de }) : '';

    // Determine which libraries to show
    const visibleLibraries = libraries.filter((lib) => !showOnlyFavorites || favorites.includes(lib.id));

    return (
        <div className="w-full bg-white dark:bg-card rounded-xl border border-border p-3 shadow-sm mb-6 animate-fadeIn">
            <div className="flex flex-col mb-3">
                <h2 className="text-lg font-medium mb-2">Bibliotheksauslastung</h2>

                <div className="flex items-center justify-center space-x-2">
                    <button
                        onClick={() => navigateDate('prev')}
                        className="p-1.5 rounded-lg bg-secondary/50 hover:bg-secondary transition-all-200"
                        aria-label="Previous day">
                        <ChevronLeft className="w-4 h-4" />
                    </button>

                    <span className="text-xs font-medium px-2 text-center">{formattedDate}</span>

                    <button
                        onClick={() => navigateDate('next')}
                        className={`p-1.5 rounded-lg transition-all-200 ${
                            selectedDateIndex < data.length - 1 && !isFuture(parseISO(data[selectedDateIndex + 1].date))
                                ? 'bg-secondary/50 hover:bg-secondary'
                                : 'bg-secondary/20 text-muted-foreground cursor-not-allowed'
                        }`}
                        disabled={
                            selectedDateIndex >= data.length - 1 || isFuture(parseISO(data[selectedDateIndex + 1].date))
                        }
                        aria-label="Next day">
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            </div>

            <div className="h-52 w-full">
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
                        <Tooltip content={<MobileCustomTooltip />} />
                        <Legend wrapperStyle={{ fontSize: '10px', marginTop: '10px' }} iconSize={8} iconType="circle" />

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
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
