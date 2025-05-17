'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import type { DailyOccupancyData } from '@/utils/types';

interface OccupancyContextType {
    occupancyData: DailyOccupancyData;
    date: string;
    loading: boolean;
    nextRefreshIn: number;
    refreshData: () => Promise<void>;
    changeDate: (newDate: string) => Promise<void>;
}

const REFRESH_INTERVAL = 180; // sec

/* ------------------------------------------------------------------ */
/*  Context                                                            */
/* ------------------------------------------------------------------ */
const OccupancyContext = createContext<OccupancyContextType | undefined>(undefined);

interface Props {
    children: ReactNode;
    /** Bereits auf dem Server zusammengeführte Live- **UND** Prognosedaten   */
    initialData: DailyOccupancyData;
    initialDate: string;
}

/* ------------------------------------------------------------------ */
/*  Merge-Routine: Live-Datensatz + Prognose-Datensatz                 */
/*  Beide Datenquellen enthalten **verschiedene** Bibliotheks-Keys:    */
/*    • Live  →  "A3", "A5", …                                         */
/*    • Prognose → "A3-pred", …                                        */
/*  Darum reicht ein einfaches Zusammenführen der Objekt-Properties.   */
/* ------------------------------------------------------------------ */
const mergeData = (live: DailyOccupancyData, pred: DailyOccupancyData): DailyOccupancyData => {
    const merged: DailyOccupancyData = { date: live.date, occupancy: {} };

    Object.entries(live.occupancy).forEach(([lib, points]) => (merged.occupancy[lib] = points));
    Object.entries(pred.occupancy).forEach(([lib, points]) => (merged.occupancy[lib + `-pred`] = points));

    return merged;
};

/* ------------------------------------------------------------------ */
/*  Provider                                                           */
/* ------------------------------------------------------------------ */
export const OccupancyProvider: React.FC<Props> = ({ children, initialData, initialDate }) => {
    const [occupancyData, setOccupancyData] = useState<DailyOccupancyData>(initialData);
    const [date, setDate] = useState(initialDate);
    const [loading, setLoading] = useState(true);
    const [nextRefreshIn, setNextRefreshIn] = useState(REFRESH_INTERVAL);

    /* ---------------- Fetch helper (live + prediction parallel) -------- */
    const fetchData = useCallback(async (day: string) => {
        const t0 = performance.now();
        try {
            setLoading(true);

            const [liveResp, predResp] = await Promise.all([
                fetch(`/api/bib/${day}`),
                fetch(`/api/bib/${day}/predict`),
            ]);
            if (!liveResp.ok || !predResp.ok) throw new Error('fetch error');

            const [live, pred]: [DailyOccupancyData, DailyOccupancyData] = await Promise.all([
                liveResp.json(),
                predResp.json(),
            ]);

            const merged = mergeData(live, pred);
            setOccupancyData(merged);
            return merged;
        } catch (err) {
            console.error('Error fetching occupancy / prediction:', err);
            return null;
        } finally {
            const elapsed = performance.now() - t0;
            if (elapsed < 200) await new Promise((r) => setTimeout(r, 200 - elapsed));
            setLoading(false);
        }
    }, []);

    /* first client-side refresh (to make sure cache is fresh) */
    useEffect(() => {
        void fetchData(initialDate);
    }, [fetchData, initialDate]);

    /* manual refresh --------------------------------------------------- */
    const refreshData = useCallback(async () => {
        await fetchData(date);
        setNextRefreshIn(REFRESH_INTERVAL);
    }, [fetchData, date]);

    /* change date ------------------------------------------------------ */
    const changeDate = useCallback(
        async (newDate: string) => {
            if (newDate === date) return;
            setDate(newDate);
            await fetchData(newDate);
            setNextRefreshIn(REFRESH_INTERVAL);
        },
        [fetchData, date]
    );

    /* countdown tick --------------------------------------------------- */
    useEffect(() => {
        const id = setInterval(() => {
            setNextRefreshIn((s) => {
                if (s <= 1) {
                    refreshData();
                    return REFRESH_INTERVAL;
                }
                return s - 1;
            });
        }, 1_000);
        return () => clearInterval(id);
    }, [refreshData]);

    /* auto-refresh ----------------------------------------------------- */
    useEffect(() => {
        const id = setInterval(refreshData, REFRESH_INTERVAL * 1_000);
        return () => clearInterval(id);
    }, [refreshData]);

    /* ------------------------------------------------------------------ */
    const value: OccupancyContextType = {
        occupancyData,
        date,
        loading,
        nextRefreshIn,
        refreshData,
        changeDate,
    };

    return <OccupancyContext.Provider value={value}>{children}</OccupancyContext.Provider>;
};

/* ------------------------------------------------------------------ */
/*  Hook                                                               */
/* ------------------------------------------------------------------ */
export const useOccupancy = (): OccupancyContextType => {
    const ctx = useContext(OccupancyContext);
    if (!ctx) throw new Error('useOccupancy must be used within an OccupancyProvider');
    return ctx;
};
