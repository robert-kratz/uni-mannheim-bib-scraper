'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Eye, EyeOff } from 'lucide-react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
    ReferenceLine,
} from 'recharts';
import { addDays, isAfter, parseISO, format, isToday, isSameDay } from 'date-fns';
import { de } from 'date-fns/locale';
import { useRouter } from 'next/navigation';
import { Library, DailyOccupancyData } from '@/utils/types';
import { getDisplayName } from '@/lib/libraryNames';
import { useOccupancy } from '@/hooks/use-occupancy';

const ANIMATION_DURATION = 800;
const MAX_FUTURE_DAYS = 3;

/* ------------------------------------------------------------------ */
/*  Tooltip                                                           */
/* ------------------------------------------------------------------ */
const CustomTooltip = ({ active, payload, label }: any) =>
    active && payload?.length ? (
        <div className="bg-white dark:bg-card p-3 border border-border rounded-lg shadow-md">
            <p className="font-medium text-sm">{label}</p>
            <div className="mt-1.5 space-y-1">
                {payload.map((e: any) => {
                    const base = e.name.replace(/-pred$/, '');
                    const pred = e.name.endsWith('-pred');
                    return (
                        <div key={e.name} className="flex items-center text-sm">
                            <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: e.color }} />
                            <span className="mr-2">
                                {getDisplayName(base)}
                                {pred ? ' (Prognose)' : ''}
                            </span>
                            <span className="font-medium">{e.value}%</span>
                        </div>
                    );
                })}
            </div>
        </div>
    ) : null;

/* ------------------------------------------------------------------ */
/*  Component                                                         */
/* ------------------------------------------------------------------ */
interface Props {
    libraries: Library[];
    favorites: string[];
    showOnlyFavorites: boolean;
}

