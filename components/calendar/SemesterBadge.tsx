import React from 'react';
import { SemesterPeriod } from '@/utils/types';
import { isWithinInterval, parseISO } from 'date-fns';

interface SemesterBadgeProps {
    semesterPeriods: SemesterPeriod[];
}

const SemesterBadge: React.FC<SemesterBadgeProps> = ({ semesterPeriods }) => {
    const getCurrentSemester = () => {
        const today = new Date();
        const currentSemester = semesterPeriods.find(
            (period) =>
                period.type === 'lecture' &&
                period.name.includes('semester') &&
                isWithinInterval(today, {
                    start: parseISO(period.start),
                    end: parseISO(period.end),
                })
        );

        if (currentSemester) {
            // Extract semester code (e.g., "FFS25" or "HSW25")
            if (currentSemester.name.includes('Frühjahr')) {
                return `FFS${currentSemester.start.substring(2, 4)}`;
            } else if (currentSemester.name.includes('Herbst')) {
                return `HSW${currentSemester.start.substring(2, 4)}`;
            }
            return currentSemester.name;
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
