import cron from 'node-cron';

const BASE_URL = `http://localhost:${process.env.PORT || 3000}`;

async function callCronEndpoint(path: string) {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
        console.error(`[cron] API_KEY not set, skipping ${path}`);
        return;
    }

    try {
        const res = await fetch(`${BASE_URL}${path}`, {
            headers: { 'x-api-key': apiKey },
        });
        await res.json();
    } catch (err) {
        console.error(`[cron] ${path} failed:`, err);
    }
}

let started = false;

export function startCronJobs() {
    if (started) return;
    started = true;

    // Every 3 minutes: scrape library occupancy
    cron.schedule('*/3 * * * *', () => callCronEndpoint('/api/cron/scrape-library'));

    // Every 3 minutes: generate predictions
    cron.schedule('*/3 * * * *', () => callCronEndpoint('/api/cron/predict-library'));

    // Once per day at 03:00: scrape semester calendar
    cron.schedule('0 3 * * *', () => callCronEndpoint('/api/cron/scrape-calendar'));

    // Run all jobs once immediately on startup
    callCronEndpoint('/api/cron/scrape-library');
    callCronEndpoint('/api/cron/predict-library');
    callCronEndpoint('/api/cron/scrape-calendar');
}
