import { NextPageContext } from 'next';

import db from '../../../utils/db';

import Footer from '@/component/Footer';
import { NextSeo } from 'next-seo';

import { Chart as ChartJS, registerables } from 'chart.js';
import { Line } from 'react-chartjs-2';
import { useEffect } from 'react';
import { useRouter } from 'next/router';
ChartJS.register(...registerables);

type Props = {
    error?: string;
    data?: {
        name: string;
        data: {
            time: string;
            percentage: number;
        }[];
    };
};

export default function Bib({ error, data }: Props) {
    if (error) {
        return <div>{error}</div>;
    }

    const router = useRouter();

    const getCurrentPercentage = (name: string) => {
        //get last percentage which is not null
        const lastEntry = data?.data.reverse().find((entry) => entry.percentage !== 0);

        return lastEntry?.percentage;
    };

    const canvasData = {
        datasets: [
            {
                label: data?.name,
                borderColor: 'navy',
                pointRadius: 0,
                fill: false,
                lineTension: 0.1,
                data: data?.data?.map((entry) => entry.percentage),
                borderWidth: 2,
            },
        ],
    };

    const options = {
        scales: {
            x: {
                category: 'time',
                grid: {
                    display: true,
                },
                labels: data?.data?.map((entry) => entry.time),
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
                title={data?.name + ' Occupancy'}
                description="Check the occupancy of the University of Mannheim library by Robert Julian Kratz"
                openGraph={{
                    title: 'Uni Mannheim Bib Occupancy',
                    description: 'Check the occupancy of the University of Mannheim library.',
                }}
            />
            <div className="max-w-5xl w-full">
                <h1 className="text-4xl font-bold text-center">{data?.name} Occupancy</h1>
                <div className="h-[50vh] p-4">
                    <Line id="home" options={options} data={canvasData} />
                </div>
                <p className="text-center text-md">
                    Current occupancy: {getCurrentPercentage(data?.name || '') || '0'}%
                </p>
                <Footer />
            </div>
        </main>
    );
}

export async function getServerSideProps(context: NextPageContext) {
    try {
        const { id } = context.query;

        if (!id && isNaN(Number(id))) {
            return {
                props: {
                    error: 'Invalid id',
                },
            };
        }

        const bibData: { [key: string]: string } = {
            '0': 'Ausleihzentrum Schloss Westflügel',
            '1': 'Bibliotheks­bereich A3',
            '2': 'Bibliotheks­bereich A5',
            '3': 'Bibliotheks­bereich Schloss Ehrenhof',
            '4': 'Bibliotheks­bereich Schloss Schneckenhof',
        };

        const bibName = bibData[id as string];

        if (!bibName) {
            return {
                props: {
                    error: 'Invalid id',
                },
            };
        }

        const data = await db.getDataForGraph(bibName);

        return {
            props: {
                data: {
                    name: bibName,
                    data,
                },
            },
        };
    } catch (error) {
        return {
            props: {
                error: 'Error retrieving data',
            },
        };
    }
}
