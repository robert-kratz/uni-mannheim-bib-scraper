'use server';

import prisma from '@/utils/db';
import logger from '@/utils/logger';
import { BibData } from '@prisma/client';

const CHUNK_START = 48,
    CHUNK_END = 139;

/**
 * Fetches data for a specific day and returns it in the required FetchDayData format.
 * @param {Date} date - The date for which to fetch the data.
 * @returns {Promise<FetchDayData | null>} - Returns the formatted data.
 */
export async function fetchDataForDay(date: Date): Promise<FetchDayData | null> {
    try {
        // Start and end of the day in UTC
        const startOfDay = new Date(date);
        startOfDay.setUTCHours(0, 0, 0, 0);
        const endOfDay = new Date(date);
        endOfDay.setUTCHours(23, 59, 59, 999);

        // Fetch data from the BibData table for the given date range
        const data: Array<BibData> = await prisma.bibData.findMany({
            where: {
                iat: {
                    gte: startOfDay,
                    lte: endOfDay,
                },
            },
            orderBy: {
                chunk: 'asc',
            },
        });

        // Create the scaling array by extracting unique names and assigning indexes
        const uniqueNames = Array.from(new Set(data.map((item) => item.name)));
        const scaling: Scaling[] = uniqueNames.map((name, index) => ({
            name: String(index),
            label: name,
        }));

        // Create a map from name to index for easy lookup
        const nameToIndexMap = new Map<string, string>();
        uniqueNames.forEach((name, index) => {
            nameToIndexMap.set(name, String(index));
        });

        // Initialize a dataMap with 144 entries for each 10-minute interval
        const dataMap = new Map<string, Data>();
        for (let i = 0; i < 144; i++) {
            const label = `${String(Math.floor(i / 6)).padStart(2, '0')}:${String((i % 6) * 10).padStart(2, '0')}`;
            dataMap.set(label, { label });
        }

        // Populate dataMap with actual data
        data.forEach((item) => {
            const label = `${String(Math.floor(item.chunk / 6)).padStart(2, '0')}:${String(
                (item.chunk % 6) * 10
            ).padStart(2, '0')}`;
            const entry = dataMap.get(label);

            if (entry) {
                const index = nameToIndexMap.get(item.name);
                if (index !== undefined) {
                    entry[index] = Math.round(item.percentage);
                }
            }
        });

        // Convert the dataMap to an array and filter out labels with no data points
        const groupedData: Data[] = Array.from(dataMap.values()).map((entry) => {
            const hasData = Object.keys(entry).some((key) => key !== 'label');
            return hasData ? entry : { label: entry.label };
        });

        // Return the FetchDayData object with a full set of labels but no future data points
        return {
            scaling,
            data: groupedData.slice(CHUNK_START, CHUNK_END),
        };
    } catch (error) {
        logger.error('Error fetching data:', error);
        throw error;
    }
}

export async function getAviableEntities(): Promise<Array<string>> {
    try {
        const data = await prisma.bibData.findMany({
            distinct: ['name'],
            select: {
                name: true,
            },
        });

        return data.map((item) => item.name);
    } catch (error) {
        logger.error('Error fetching data:', error);
        throw error;
    }
}

export async function getAverageData(date: Date): Promise<FetchDayData | null> {
    try {
        // First, fetch the data for the target date to get the scaling
        const currentData = await fetchDataForDay(date);
        if (!currentData) {
            return null;
        }

        const scaling = currentData.scaling;

        // Map to quickly access index by name
        const nameToIndexMap = new Map<string, string>();
        scaling.forEach((scale) => {
            nameToIndexMap.set(scale.label, scale.name);
        });

        // Get the dates for the same weekday over the last three weeks
        const previousDates: Date[] = [];
        for (let i = 1; i <= 3; i++) {
            const pastDate = new Date(date);
            pastDate.setDate(date.getDate() - i * 7);
            previousDates.push(pastDate);
        }

        // Fetch data for the previous dates
        const pastDataPromises = previousDates.map((pastDate) => fetchDataForSingleDayWithScaling(pastDate, scaling));
        const pastDataResults = await Promise.all(pastDataPromises);

        // Compute the average data
        const avgDataResult = computeAverageDataWithScaling(pastDataResults, scaling);

        return avgDataResult;
    } catch (error) {
        logger.error('Error fetching average data:', error);
        throw error;
    }
}

async function fetchDataForSingleDayWithScaling(date: Date, scaling: Scaling[]): Promise<FetchDayData> {
    // Start and end of the day in UTC
    const startOfDay = new Date(date);
    startOfDay.setUTCHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setUTCHours(23, 59, 59, 999);

    // Fetch data from the BibData table for the given date range
    const data: Array<BibData> = await prisma.bibData.findMany({
        where: {
            iat: {
                gte: startOfDay,
                lte: endOfDay,
            },
        },
        orderBy: {
            chunk: 'asc',
        },
    });

    // Create a map from name to index based on the provided scaling
    const nameToIndexMap = new Map<string, string>();
    scaling.forEach((scale) => {
        nameToIndexMap.set(scale.label, scale.name);
    });

    // Initialize a dataMap with entries for each 10-minute interval
    const dataMap = new Map<string, Data>();
    for (let i = 0; i < 144; i++) {
        const label = `${String(Math.floor(i / 6)).padStart(2, '0')}:${String((i % 6) * 10).padStart(2, '0')}`;
        dataMap.set(label, { label });
    }

    // Populate dataMap with actual data
    data.forEach((item) => {
        const label = `${String(Math.floor(item.chunk / 6)).padStart(2, '0')}:${String((item.chunk % 6) * 10).padStart(
            2,
            '0'
        )}`;
        const entry = dataMap.get(label);

        if (entry) {
            const index = nameToIndexMap.get(item.name);
            if (index !== undefined) {
                entry[index] = Math.round(item.percentage);
            }
        }
    });

    // Convert the dataMap to an array
    const groupedData: Data[] = Array.from(dataMap.values());

    // Return the FetchDayData object
    return {
        scaling,
        data: groupedData, // Do not slice here
    };
}

function computeAverageDataWithScaling(dataSets: FetchDayData[], scaling: Scaling[]): FetchDayData {
    // Initialize a dataMap with entries for each time label
    const dataMap = new Map<string, Data>();

    for (let i = CHUNK_START; i < CHUNK_END; i++) {
        const label = `${String(Math.floor(i / 6)).padStart(2, '0')}:${String((i % 6) * 10).padStart(2, '0')}`;
        dataMap.set(label, { label });
    }

    // For each time label and index, compute the sum and count
    dataMap.forEach((entry, label) => {
        scaling.forEach((scale) => {
            const index = scale.name;
            let sum = 0;
            let count = 0;

            dataSets.forEach((dataSet) => {
                const dataEntry = dataSet.data.find((d) => d.label === label);
                if (dataEntry && dataEntry[index] !== undefined) {
                    sum += Number(dataEntry[index]);
                    count++;
                }
            });

            if (count > 0) {
                entry[index] = Math.round(sum / count);
            }
        });
    });

    const avgData = Array.from(dataMap.values());

    return {
        scaling,
        data: avgData,
    };
}
