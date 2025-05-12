// app/page.tsx  (oder wo auch immer Deine Root-Page liegt)
import IndexPage from '@/components/pages/IndexPage';
import { DailyOccupancyData } from '@/utils/types';
import { getDailyOccupancy } from '@/lib/occupancy';

export default async function DailyOccupancyPage({ searchParams }: { searchParams: Promise<{ date?: string }> }) {
    // date als queryParam lesen
    const date = (await searchParams).date ?? new Date().toISOString().split('T')[0];
    console.log('Date:', date);
    const data: DailyOccupancyData = await getDailyOccupancy(date, 48, 138);

    console.log('Data:', data);

    return <IndexPage occupancyData={[data]} />;
}
