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
                    p-4 border-2
                    ${nextEvent.type === 'exam' ? 'border-l-4 border-l-red-500 border-foreground/10' : ''}
                    ${nextEvent.type === 'break' ? 'border-l-4 border-l-amber-500 border-foreground/10' : ''}
                  `}>
                <p className="font-mono text-sm font-bold uppercase tracking-wide">{nextEvent.name} in:</p>
                <p className="font-mono text-4xl font-bold mt-2">
                    {nextEvent.days} {nextEvent.days === 1 ? 'Tag' : 'Tage'}
                </p>
            </div>
        </div>
    );
};

export default NextEventCountdown;
