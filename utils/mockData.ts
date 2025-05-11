import { Library, DailyOccupancyData, SemesterPeriod } from './types';

export const libraries: Library[] = [
    { id: 'bib-a3', name: 'A3 Bibliothek', color: '#3B82F6' }, // Blue
    { id: 'bib-a5', name: 'A5 Bibliothek', color: '#10B981' }, // Green
    { id: 'bib-schloss', name: 'Schloss Bibliothek', color: '#F59E0B' }, // Amber
    { id: 'bib-jura', name: 'Jura Bibliothek', color: '#EC4899' }, // Pink
    { id: 'bib-bwl', name: 'BWL Bibliothek', color: '#8B5CF6' }, // Purple
];

function generateDailyData(date: string, dayOffset: number = 0): DailyOccupancyData {
    const occupancy: Record<string, any> = {};

    libraries.forEach((library) => {
        const dataPoints = [];
        for (let hour = 8; hour <= 23; hour++) {
            for (let minute = 0; minute < 60; minute += 10) {
                const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;

                let baseOccupancy = 0;
                if (hour < 10) baseOccupancy = 20 + hour * 3;
                else if (hour < 14) baseOccupancy = 50 + (hour - 10) * 5;
                else if (hour < 18) baseOccupancy = 70 - (hour - 14) * 2;
                else if (hour < 22) baseOccupancy = 40 - (hour - 18) * 5;
                else baseOccupancy = 15;

                const libraryFactor = parseInt(library.id.slice(-1), 36) % 5;
                const dayFactor = dayOffset % 7;

                let occupancyValue = baseOccupancy + libraryFactor * 5 + dayFactor * 3;
                occupancyValue += Math.random() * 10 - 5;
                occupancyValue = Math.max(0, Math.min(100, occupancyValue));
                const predictionValue = occupancyValue + (Math.random() * 15 - 7.5);

                dataPoints.push({
                    time: timeString,
                    occupancy: Math.round(occupancyValue),
                    prediction: Math.round(Math.max(0, Math.min(100, predictionValue))),
                });
            }
        }

        occupancy[library.id] = dataPoints;
    });

    return {
        date,
        occupancy,
    };
}

export const generateMockData = (): DailyOccupancyData[] => {
    const today = new Date();
    const data: DailyOccupancyData[] = [];

    for (let i = -3; i <= 3; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() + i);
        const dateString = date.toISOString().split('T')[0];
        data.push(generateDailyData(dateString, i));
    }

    return data;
};

export const occupancyData = generateMockData();

export const semesterPeriods: SemesterPeriod[] = [
    // Spring Semester 2025
    {
        start: '2025-05-31',
        end: '2025-06-14',
        type: 'exam',
        name: 'Prüfungsphase',
    },
    {
        start: '2025-08-23',
        end: '2025-08-30',
        type: 'exam',
        name: 'Zweittermin Prüfungen',
    },
    {
        start: '2025-02-01',
        end: '2025-07-31',
        type: 'lecture',
        name: 'Frühjahrssemester 2025',
    },
    {
        start: '2025-02-10',
        end: '2025-05-30',
        type: 'lecture',
        name: 'Vorlesungszeit (Frühjahr 2025)',
    },
    {
        start: '2025-04-14',
        end: '2025-04-25',
        type: 'holiday',
        name: 'Osterferien',
    },

    // Fall Semester 2025
    {
        start: '2025-12-08',
        end: '2025-12-20',
        type: 'exam',
        name: 'Prüfungsphase',
    },
    {
        start: '2026-01-31',
        end: '2026-02-07',
        type: 'exam',
        name: 'Zweittermin Prüfungen',
    },
    {
        start: '2025-08-01',
        end: '2026-01-31',
        type: 'lecture',
        name: 'Herbstsemester 2025',
    },
    {
        start: '2025-09-01',
        end: '2025-12-05',
        type: 'lecture',
        name: 'Klausurphase (Herbst 2025)',
    },
    {
        start: '2025-01-01',
        end: '2025-12-12',
        type: 'lecture',
        name: 'Vorlesungszeit (Herbst 2025)',
    },

    // Registration periods
    {
        start: '2024-10-15',
        end: '2024-12-02',
        type: 'info',
        name: 'Rückmeldung Frühjahrssemester',
    },
    {
        start: '2025-05-01',
        end: '2025-06-16',
        type: 'info',
        name: 'Rückmeldung Herbstsemester',
    },
];
