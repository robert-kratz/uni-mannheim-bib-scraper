const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

const prisma = new PrismaClient();

// Function to calculate the 10-minute chunk
function encodeTo10MinuteChunk(date) {
    const totalMinutes = date.getHours() * 60 + date.getMinutes();
    const additionalTime = date.getSeconds() + date.getMilliseconds() / 1000;
    return Math.round((totalMinutes + additionalTime / 60) / 10);
}

async function migrateData() {
    try {
        // Read the exported data from the JSON file
        const rawData = fs.readFileSync('dataEntries.json', 'utf-8');
        const dataEntries = JSON.parse(rawData);

        for (const entry of dataEntries) {
            const date = new Date(entry.date);
            const year = date.getUTCFullYear();
            const month = date.getUTCMonth() + 1; // Month is 0-indexed
            const day = date.getUTCDate();
            const chunk = encodeTo10MinuteChunk(date);
            const iat = date;

            // Insert the transformed data into the BibData table
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
        }

        console.log('Migration completed successfully!');
    } catch (error) {
        console.error('Error during migration:', error);
    } finally {
        // Disconnect the Prisma client
        await prisma.$disconnect();
    }
}

migrateData();
