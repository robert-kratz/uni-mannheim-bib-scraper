'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import LibraryList from '@/components/LibraryList';
import OccupancyGraph from '@/components/OccupancyGraph';
import MobileOccupancyGraph from '@/components/MobileOccupancyGraph';
import Calendar from '@/components/Calendar';
import { libraries, occupancyData, semesterPeriods } from '@/utils/mockData';
import { useIsMobile } from '@/hooks/use-mobile';

export default function IndexPage() {
    const isMobile = useIsMobile();

    // Theme state
    const [theme, setTheme] = useState<'light' | 'dark'>(() => {
        if (typeof window !== 'undefined') {
            // Check for saved theme preference
            const savedTheme = localStorage.getItem('theme');

            // Check for system preference
            if (!savedTheme) {
                return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
            }

            return savedTheme as 'light' | 'dark';
        }

        return 'light';
    });

    // Library favorites state
    const [favorites, setFavorites] = useState<string[]>(() => {
        if (typeof window === 'undefined') return ['bib-a3', 'bib-schloss']; // Default favorites
        const saved = localStorage?.getItem('favorites');
        return saved ? JSON.parse(saved) : ['bib-a3', 'bib-schloss']; // Default favorites
    });

    // Show only favorites state
    const [showOnlyFavorites, setShowOnlyFavorites] = useState<boolean>(() => {
        if (typeof window === 'undefined') return false;
        const saved = localStorage?.getItem('showOnlyFavorites');
        return saved ? JSON.parse(saved) === true : false;
    });

    // Selected date state (default to today)
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());

    // Selected date index for graphs
    const [selectedDateIndex, setSelectedDateIndex] = useState<number>(() => {
        return (
            occupancyData.findIndex((day) => {
                const today = new Date().toISOString().split('T')[0];
                return day.date === today;
            }) || 0
        );
    });

    // Toggle theme function
    const toggleTheme = () => {
        setTheme(theme === 'light' ? 'dark' : 'light');
    };

    // Toggle favorite function
    const toggleFavorite = (id: string) => {
        setFavorites((prev) => {
            if (prev.includes(id)) {
                return prev.filter((item) => item !== id);
            } else {
                return [...prev, id];
            }
        });
    };

    // Save preferences to localStorage whenever they change
    useEffect(() => {
        localStorage.setItem('theme', theme);
        localStorage.setItem('favorites', JSON.stringify(favorites));
        localStorage.setItem('showOnlyFavorites', JSON.stringify(showOnlyFavorites));

        // Apply theme to document
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [theme, favorites, showOnlyFavorites]);

    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col">
            <Navbar toggleTheme={toggleTheme} isDarkMode={theme === 'dark'} />

            <main className="container max-w-7xl mx-auto pt-24 px-4 flex-grow">
                <div className="mb-8">
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
                    selectedDateIndex={selectedDateIndex}
                    setSelectedDateIndex={setSelectedDateIndex}
                />

                {/* Mobile graph */}
                {isMobile && (
                    <MobileOccupancyGraph
                        libraries={libraries}
                        data={occupancyData}
                        favorites={favorites}
                        showOnlyFavorites={showOnlyFavorites}
                        selectedDateIndex={selectedDateIndex}
                        setSelectedDateIndex={setSelectedDateIndex}
                    />
                )}

                <Calendar
                    semesterPeriods={semesterPeriods}
                    selectedDate={selectedDate}
                    onSelectDate={(date) => {
                        setSelectedDate(date);
                        // Find and set the corresponding date in the data
                        const dateString = date.toISOString().split('T')[0];
                        const index = occupancyData.findIndex((day) => day.date === dateString);
                        if (index !== -1) {
                            setSelectedDateIndex(index);
                        }
                    }}
                />
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
