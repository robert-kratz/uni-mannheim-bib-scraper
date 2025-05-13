import React, { useEffect, useState } from 'react';
import { Library, OccupancyDataPoint } from '@/utils/types';
import { Progress } from '@/components/ui/progress';
import { ArrowUp, ArrowDown, ArrowRight } from 'lucide-react';
import { getDisplayName } from '@/lib/libraryNames';

interface CurrentOccupancyProps {
    libraries: Library[];
    data: Record<string, OccupancyDataPoint[]>;
    favorites: string[];
    showOnlyFavorites: boolean;
}

type Trend = 'up' | 'down' | 'stable';
interface CurrentData {
    occupancy: number;
    trend: Trend;
}

const CurrentOccupancy: React.FC<CurrentOccupancyProps> = ({ libraries, data, favorites, showOnlyFavorites }) => {
    const [mounted, setMounted] = useState(false);
    useEffect(() => {
        setMounted(true);
    }, []);
    if (!mounted) return null;

    const getCurrentOccupancyData = (libraryId: string): CurrentData | null => {
        const libData = data[libraryId];
        if (!libData || libData.length === 0) return null;

        // 1) Von hinten starten und ersten validen occupancy-Wert finden
        let currentIdx = -1;
        for (let i = libData.length - 1; i >= 0; i--) {
            const occ = libData[i].occupancy;
            if (occ != null && occ !== -1) {
                currentIdx = i;
                break;
            }
        }
        if (currentIdx === -1) return null;

        const currentOcc = libData[currentIdx].occupancy as number;

        // 2) Trend: vorherigen validen Punkt finden
        let trend: Trend = 'stable';
        for (let j = currentIdx - 1; j >= 0; j--) {
            const prevOcc = libData[j].occupancy;
            if (prevOcc != null && prevOcc !== -1) {
                if (currentOcc > prevOcc) trend = 'up';
                else if (currentOcc < prevOcc) trend = 'down';
                break;
            }
        }

        return { occupancy: currentOcc, trend };
    };

    const getOccupancyColor = (occ: number) => {
        if (occ < 30) return 'bg-green-500';
        if (occ < 70) return 'bg-amber-500';
        return 'bg-red-500';
    };

    // Favorites-Filter
    const displayLibs = showOnlyFavorites ? libraries.filter((lib) => favorites.includes(lib.id)) : libraries;

    return (
        <div className="mb-8 animate-slideIn">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-medium">Aktuelle Auslastung</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {displayLibs.map((library) => {
                    const cur = getCurrentOccupancyData(library.id);
                    if (!cur) return null;

                    return (
                        <div
                            key={library.id}
                            className="p-4 rounded-xl bg-white dark:bg-card border border-border transition-all-300 hover:shadow-md">
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: library.color }} />
                                    <h3 className="font-medium">{getDisplayName(library.name)}</h3>
                                </div>
                                <div className="flex items-center gap-1">
                                    <span className="text-sm font-medium">{cur.occupancy}%</span>
                                    {cur.trend === 'up' && <ArrowUp size={18} className="text-red-500" />}
                                    {cur.trend === 'stable' && <ArrowRight size={18} className="text-gray-500" />}
                                    {cur.trend === 'down' && <ArrowDown size={18} className="text-green-500" />}
                                </div>
                            </div>

                            <Progress
                                value={cur.occupancy}
                                className="h-2"
                                indicatorClassName={getOccupancyColor(cur.occupancy)}
                            />
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default CurrentOccupancy;
