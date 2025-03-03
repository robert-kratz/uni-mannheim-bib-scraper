'use client';

import React, { useState } from 'react';
import { LineChart } from '@mantine/charts';
import DayControls from './DayControls';
import PercentageLabel from './PercentageLabel';
import FavIcon from './FavouriteIcon';
import Footer from './Footer';
import formatDate from '../utils/formatter';
import { useDeviceWidth } from '../hooks/useDeviceWidth';
import { useGraphData } from '../hooks/useGraphData';
import { useDateNavigation } from '../hooks/useDateNavigation';
import { FetchDayData, GraphScaling, HomePageProps } from '@/types/types';

const classNames = (...classes: string[]) => classes.filter(Boolean).join(' ');

const HomePage: React.FC<HomePageProps> = ({ data, avgData, availableEntities, currentDate, prediction }) => {
    const deviceWidth = useDeviceWidth();
    const [graphScaling, setGraphScaling] = useState<GraphScaling>(GraphScaling.TenMinutes);
    const [selectedGraph, setSelectedGraph] = useState<number[]>([]);
    const [showAverageData, setShowAverageData] = useState<boolean>(false);

    const { selectedDate, setSelectedDate, goToNextDay, goToPreviousDay, canGoToNextDay } =
        useDateNavigation(currentDate);

    const { mergedData, series } = useGraphData(data, avgData, graphScaling, selectedGraph, showAverageData);

    // Helper functions
    const addToFavourites = (index: number) => {
        if (!selectedGraph.includes(index)) {
            setSelectedGraph([...selectedGraph, index]);
        }
    };

    const removeFromFavourites = (index: number) => {
        setSelectedGraph(selectedGraph.filter((i) => i !== index));
    };

    const bestTimeToGo = whenToGo(
        avgData,
        selectedGraph.length > 0 ? selectedGraph : availableEntities.map((_, idx) => idx)
    );

    return (
        <div className="flex justify-center items-start min-h-screen w-screen">
            <div className="w-screen md:w-[90vw] md:min-h-[50vh] space-y-6 py-8">
                {/* Header */}
                <div>
                    <h2 className="text-2xl font-bold px-4">{formatDate(new Date(selectedDate), 'en')}</h2>
                    <p className="text-md px-4">
                        This graph shows the occupancy of the University of Mannheim library for the selected day.
                    </p>
                </div>

                {/* Controls */}
                <div
                    className={classNames(
                        'flex items-center w-full',
                        deviceWidth > 768 ? 'justify-between' : 'justify-end'
                    )}>
                    {deviceWidth > 768 && (
                        <DayControls
                            goToNextDay={goToNextDay}
                            goToPreviousDay={goToPreviousDay}
                            canGoToNextDay={!canGoToNextDay}
                        />
                    )}
                    {/* Graph Scaling Buttons */}
                    <div className="flex space-x-4 p-4">
                        {/* <button
className={`${
graphScaling === GraphScaling.TenMinutes ? 'bg-blue-500' : 'bg-blue-400'
} text-white px-4 py-2 rounded`}
                            onClick={() => setGraphScaling(GraphScaling.TenMinutes)}>
                            M
                        </button>
                        <button
                            className={`${
                                graphScaling === GraphScaling.Hourly ? 'bg-blue-500' : 'bg-blue-400'
                            } text-white px-4 py-2 rounded`}
                            onClick={() => setGraphScaling(GraphScaling.Hourly)}>
                            H
                        </button> */}
                        {/* <button
                            className={`${
                                graphScaling === GraphScaling.LastThreeHours ? 'bg-blue-500' : 'bg-blue-400'
                            } text-white px-4 py-2 rounded`}
                            onClick={() => setGraphScaling(GraphScaling.LastThreeHours)}>
                            3h
                        </button>
                        <button
                            className={`${
                                graphScaling === GraphScaling.LastSixHours ? 'bg-blue-500' : 'bg-blue-400'
                            } text-white px-4 py-2 rounded`}
                            onClick={() => setGraphScaling(GraphScaling.LastSixHours)}>
                            6h
                        </button> */}
                        {/* <button
                            className={`${
                                graphScaling === GraphScaling.TenMinutes ? 'bg-blue-500' : 'bg-blue-400'
                            } text-white px-4 py-2 rounded`}
                            onClick={() => setGraphScaling(GraphScaling.TenMinutes)}>
                            M
                        </button>
                        <button
                            className={`${
                                graphScaling === GraphScaling.Hourly ? 'bg-blue-500' : 'bg-blue-400'
                            } text-white px-4 py-2 rounded`}
                            onClick={() => setGraphScaling(GraphScaling.Hourly)}>
                            H
                        </button> */}
                        {/* <button
                            className={`${
                                graphScaling === GraphScaling.LastThreeHours ? 'bg-blue-500' : 'bg-blue-400'
                            } text-white px-4 py-2 rounded`}
                            onClick={() => setGraphScaling(GraphScaling.LastThreeHours)}>
                            3h
                        </button>
                        <button
                            className={`${
                                graphScaling === GraphScaling.LastSixHours ? 'bg-blue-500' : 'bg-blue-400'
                            } text-white px-4 py-2 rounded`}
                            onClick={() => setGraphScaling(GraphScaling.LastSixHours)}>
                            6h
                        </button> */}
                        {/* <button
                            className={`${
                                graphScaling === GraphScaling.TenMinutes ? 'bg-blue-500' : 'bg-blue-400'
                            } text-white px-4 py-2 rounded`}
                            onClick={() => setGraphScaling(GraphScaling.TenMinutes)}>
                            M
                        </button>
                        <button
                            className={`${
                                graphScaling === GraphScaling.Hourly ? 'bg-blue-500' : 'bg-blue-400'
                            } text-white px-4 py-2 rounded`}
                            onClick={() => setGraphScaling(GraphScaling.Hourly)}>
                            H
                        </button> */}
                        {/* <button
                            className={`${
                                graphScaling === GraphScaling.LastThreeHours ? 'bg-blue-500' : 'bg-blue-400'
                            } text-white px-4 py-2 rounded`}
                            onClick={() => setGraphScaling(GraphScaling.LastThreeHours)}>
                            3h
                        </button>
                        <button
                            className={`${
                                graphScaling === GraphScaling.LastSixHours ? 'bg-blue-500' : 'bg-blue-400'
                            } text-white px-4 py-2 rounded`}
                            onClick={() => setGraphScaling(GraphScaling.LastSixHours)}>
                            6h
                        </button> */}
                        {/* <button
                            className={`${
                                graphScaling === GraphScaling.TenMinutes ? 'bg-blue-500' : 'bg-blue-400'
                            } text-white px-4 py-2 rounded`}
                            onClick={() => setGraphScaling(GraphScaling.TenMinutes)}>
                            M
                        </button>
                        <button
                            className={`${
                                graphScaling === GraphScaling.Hourly ? 'bg-blue-500' : 'bg-blue-400'
                            } text-white px-4 py-2 rounded`}
                            onClick={() => setGraphScaling(GraphScaling.Hourly)}>
                            H
                        </button> */}
                        {/* <button
                            className={`${
                                graphScaling === GraphScaling.LastThreeHours ? 'bg-blue-500' : 'bg-blue-400'
                            } text-white px-4 py-2 rounded`}
                            onClick={() => setGraphScaling(GraphScaling.LastThreeHours)}>
                            3h
                        </button>
                        <button
                            className={`${
                                graphScaling === GraphScaling.LastSixHours ? 'bg-blue-500' : 'bg-blue-400'
                            } text-white px-4 py-2 rounded`}
                            onClick={() => setGraphScaling(GraphScaling.LastSixHours)}>
                            6h
                        </button> */}
                        {/* <button
                            className={`${
                                graphScaling === GraphScaling.TenMinutes ? 'bg-blue-500' : 'bg-blue-400'
                            } text-white px-4 py-2 rounded`}
                            onClick={() => setGraphScaling(GraphScaling.TenMinutes)}>
                            M
                        </button>
                        <button
                            className={`${
                                graphScaling === GraphScaling.Hourly ? 'bg-blue-500' : 'bg-blue-400'
                            } text-white px-4 py-2 rounded`}
                            onClick={() => setGraphScaling(GraphScaling.Hourly)}>
                            H
                        </button> */}
                        {/* <button
                            className={`${
                                graphScaling === GraphScaling.LastThreeHours ? 'bg-blue-500' : 'bg-blue-400'
                            } text-white px-4 py-2 rounded`}
                            onClick={() => setGraphScaling(GraphScaling.LastThreeHours)}>
                            3h
                        </button>
                        <button
                            className={`${
                                graphScaling === GraphScaling.LastSixHours ? 'bg-blue-500' : 'bg-blue-400'
                            } text-white px-4 py-2 rounded`}
                            onClick={() => setGraphScaling(GraphScaling.LastSixHours)}>
                            6h
                        </button> */}
                        {/* <button
                            className={`${
                                graphScaling === GraphScaling.TenMinutes ? 'bg-blue-500' : 'bg-blue-400'
                            } text-white px-4 py-2 rounded`}
                            onClick={() => setGraphScaling(GraphScaling.TenMinutes)}>
                            M
                        </button>
                        <button
                            className={`${
                                graphScaling === GraphScaling.Hourly ? 'bg-blue-500' : 'bg-blue-400'
                            } text-white px-4 py-2 rounded`}
                            onClick={() => setGraphScaling(GraphScaling.Hourly)}>
                            H
                        </button> */}
                        {/* <button
                            className={`${
                                graphScaling === GraphScaling.LastThreeHours ? 'bg-blue-500' : 'bg-blue-400'
                            } text-white px-4 py-2 rounded`}
                            onClick={() => setGraphScaling(GraphScaling.LastThreeHours)}>
                            3h
                        </button>
                        <button
                            className={`${
                                graphScaling === GraphScaling.LastSixHours ? 'bg-blue-500' : 'bg-blue-400'
                            } text-white px-4 py-2 rounded`}
                            onClick={() => setGraphScaling(GraphScaling.LastSixHours)}>
                            6h
                        </button> */}
                        {/* <button
                            className={`${
                                graphScaling === GraphScaling.TenMinutes ? 'bg-blue-500' : 'bg-blue-400'
                            } text-white px-4 py-2 rounded`}
                            onClick={() => setGraphScaling(GraphScaling.TenMinutes)}>
                            M
                        </button>
                        <button
                            className={`${
                                graphScaling === GraphScaling.Hourly ? 'bg-blue-500' : 'bg-blue-400'
                            } text-white px-4 py-2 rounded`}
                            onClick={() => setGraphScaling(GraphScaling.Hourly)}>
                            H
                        </button> */}
                        {/* <button
                            className={`${
                                graphScaling === GraphScaling.LastThreeHours ? 'bg-blue-500' : 'bg-blue-400'
                            } text-white px-4 py-2 rounded`}
                            onClick={() => setGraphScaling(GraphScaling.LastThreeHours)}>
                            3h
                        </button>
                        <button
                            className={`${
                                graphScaling === GraphScaling.LastSixHours ? 'bg-blue-500' : 'bg-blue-400'
                            } text-white px-4 py-2 rounded`}
                            onClick={() => setGraphScaling(GraphScaling.LastSixHours)}>
                            6h
                        </button> */}
                        {/* <button
                            className={`${
                                graphScaling === GraphScaling.TenMinutes ? 'bg-blue-500' : 'bg-blue-400'
                            } text-white px-4 py-2 rounded`}
                            onClick={() => setGraphScaling(GraphScaling.TenMinutes)}>
                            M
                        </button>
                        <button
                            className={`${
                                graphScaling === GraphScaling.Hourly ? 'bg-blue-500' : 'bg-blue-400'
                            } text-white px-4 py-2 rounded`}
                            onClick={() => setGraphScaling(GraphScaling.Hourly)}>
                            H
                        </button> */}
                        {/* <button
                            className={`${
                                graphScaling === GraphScaling.LastThreeHours ? 'bg-blue-500' : 'bg-blue-400'
                            } text-white px-4 py-2 rounded`}
                            onClick={() => setGraphScaling(GraphScaling.LastThreeHours)}>
                            3h
                        </button>
                        <button
                            className={`${
                                graphScaling === GraphScaling.LastSixHours ? 'bg-blue-500' : 'bg-blue-400'
                            } text-white px-4 py-2 rounded`}
                            onClick={() => setGraphScaling(GraphScaling.LastSixHours)}>
                            6h
                        </button> */}
                        {/* <button
                            className={`${
                                graphScaling === GraphScaling.TenMinutes ? 'bg-blue-500' : 'bg-blue-400'
                            } text-white px-4 py-2 rounded`}
                            onClick={() => setGraphScaling(GraphScaling.TenMinutes)}>
                            M
                        </button>
                        <button
                            className={`${
                                graphScaling === GraphScaling.Hourly ? 'bg-blue-500' : 'bg-blue-400'
                            } text-white px-4 py-2 rounded`}
                            onClick={() => setGraphScaling(GraphScaling.Hourly)}>
                            H
                        </button> */}
                        {/* <button
                            className={`${
                                graphScaling === GraphScaling.LastThreeHours ? 'bg-blue-500' : 'bg-blue-400'
                            } text-white px-4 py-2 rounded`}
                            onClick={() => setGraphScaling(GraphScaling.LastThreeHours)}>
                            3h
                        </button>
                        <button
                            className={`${
                                graphScaling === GraphScaling.LastSixHours ? 'bg-blue-500' : 'bg-blue-400'
                            } text-white px-4 py-2 rounded`}
                            onClick={() => setGraphScaling(GraphScaling.LastSixHours)}>
                            6h
                        </button> */}
                        {/* <button
                            className={`${
                                graphScaling === GraphScaling.TenMinutes ? 'bg-blue-500' : 'bg-blue-400'
                            } text-white px-4 py-2 rounded`}
                            onClick={() => setGraphScaling(GraphScaling.TenMinutes)}>
                            M
                        </button>
                        <button
                            className={`${
                                graphScaling === GraphScaling.Hourly ? 'bg-blue-500' : 'bg-blue-400'
                            } text-white px-4 py-2 rounded`}
                            onClick={() => setGraphScaling(GraphScaling.Hourly)}>
                            H
                        </button> */}
                        {/* <button
                            className={`${
                                graphScaling === GraphScaling.LastThreeHours ? 'bg-blue-500' : 'bg-blue-400'
                            } text-white px-4 py-2 rounded`}
                            onClick={() => setGraphScaling(GraphScaling.LastThreeHours)}>
                            3h
                        </button>
                        <button
                            className={`${
                                graphScaling === GraphScaling.LastSixHours ? 'bg-blue-500' : 'bg-blue-400'
                            } text-white px-4 py-2 rounded`}
                            onClick={() => setGraphScaling(GraphScaling.LastSixHours)}>
                            6h
                        </button> */}
                        {/* <button
                            className={`${
                                graphScaling === GraphScaling.TenMinutes ? 'bg-blue-500' : 'bg-blue-400'
                            } text-white px-4 py-2 rounded`}
                            onClick={() => setGraphScaling(GraphScaling.TenMinutes)}>
                            M
                        </button>
                        <button
                            className={`${
                                graphScaling === GraphScaling.Hourly ? 'bg-blue-500' : 'bg-blue-400'
                            } text-white px-4 py-2 rounded`}
                            onClick={() => setGraphScaling(GraphScaling.Hourly)}>
                            H
                        </button> */}
                        {/* <button
                            className={`${
                                graphScaling === GraphScaling.LastThreeHours ? 'bg-blue-500' : 'bg-blue-400'
                            } text-white px-4 py-2 rounded`}
                            onClick={() => setGraphScaling(GraphScaling.LastThreeHours)}>
                            3h
                        </button>
                        <button
                            className={`${
                                graphScaling === GraphScaling.LastSixHours ? 'bg-blue-500' : 'bg-blue-400'
                            } text-white px-4 py-2 rounded`}
                            onClick={() => setGraphScaling(GraphScaling.LastSixHours)}>
                            6h
                        </button> */}
                        {/* <button
                            className={`${
                                graphScaling === GraphScaling.TenMinutes ? 'bg-blue-500' : 'bg-blue-400'
                            } text-white px-4 py-2 rounded`}
                            onClick={() => setGraphScaling(GraphScaling.TenMinutes)}>
                            M
                        </button>
                        <button
                            className={`${
                                graphScaling === GraphScaling.Hourly ? 'bg-blue-500' : 'bg-blue-400'
                            } text-white px-4 py-2 rounded`}
                            onClick={() => setGraphScaling(GraphScaling.Hourly)}>
                            H
                        </button> */}
                        {/* <button
                            className={`${
                                graphScaling === GraphScaling.LastThreeHours ? 'bg-blue-500' : 'bg-blue-400'
                            } text-white px-4 py-2 rounded`}
                            onClick={() => setGraphScaling(GraphScaling.LastThreeHours)}>
                            3h
                        </button>
                        <button
                            className={`${
                                graphScaling === GraphScaling.LastSixHours ? 'bg-blue-500' : 'bg-blue-400'
                            } text-white px-4 py-2 rounded`}
                            onClick={() => setGraphScaling(GraphScaling.LastSixHours)}>
                            6h
                        </button> */}
                        <button
                            className={`${
                                showAverageData ? 'bg-orange-500' : 'bg-orange-400'
                            } text-white px-4 py-2 rounded`}
                            onClick={() => setShowAverageData(!showAverageData)}>
                            Avg
                        </button>
                    </div>
                </div>

                {/* Line Chart */}
                <div className={classNames(deviceWidth > 768 ? 'w-full' : 'w-screen', 'pr-4')}>
                    <LineChart
                        h={deviceWidth > 768 ? 400 : 300}
                        data={mergedData?.data ?? []}
                        series={series}
                        dataKey="label"
                        withDots={false}
                        withYAxis
                        curveType="bump"
                        yAxisProps={{ domain: [0, 100] }}
                        valueFormatter={(value) => `${value}%`}
                    />
                </div>

                {/* Prediction Chart */}
                <div className={classNames(deviceWidth > 768 ? 'w-full' : 'w-screen', 'pr-4')}>
                    <LineChart
                        h={deviceWidth > 768 ? 400 : 300}
                        data={[{ label: 'Prediction', value: prediction }]}
                        series={[{ name: 'Prediction' }]}
                        dataKey="label"
                        withDots={true}
                        withYAxis
                        curveType="linear"
                        yAxisProps={{ domain: [0, 100] }}
                        valueFormatter={(value) => `${value}%`}
                    />
                </div>

                {deviceWidth < 768 && (
                    <div className="md:hidden">
                        <DayControls
                            goToNextDay={goToNextDay}
                            goToPreviousDay={goToPreviousDay}
                            canGoToNextDay={!canGoToNextDay}
                        />
                    </div>
                )}

                {/* Library Selection */}
                <div className="space-y-4">
                    <h2 className="text-2xl font-bold px-4">Select your libraries</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 2xl:grid-cols-5 gap-4 px-4">
                        {availableEntities.map((entity, index) => (
                            <div
                                key={index}
                                className={classNames(
                                    'flex items-center justify-between space-x-2 bg-gray-50 hover:bg-gray-100 transition rounded-md cursor-pointer border-2',
                                    selectedGraph.includes(index) ? 'border-indigo-600' : 'border-gray-300'
                                )}
                                onClick={() =>
                                    selectedGraph.includes(index) ? removeFromFavourites(index) : addToFavourites(index)
                                }>
                                <div className={!canGoToNextDay ? 'hidden' : 'block'}>
                                    <PercentageLabel percentage={getLatestOccupancy(index, data)} />
                                </div>
                                <div className="p-4 md:p-3 w-full flex justify-between items-center">
                                    <p className="text-sm">
                                        {entity.replace('Ausleihzentrum ', '').replace('Bibliotheks­bereich ', '')}
                                    </p>
                                    <FavIcon favoured={selectedGraph.includes(index)} onClick={() => {}} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Best Time to Go */}
                {bestTimeToGo ? (
                    <div className="p-4 mx-4 bg-gray-100 transition rounded-md cursor-pointer">
                        <h3 className="text-2xl font-bold">When should I go?</h3>
                        <p className="text-md mt-2">
                            To avoid the crowds, the best time to get a seat is before{' '}
                            <strong>{bestTimeToGo} o'clock.</strong>
                        </p>
                    </div>
                ) : (
                    <div className="p-4 mx-4 bg-gray-100 transition rounded-md cursor-pointer">
                        <h3 className="text-2xl font-bold">When should I go?</h3>
                        <p className="text-md mt-2">
                            Unfortunately, there is no time today when the average occupancy is below 65% for the
                            selected libraries.
                        </p>
                    </div>
                )}

                {/* Footer */}
                <Footer />
            </div>
        </div>
    );
};

export default HomePage;

// Helper Functions

function whenToGo(avgData: FetchDayData, selectedGraph: number[]): string | null {
    const dataToUse = avgData.data;

    for (const item of dataToUse) {
        let total = 0;
        let count = 0;

        selectedGraph.forEach((index) => {
            const key = String(index);
            if (item.hasOwnProperty(key) && typeof item[key] === 'number') {
                total += item[key] as number;
                count++;
            }
        });

        if (count > 0) {
            const average = total / count;

            if (average > 65) {
                return item.label;
            }
        }
    }

    return null;
}

function getLatestOccupancy(index: number, data: FetchDayData): number {
    for (let i = data.data.length - 1; i >= 0; i--) {
        const item = data.data[i];
        if (item[index] !== undefined) {
            return item[index] as number;
        }
    }

    return 0;
}
