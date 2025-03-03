"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchAndParseHTML = void 0;
const axios_1 = __importDefault(require("axios"));
const cheerio_1 = require("cheerio");
const logger_1 = __importDefault(require("./logger"));
/**
 * Fetches and parses HTML from a given URL to extract data entries.
 * @param {string} url The URL from which to fetch HTML.
 * @returns {Promise<Array<{ time: string; percentage: number; name: string }>>}
 */
const fetchAndParseHTML = async (url) => {
    try {
        const response = await axios_1.default.get(url);
        const html = response.data;
        const $ = (0, cheerio_1.load)(html);
        const data = $('.available-seats-table tbody tr')
            .map((i, elem) => {
            const percentageText = $(elem).find('.available-seats-table-status span').text().trim() || 'Keine Arbeitsplätze vorhanden';
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
    }
    catch (error) {
        logger_1.default.error('Failed to fetch or parse HTML:', error);
        return [];
    }
};
exports.fetchAndParseHTML = fetchAndParseHTML;
