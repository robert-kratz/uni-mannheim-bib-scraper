// app/api/occupancy/[date]/route.ts
import { NextResponse } from 'next/server';
import { getDailyOccupancy } from '@/lib/occupancy';

export async function GET(_req: Request, { params }: { params: { date: string } }) {
    const { date } = params;

    // Nur Validierung hier, die Business-Logik lebt in getDailyOccupancy()
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return NextResponse.json({ error: 'Datum muss im Format YYYY-MM-DD sein.' }, { status: 400 });
    }

    try {
        const data = await getDailyOccupancy(date, 48, 138);
        return NextResponse.json(data);
    } catch (e: any) {
        console.error('Fehler beim Laden der Occupancy:', e);
        return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 });
    }
}
