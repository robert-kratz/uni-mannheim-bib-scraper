import React from 'react';
import { format, parseISO } from 'date-fns';
import { SemesterPeriod } from '@/utils/types';

interface DayEventsProps {
    selectedDate: Date;
    selectedDayEvents: SemesterPeriod[];
}

const DayEvents: React.FC<DayEventsProps> = ({ selectedDate, selectedDayEvents }) => {
    return (
        <div className="mt-6 space-y-3">
            <h3 className="font-medium">Ereignisse am {format(selectedDate, 'dd.MM.yyyy')}:</h3>

            {selectedDayEvents.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {selectedDayEvents.map((event, idx) => (
                        <div
                            key={idx}
                            className={`
                                p-3 rounded-lg border shadow-sm
                                ${event.type === 'lecture' ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800' : ''}
                                ${event.type === 'exam' ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800' : ''}
                                ${event.type === 'holiday' ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' : ''}
                                ${event.type === 'break' ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800' : ''}
                              `}>
                            <p className="font-medium">{event.name}</p>
                            <p className="text-sm text-muted-foreground">
                                {format(parseISO(event.start), 'dd.MM.yyyy')} -{' '}
                                {format(parseISO(event.end), 'dd.MM.yyyy')}
                            </p>
                        </div>
                    ))}
                </div>
            ) : (
                <p className="text-muted-foreground">Keine Ereignisse an diesem Tag.</p>
            )}
        </div>
    );
};

export default DayEvents;
