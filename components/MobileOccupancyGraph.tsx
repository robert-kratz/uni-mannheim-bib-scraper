'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { ChevronLeft, ChevronRight, Eye, EyeOff, AlertTriangle } from 'lucide-react';
import {
    ResponsiveContainer,
    LineChart,
    Line,
    CartesianGrid,
    XAxis,
    YAxis,
    Tooltip,
    Legend,
    ReferenceLine,
} from 'recharts';
import { addDays, isAfter, parseISO, format, isToday, isFuture } from 'date-fns';
import { de } from 'date-fns/locale';
import { Library, DailyOccupancyData } from '@/utils/types';
import { useOccupancy } from '@/hooks/use-occupancy';
import { getDisplayName } from '@/lib/libraryNames';

const ANIMATION_DURATION = 800;
const MAX_FUTURE_DAYS = 3;

/* ------------------------------------------------------------------ */
/*  Tooltip (mobile)                                                  */
/* ------------------------------------------------------------------ */
const MobileTooltip = ({ active, payload, label }: any) =>
    active && payload?.length ? (
        <div className="bg-white dark:bg-card p-2 border border-border rounded-lg shadow-md text-xs">
            <p className="font-medium">{label}</p>
            <div className="mt-1 space-y-0.5">
                {payload.map((e: any) => {
                    const base = e.name.replace(/-pred$/, '');
                    const pred = e.name.endsWith('-pred');
                    return (
                        <div key={e.name} className="flex items-center">
                            <div className="w-2 h-2 rounded-full mr-1.5" style={{ backgroundColor: e.color }} />
                            <span className="mr-1.5">
                                {getDisplayName(base)}
                                {pred ? ' (Prognose)' : ''}:
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

export default function MobileOccupancyGraph({ libraries, favorites, showOnlyFavorites }: Props) {
    const { occupancyData: data, date, changeDate, loading } = useOccupancy();

    /* ---------- prediction toggle (LS) ---------------------------- */
    const [showPred, setShowPred] = useState<boolean>(() => {
        if (typeof window === 'undefined') return true;
        const v = localStorage.getItem('showPredictions');
        return v ? JSON.parse(v) : true;
    });
    useEffect(() => {
        localStorage.setItem('showPredictions', JSON.stringify(showPred));
    }, [showPred]);

    /* ---------- visible libs -------------------------------------- */
    const visibleLibs = useMemo(
        () => libraries.filter((l) => !showOnlyFavorites || favorites.includes(l.id)),
        [libraries, showOnlyFavorites, favorites]
    );
    const libsKey = visibleLibs
        .map((l) => l.id)
        .sort()
        .join(',');

    /* ---------- chart data & animation ---------------------------- */
    const [chartData, setChartData] = useState<any[]>([]);
    const [chartKey, setChartKey] = useState(0);
    const initRef = useRef(false);

    useEffect(() => {
        if (!data) return;
        setChartData(toRows(data));
        if (initRef.current) setChartKey((k) => k + 1);
        else initRef.current = true;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [data, libsKey, showPred]);

    const toRows = (src: DailyOccupancyData) => {
        const first = Object.keys(src.occupancy).find((k) => !k.endsWith('-pred'));
        if (!first) return [];
        const times = src.occupancy[first].map((p) => p.time);

        /* Für Mobile nur jede Stunde zeigen → index % 6 === 0 */
        return (
            times
                //.filter((_, i) => i % 2 === 0)
                .map((time, idxH) => {
                    //const absIdx = idxH * 2;
                    const absIdx = idxH;
                    const row: any = { time };
                    visibleLibs.forEach((lib) => {
                        row[lib.id] = src.occupancy[lib.id]?.[absIdx]?.occupancy;
                        const pred = src.occupancy[`${lib.id}-pred`]?.[absIdx];
                        if (pred?.prediction !== undefined) row[`${lib.id}-pred`] = pred.prediction;
                    });
                    return row;
                })
        );
    };

    /* ---------- navigation helpers ------------------------------- */
    const back = () => changeDate(format(addDays(parseISO(date), -1), 'yyyy-MM-dd'));

    const canForward = () => {
        const max = addDays(new Date(), MAX_FUTURE_DAYS);
        return !isAfter(addDays(parseISO(date), 1), max);
    };
    const forward = () => {
        if (canForward()) changeDate(format(addDays(parseISO(date), 1), 'yyyy-MM-dd'));
    };

    /* ---------- quick date list ---------------------------------- */
    const today = new Date();
    const quickDates = Array.from({ length: 7 }, (_, i) => addDays(today, i - 3)).filter(
        (d) => !isAfter(d, addDays(today, MAX_FUTURE_DAYS))
    );

    /* ---------- helpers ------------------------------------------ */
    if (!data) return null;
    const formattedDate = format(parseISO(date), 'EEEE, d. MMM yyyy', {
        locale: de,
    });

    const legendHeight = (amount: number) => {
        const base = showPred ? 2 * amount : amount;

        if (base <= 1) return 20;
        if (base <= 3) return 30;
        if (base <= 5) return 40;
        if (base <= 7) return 50;
        if (base <= 9) return 60;

        return 70;
    };

    /* ---------- render ------------------------------------------- */
    return (
        <div className="w-full mb-8">
            {/* Controls */}
            <div className="flex justify-end gap-2 mb-4">
                <button
                    onClick={() => setShowPred((v) => !v)}
                    className="text-xs px-2 py-1 rounded-full bg-secondary hover:bg-secondary/80 flex items-center gap-1">
                    {showPred ? (
                        <>
                            Prognose <EyeOff className="w-4 h-4" />
                        </>
                    ) : (
                        <>
                            Prognose <Eye className="w-4 h-4" />
                        </>
                    )}
                </button>
                {!isToday(parseISO(date)) && (
                    <button
                        onClick={() => changeDate(format(today, 'yyyy-MM-dd'))}
                        className="text-xs px-2 py-1 rounded-full bg-accent text-white">
                        Heute
                    </button>
                )}
            </div>

            {/* Header + Nav */}
            <div className="flex justify-center items-center gap-3 mb-3">
                <Nav dir="left" onClick={back} />
                <span className="text-sm">{formattedDate}</span>
                <Nav dir="right" onClick={forward} disabled={!canForward()} />
            </div>

            {/* Chart Card */}
            <div className="bg-white dark:bg-card border border-border rounded-xl p-3 shadow-sm">
                <div className="h-[24rem]">
                    {loading ? (
                        <Spinner />
                    ) : (
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart
                                key={chartKey}
                                data={chartData}
                                margin={{ top: 5, right: 0, left: -10, bottom: 15 }}>
                                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                                <XAxis dataKey="time" tick={{ fontSize: 9 }} />
                                <YAxis domain={[0, 100]} unit="%" tick={{ fontSize: 9 }} tickCount={5} />
                                {isToday(parseISO(date)) && <ReferenceLine y={80} stroke="red" strokeDasharray="3 3" />}
                                <Tooltip content={<MobileTooltip />} />
                                <Legend
                                    wrapperStyle={{ fontSize: '9px' }}
                                    iconSize={8}
                                    iconType="circle"
                                    verticalAlign="bottom"
                                    height={legendHeight(visibleLibs.length)}
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
                                        activeDot={{ r: 4 }}
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
                                            strokeDasharray="5 4"
                                            dot={false}
                                            activeDot={{ r: 3 }}
                                            animationDuration={ANIMATION_DURATION}
                                            animationEasing="ease-in-out"
                                        />
                                    ))}
                            </LineChart>
                        </ResponsiveContainer>
                    )}
                </div>

                {/* quick date chips */}
                <div className="mt-3 flex justify-center gap-1 overflow-x-auto">
                    {quickDates.map((d) => {
                        const iso = format(d, 'yyyy-MM-dd');
                        const sel = iso === date;
                        const label = format(d, 'dd.MM', { locale: de });
                        const disabled = isAfter(d, addDays(today, MAX_FUTURE_DAYS));
                        return (
                            <button
                                key={iso}
                                disabled={disabled}
                                onClick={() => changeDate(iso)}
                                className={`text-xs px-2 py-1 rounded-full whitespace-nowrap transition
                  ${sel ? 'bg-accent text-white' : 'bg-secondary/50 hover:bg-secondary'}
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

/* ------------------------------------------------------------------ */
/*  helpers                                                           */
/* ------------------------------------------------------------------ */
const Spinner = () => (
    <div className="h-full w-full flex items-center justify-center">
        <div className="h-7 w-7 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
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
            className="p-1.5 rounded-lg bg-secondary/50 hover:bg-secondary disabled:opacity-50">
            <Icon className="w-4 h-4" />
        </button>
    );
};
