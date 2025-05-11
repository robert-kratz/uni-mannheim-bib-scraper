'use client';

import { useState, useEffect } from 'react';
import { Moon, Sun, Menu } from 'lucide-react';
import { useTheme } from 'next-themes';

export default function Navbar() {
    const [scrolled, setScrolled] = useState(false);
    const [visible, setVisible] = useState(true);
    const [lastScrollY, setLastScrollY] = useState(0);
    const [mounted, setMounted] = useState(false);

    const { theme, setTheme } = useTheme();

    useEffect(() => {
        setMounted(true);

        const handleScroll = () => {
            const currentScrollY = window.scrollY;

            // Determine if scrolled past threshold for background change
            setScrolled(currentScrollY > 20);

            // Hide when scrolling down, show when scrolling up
            if (currentScrollY > lastScrollY) {
                setVisible(false);
            } else {
                setVisible(true);
            }

            // Update last scroll position
            setLastScrollY(currentScrollY);
        };

        window.addEventListener('scroll', handleScroll, { passive: true });

        return () => {
            window.removeEventListener('scroll', handleScroll);
        };
    }, [lastScrollY]);

    return (
        <header
            className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 px-6 py-4 ${
                scrolled ? 'bg-white/80 dark:bg-black/80 backdrop-blur shadow-sm' : 'bg-transparent'
            } ${visible ? 'translate-y-0' : '-translate-y-full'}`}>
            <div className="max-w-7xl mx-auto flex items-center justify-between">
                <div className="flex items-center space-x-1">
                    <h1 className="text-xl font-medium">
                        <span className="font-bold">bib</span>.rjks.us
                    </h1>
                    <span className="text-xs bg-accent/10 text-accent px-2 py-0.5 rounded-full">Beta</span>
                </div>

                <div className="flex items-center space-x-4">
                    <button
                        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                        className="p-2 rounded-full bg-secondary/50 hover:bg-secondary transition-all duration-200"
                        aria-label={theme !== 'light' ? 'Switch to light mode' : 'Switch to dark mode'}>
                        {theme !== 'light' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                    </button>
                </div>
            </div>
        </header>
    );
}
