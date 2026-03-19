import React from 'react';
import { format, isSameDay } from 'date-fns';
import { de } from 'date-fns/locale';

interface MonthViewProps {
    monthDate: Date;
    days: Date[];
    startDayOfWeek: number;
    selectedDate: Date;
    onSelectDate: (date: Date) => void;
    getDayColor: (date: Date, dayIndex: number, days: Date[]) => string;
}

const MonthView: React.FC<MonthViewProps> = ({
    monthDate,
    days,
    startDayOfWeek,
    selectedDate,
    onSelectDate,
    getDayColor,
}) => {
    return (
        <div className="bg-card border-2 border-foreground/10 p-4">
            <h3 className="text-center font-mono font-bold text-sm uppercase tracking-wide mb-4">{format(monthDate, 'MMMM yyyy', { locale: de })}</h3>

            <div className="grid grid-cols-7 mb-2">
                {['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'].map((day) => (
                    <div key={day} className="text-center font-mono text-[10px] text-muted-foreground font-medium uppercase">
                        {day}
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
                {/* Add empty cells for days before the 1st of the month */}
                {Array.from({ length: (startDayOfWeek + 6) % 7 }).map((_, i) => (
                    <div key={`empty-${i}`} className="h-8"></div>
                ))}

                {days.map((day, index) => {
                    const isSelected = isSameDay(day, selectedDate);
                    const dayColor = getDayColor(day, index, days);

                    return (
                        <button
                            key={format(day, 'yyyy-MM-dd')}
                            onClick={() => onSelectDate(day)}
                            className={`
                                h-8 flex items-center justify-center font-mono text-xs transition-all duration-200 relative
                                ${isSelected ? 'font-bold z-10' : ''}
                              `}>
                            <span
                                className={`
                                    absolute inset-0 ${dayColor}
                                  `}></span>
                            <span
                                className={`
                                    ${isSelected ? 'bg-foreground text-background w-7 h-7 flex items-center justify-center z-20' : 'z-20 relative'}
                                  `}>
                                {format(day, 'd')}
                            </span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

export default MonthView;
