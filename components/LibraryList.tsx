'use client';

import { Heart } from 'lucide-react';
import { Library } from '@/utils/types';
import { useEffect, useState } from 'react';
import { getDisplayName } from '@/lib/libraryNames';

interface LibraryListProps {
    libraries: Library[];
    favorites: string[];
    toggleFavorite: (id: string) => void;
}

export default function LibraryList({
    libraries,
    favorites,
    toggleFavorite,
}: LibraryListProps) {
    const [mounted, setMounted] = useState(false);
    const [loadedItems, setLoadedItems] = useState<string[]>([]);

    useEffect(() => {
        setMounted(true);

        // Simulate loading delay
        const timer = setTimeout(() => {
            // Stagger the animation of each library card
            libraries.forEach((library, index) => {
                setTimeout(() => {
                    setLoadedItems((prev) => [...prev, library.id]);
                }, 50); // 100ms delay between each card
            });
        }, 0); // Initial loading delay

        return () => clearTimeout(timer);
    }, [libraries]);

    if (!mounted) return null;

    return (
        <div className="w-full mb-8 animate-fadeIn">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-mono font-bold uppercase tracking-wide">Bibliotheken</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3">
                {libraries.map((library, index) => (
                    <div
                        key={library.id}
                        onClick={() => toggleFavorite(library.id)}
                        className={`relative group overflow-hidden cursor-pointer bg-card border-2 border-foreground/10 hover:dot-pattern transition-all duration-200 ${
                            loadedItems.includes(library.id) ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'
                        }`}
                        style={{
                            transitionDelay: `${index * 80}ms`,
                            transitionProperty: 'transform, opacity',
                            borderLeftWidth: '4px',
                            borderLeftColor: library.color,
                        }}>
                        <div className="p-4">
                            <div className="absolute top-3 right-3">
                                <button
                                    className="p-1 transition-all duration-200"
                                    aria-label={
                                        favorites.includes(library.id) ? 'Remove from favorites' : 'Add to favorites'
                                    }>
                                    <Heart
                                        className={`w-4 h-4 transition-all duration-200 ${
                                            favorites.includes(library.id)
                                                ? 'fill-foreground text-foreground'
                                                : 'fill-transparent text-muted-foreground group-hover:text-foreground'
                                        }`}
                                    />
                                </button>
                            </div>
                            <h3 className="font-mono font-semibold text-sm">{getDisplayName(library.name)}</h3>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
