'use client';

import { Heart } from 'lucide-react';
import { Library } from '@/utils/types';
import { useEffect, useState } from 'react';

interface LibraryListProps {
    libraries: Library[];
    favorites: string[];
    toggleFavorite: (id: string) => void;
    showOnlyFavorites: boolean;
    setShowOnlyFavorites: (show: boolean) => void;
}

export default function LibraryList({
    libraries,
    favorites,
    toggleFavorite,
    showOnlyFavorites,
    setShowOnlyFavorites,
}: LibraryListProps) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    return (
        <div className="w-full mb-8">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-medium">Bibliotheken</h2>
                <button
                    onClick={() => setShowOnlyFavorites(!showOnlyFavorites)}
                    className={`text-sm px-3 py-1 rounded-full transition-all-200 ${
                        showOnlyFavorites ? 'bg-accent text-white' : 'bg-secondary hover:bg-secondary/80'
                    }`}>
                    {showOnlyFavorites ? 'Alle anzeigen' : 'Nur Favoriten'}
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3">
                {libraries.map((library) => (
                    <div
                        key={library.id}
                        onClick={() => toggleFavorite(library.id)}
                        className="relative group overflow-hidden p-4 rounded-xl cursor-pointer bg-white dark:bg-card border border-border transition-all-200 hover:shadow-md">
                        <div className="absolute top-3 right-3">
                            <button
                                className="p-1.5 rounded-full transition-all-200"
                                aria-label={
                                    favorites.includes(library.id) ? 'Remove from favorites' : 'Add to favorites'
                                }>
                                <Heart
                                    className={`w-5 h-5 transition-all-200 ${
                                        favorites.includes(library.id)
                                            ? 'fill-accent text-accent'
                                            : 'fill-transparent text-muted-foreground group-hover:text-foreground'
                                    }`}
                                />
                            </button>
                        </div>

                        <div className="w-12 h-2 rounded-full mb-3" style={{ backgroundColor: library.color }} />

                        <h3 className="font-medium">{library.name}</h3>
                    </div>
                ))}
            </div>
        </div>
    );
}
