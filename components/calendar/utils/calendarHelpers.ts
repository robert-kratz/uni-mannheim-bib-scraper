import { format, parseISO, isWithinInterval } from 'date-fns';
import { SemesterPeriod } from '@/utils/types';

// Find periods for a specific day
export const getPeriodsForDay = (date: Date, semesterPeriods: SemesterPeriod[]) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return semesterPeriods.filter((period) => dateStr >= period.start && dateStr <= period.end);
};

const getPriority = (type: SemesterPeriod['type']): number => {
    switch (type) {
        case 'exam':
            return 0;
        case 'holiday':
            return 1;
        case 'break':
            return 2;
        case 'lecture':
            return 3;
        default:
            return 4;
    }
};

export const getDayPeriodType = (
    date: Date,
    periods: SemesterPeriod[]
): { type: SemesterPeriod['type']; isStart: boolean; isEnd: boolean } | null => {
    const dateStr = format(date, 'yyyy-MM-dd');

    const applicable = periods.filter((p) => p.start <= dateStr && dateStr <= p.end);
    if (applicable.length === 0) return null;

    const top = applicable.reduce((best, cur) => (getPriority(cur.type) < getPriority(best.type) ? cur : best));

    return {
        type: top.type,
        isStart: dateStr === top.start,
        isEnd: dateStr === top.end,
    };
};

export const getNextEventCountdown = (semesterPeriods: SemesterPeriod[]) => {
    const today = new Date();

    const upcomingExams = semesterPeriods.filter((period) => period.type === 'exam' && parseISO(period.start) > today);

    if (upcomingExams.length > 0) {
        upcomingExams.sort((a, b) => parseISO(a.start).getTime() - parseISO(b.start).getTime());

        const nextExam = upcomingExams[0];
        const startDate = parseISO(nextExam.start);
        const diffTime = startDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        return {
            name: nextExam.name,
            type: 'exam',
            days: diffDays,
        };
    }

    const upcomingBreaks = semesterPeriods.filter(
        (period) => period.type === 'break' && parseISO(period.start) > today
    );

    if (upcomingBreaks.length > 0) {
        upcomingBreaks.sort((a, b) => parseISO(a.start).getTime() - parseISO(b.start).getTime());

        const nextBreak = upcomingBreaks[0];
        const startDate = parseISO(nextBreak.start);
        const diffTime = startDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        return {
            name: nextBreak.name,
            type: 'break',
            days: diffDays,
        };
    }

    return null;
};

export const getDayColor = (date: Date, dayIndex: number, days: Date[], semesterPeriods: SemesterPeriod[]) => {
    const periodInfo = getDayPeriodType(date, semesterPeriods);

    if (!periodInfo) return 'bg-transparent';

    const prevDayIndex = dayIndex - 1;
    const nextDayIndex = dayIndex + 1;

    const prevDay = prevDayIndex >= 0 ? getDayPeriodType(days[prevDayIndex], semesterPeriods) : null;
    const nextDay = nextDayIndex < days.length ? getDayPeriodType(days[nextDayIndex], semesterPeriods) : null;

    const hasPrevDaySameType = prevDay && prevDay.type === periodInfo.type;
    const hasNextDaySameType = nextDay && nextDay.type === periodInfo.type;

    // Calculate rounded corners based on position in a series
    let borderRadius = '';

    // First day of week (Monday) - round left side
    if (getDay(date) === 1) {
        borderRadius += ' rounded-l-full';
    }

    // Last day of week (Sunday) - round right side
    if (getDay(date) === 0) {
        borderRadius += ' rounded-r-full';
    }

    // First day in a sequence - round left side
    if (!hasPrevDaySameType && periodInfo.type) {
        borderRadius += ' rounded-l-full';
    }

    // Last day in a sequence - round right side
    if (!hasNextDaySameType && periodInfo.type) {
        borderRadius += ' rounded-r-full';
    }

    // Single day in a sequence - round both sides
    if (!hasPrevDaySameType && !hasNextDaySameType) {
        borderRadius = 'rounded-full';
    }

    let colorClass = '';
    switch (periodInfo.type) {
        case 'exam':
            colorClass = 'bg-red-100 dark:bg-red-900/30';
            break;
        case 'lecture':
            colorClass = 'bg-blue-100 dark:bg-blue-900/30';
            break;
        case 'info':
            colorClass = 'bg-blue-100 dark:bg-blue-900/30';
            break;
        case 'holiday':
            colorClass = 'bg-green-100 dark:bg-green-900/30';
            break;
        case 'break':
            colorClass = 'bg-amber-100 dark:bg-amber-900/30';
            break;
        default:
            colorClass = 'bg-transparent';
    }

    return `${colorClass} ${borderRadius}`;
};

// Get function for determining day display in getDay
export const getDay = (date: Date) => {
    // JS getDay returns 0 for Sunday, but we want Monday as 1, Sunday as 7
    const day = date.getDay();
    return day === 0 ? 7 : day;
};
