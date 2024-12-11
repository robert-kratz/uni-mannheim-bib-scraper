import React from 'react';

const classNames = (...classes: string[]) => classes.filter(Boolean).join(' ');

export default function PercentageLabel({ percentage }: { percentage: number }) {
    const getColorClass = (percentage: number) => {
        if (percentage > 75) return 'bg-red-500';
        if (percentage > 50) return 'bg-yellow-500';
        return 'bg-green-500';
    };

    const colorClass = getColorClass(percentage);

    return (
        <div className={classNames('h-full flex justify-center items-center rounded-l-[4px] p-4 w-20', colorClass)}>
            <p className="text-white text-sm font-bold">{percentage}%</p>
        </div>
    );
}
