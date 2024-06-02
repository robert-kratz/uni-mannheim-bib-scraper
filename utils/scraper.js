const axios = require('axios');
const cheerio = require('cheerio');

/**
 * Fetches and parses HTML from a given URL to extract data entries.
 * @param {string} url The URL from which to fetch HTML.
 * @returns {Promise<Array>} A promise that resolves to an array of data entries.
 */
async function fetchAndParseHTML(url) {
    try {
        // Fetch the HTML from the URL using Axios
        const response = await axios.get(url);
        const html = response.data;

        // Load HTML into Cheerio
        const $ = cheerio.load(html);

        // Find the relevant data from the HTML (assuming static content for the sake of example)
        const data = $('.available-seats-table tbody tr')
            .map((i, elem) => {
                let percentageText =
                    $(elem).find('.available-seats-table-status span').text().trim() || 'Keine Arbeitsplätze vorhanden';
                const name = $(elem).find('td:nth-child(2) h4 a').text().trim();
                let percentage = 0;

                // Parse percentage if it includes a '%' sign
                if (percentageText.includes('%')) {
                    percentage = parseInt(percentageText.replace('%', ''), 10);
                }
                const date = new Date();

                //date is two hours behind
                date.setHours(date.getHours() + 2);

                return {
                    time: date.toISOString(),
                    percentage,
                    name,
                };
            })
            .get(); // Convert Cheerio object to an array

        return data;
    } catch (error) {
        console.error('Failed to fetch or parse HTML:', error);
        return [];
    }
}

module.exports = fetchAndParseHTML;
