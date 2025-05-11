import React from 'react';

const EventLegend: React.FC = () => {
    return (
        <div className="flex flex-wrap mb-4 gap-3">
            <div className="flex space-x-2 items-center">
                <div className="w-3 h-3 rounded-full bg-blue-300 dark:bg-blue-700"></div>
                <span className="text-xs sm:text-sm">Vorlesungszeit</span>
            </div>
            <div className="flex space-x-2 items-center">
                <div className="w-3 h-3 rounded-full bg-red-300 dark:bg-red-700"></div>
                <span className="text-xs sm:text-sm">Prüfungsphase</span>
            </div>
            <div className="flex space-x-2 items-center">
                <div className="w-3 h-3 rounded-full bg-green-300 dark:bg-green-700"></div>
                <span className="text-xs sm:text-sm">Feiertage</span>
            </div>
            <div className="flex space-x-2 items-center">
                <div className="w-3 h-3 rounded-full bg-amber-300 dark:bg-amber-700"></div>
                <span className="text-xs sm:text-sm">Semesterpause</span>
            </div>
        </div>
    );
};

export default EventLegend;
