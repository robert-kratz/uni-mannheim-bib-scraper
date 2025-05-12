import React, { useEffect, useState } from 'react';
import { Library, OccupancyDataPoint } from '@/utils/types';
import { Progress } from '@/components/ui/progress';
import { ArrowUp, ArrowDown, ArrowRight } from 'lucide-react';

interface CurrentOccupancyProps {
    libraries: Library[];
    data: Record<string, OccupancyDataPoint[]>;
    favorites: string[];
    showOnlyFavorites: boolean;
}

const CurrentOccupancy = ({ libraries, data, favorites, showOnlyFavorites }: CurrentOccupancyProps) => {
    // Get current time
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();

    // Format current time to match data format (HH:MM)
    const currentTimeString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;

    const [mounted, setMounted] = useState(false);
    useEffect(() => {
        setMounted(true);
    }, []);
    if (!mounted) return null; // oder Skeleton-Placeholder

    // Get current occupancy and trend for each library
    const getCurrentOccupancyData = (libraryId: string) => {
        const libraryData = data[libraryId];
        if (!libraryData || libraryData.length === 0) return null;

        // Find the closest time data point
        const sortedData = [...libraryData].sort((a, b) => {
            const aDiff = Math.abs(timeToMinutes(a.time) - timeToMinutes(currentTimeString));
            const bDiff = Math.abs(timeToMinutes(b.time) - timeToMinutes(currentTimeString));
            return aDiff - bDiff;
        });

        const currentData = sortedData[0];

        // Get trend by comparing with previous data point if available
        let trend: 'up' | 'down' | 'stable' = 'stable';
        const currentIndex = libraryData.findIndex((d) => d.time === currentData.time);
        if (currentIndex > 0) {
            const prevOccupancy = libraryData[currentIndex - 1].occupancy;

            if (currentData.occupancy === null || prevOccupancy === null) {
                trend = 'stable';
            } else if (currentData.occupancy > prevOccupancy) {
                trend = 'up';
            } else if (currentData.occupancy < prevOccupancy) {
                trend = 'down';
            }
        }

        return {
            occupancy: currentData.occupancy,
            trend,
        };
    };

    // Convert time string to minutes for easier comparison
    const timeToMinutes = (time: string) => {
        const [hours, minutes] = time.split(':').map(Number);
        return hours * 60 + minutes;
    };

    const getOccupancyColor = (occupancy: number) => {
        if (occupancy < 30) return 'bg-green-500';
        if (occupancy < 70) return 'bg-amber-500';
        return 'bg-red-500';
    };

    // Filter libraries if needed
    const filteredLibraries = showOnlyFavorites ? libraries.filter((lib) => favorites.includes(lib.id)) : libraries;

    return (
        <div className="mb-8 animate-slideIn">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-medium">Aktuelle Auslastung</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredLibraries.map((library) => {
                    const occupancyData = getCurrentOccupancyData(library.id);
                    if (!occupancyData) return null;

                    return (
                        <div
                            key={library.id}
                            className="p-4 rounded-xl bg-white dark:bg-card border border-border transition-all-300 hover:shadow-md">
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: library.color }} />
                                    <h3 className="font-medium">{library.name}</h3>
                                </div>
                                <div className="flex items-center gap-1">
                                    <span className="text-sm font-medium">{occupancyData.occupancy}%</span>
                                    {occupancyData.trend === 'up' && <ArrowUp size={18} className="text-red-500" />}
                                    {occupancyData.trend === 'stable' && (
                                        <ArrowRight size={18} className="text-gray-500" />
                                    )}
                                    {occupancyData.trend === 'down' && (
                                        <ArrowDown size={18} className="text-green-500" />
                                    )}
                                </div>
                            </div>

                            <Progress
                                value={occupancyData.occupancy}
                                className="h-2"
                                indicatorClassName={getOccupancyColor(occupancyData.occupancy || 0)}
                            />
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default CurrentOccupancy;
