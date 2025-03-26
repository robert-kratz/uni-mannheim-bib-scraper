import { useState, useRef, useEffect } from 'react';
import { format, parseISO, addMonths, startOfMonth, endOfMonth, eachDayOfInterval, getDay } from 'date-fns';
import { SemesterPeriod } from '@/utils/types';
import { useIsMobile } from '@/hooks/use-mobile';

// Import sub-components
import CalendarHeader from './calendar/CalendarHeader';
import EventLegend from './calendar/EventLegend';
import SemesterBadge from './calendar/SemesterBadge';
import MonthView from './calendar/MonthView';
import DayEvents from './calendar/DayEvents';
import NextEventCountdown from './calendar/NextEventCountdown';

// Import utility functions
import { getPeriodsForDay, getDayColor, getNextEventCountdown } from './calendar/utils/calendarHelpers';

interface CalendarProps {
    semesterPeriods: SemesterPeriod[];
    selectedDate: Date;
    onSelectDate: (date: Date) => void;
}

const Calendar = ({ semesterPeriods, selectedDate, onSelectDate }: CalendarProps) => {
    const [currentMonth, setCurrentMonth] = useState(startOfMonth(selectedDate));
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const isMobile = useIsMobile();

    // Navigate to previous/next month
    const navigateMonth = (direction: 'prev' | 'next') => {
        setCurrentMonth(addMonths(currentMonth, direction === 'prev' ? -1 : 1));
    };

    // Generate calendar data for 12 months (current + 11 future months)
    const calendarMonths = Array.from({ length: 12 }, (_, i) => {
        const monthDate = addMonths(currentMonth, i);
        const monthStart = startOfMonth(monthDate);
        const monthEnd = endOfMonth(monthDate);
        const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

        // Calculate the day of week of the first day (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
        const startDayOfWeek = getDay(monthStart);

        // Create array of all days in the month
        return {
            monthDate,
            days,
            startDayOfWeek,
        };
    });

    // Generate day color helper that uses the utility function
    const generateDayColor = (date: Date, dayIndex: number, days: Date[]) => {
        return getDayColor(date, dayIndex, days, semesterPeriods);
    };

    // Scroll to current month on component mount
    useEffect(() => {
        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollLeft = 0;
        }
    }, [currentMonth]);

    // Get selected day events
    const selectedDayEvents = getPeriodsForDay(selectedDate, semesterPeriods);

    // Get next important event countdown
    const nextEvent = getNextEventCountdown(semesterPeriods);

    return (
        <div className="w-full mb-8 animate-slideIn">
            <CalendarHeader currentMonth={currentMonth} navigateMonth={navigateMonth} />

            <EventLegend />

            <SemesterBadge semesterPeriods={semesterPeriods} />

            <div
                ref={scrollContainerRef}
                className="w-full overflow-x-auto pb-4 snap-x snap-mandatory"
                style={{ scrollbarWidth: 'none' }}>
                <div className="flex space-x-6 min-w-max">
                    {calendarMonths.map(({ monthDate, days, startDayOfWeek }) => (
                        <div
                            key={format(monthDate, 'yyyy-MM')}
                            className={`flex-shrink-0 ${isMobile ? 'w-64' : 'w-80'} snap-start`}>
                            <MonthView
                                monthDate={monthDate}
                                days={days}
                                startDayOfWeek={startDayOfWeek}
                                selectedDate={selectedDate}
                                onSelectDate={onSelectDate}
                                getDayColor={generateDayColor}
                            />
                        </div>
                    ))}
                </div>
            </div>

            <DayEvents selectedDate={selectedDate} selectedDayEvents={selectedDayEvents} />

            <NextEventCountdown nextEvent={nextEvent} />
        </div>
    );
};

export default Calendar;
