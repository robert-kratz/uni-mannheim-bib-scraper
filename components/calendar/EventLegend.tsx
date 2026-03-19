import React from 'react';

const EventLegend: React.FC = () => {
    return (
        <div className="flex flex-wrap mb-4 gap-3">
            <div className="flex space-x-2 items-center">
                <div className="w-3 h-3 bg-blue-500 dark:bg-blue-600"></div>
                <span className="font-mono text-[10px] uppercase tracking-wider">Vorlesungszeit</span>
            </div>
            <div className="flex space-x-2 items-center">
                <div className="w-3 h-3 bg-red-500 dark:bg-red-600"></div>
                <span className="font-mono text-[10px] uppercase tracking-wider">Prüfungsphase</span>
            </div>
            <div className="flex space-x-2 items-center">
                <div className="w-3 h-3 bg-green-500 dark:bg-green-600"></div>
                <span className="font-mono text-[10px] uppercase tracking-wider">Feiertage</span>
            </div>
            <div className="flex space-x-2 items-center">
                <div className="w-3 h-3 bg-amber-500 dark:bg-amber-600"></div>
                <span className="font-mono text-[10px] uppercase tracking-wider">Semesterpause</span>
            </div>
        </div>
    );
};

export default EventLegend;