export default function OccupancyGraph({ libraries, favorites, showOnlyFavorites }: Props) {
    const router = useRouter();
    const { occupancyData: data, date, changeDate, loading } = useOccupancy();

    /* ---------- Toggle for predictions (LocalStorage) ----------- */
    const [showPred, setShowPred] = useState<boolean>(() => {
        if (typeof window === 'undefined') return false;
        const v = localStorage.getItem('showPredictions');
        return v ? JSON.parse(v) : false;
    });
    const [mounted, setMounted] = useState(false);
    useEffect(() => {
        if (typeof window !== 'undefined') localStorage.setItem('showPredictions', JSON.stringify(showPred));
    }, [showPred]);

    useEffect(() => {
        setMounted(true);
    }, []);

    /* ---------- Visible libs (memo) ------------------------------- */
    const visibleLibs = useMemo(
        () => libraries.filter((l) => !showOnlyFavorites || favorites.includes(l.id)),
        [libraries, showOnlyFavorites, favorites]
    );
    const libsKey = visibleLibs
        .map((l) => l.id)
        .sort()
        .join(',');

    /* ---------- Chart data & animation --------------------------- */
    const [chartData, setChartData] = useState<any[]>([]);
    const [chartKey, setChartKey] = useState(0);
    const mountedRef = useRef(false);

    useEffect(() => {
        if (!data) return;
        setChartData(buildRows(data));
        if (mountedRef.current) setChartKey((k) => k + 1);
        else mountedRef.current = true;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [data, libsKey, showPred]);

    const buildRows = (src: DailyOccupancyData) => {
        const first = Object.keys(src.occupancy).find((k) => !k.endsWith('-pred'));
        if (!first) return [];
        const times = src.occupancy[first].map((p) => p.time);

        return times.map((time, idx) => {
            const row: any = { time };
            visibleLibs.forEach((lib) => {
                row[lib.id] = src.occupancy[lib.id]?.[idx]?.occupancy;
                const pred = src.occupancy[`${lib.id}-pred`]?.[idx];
                if (pred?.prediction !== undefined) row[`${lib.id}-pred`] = pred.prediction;
            });
            return row;
        });
    };

    /* ---------- Navigation helpers ------------------------------- */
    const back = () => changeDate(format(addDays(parseISO(date), -1), 'yyyy-MM-dd'));

    const canForward = () => {
        const max = addDays(new Date(), MAX_FUTURE_DAYS);
        return !isAfter(addDays(parseISO(date), 1), max);
    };
    const forward = () => {
        if (canForward()) changeDate(format(addDays(parseISO(date), 1), 'yyyy-MM-dd'));
    };

    const formattedDate = format(parseISO(date), 'EEEE, d. MMMM yyyy', {
        locale: de,
    });

    /* ---------- Short-range date picker --------------------------- */
    const today = new Date();
    const quickDates = Array.from({ length: 7 }, (_, i) => addDays(today, i - 3)).filter(
        (d) => !isAfter(d, addDays(today, MAX_FUTURE_DAYS))
    );

    /* ---------- Render ------------------------------------------- */
    if (!data || !mounted) return null;

    return (
        <div className="w-full mb-8 hidden md:block">
            {/* Controls */}
            <div className="flex justify-end gap-2 mb-4">
                <button
                    onClick={() => setShowPred((v) => !v)}
                    className="text-sm px-3 py-1 rounded-full bg-secondary hover:bg-secondary/80 transition flex items-center gap-1">
                    {showPred ? (
                        <>
                            Prognose ausblenden <EyeOff className="w-4 h-4" />
                        </>
                    ) : (
                        <>
                            Prognose anzeigen <Eye className="w-4 h-4" />
                        </>
                    )}
                </button>
                {!isToday(parseISO(date)) && (
                    <button
                        onClick={() => changeDate(format(today, 'yyyy-MM-dd'))}
                        className="text-sm px-3 py-1 rounded-full bg-accent text-white transition">
                        Zurück zu Heute
                    </button>
                )}
            </div>

            {/* Card */}
            <div className="bg-white dark:bg-card rounded-xl border border-border p-4 shadow-sm">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:justify-between mb-4 gap-2">
                    <h2 className="text-xl font-medium">Bibliotheksauslastung</h2>
                    <div className="flex items-center gap-2">
                        <Nav dir="left" onClick={back} disabled={loading} />
                        <span
                            className="text-sm font-medium px-2 cursor-pointer"
                            onClick={() => router.push('?date=' + date)}>
                            {formattedDate}
                        </span>
                        <Nav dir="right" onClick={forward} disabled={!canForward() || loading} />
                    </div>
                </div>

                {/* Chart */}
                <div className="h-[26rem]">
                    {loading ? (
                        <Spinner />
                    ) : (
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart
                                key={chartKey}
                                data={chartData}
                                margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                                <XAxis dataKey="time" tick={{ fontSize: 10 }} />
                                <YAxis domain={[0, 100]} tickCount={6} unit="%" tick={{ fontSize: 12 }} />
                                {isToday(parseISO(date)) && <ReferenceLine y={80} stroke="red" strokeDasharray="3 3" />}
                                <Tooltip content={<CustomTooltip />} />
                                <Legend
                                    wrapperStyle={{ fontSize: '9px' }}
                                    iconSize={8}
                                    iconType="circle"
                                    verticalAlign="bottom"
                                    height={20}
                                />

                                {visibleLibs.map((lib) => (
                                    <Line
                                        key={lib.id}
                                        type="monotone"
                                        dataKey={lib.id}
                                        name={getDisplayName(lib.name)}
                                        stroke={lib.color}
                                        strokeWidth={2}
                                        dot={false}
                                        activeDot={{ r: 6 }}
                                        animationDuration={ANIMATION_DURATION}
                                        animationEasing="ease-in-out"
                                    />
                                ))}

                                {showPred &&
                                    visibleLibs.map((lib) => (
                                        <Line
                                            key={`${lib.id}-pred`}
                                            type="monotone"
                                            dataKey={`${lib.id}-pred`}
                                            name={`${getDisplayName(lib.name)} (Prognose)`}
                                            stroke={lib.color}
                                            strokeWidth={2}
                                            strokeDasharray="6 4"
                                            dot={false}
                                            activeDot={{ r: 4 }}
                                            animationDuration={ANIMATION_DURATION}
                                            animationEasing="ease-in-out"
                                        />
                                    ))}
                            </LineChart>
                        </ResponsiveContainer>
                    )}
                </div>

                {/* Quick date list */}
                <div className="mt-4 flex justify-center gap-1 sm:gap-2 overflow-x-auto">
                    {quickDates.map((d) => {
                        const iso = format(d, 'yyyy-MM-dd');
                        const isSelected = iso === date;
                        const label = format(d, 'EEE dd.MM', { locale: de }); // Mo 20.05
                        const disabled = isAfter(d, addDays(today, MAX_FUTURE_DAYS));
                        return (
                            <button
                                key={iso}
                                disabled={disabled}
                                onClick={() => changeDate(iso)}
                                className={`text-xs sm:text-sm px-3 py-1 rounded-full whitespace-nowrap transition
                  ${isSelected ? 'bg-accent text-white' : 'bg-secondary/50 hover:bg-secondary'}
                  disabled:opacity-50`}>
                                {label}
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

/* ---------------- helpers ---------------- */
const Spinner = () => (
    <div className="h-full w-full flex items-center justify-center">
        <div className="h-8 w-8 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
    </div>
);

const Nav: React.FC<{
    dir: 'left' | 'right';
    disabled?: boolean;
    onClick: () => void;
}> = ({ dir, disabled, onClick }) => {
    const Icon = dir === 'left' ? ChevronLeft : ChevronRight;
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            aria-label={dir === 'left' ? 'Previous day' : 'Next day'}
            className="p-1.5 rounded-lg bg-secondary/50 hover:bg-secondary disabled:opacity-50 disabled:cursor-not-allowed transition">
            <Icon className="w-5 h-5" />
        </button>
    );
};
