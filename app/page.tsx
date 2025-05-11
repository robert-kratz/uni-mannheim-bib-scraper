'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import Navbar from '@/components/Navbar';
import LibraryList from '@/components/LibraryList';
import OccupancyGraph from '@/components/OccupancyGraph';
import MobileOccupancyGraph from '@/components/MobileOccupancyGraph';
import Calendar from '@/components/Calendar';
import { libraries, occupancyData, semesterPeriods } from '@/utils/mockData';
import { useIsMobile } from '@/hooks/use-mobile';

export default function IndexPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const pathname = usePathname();
    const isMobile = useIsMobile();

    // Persisted graph date via URL
    const todayStr = new Date().toISOString().split('T')[0];
    const urlDate = searchParams.get('date') ?? todayStr;
    const validIdx = occupancyData.findIndex((d) => d.date === urlDate);
    const initialIdx = validIdx !== -1 ? validIdx : occupancyData.findIndex((d) => d.date === todayStr) || 0;

    // Graph state
    const [selectedGraphIndex, setSelectedGraphIndex] = useState<number>(initialIdx);

    // Calendar state (not in URL)
    const [calendarDate, setCalendarDate] = useState<Date>(new Date());

    // Preferences: theme, favorites, etc.
    const [theme, setTheme] = useState<'light' | 'dark'>(() => {
        if (typeof window === 'undefined') return 'light';
        const saved = localStorage.getItem('theme');
        if (saved === 'light' || saved === 'dark') return saved;
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    });
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

    // Update graph index & URL
    const updateGraph = (index: number) => {
        const newDate = occupancyData[index].date;
        setSelectedGraphIndex(index);
        router.push(`${pathname}?date=${newDate}`);
    };

    // Calendar select (state only)
    const updateCalendar = (date: Date) => {
        setCalendarDate(date);
    };

    // Persist preferences & apply theme
    useEffect(() => {
        localStorage.setItem('theme', theme);
        localStorage.setItem('favorites', JSON.stringify(favorites));
        localStorage.setItem('showOnlyFavorites', JSON.stringify(showOnlyFavorites));
        theme === 'dark'
            ? document.documentElement.classList.add('dark')
            : document.documentElement.classList.remove('dark');
    }, [theme, favorites, showOnlyFavorites]);

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
                    selectedDateIndex={selectedGraphIndex}
                    setSelectedDateIndex={updateGraph}
                />

                {/* Mobile graph */}
                {isMobile && (
                    <MobileOccupancyGraph
                        libraries={libraries}
                        data={occupancyData}
                        favorites={favorites}
                        showOnlyFavorites={showOnlyFavorites}
                        selectedDateIndex={selectedGraphIndex}
                        setSelectedDateIndex={updateGraph}
                    />
                )}

                <Calendar semesterPeriods={semesterPeriods} selectedDate={calendarDate} onSelectDate={updateCalendar} />
            </main>

            <footer className="mt-12 py-6 bg-secondary/30 dark:bg-secondary/10 border-t border-border">
                <div className="container max-w-7xl mx-auto px-4">
                    <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                        <p className="text-sm text-muted-foreground">
                            © {new Date().getFullYear()}{' '}
                            <a href="https://github.com/robert-kratz" className="text-accent hover:underline">
                                Made by Robert Julian Kratz
                            </a>{' '}
                            &{' '}
                            <a href="https://github.com/its-gil" className="text-accent hover:underline">
                                Virgil Baclanov
                            </a>
                        </p>
                        <div className="flex items-center gap-4">
                            <a
                                href="https://github.com/robert-kratz/uni-mannheim-bib-scraper"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                                GitHub Repository
                            </a>
                            <a
                                href="https://www.uni-mannheim.de/studium/termine/semesterzeiten"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                                Semesterzeiten
                            </a>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}
