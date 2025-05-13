'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import RefreshTimer from '@/components/RefreshTimer';
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
import { useOccupancy } from '@/hooks/use-occupancy';

type Props = {
    semesterPeriods: SemesterPeriod[];
};

export default function IndexPage({ semesterPeriods }: Props) {
    const isMobile = useIsMobile();
    const { date, changeDate } = useOccupancy();

    // Calendar state
    const [calendarDate, setCalendarDate] = useState<Date>(new Date(date));

    // Favorites state
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
    const isToday = (dateString: string): boolean => {
        const selectedDate = new Date(dateString);
        const today = new Date();
        return (
            selectedDate.getDate() === today.getDate() &&
            selectedDate.getMonth() === today.getMonth() &&
            selectedDate.getFullYear() === today.getFullYear()
        );
    };

    // Persist preferences
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
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                        <h1 className="text-3xl sm:text-4xl font-bold mb-2">Uni Mannheim Bibliotheks Manager</h1>
                        <div className="hidden md:flex">
                            <RefreshTimer className="self-start sm:self-auto" />
                        </div>
                    </div>
                    <p className="text-muted-foreground">Überblick über die Auslastung der Universitätsbibliotheken</p>
                    <RefreshTimer className="self-start sm:self-auto block md:hidden" />
                </div>
                <LibraryList
                    libraries={libraries}
                    favorites={favorites}
                    toggleFavorite={toggleFavorite}
                    showOnlyFavorites={showOnlyFavorites}
                    setShowOnlyFavorites={setShowOnlyFavorites}
                />
                {/* Show current occupancy only if selected date is today */}
                {isToday(date) && (
                    <CurrentOccupancy
                        libraries={libraries}
                        favorites={favorites}
                        showOnlyFavorites={showOnlyFavorites}
                    />
                )}
                {/* Desktop graph */}
                <OccupancyGraph libraries={libraries} favorites={favorites} showOnlyFavorites={showOnlyFavorites} />
                {/* Mobile graph */}
                {isMobile && (
                    <MobileOccupancyGraph
                        libraries={libraries}
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
