'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { DailyOccupancyData } from '@/utils/types';

interface OccupancyContextType {
    occupancyData: DailyOccupancyData;
    date: string;
    loading: boolean;
    nextRefreshIn: number;
    refreshData: () => Promise<void>;
    changeDate: (newDate: string) => Promise<void>;
}

const REFRESH_INTERVAL = 180; // 2 minutes in seconds

const OccupancyContext = createContext<OccupancyContextType | undefined>(undefined);

interface OccupancyProviderProps {
    children: ReactNode;
    initialData: DailyOccupancyData;
    initialDate: string;
}

export const OccupancyProvider: React.FC<OccupancyProviderProps> = ({ children, initialData, initialDate }) => {
    const [occupancyData, setOccupancyData] = useState<DailyOccupancyData>(initialData);
    const [date, setDate] = useState<string>(initialDate);
    const [loading, setLoading] = useState<boolean>(true);
    const [nextRefreshIn, setNextRefreshIn] = useState<number>(REFRESH_INTERVAL); // 2 minutes in seconds

    const fetchOccupancyData = useCallback(async (dateToFetch: string) => {
        const start = new Date();
        try {
            setLoading(true);
            const response = await fetch(`/api/bib/${dateToFetch}`);

            if (!response.ok) {
                throw new Error('Failed to fetch occupancy data');
            }

            const data = await response.json();
            setOccupancyData(data);
            return data;
        } catch (error) {
            console.error('Error fetching occupancy data:', error);
            return null;
        } finally {
            //check if load has been doen in less then 200ms, if yes, make sure to wait 200ms
            const end = new Date();
            const loadTime = end.getTime() - start.getTime();
            if (loadTime < 200) {
                await new Promise((resolve) => setTimeout(resolve, 200 - loadTime));
            }

            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (occupancyData) setLoading(false);
    }, []);

    // Function to manually refresh data
    const refreshData = useCallback(async () => {
        await fetchOccupancyData(date);
        setNextRefreshIn(REFRESH_INTERVAL); // Reset countdown timer
    }, [fetchOccupancyData, date]);

    // Function to change date and fetch data for that date
    const changeDate = useCallback(
        async (newDate: string) => {
            if (newDate !== date) {
                setDate(newDate);
                console.log('Changing date to:', newDate);
                await fetchOccupancyData(newDate);
                setNextRefreshIn(REFRESH_INTERVAL); // Reset countdown timer
            }
        },
        [fetchOccupancyData, date]
    );

    // Setup countdown timer
    useEffect(() => {
        const timer = setInterval(() => {
            setNextRefreshIn((prev) => {
                if (prev <= 1) {
                    // When countdown reaches 0, refresh data and reset timer
                    refreshData();
                    return REFRESH_INTERVAL;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [refreshData]);

    // Auto-refresh data every 2 minutes
    useEffect(() => {
        const autoRefreshTimer = setInterval(() => {
            refreshData();
        }, REFRESH_INTERVAL * 1000);

        return () => clearInterval(autoRefreshTimer);
    }, [refreshData]);

    const value = {
        occupancyData,
        date,
        loading,
        nextRefreshIn,
        refreshData,
        changeDate,
    };

    return <OccupancyContext.Provider value={value}>{children}</OccupancyContext.Provider>;
};

export const useOccupancy = (): OccupancyContextType => {
    const context = useContext(OccupancyContext);

    if (context === undefined) {
        throw new Error('useOccupancy must be used within an OccupancyProvider');
    }

    return context;
};
