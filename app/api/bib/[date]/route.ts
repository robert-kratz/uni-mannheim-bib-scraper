// app/api/bib/[date]/route.ts
export const runtime = 'nodejs';
export const revalidate = 300; // Cache for 5 minutes

import { NextRequest, NextResponse } from 'next/server';
import { getDailyOccupancy } from '@/lib/occupancy';

export async function GET(
    req: NextRequest,
    context: {
        params: Promise<{ date: string }>;
    }
) {
    const { date } = await context.params;

    // 1) Format-Validation
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return NextResponse.json({ error: 'Invalid date format – use YYYY-MM-DD' }, { status: 400 });
    }

    // 2) Daten holen
    try {
        const data = await getDailyOccupancy(date, 48, 138);

        // 3) Cache-Control Headers setzen
        const response = NextResponse.json(data);
        response.headers.set('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');

        return response;
    } catch (err) {
        console.error('getDailyOccupancy failed:', err);
        return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
}
