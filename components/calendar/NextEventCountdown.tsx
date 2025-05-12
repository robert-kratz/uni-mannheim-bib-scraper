import React from 'react';

interface NextEventCountdownProps {
    nextEvent: {
        name: string;
        type: string;
        days: number;
    } | null;
}

const NextEventCountdown: React.FC<NextEventCountdownProps> = ({ nextEvent }) => {
    if (!nextEvent) return null;

    return (
        <div className="mt-6">
            <div
                className={`
                    p-4 rounded-lg border shadow-sm
                    ${nextEvent.type === 'exam' ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800' : ''}
                    ${nextEvent.type === 'break' ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800' : ''}
                  `}>
                <p className="text-lg font-semibold">{nextEvent.name} in:</p>
                <p className="text-3xl font-bold mt-2">
                    {nextEvent.days} {nextEvent.days === 1 ? 'Tag' : 'Tage'}
                </p>
            </div>
        </div>
    );
};

export default NextEventCountdown;
