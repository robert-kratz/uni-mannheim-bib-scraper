import Link from 'next/link';

import prisma from '../../prismaClient';
import db from '../../utils/db';

import Footer from '@/component/Footer';
import { NextSeo } from 'next-seo';

import { Chart as ChartJS, registerables } from 'chart.js';
import { Line } from 'react-chartjs-2';
import { useEffect } from 'react';
import { useRouter } from 'next/router';
ChartJS.register(...registerables);

type Props = {
    bibs: {
        name: string;
        data: {
            time: string;
            percentage: number;
        }[];
    }[];
};

const classNames = (...classes: string[]) => {
    return classes.filter(Boolean).join(' ');
};

export default function Home({ bibs }: Props) {
    const router = useRouter();

    const colors = ['blue', 'red', 'green', 'purple', 'orange', 'yellow'];

    const getCurrentPercentage = (name: string) => {
        //get last percentage which is not null
        const bibExists = bibs.find((bib) => bib.name === name);

        if (!bibExists) {
            return 0;
        }

        const lastEntry = bibExists.data.reverse().find((entry) => entry.percentage !== 0);

        return lastEntry?.percentage;
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
    };

    useEffect(() => {
        //refresh data every 5 minutes
        const interval = setInterval(() => {
            router.replace(router.asPath);
        }, 300000);

        return () => clearInterval(interval);
    }, []);

    return (
        <main className="min-h-screen w-screen flex justify-center py-4 md:p-4">
            <NextSeo
                title="Uni Mannheim Bib Occupancy by Robert Julian Kratz"
                description="Check the occupancy of the University of Mannheim library."
                openGraph={{
                    title: 'Uni Mannheim Bib Occupancy',
                    description: 'Check the occupancy of the University of Mannheim library.',
                }}
            />
            <div className="max-w-5xl w-full">
                <h1 className="text-4xl font-bold text-center">Uni Mannheim Bib Occupancy</h1>
                <div className="h-[50vh] p-4">
                    <Line id="home" options={options} data={canvasData} />
                </div>
                <div className="flex flex-col justify-start items-center divide-y">
                    {bibs.map((bib, index) => {
                        const percentage = getCurrentPercentage(bib.name) || 0;

                        let color = 'bg-green-500';

                        if (percentage > 50) {
                            color = 'bg-yellow-500';
                        }

                        if (percentage > 75) {
                            color = 'bg-red-500';
                        }

                        return (
                            <div key={index} className="p-4 w-full flex justify-start items-center space-x-4">
                                <div>
                                    <div
                                        className={classNames(
                                            'w-10 h-10 rounded-full flex justify-center items-center',
                                            color
                                        )}>
                                        <p className="text-white text-xs">{percentage}%</p>
                                    </div>
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
                <Footer />
            </div>
        </main>
    );
}

export async function getServerSideProps() {
    const bibs = await prisma.dataEntry.findMany({
        select: {
            name: true,
            id: true,
        },
        distinct: ['name'],
    });

    let dataSets = [];

    for (let i = 0; i < bibs.length; i++) {
        const data = await db.getDataForGraph(bibs[i].name);

        dataSets.push({
            name: bibs[i].name,
            data: data,
        });
    }

    return {
        props: {
            bibs: dataSets,
        },
    };
}
