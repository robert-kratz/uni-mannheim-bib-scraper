/**
 * Formats the given date to a string.
 * @param date - The date to format.
 * @param language - The language to use for formatting.
 * @returns {string} - The formatted date.
 */
export default function formatDate(date: Date, language: 'de' | 'en'): string {
    const dayOfWeek = date.toLocaleDateString(language, { weekday: 'long' });
    const day = date.getDate();
    const month = date.toLocaleDateString(language, { month: 'long' });
    const monthShort = date.toLocaleDateString(language, { month: 'short' });
    const year = date.getFullYear();

    if (language === 'de') {
        return `${dayOfWeek}, ${day}. ${month} ${year}`;
    } else if (language === 'en') {
        const dayWithSuffix = day + getDaySuffix(day);
        return `${dayOfWeek}, ${monthShort}. ${dayWithSuffix}, ${year}`;
    } else {
        throw new Error('Unsupported language');
    }
}

/**
 * Returns the suffix for the given day.
 * @param day - The day for which to get the suffix.
 * @returns {string} - The suffix for the given day.
 */
function getDaySuffix(day: number): string {
    if (day >= 11 && day <= 13) return 'th';
    switch (day % 10) {
        case 1:
            return 'st';
        case 2:
            return 'nd';
        case 3:
            return 'rd';
        default:
            return 'th';
    }
}
