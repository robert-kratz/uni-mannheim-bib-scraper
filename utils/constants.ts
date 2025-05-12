import { Library } from '@/utils/types';

export const libraries: Library[] = [
    { id: 'A3', name: 'A3 Bibliothek', color: '#3B82F6' }, // Blue
    { id: 'A5', name: 'A5 Bibliothek', color: '#10B981' }, // Green
    { id: 'Schloss', name: 'Schloss Bibliothek', color: '#F59E0B' }, // Amber
    { id: 'Jura', name: 'Jura Bibliothek', color: '#EC4899' }, // Pink
    { id: 'BWL', name: 'BWL Bibliothek', color: '#8B5CF6' }, // Purple
];

export const ALLOWED_LIBS = new Set(['A3', 'A5', 'Jura', 'Schloss', 'BWL']);
