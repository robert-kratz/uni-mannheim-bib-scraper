const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

const prisma = new PrismaClient();

async function exportData() {
    try {
        // Fetch all data from the DataEntry table
        const dataEntries = await prisma.dataEntry.findMany();

        // Convert the data to JSON format
        const jsonData = JSON.stringify(dataEntries, null, 2);

        // Write the JSON data to a file
        fs.writeFileSync('dataEntries.json', jsonData);

        console.log('Data successfully exported to dataEntries.json');
    } catch (error) {
        console.error('Error exporting data:', error);
    } finally {
        // Disconnect the Prisma client
        await prisma.$disconnect();
    }
}

exportData();
