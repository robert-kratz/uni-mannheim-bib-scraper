import Link from 'next/link';

import prisma from '../../prismaClient';
import db from '../../utils/db';

import Footer from '@/components/Footer';
import { NextSeo } from 'next-seo';

import { Chart as ChartJS, registerables } from 'chart.js';
import { Line } from 'react-chartjs-2';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { NextPageContext } from 'next';
import PercentageLabel from '@/components/PercentageLabel';
import { GraphBackButton, GraphNextButton } from '@/components/button/NavigationBtn';
ChartJS.register(...registerables);

type Props = {
    bibs: {
        name: string;
        data: {
            time: string;
            percentage: number;
        }[];
    }[];
    day: string;
};

const classNames = (...classes: string[]) => {
    return classes.filter(Boolean).join(' ');
};

const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
};

export default function Home({ bibs, day }: Props) {
    const router = useRouter();

    const [selectedDate, setSelectedDate] = useState(new Date(day));
    const [currentDay, setCurrentDay] = useState(formatDate(new Date(day)));
    const [avgPercentage, setAvgPercentage] = useState(0);

    const colors = ['blue', 'red', 'green', 'purple', 'orange', 'yellow'];

    const getCurrentPercentage = (name: string) => {
        let copy = structuredClone(bibs);

        //get last percentage which is not null
        const bibExists = copy.find((bib) => bib.name === name);

        if (!bibExists) {
            return 0;
        }

        const lastEntry = bibExists.data.reverse().find((entry) => entry.percentage !== 0);

        return lastEntry?.percentage;
    };

    const getBibAvgPercentage = () => {
        let copy = structuredClone(bibs);

        let total = 0;
        let count = 0;

        for (let i = 0; i < copy.length; i++) {
            const lastEntry = copy[i].data.reverse().find((entry) => entry.percentage !== 0);

            if (lastEntry) {
                total += lastEntry.percentage;
                count++;
            }
        }
        let res = Math.round(total / count);

        return isNaN(res) ? 0 : res;
    };

    useEffect(() => {
        setSelectedDate(new Date(day));
        setCurrentDay(formatDate(new Date(day)));
        setAvgPercentage(getBibAvgPercentage());
    }, [router.query]);

    /**
     * Go to the next day
     */
    const nextDay = () => {
        //check if next day is in the future
        const next = new Date(selectedDate);
        next.setDate(next.getDate() + 1);

        if (next > new Date()) {
            return;
        }

        changeToDay(next);
    };

    /**
     * Go to the previous day
     */
    const prevDay = () => {
        const prev = new Date(selectedDate);
        prev.setDate(prev.getDate() - 1);
        changeToDay(prev);
    };

    /**
     * Change to a specific day
     * @param day Date
     */
    const changeToDay = (day: Date) => {
        setSelectedDate(day);
        setCurrentDay(formatDate(day));
        if (formatDate(day) === formatDate(new Date())) {
            router.push(`/`);
        } else {
            router.push(`/?day=${day.toISOString()}`);
        }
    };

    const canvasData = {
        datasets: bibs?.map((bib, index) => ({
            label: bib?.name || 'Unknown',
            borderColor: colors[index],
            pointRadius: 0,
            fill: false,
            lineTension: 0.1,
            data: bib?.data?.map((entry) => entry.percentage),
            borderWidth: 2,
        })),
    };

    const options = {
        scales: {
            x: {
                category: 'time',
                grid: {
                    display: true,
                },
                labels: bibs[0]?.data?.map((entry) => entry.time),
                ticks: {
                    color: 'black',
                },
            },
            y: {
                grid: {
                    display: false,
                },
                border: {
                    display: true,
                },
                min: 0,
                max: 100,
                ticks: {
                    stepSize: 5,
                    color: 'black',
                },
            },
        },
        maintainAspectRatio: false,
        responsive: true,
        plugins: {
            legend: {
                display: false,
            },
            title: {
                display: false,
            },
        },
        tooltips: {
            mode: 'index',
            intersect: true,
        },
    };

    useEffect(() => {
        //refresh data every 5 minutes
        const interval = setInterval(() => {
            router.replace(router.asPath);
        }, 300000);

        return () => clearInterval(interval);
    }, []);

    return (
        <main className="min-h-screen w-screen flex justify-center px-2 py-4 md:p-4">
            <NextSeo
                title="Uni Mannheim Bib Occupancy by Robert Julian Kratz"
                description="Check the occupancy of the University of Mannheim library."
                openGraph={{
                    title: 'Uni Mannheim Bib Occupancy',
                    description: 'Check the occupancy of the University of Mannheim library.',
                }}
            />
            <div className="max-w-5xl w-full">
                <div>
                    <div className="flex justify-between items-center px-4">
                        <div className="flex justify-start items-center space-x-4">
                            <h1 className="text-xl font-semibold text-left">Uni Mannheim Bib Occupancy</h1>
                        </div>
                        <div className="w-10 h-10">
                            <PercentageLabel percentage={avgPercentage} />
                        </div>
                    </div>
                    <p className="text-left text-sm font-light px-4">
                        This graph shows the occupancy of the University of Mannheim library for the selected day.
                    </p>
                </div>
                <div className="h-[50vh] p-4">
                    <Line options={options} data={canvasData} />
                </div>
                <div className="flex justify-evenly items-center">
                    <GraphBackButton onClick={prevDay} disabled={false} />
                    <div>
                        <p className="text-center text-md font-light">{currentDay}</p>
                    </div>
                    <GraphNextButton onClick={nextDay} disabled={currentDay === formatDate(new Date())} />
                </div>
                {currentDay === formatDate(new Date()) && (
                    <div className="flex flex-col justify-start items-center divide-y py-4">
                        {bibs.map((bib, index) => {
                            const percentage = getCurrentPercentage(bib.name) || 0;

                            return (
                                <div key={index} className="p-4 w-full flex justify-start items-center space-x-4">
                                    <div className="w-10 h-10">
                                        <PercentageLabel percentage={percentage} />
                                    </div>
                                    <Link
                                        href={`/bibs/${index}`}
                                        className="text-left font-medium hover:underline transition">
                                        {bib.name}
                                    </Link>
                                </div>
                            );
                        })}
                    </div>
                )}
                <Footer />
            </div>
        </main>
    );
}

export async function getServerSideProps(context: NextPageContext) {
    const bibs = await prisma.dataEntry.findMany({
        select: {
            name: true,
            id: true,
        },
        distinct: ['name'],
    });

    const { day } = context.query;

    let selectedDate: Date = new Date();

    try {
        if (day) {
            selectedDate = new Date(day as string);
        }
    } catch (error) {
        console.error(error);
    }

    let dataSets = [];

    for (let i = 0; i < bibs.length; i++) {
        const data = await db.getDataForGraph(bibs[i].name, selectedDate);

        dataSets.push({
            name: bibs[i].name,
            data: data,
        });
    }

    return {
        props: {
            bibs: dataSets,
            day: selectedDate.toISOString(),
        },
    };
}
