// app/api/cron/predict-library/route.ts
import { NextRequest, NextResponse } from 'next/server';
import dotenv from 'dotenv';
dotenv.config();

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
    return NextResponse.json({ message: 'To be implemented' });
}
