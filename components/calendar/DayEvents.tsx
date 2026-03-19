import React from 'react';
import { format, parseISO } from 'date-fns';
import { SemesterPeriod } from '@/utils/types';
import { analytics } from '@/lib/analytics';

interface DayEventsProps {
    selectedDate: Date;
    selectedDayEvents: SemesterPeriod[];
}

const DayEvents: React.FC<DayEventsProps> = ({ selectedDate, selectedDayEvents }) => {
    const handleEventClick = (event: SemesterPeriod) => {
        analytics.trackCalendarEventClick(event.type, event.name);
    };

    return (
        <div className="mt-6 space-y-3">
            <h3 className="font-mono font-bold text-sm uppercase tracking-wide">Ereignisse am {format(selectedDate, 'dd.MM.yyyy')}:</h3>

            {selectedDayEvents.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {selectedDayEvents.map((event, idx) => (
                        <div
                            key={idx}
                            onClick={() => handleEventClick(event)}
                            className={`
                                p-3 border-2 cursor-pointer hover:bg-secondary/30 transition-colors
                                ${event.type === 'lecture' ? 'border-l-4 border-l-blue-500 border-foreground/10' : ''}
                                ${event.type === 'exam' ? 'border-l-4 border-l-red-500 border-foreground/10' : ''}
                                ${event.type === 'holiday' ? 'border-l-4 border-l-green-500 border-foreground/10' : ''}
                                ${event.type === 'break' ? 'border-l-4 border-l-amber-500 border-foreground/10' : ''}
                              `}>
                            <p className="font-mono font-bold text-sm">{event.name}</p>
                            <p className="font-mono text-xs text-muted-foreground mt-1">
                                {format(parseISO(event.start), 'dd.MM.yyyy')} -{' '}
                                {format(parseISO(event.end), 'dd.MM.yyyy')}
                            </p>
                        </div>
                    ))}
                </div>
            ) : (
                <p className="font-mono text-xs text-muted-foreground">Keine Ereignisse an diesem Tag.</p>
            )}
        </div>
    );
};

export default DayEvents;
