'use client';

import { useState, useEffect } from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';

export default function Navbar() {
    const [scrolled, setScrolled] = useState(false);
    const [visible, setVisible] = useState(true);
    const [lastY, setLastY] = useState(0);
    const [mounted, setMounted] = useState(false);

    const { theme, setTheme } = useTheme();

    useEffect(() => {
        setMounted(true);
        const onScroll = () => {
            const y = window.scrollY;

            setScrolled(y > 100);
            setVisible(y <= lastY);
            setLastY(y);
        };
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, [lastY]);

    return (
        <header
            className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 px-6 py-4 ${
                scrolled ? 'bg-white/80 dark:bg-black/80 backdrop-blur shadow-sm' : 'bg-transparent'
            } ${visible ? 'translate-y-0' : '-translate-y-full'}`}>
            <div className="max-w-7xl mx-auto flex items-center justify-between">
                <div className="flex items-center space-x-2">
                    <h1 className="text-xl font-medium">
                        <span className="font-bold">bib2</span>.rjks.us
                    </h1>
                    <span className="text-xs bg-accent/10 text-accent px-2 py-0.5 rounded-full">Beta</span>
                </div>
                {/* Theme-Toggle nur nach Mount */}
                {mounted && (
                    <button
                        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                        className="p-2 rounded-full bg-secondary/50 hover:bg-secondary transition duration-200"
                        aria-label={theme === 'light' ? 'Dark Mode an' : 'Light Mode an'}>
                        {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                    </button>
                )}
            </div>
        </header>
    );
}
