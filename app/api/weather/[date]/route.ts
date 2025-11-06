// app/api/weather/[date]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getWeather } from '@/lib/weather';

/**
 * GET /api/weather/[date]
 * Returns weather forecast data for the specified date
 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ date: string }> }) {
    try {
        const { date } = await params;

        // Validate date format
        if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
            return NextResponse.json({ error: 'Invalid date format. Use YYYY-MM-DD' }, { status: 400 });
        }

        const weather = await getWeather(date);

        return NextResponse.json(
            {
                date,
                weather,
            },
            {
                headers: {
                    'Cache-Control': 'public, s-maxage=1800, stale-while-revalidate=3600',
                },
            }
        );
    } catch (error: any) {
        console.error('Weather API error:', error);
        return NextResponse.json({ error: 'Failed to fetch weather data', details: error.message }, { status: 500 });
    }
}
