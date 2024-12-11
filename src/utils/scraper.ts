import axios from 'axios';
import { load } from 'cheerio';
import logger from './logger';

/**
 * Fetches and parses HTML from a given URL to extract data entries.
 * @param {string} url The URL from which to fetch HTML.
 * @returns {Promise<Array<{ time: string; percentage: number; name: string }>>}
 */
export const fetchAndParseHTML = async (url: string): Promise<{ time: string; percentage: number; name: string }[]> => {
    try {
        const response = await axios.get(url);
        const html = response.data;

        const $ = load(html);

        const data = $('.available-seats-table tbody tr')
            .map((i, elem) => {
                const percentageText =
                    $(elem).find('.available-seats-table-status span').text().trim() || 'Keine Arbeitsplätze vorhanden';
                const name = $(elem).find('td:nth-child(2) h4 a').text().trim();
                let percentage = 0;

                if (percentageText.includes('%')) {
                    percentage = parseInt(percentageText.replace('%', ''), 10);
                }
                const date = new Date();

                return {
                    time: date.toISOString(),
                    percentage,
                    name,
                };
            })
            .get();

        return data;
    } catch (error) {
        logger.error('Failed to fetch or parse HTML:', error);
        return [];
    }
};
