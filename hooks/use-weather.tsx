'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import type { WeatherData } from '@/lib/weather';

/* ------------------------------------------------------------------ */
/*  Public context contract                                            */
/* ------------------------------------------------------------------ */
interface WeatherContextType {
    weatherData: WeatherData[];
    date: string; // ISO-YYYY-MM-DD (local, Europe/Berlin)
    loading: boolean;
}

/* ------------------------------------------------------------------ */
/*  Config                                                             */
/* ------------------------------------------------------------------ */
const REFRESH_INTERVAL = 60 * 30; // 30 min in seconds

const WeatherContext = createContext<WeatherContextType | undefined>(undefined);

/* ------------------------------------------------------------------ */
/*  Provider                                                           */
/* ------------------------------------------------------------------ */
interface WeatherProviderProps {
    children: ReactNode;
    initialData: WeatherData[]; // ← comes from your page-level loader
    initialDate: string; // e.g. "2025-05-17"
}

export const WeatherProvider: React.FC<WeatherProviderProps> = ({ children, initialData, initialDate }) => {
    const [weatherData, setWeatherData] = useState<WeatherData[]>(initialData);
    const [date, setDate] = useState<string>(initialDate);
    const [loading, setLoading] = useState<boolean>(true);

    /* --------------------------- effects --------------------------- */
    // mark initial load as done
    useEffect(() => {
        if (initialData.length) setLoading(false);
    }, [initialData]);

    /* --------------------------- context value --------------------------- */
    const value: WeatherContextType = {
        weatherData,
        date,
        loading,
    };

    return <WeatherContext.Provider value={value}>{children}</WeatherContext.Provider>;
};

/* ------------------------------------------------------------------ */
/*  Hook                                                               */
/* ------------------------------------------------------------------ */
export const useWeather = (): WeatherContextType => {
    const ctx = useContext(WeatherContext);
    if (!ctx) {
        throw new Error('useWeather must be used within a WeatherProvider');
    }
    return ctx;
};
