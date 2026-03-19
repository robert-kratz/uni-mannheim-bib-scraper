import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

interface CalendarHeaderProps {
    currentMonth: Date;
    navigateMonth: (direction: 'prev' | 'next') => void;
}

const CalendarHeader: React.FC<CalendarHeaderProps> = ({ currentMonth, navigateMonth }) => {
    return (
        <div className="flex justify-between sm:flex-row sm:items-center sm:justify-between mb-4 gap-2">
            <h2 className="text-lg font-mono font-bold uppercase tracking-wide">Kalender</h2>

            <div className="flex items-center space-x-2">
                <button
                    onClick={() => navigateMonth('prev')}
                    className="p-1.5 border border-foreground/10 hover:border-foreground/30 transition-all duration-200"
                    aria-label="Previous month">
                    <ChevronLeft className="w-4 h-4" />
                </button>

                <span className="font-mono text-xs font-medium px-2">{format(currentMonth, 'MMMM yyyy', { locale: de })}</span>

                <button
                    onClick={() => navigateMonth('next')}
                    className="p-1.5 border border-foreground/10 hover:border-foreground/30 transition-all duration-200"
                    aria-label="Next month">
                    <ChevronRight className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
};

export default CalendarHeader;
