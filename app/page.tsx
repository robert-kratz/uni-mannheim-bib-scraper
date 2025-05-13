// app/page.tsx  (oder wo auch immer Deine Root-Page liegt)
import IndexPage from '@/components/pages/IndexPage';
import { DailyOccupancyData, EventType, SemesterPeriod } from '@/utils/types';
import { getDailyOccupancy } from '@/lib/occupancy';
import { getCalendarEvents } from '@/lib/calendar';
import { OccupancyProvider } from '@/hooks/use-occupancy';

export const metadata = {
    title: 'Uni Mannheim - Bibliotheksbelegung',
    description: 'Live Belegung der Bibliotheken der Universität Mannheim',
};

export default async function DailyOccupancyPage({ searchParams }: { searchParams: Promise<{ date?: string }> }) {
    // date als queryParam lesen
    const date = (await searchParams).date ?? new Date().toISOString().split('T')[0];
    const data: DailyOccupancyData = await getDailyOccupancy(date, 48, 138);

    const calendarEvents = (await getCalendarEvents()) || [];

    const events = calendarEvents.map((event) => ({
        id: Number(event.id),
        name: event.name || '',
        type: event.type as EventType,
        start: event.start ? event.start.toISOString().split('T')[0] : '',
        end: event.end ? event.end.toISOString().split('T')[0] : '',
    }));

    return (
        <OccupancyProvider initialData={data} initialDate={date}>
            <IndexPage semesterPeriods={events} />
        </OccupancyProvider>
    );
}
