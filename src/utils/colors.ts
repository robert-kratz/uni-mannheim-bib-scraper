export function getColorForName(name: string): string {
    const baseColors = [
        '#4F46E5', // indigo-600
        '#EF4444', // red-500
        '#10B981', // green-500
        '#F59E0B', // yellow-500
        '#8B5CF6', // purple-500
        '#06B6D4', // cyan-500
        '#EC4899', // pink-500
        '#F97316', // orange-500
        '#14B8A6', // teal-500
    ];

    const lighterColors = [
        '#A5B4FC', // indigo-300
        '#FCA5A5', // red-300
        '#6EE7B7', // green-300
        '#FCD34D', // yellow-300
        '#C4B5FD', // purple-300
        '#67E8F9', // cyan-300
        '#F9A8D4', // pink-300
        '#FDBA74', // orange-300
        '#5EEAD4', // teal-300
    ];

    if (name.startsWith('avg_')) {
        const index = parseInt(name.replace('avg_', ''), 10);
        return lighterColors[index % lighterColors.length] || '#D1D5DB'; // default to gray-300
    } else {
        const index = parseInt(name, 10);
        return baseColors[index % baseColors.length] || '#6B7280'; // default to gray-500
    }
}
