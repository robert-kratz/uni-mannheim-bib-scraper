import { PrismaClient } from '@prisma/client';
import { format, subMinutes, addMinutes } from 'date-fns';

const prisma = new PrismaClient();

interface DataPoint {
    time: string;
    percentage: number;
}

async function getDataForGraph(name: string, startOfDay: Date): Promise<DataPoint[]> {
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const dataEntries = await prisma.dataEntry.findMany({
        where: {
            name: name,
            date: {
                gte: startOfDay,
                lte: endOfDay,
            },
        },
        orderBy: {
            date: 'asc',
        },
    });

    const result: DataPoint[] = [];

    for (let hour = 0; hour < 24; hour++) {
        for (let min = 0; min < 60; min += 10) {
            const centerTime = new Date(startOfDay);
            centerTime.setHours(hour, min, 0, 0);
            const timeWindowStart = subMinutes(centerTime, 5);
            const timeWindowEnd = addMinutes(centerTime, 5);

            const relevantEntries = dataEntries.filter(
                (entry: any) => entry.date >= timeWindowStart && entry.date <= timeWindowEnd
            );

            let averagePercentage = 0;
            if (relevantEntries.length > 0) {
                averagePercentage =
                    relevantEntries.reduce((sum: any, current: any) => sum + current.percentage, 0) /
                    relevantEntries.length;
            }

            result.push({
                time: format(centerTime, 'HH:mm'),
                percentage: averagePercentage,
            });
        }
    }

    return result;
}

export default {
    getDataForGraph,
};
