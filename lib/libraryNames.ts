// utils/libraryNames.ts
import { Library } from '@/utils/types';

/**
 * Maps internal library IDs/names to display names
 * This keeps the original IDs intact while changing only what's shown to users
 */
export const getDisplayName = (name: string): string => {
    switch (name) {
        case 'Schloss Bibliothek':
        case 'Schloss':
            return 'Ausleihzentrum Schloss';
        case 'BWL Bibliothek':
        case 'BWL':
            return 'Schneckenhof Bibliothek';
        case 'Jura Bibliothek':
        case 'Jura':
            return 'Ehrenhof Bibliothek';
        default:
            return name;
    }
};

/**
 * Apply the display name mapping to a library object
 * Creates a new object with the same properties but with the display name for UI
 */
export const getLibraryWithDisplayName = (library: Library): Library => {
    return {
        ...library,
        name: getDisplayName(library.name),
    };
};

/**
 * Apply the display name mapping to a list of library objects
 */
export const getLibrariesWithDisplayNames = (libraries: Library[]): Library[] => {
    return libraries.map(getLibraryWithDisplayName);
};
