'use client';

import React from 'react';
import { RefreshCw } from 'lucide-react';
import { useOccupancy } from '@/hooks/use-occupancy';

interface RefreshTimerProps {
    className?: string;
}

const cn = (...classes: string[]) => {
    return classes.filter(Boolean).join(' ');
};

export default function RefreshTimer({ className }: RefreshTimerProps) {
    const { nextRefreshIn, refreshData, loading } = useOccupancy();

    // Format the timer display (MM:SS)
    const minutes = Math.floor(nextRefreshIn / 60);
    const seconds = nextRefreshIn % 60;
    const formattedTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

    return (
        <div className={cn('flex items-center gap-2 text-sm text-muted-foreground py-1', className || '')}>
            <span className="font-mono text-xs tracking-wide">Nächste Aktualisierung in {formattedTime}</span>
            <button
                onClick={() => refreshData()}
                disabled={loading}
                className="p-1.5 border border-foreground/10 hover:border-foreground/30 transition-colors"
                aria-label="Daten aktualisieren">
                <RefreshCw
                    className={cn('h-3.5 w-3.5', loading ? 'animate-spin text-muted-foreground' : 'text-muted-foreground')}
                />
            </button>
        </div>
    );
}
