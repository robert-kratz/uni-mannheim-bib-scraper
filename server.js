const express = require('express');
const next = require('next');
const cron = require('node-cron');
const { PrismaClient } = require('@prisma/client'); // Import the PrismaClient class

const scraper = require('./utils/scraper');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

const url = 'https://www.bib.uni-mannheim.de/standorte/freie-sitzplaetze/';

const prisma = new PrismaClient(); // Create an instance of PrismaClient

app.prepare().then(() => {
    const server = express();

    console.log('Running a task every 5 minutes');

    // Schedule your tasks every 5 minutes
    cron.schedule('0,10,20,30,40,50 * * * *', async () => {
        console.log('Fetching and saving data from the website');
        try {
            const data = await scraper(url);

            for (let i = 0; i < data.length; i++) {
                const element = data[i];

                await prisma.dataEntry.create({
                    // Make sure to use the correct model name
                    data: {
                        date: element.time,
                        name: element.name,
                        percentage: element.percentage,
                    },
                });
            }
        } catch (error) {
            console.error('Failed to fetch or parse HTML:', error);
        }
    });

    server.all('*', (req, res) => {
        return handle(req, res);
    });

    server.listen(3000, (err) => {
        if (err) throw err;
        console.log('> Ready on http://localhost:3000');
    });
});
