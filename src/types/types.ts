// src/types/types.ts

export enum GraphScaling {
    TenMinutes = 'tenMinutes',
    Hourly = 'hourly',
    LastThreeHours = 'lastThreeHours',
    LastSixHours = 'lastSixHours',
}

export interface Scaling {
    name: string;
    label: string;
}

export interface DataPoint {
    label: string;
    [key: string]: number | string;
}

export interface FetchDayData {
    scaling: Scaling[];
    data: DataPoint[];
}

export interface HomePageProps {
    data: FetchDayData;
    avgData: FetchDayData;
    availableEntities: string[];
    currentDate: string;
    prediction: number;
}
