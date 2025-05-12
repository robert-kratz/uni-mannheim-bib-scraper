import { InferSelectModel } from 'drizzle-orm';
import { CalendarEvent } from '@/drizzle/schema';

export interface Library {
    id: string;
    name: string;
    color: string;
}

export interface OccupancyDataPoint {
    time: string; // Format: "HH:MM"
    occupancy: number | null; // 0-100
    prediction?: number; // Optional prediction value (0-100)
}

export interface DailyOccupancyData {
    date: string; // Format: "YYYY-MM-DD"
    occupancy: Record<string, OccupancyDataPoint[]>; // libraryId -> occupancy data
}

export type EventType = 'lecture' | 'exam' | 'holiday' | 'break' | 'event' | 'info';

export interface SemesterPeriod {
    start: string; // Format: "YYYY-MM-DD"
    end: string; // Format: "YYYY-MM-DD"
    type: EventType;
    name: string;
}

export type InferSemesterPeriod = InferSelectModel<typeof CalendarEvent>;

export interface UserPreferences {
    favorites: string[]; // Library IDs
    theme: 'light' | 'dark' | 'system';
}
