// app/api/cron/predict-libary/route.ts
import { NextRequest, NextResponse } from 'next/server';
import dotenv from 'dotenv';
dotenv.config();

export async function GET(req: NextRequest) {
    return NextResponse.json({ message: 'To be implemented' });
}
