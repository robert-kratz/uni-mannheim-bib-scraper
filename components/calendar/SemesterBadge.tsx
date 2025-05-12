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
            console.log('Current Event:', currentEvent);
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
            <span className="inline-flex items-center rounded-md bg-blue-50 dark:bg-blue-900/20 px-2 py-1 text-xs font-medium text-blue-700 dark:text-blue-200 ring-1 ring-inset ring-blue-700/10 dark:ring-blue-500/30">
                Aktuelles Semester: {getCurrentSemester()}
            </span>
        </div>
    );
};

export default SemesterBadge;
