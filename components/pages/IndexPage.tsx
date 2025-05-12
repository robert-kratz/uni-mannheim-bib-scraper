'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import Navbar from '@/components/Navbar';
import LibraryList from '@/components/LibraryList';
import OccupancyGraph from '@/components/OccupancyGraph';
import MobileOccupancyGraph from '@/components/MobileOccupancyGraph';
import Calendar from '@/components/Calendar';
import { useIsMobile } from '@/hooks/use-mobile';
import CurrentOccupancy from '@/components/CurrentOccupancy';
import { DailyOccupancyData, SemesterPeriod } from '@/utils/types';
import { libraries } from '@/utils/constants';
import Footer from '@/components/Footer';
import { AlertTriangle } from 'lucide-react';

type Props = {
    occupancyData: DailyOccupancyData;
    semesterPeriods: SemesterPeriod[];
};

export default function IndexPage({ occupancyData, semesterPeriods }: Props) {
    const searchParams = useSearchParams();
    const isMobile = useIsMobile();

    // Persisted graph date via URL
    const todayStr = new Date().toISOString().split('T')[0];
    const urlDate = searchParams.get('date') ?? todayStr;

    // Calendar state (not in URL)
    const [calendarDate, setCalendarDate] = useState<Date>(new Date());

    const [favorites, setFavorites] = useState<string[]>(() => {
        if (typeof window === 'undefined') return ['bib-a3', 'bib-schloss'];
        const saved = localStorage.getItem('favorites');
        return saved ? JSON.parse(saved) : ['bib-a3', 'bib-schloss'];
    });
    const [showOnlyFavorites, setShowOnlyFavorites] = useState<boolean>(() => {
        if (typeof window === 'undefined') return false;
        const saved = localStorage.getItem('showOnlyFavorites');
        return saved ? JSON.parse(saved) : false;
    });

    // Check if selected date is today
    const isToday = (date: Date): boolean => {
        const today = new Date();
        return (
            date.getDate() === today.getDate() &&
            date.getMonth() === today.getMonth() &&
            date.getFullYear() === today.getFullYear()
        );
    };

    // Persist preferences & apply theme
    useEffect(() => {
        localStorage.setItem('favorites', JSON.stringify(favorites));
        localStorage.setItem('showOnlyFavorites', JSON.stringify(showOnlyFavorites));
    }, [favorites, showOnlyFavorites]);

    const toggleFavorite = (id: string) => {
        setFavorites((prev) => {
            const updated = prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id];
            if (updated.length === 0) setShowOnlyFavorites(false);
            return updated;
        });
    };

    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col">
            <Navbar />
            <main className="container max-w-7xl mx-auto pt-24 px-4 flex-grow">
                <div className="mb-8 animate-fadeIn">
                    <h1 className="text-3xl sm:text-4xl font-bold mb-2">Uni Mannheim Bibliotheks Manager</h1>
                    <p className="text-muted-foreground">Überblick über die Auslastung der Universitätsbibliotheken</p>
                </div>
                <LibraryList
                    libraries={libraries}
                    favorites={favorites}
                    toggleFavorite={toggleFavorite}
                    showOnlyFavorites={showOnlyFavorites}
                    setShowOnlyFavorites={setShowOnlyFavorites}
                />
                {/* Desktop graph */}
                <OccupancyGraph
                    libraries={libraries}
                    data={occupancyData}
                    favorites={favorites}
                    showOnlyFavorites={showOnlyFavorites}
                />
                {/* Show current occupancy only if selected date is today */}
                {isToday(new Date(urlDate)) && (
                    <CurrentOccupancy
                        libraries={libraries}
                        data={occupancyData?.occupancy || {}}
                        favorites={favorites}
                        showOnlyFavorites={showOnlyFavorites}
                    />
                )}
                {/* Mobile graph */}
                {isMobile && (
                    <MobileOccupancyGraph
                        libraries={libraries}
                        data={occupancyData}
                        favorites={favorites}
                        showOnlyFavorites={showOnlyFavorites}
                    />
                )}

                <Calendar
                    semesterPeriods={semesterPeriods}
                    selectedDate={calendarDate}
                    onSelectDate={(date) => setCalendarDate(date)}
                />
                <div className="mb-4 flex items-start space-x-2 p-3 rounded-md bg-amber-100 dark:bg-amber-900/40 text-amber-900 dark:text-amber-100 text-sm">
                    <AlertTriangle className="w-5 h-5 mt-0.5 shrink-0" />
                    <p>Alle Angaben sind ohne Gewähr. Die Daten werden alle 10 Minuten aktualisiert. </p>
                </div>
            </main>

            <Footer />
        </div>
    );
}
