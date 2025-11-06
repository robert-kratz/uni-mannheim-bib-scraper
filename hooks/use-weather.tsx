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
    initialData: WeatherData[] | null; // ← kann jetzt null sein für client-side loading
    initialDate: string; // e.g. "2025-05-17"
}

export const WeatherProvider: React.FC<WeatherProviderProps> = ({ children, initialData, initialDate }) => {
    const [weatherData, setWeatherData] = useState<WeatherData[]>(initialData || []);
    const [date, setDate] = useState<string>(initialDate);
    const [loading, setLoading] = useState<boolean>(!initialData || initialData.length === 0);

    /* --------------------------- Client-side fetch wenn keine initialData --------------------------- */
    useEffect(() => {
        if (initialData === null || initialData.length === 0) {
            setLoading(true);
            fetch(`/api/weather/${initialDate}`)
                .then((res) => res.json())
                .then((data) => {
                    setWeatherData(data.weather || []);
                    setLoading(false);
                })
                .catch((err) => {
                    console.error('Failed to fetch weather:', err);
                    setLoading(false);
                });
        }
    }, [initialData, initialDate]);

    /* --------------------------- effects --------------------------- */
    // mark initial load as done (nur wenn initialData vorhanden war)
    useEffect(() => {
        if (initialData && initialData.length) setLoading(false);
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
