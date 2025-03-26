export interface Library {
    id: string;
    name: string;
    color: string;
}

export interface OccupancyDataPoint {
    time: string; // Format: "HH:MM"
    occupancy: number; // 0-100
    prediction?: number; // Optional prediction value (0-100)
}

export interface DailyOccupancyData {
    date: string; // Format: "YYYY-MM-DD"
    occupancy: Record<string, OccupancyDataPoint[]>; // libraryId -> occupancy data
}

export interface SemesterPeriod {
    start: string; // Format: "YYYY-MM-DD"
    end: string; // Format: "YYYY-MM-DD"
    type: 'lecture' | 'exam' | 'holiday' | 'break';
    name: string;
}

export interface UserPreferences {
    favorites: string[]; // Library IDs
    theme: 'light' | 'dark' | 'system';
}
