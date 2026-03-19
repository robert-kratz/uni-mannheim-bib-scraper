import { Library } from '@/utils/types';

export const libraries: Library[] = [
    { id: 'A3', name: 'A3 Bibliothek', color: '#2563EB' }, // Blue (strong)
    { id: 'A5', name: 'A5 Bibliothek', color: '#059669' }, // Green (deep)
    { id: 'Schloss', name: 'Schloss Bibliothek', color: '#D97706' }, // Amber (deep)
    { id: 'Jura', name: 'Jura Bibliothek', color: '#DB2777' }, // Pink (deep)
    { id: 'BWL', name: 'BWL Bibliothek', color: '#7C3AED' }, // Purple (deep)
];

export const ALLOWED_LIBS = new Set(['A3', 'A5', 'Jura', 'Schloss', 'BWL']);
