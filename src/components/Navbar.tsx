'use client';

import { useState, useEffect } from 'react';
import { Moon, Sun, Menu } from 'lucide-react';

interface NavbarProps {
    toggleTheme: () => void;
    isDarkMode: boolean;
}

export default function Navbar({ toggleTheme, isDarkMode }: NavbarProps) {
    const [scrolled, setScrolled] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null; // oder ein Platzhalter

    return (
        <header
            className={`fixed top-0 left-0 right-0 z-50 transition-all-300 px-6 py-4 ${
                scrolled ? 'bg-white/80 dark:bg-black/80 backdrop-blur shadow-sm' : 'bg-transparent'
            }`}>
            <div className="max-w-7xl mx-auto flex items-center justify-between">
                <div className="flex items-center space-x-1">
                    <h1 className="text-xl font-medium">
                        <span className="font-bold">bib</span>.rjks.us
                    </h1>
                    <span className="text-xs bg-accent/10 text-accent px-2 py-0.5 rounded-full">Beta</span>
                </div>

                <div className="flex items-center space-x-4">
                    <button
                        onClick={toggleTheme}
                        className="p-2 rounded-full bg-secondary/50 hover:bg-secondary transition-all-200"
                        aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}>
                        {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                    </button>
                </div>
            </div>
        </header>
    );
}
