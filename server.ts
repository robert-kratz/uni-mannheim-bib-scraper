import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import cron from 'node-cron';
import { PrismaClient } from '@prisma/client';
import { fetchAndParseHTML } from './src/utils/scraper';
import { loadModel, predict } from './tensorflow/model';

const port = parseInt(process.env.PORT || '3000', 10);
const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

const url = 'https://www.bib.uni-mannheim.de/standorte/freie-sitzplaetze/';
const prisma = new PrismaClient();

app.prepare().then(() => {
    const server = createServer((req, res) => {
        const parsedUrl = parse(req.url!, true);
        handle(req, res, parsedUrl);
    });

    server.listen(port, () => {
        console.info(`> Server listening at http://localhost:${port} as ${dev ? 'development' : process.env.NODE_ENV}`);
    });

    // Schedule the scraper task
    scheduleScraperTask();
    schedulePredictionTask();

    /**
     * // Load the model
    const model = await loadModel();

    const prediction = await predict(model, inputData, inputLibrary);
     */
});

const schedulePredictionTask = () => {
    console.log('Running a prediction task every 24 hours');

    cron.schedule('0 0 * * *', async () => {
        const start = Date.now();

        console.info('Running prediction task');
        try {
            //const dataLastWeek = await fetchDataForDay(lastWeek);

            //const inputData = dataLastWeek.data.flatMap((item) =>
            //    Object.values(item).filter((value) => typeof value === 'number')
            //);

            // Convert library names to their one-hot encoded vectors
            //EDIT
            //const inputLibrary = data.data.flatMap((item) => libraryEncodings[item.library]);

            //for every distinct library, add a one-hot encoded vector
            // const inputLibrary = data.data.flatMap((item) => {
            //     const library = item.library;
            //     return Object.keys(libraryEncodings).map((key) => (key === library ? 1 : 0));
            // });

            // Load the model
            //const model = await loadModel();

            //const prediction = await predict(model, inputData, inputLibrary);

            const end = Date.now();
            console.info(`Prediction task completed in ${end - start}ms for ${new Date().toISOString()}`);
        } catch (error) {
            console.error('Failed to run prediction task:', error);
        }
    });
};

/**
 * Schedules the scraper task to run every 10 minutes
 */
const scheduleScraperTask = () => {
    console.info('Running a task every 10 minutes');

    cron.schedule('0,10,20,30,40,50 * * * *', async () => {
        const start = Date.now();

        console.info('Fetching and saving data from the website');
        try {
            await scrapeData();

            const end = Date.now();
            console.info(`Data fetched and saved in ${end - start}ms for ${new Date().toISOString()}`);
        } catch (error) {
            console.error('Failed to fetch or save data:', error);
        }
    });
};

/**
 * Scrapes data and saves it into the BibData table in the database
 */
const scrapeData = async () => {
    const data = await fetchAndParseHTML(url);

    for (const entry of data) {
        try {
            const date = new Date(entry.time);
            const year = date.getUTCFullYear();
            const month = date.getUTCMonth() + 1; // Month is 0-indexed
            const day = date.getUTCDate();
            const chunk = encodeTo10MinuteChunk(date);
            const iat = date;

            await prisma.bibData.create({
                data: {
                    percentage: entry.percentage,
                    name: entry.name,
                    year: year,
                    month: month,
                    day: day,
                    chunk: chunk,
                    iat: iat,
                },
            });
        } catch (error) {
            console.info(`Failed to save entry: ${entry.name}`, error);
        }
    }
};

/**
 * Encodes the timestamp into a 10-minute chunk
 * @param {Date} date
 * @returns {number}
 */
const encodeTo10MinuteChunk = (date: Date): number => {
    const totalMinutes = date.getHours() * 60 + date.getMinutes();
    const additionalTime = date.getSeconds() + date.getMilliseconds() / 1000;
    return Math.round((totalMinutes + additionalTime / 60) / 10);
};
