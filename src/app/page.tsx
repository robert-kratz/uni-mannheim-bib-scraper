'use server';

import '@mantine/charts/styles.css';
import '@mantine/core/styles.css';

import { fetchDataForDay, getAverageData, getAviableEntities } from '@/actions/data.action';
import HomePage from '@/components/HomePage';

export default async function Home({ searchParams }: { searchParams: { date?: string } }) {
    let params = await searchParams;
    // Retrieve the date from searchParams or default to today's date
    let target = params?.date;

    if (!target || isNaN(new Date(target).getTime())) {
        target = new Date().toISOString();
    }

    // Fetch data for the specified date
    const data = await fetchDataForDay(new Date(target));
    const avgData = await getAverageData(new Date(target));

    if (!data || !avgData) {
        return <div>Error fetching data</div>;
    }

    // Fetch available entities
    const aviailableEntities = await getAviableEntities();

    return <HomePage data={data} availableEntities={aviailableEntities} currentDate={target} avgData={avgData} />;
}
