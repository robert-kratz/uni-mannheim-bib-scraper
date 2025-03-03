'use server';

import '@mantine/charts/styles.css';
import '@mantine/core/styles.css';

import * as tf from '@tensorflow/tfjs';

import { fetchDataForDay, getAverageData, getAviableEntities } from '@/actions/data.action';
import { predict } from '@/actions/model.action';
import HomePage from '@/components/HomePage';

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

    const inputData = dataLastWeek.data.flatMap((item) =>
        Object.values(item).filter((value) => typeof value === 'number')
    );
    const prediction = await predict(inputData);

    return (
        <HomePage
            data={data}
            availableEntities={aviailableEntities}
            currentDate={target}
            avgData={avgData}
            prediction={prediction}
        />
    );
}
