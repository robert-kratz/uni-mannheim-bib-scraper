import React from 'react';
import { SemesterPeriod } from '@/utils/types';
import { isWithinInterval, parseISO } from 'date-fns';

interface SemesterBadgeProps {
    semesterPeriods: SemesterPeriod[];
}

const SemesterBadge: React.FC<SemesterBadgeProps> = ({ semesterPeriods }) => {
    const getCurrentSemester = () => {
        const today = new Date();

        const todayEvents = semesterPeriods.filter((period) => {
            return isWithinInterval(today, {
                start: parseISO(period.start),
                end: parseISO(period.end),
            });
        });

        if (todayEvents.length > 0) {
            const currentEvent = todayEvents[0];
            return currentEvent.name;
        }

        // If no events for today, check for the next event
        const nextEvent = semesterPeriods.find((period) => {
            return isWithinInterval(today, {
                start: parseISO(period.start),
                end: parseISO(period.end),
            });
        });

        if (nextEvent) {
            return nextEvent.name;
        }

        return 'Vorlesungsfreie Zeit';
    };

    return (
        <div className="mb-4">
            <span className="inline-flex items-center font-mono text-[10px] uppercase tracking-widest border-2 border-foreground/10 px-3 py-1.5 font-bold">
                Aktuelles Semester: {getCurrentSemester()}
            </span>
        </div>
    );
};

export default SemesterBadge;
