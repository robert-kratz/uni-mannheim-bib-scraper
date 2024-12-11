import React from 'react';

interface DayControlsProps {
    goToNextDay: () => void;
    goToPreviousDay: () => void;
    canGoToNextDay: boolean;
}

const classNames = (...classes: (string | undefined)[]) => classes.filter(Boolean).join(' ');

const DayControls: React.FC<DayControlsProps> = ({ goToNextDay, goToPreviousDay, canGoToNextDay }) => {
    return (
        <div className="flex justify-evenly items-center space-x-4 p-4">
            <button className="bg-blue-500 text-white p-3 rounded" onClick={goToPreviousDay}>
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="size-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
                </svg>
            </button>
            <button
                className={classNames(
                    'text-white p-3 rounded disabled:cursor-not-allowed',
                    canGoToNextDay ? 'bg-blue-500' : 'bg-blue-200'
                )}
                onClick={goToNextDay}
                disabled={!canGoToNextDay}>
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="size-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                </svg>
            </button>
        </div>
    );
};

export default DayControls;
