// app/api/bib/[date]/predict/route.ts
export const runtime = 'nodejs'; // Server–Runtime
export const revalidate = 300; // 5-min ISR

import { NextRequest, NextResponse } from 'next/server';
import { getPrediction } from '@/lib/prediction';

/**
 * GET  /api/bib/[date]/predict
 *
 * Liefert ausschließlich die **Vorhersagewerte** (Ø der letzten 5 Montage) –
 * echte Belegungszahlen sind immer `null`.
 *
 * ▸ Vergangenes Datum → alles `null`
 * ▸ Heute       → Vorhersage ab aktuellem Chunk
 * ▸ Zukunftstag   → Vorhersage für den ganzen Tag
 */
export async function GET(
    _req: NextRequest,
    context: {
        params: Promise<{ date: string }>;
    }
) {
    const { date } = await context.params;

    /* ---------- 1 · Date-Format validieren (YYYY-MM-DD) ---------------- */
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return NextResponse.json({ error: 'Invalid date format – use YYYY-MM-DD' }, { status: 400 });
    }

    /* ---------- 2 · Vorhersagedaten holen ------------------------------ */
    try {
        const data = await getPrediction(date, 48, 138); // 08:00 – 23:00

        // Cache-Control Headers setzen
        const response = NextResponse.json(data, { status: 200 });
        response.headers.set('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');

        return response;
    } catch (err) {
        console.error('getPrediction failed:', err);
        return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
}
