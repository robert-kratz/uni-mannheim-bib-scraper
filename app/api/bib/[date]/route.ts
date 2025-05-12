// app/api/occupancy/[date]/route.ts
import { NextResponse } from 'next/server';
import { getDailyOccupancy } from '@/lib/occupancy';

export async function GET(_req: Request, { params }: { params: { date: string } }) {
    const { date } = params;

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return NextResponse.json({ error: 'Invalid date format, please use YYYY-MM-DD' }, { status: 400 });
    }

    try {
        const data = await getDailyOccupancy(date);
        return NextResponse.json(data);
    } catch (e: any) {
        console.error('Fehler beim Laden der Occupancy:', e);
        return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
}
