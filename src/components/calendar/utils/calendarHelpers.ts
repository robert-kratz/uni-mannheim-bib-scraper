import { format, parseISO, isWithinInterval } from 'date-fns';
import { SemesterPeriod } from '@/utils/types';

// Find periods for a specific day
export const getPeriodsForDay = (date: Date, semesterPeriods: SemesterPeriod[]) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return semesterPeriods.filter((period) => dateStr >= period.start && dateStr <= period.end);
};

// Get period type for a day based on semester periods with priority
export const getDayPeriodType = (
    date: Date,
    semesterPeriods: SemesterPeriod[]
): { type: string; isStart: boolean; isEnd: boolean } | null => {
    const dateStr = format(date, 'yyyy-MM-dd');

    // Define priority order: holiday (highest) -> break -> exam -> lecture (lowest)
    const priorityOrder = {
        holiday: 0,
        break: 1,
        exam: 2,
        lecture: 3,
    };

    // Collect all applicable periods for this day
    const applicablePeriods = semesterPeriods.filter((period) => dateStr >= period.start && dateStr <= period.end);

    if (applicablePeriods.length === 0) return null;

    // Sort by priority and get the highest priority period
    applicablePeriods.sort(
        (a, b) =>
            priorityOrder[a.type as keyof typeof priorityOrder] - priorityOrder[b.type as keyof typeof priorityOrder]
    );

    const highestPriorityPeriod = applicablePeriods[0];

    return {
        type: highestPriorityPeriod.type,
        isStart: dateStr === highestPriorityPeriod.start,
        isEnd: dateStr === highestPriorityPeriod.end,
    };
};

// Get next important date countdown
export const getNextEventCountdown = (semesterPeriods: SemesterPeriod[]) => {
    const today = new Date();

    // Filter for exam periods that are in the future
    const upcomingExams = semesterPeriods.filter((period) => period.type === 'exam' && parseISO(period.start) > today);

    if (upcomingExams.length > 0) {
        // Sort by start date to get the closest exam period
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

    // If no exam periods, check for breaks
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

// Get day color for calendar display
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
        case 'lecture':
            colorClass = 'bg-blue-100 dark:bg-blue-900/30';
            break;
        case 'holiday':
            colorClass = 'bg-green-100 dark:bg-green-900/30';
            break;
        case 'break':
            colorClass = 'bg-amber-100 dark:bg-amber-900/30';
            break;
        case 'exam':
            colorClass = 'bg-red-100 dark:bg-red-900/30';
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
