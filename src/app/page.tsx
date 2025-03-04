'use server';

import '@mantine/charts/styles.css';
import '@mantine/core/styles.css';

import * as tf from '@tensorflow/tfjs';

import { fetchDataForDay, getAverageData, getAviableEntities } from '@/actions/data.action';
import HomePage from '@/components/HomePage';

// Predefined one-hot encodings for libraries
const libraryEncodings: { [key: string]: number[] } = {
    'Ausleihzentrum Schloss Westflügel': [1, 0, 0, 0, 0],
    'Bibliotheks­bereich A3': [0, 1, 0, 0, 0],
    'Bibliotheks­bereich A5': [0, 0, 1, 0, 0],
    'Bibliotheks­bereich Schloss Ehrenhof': [0, 0, 0, 1, 0],
    'Bibliotheks­bereich Schloss Schneckenhof': [0, 0, 0, 0, 1],
};

export default async function Home({ searchParams }: { searchParams: Promise<{ date?: string }> }) {
    let params = await searchParams;
    // Retrieve the date from searchParams or default to today's date
    let target = params?.date;

    if (!target || isNaN(new Date(target).getTime())) {
        target = new Date().toISOString();
    }

    // Calculate the date for yesterday
    const lastWeek = new Date(target);
    lastWeek.setDate(lastWeek.getDate() - 7);

    // Fetch data for the specified date and one week ago
    const data = await fetchDataForDay(new Date(target));
    const dataLastWeek = await fetchDataForDay(lastWeek);
    const avgData = await getAverageData(new Date(target));

    if (!data || !avgData) {
        return <div>Error fetching data</div>;
    }

    // Fetch available entities
    const aviailableEntities = await getAviableEntities();

    // Use the predict function to get the model prediction
    if (!dataLastWeek) {
        return <div>Error fetching data for last week</div>;
    }

    return (
        <HomePage
            data={data}
            availableEntities={aviailableEntities}
            currentDate={target}
            avgData={avgData}
            //prediction={prediction}
        />
    );
}
