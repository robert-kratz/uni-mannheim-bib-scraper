import { NextPageContext } from 'next';

import db from '../../../utils/db';

import Footer from '@/components/Footer';
import { NextSeo } from 'next-seo';

import { Chart as ChartJS, registerables } from 'chart.js';
import { Line } from 'react-chartjs-2';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import PercentageLabel from '@/components/PercentageLabel';
import BackButton from '@/components/button/BackBtn';
import { GraphBackButton, GraphNextButton } from '@/components/button/NavigationBtn';
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
    day: string;
};

const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
};

export default function Bib({ error, data, day }: Props) {
    if (error) {
        return <div>{error}</div>;
    }

    const router = useRouter();

    const { id } = router.query;

    const colors = ['blue', 'red', 'green', 'purple', 'orange', 'yellow'];

    const [selectedDate, setSelectedDate] = useState(new Date(day));
    const [currentDay, setCurrentDay] = useState(formatDate(new Date(day)));

    const getCurrentPercentage = (name: string) => {
        let copy = structuredClone(data);

        //get last percentage which is not null
        const lastEntry = copy?.data.reverse().find((entry) => entry.percentage !== 0);

        return lastEntry?.percentage;
    };

    const currentPercentage = getCurrentPercentage(data?.name || '') || '0';

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

        setSelectedDate(next);
        setCurrentDay(formatDate(next));
        if (formatDate(next) === formatDate(new Date())) {
            router.push(`/bibs/${id}`);
        } else {
            router.push(`/bibs/${id}?day=${next.toISOString()}`);
        }
    };

    /**
     * Go to the previous day
     */
    const prevDay = () => {
        const prev = new Date(selectedDate);
        prev.setDate(prev.getDate() - 1);
        setSelectedDate(prev);
        setCurrentDay(formatDate(prev));

        router.push(`/bibs/${id}?day=${prev.toISOString()}`);
    };

    let graphData = (bib: any) => {
        //use the percentage until the current time, after that leave empty so the line stops
        let copy = structuredClone(bib);
        let currentData = copy.data.reverse();

        let result = [],
            endReached = false;

        for (let i = 0; i < currentData.length; i++) {
            const element = currentData[i];

            if (element.percentage === 0 && !endReached) continue;

            endReached = true;

            result.push(element.percentage);
        }

        return result.reverse();
    };

    const canvasData = {
        datasets: [
            {
                label: data?.name,
                borderColor: colors[Number(id) || 0],
                pointRadius: 2,
                fill: false,
                lineTension: 0.1,
                data: graphData(data),
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
                    display: true,
                },
                border: {
                    display: true,
                },
                min: 0,
                max: 105,
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
        <main className="min-h-screen w-screen flex justify-center px-2 py-4 md:p-4">
            <NextSeo
                title={data?.name + ' Occupancy'}
                description="Check the occupancy of the University of Mannheim library by Robert Julian Kratz"
                openGraph={{
                    title: 'Uni Mannheim Bib Occupancy',
                    description: 'Check the occupancy of the University of Mannheim library.',
                }}
            />
            <div className="max-w-5xl w-full">
                <div className="flex justify-between items-center px-4">
                    <div className="flex justify-start items-center space-x-4">
                        <BackButton onClick={() => router.push('/')} disabled={false} />
                        <h1 className="text-xl font-semibold text-left">{data?.name}</h1>
                    </div>
                    <div className="w-10 h-10">
                        <PercentageLabel percentage={Number(currentPercentage)} />
                    </div>
                </div>
                <div className="h-[50vh] p-4">
                    <Line id="home" options={options} data={canvasData} />
                </div>
                <div className="flex justify-evenly items-center">
                    <GraphBackButton onClick={prevDay} disabled={false} />
                    <div>
                        <p className="text-center text-md font-light">{currentDay}</p>
                    </div>
                    <GraphNextButton onClick={nextDay} disabled={currentDay === formatDate(new Date())} />
                </div>
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

        const { day } = context.query;

        let selectedDate: Date = new Date();

        try {
            if (day) {
                selectedDate = new Date(day as string);
            }
        } catch (error) {
            console.error(error);
        }

        const data = await db.getDataForGraph(bibName, selectedDate);

        return {
            props: {
                data: {
                    name: bibName,
                    data,
                },
                day: selectedDate.toISOString(),
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
