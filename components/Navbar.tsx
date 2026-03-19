'use client';

import { useState, useEffect } from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { analytics } from '@/lib/analytics';

export default function Navbar() {
    const [mounted, setMounted] = useState(false);
    const { theme, setTheme } = useTheme();

    const handleThemeToggle = () => {
        const newTheme = theme === 'dark' ? 'light' : 'dark';
        setTheme(newTheme);
        analytics.trackThemeChange(newTheme as 'light' | 'dark');
    };

    useEffect(() => {
        setMounted(true);
    }, []);

    return (
        <header className="sticky top-0 z-50 bg-background border-b-2 border-foreground/10 px-6 py-3">
            <div className="max-w-7xl mx-auto flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <h1 className="text-lg font-mono font-bold tracking-tight">
                        bib2<span className="text-muted-foreground">.rjks.us</span>
                    </h1>
                    <span className="text-[10px] font-mono uppercase tracking-widest border border-foreground/20 px-2 py-0.5">
                        Beta
                    </span>
                </div>
                {mounted && (
                    <button
                        onClick={handleThemeToggle}
                        className="p-2 border-2 border-foreground/10 hover:border-foreground/30 bg-secondary transition-all duration-200"
                        aria-label={theme === 'light' ? 'Dark Mode an' : 'Light Mode an'}>
                        {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                    </button>
                )}
            </div>
        </header>
    );
}
