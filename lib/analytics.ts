// lib/analytics.ts
/**
 * Plausible Analytics Event Tracking
 * Zentrale Stelle für alle Analytics Events
 */

type PlausibleEventProps = {
    [key: string]: string | number | boolean;
};

/**
 * Sendet ein Event an Plausible Analytics
 * @param eventName Name des Events
 * @param props Optionale Properties für das Event
 */
function trackEvent(eventName: string, props?: PlausibleEventProps) {
    if (typeof window === 'undefined') return;

    try {
        if (window.plausible) {
            window.plausible(eventName, { props });
        }
    } catch (error) {
        console.error('Plausible tracking error:', error);
    }
}

/**
 * Analytics Events für die Bibliotheks-App
 */
export const analytics = {
    /**
     * Trackt die Auswahl einer Bibliothek
     */
    trackLibrarySelection: (libraryId: string, libraryName: string) => {
        trackEvent('Library Selected', {
            library_id: libraryId,
            library_name: libraryName,
        });
    },

    /**
     * Trackt das Hinzufügen/Entfernen einer Bibliothek zu Favoriten
     */
    trackFavoriteToggle: (libraryId: string, isFavorite: boolean) => {
        trackEvent('Favorite Toggled', {
            library_id: libraryId,
            action: isFavorite ? 'added' : 'removed',
        });
    },

    /**
     * Trackt das Ein-/Ausblenden von nur Favoriten
     */
    trackShowOnlyFavorites: (enabled: boolean) => {
        trackEvent('Show Only Favorites', {
            enabled: enabled ? 'yes' : 'no',
        });
    },

    /**
     * Trackt das An-/Ausschalten der Vorhersage
     */
    trackPredictionToggle: (enabled: boolean, libraryId?: string) => {
        const props: PlausibleEventProps = {
            enabled: enabled ? 'yes' : 'no',
        };
        if (libraryId) props.library_id = libraryId;

        trackEvent('Prediction Toggle', props);
    },

    /**
     * Trackt Theme-Wechsel
     */
    trackThemeChange: (theme: 'light' | 'dark' | 'system') => {
        trackEvent('Theme Changed', {
            theme,
        });
    },

    /**
     * Trackt Datumswechsel im Kalender
     */
    trackDateChange: (date: string, source: 'calendar' | 'url' | 'navigation') => {
        trackEvent('Date Changed', {
            date,
            source,
        });
    },

    /**
     * Trackt Kalender-Interaktionen
     */
    trackCalendarInteraction: (action: 'open' | 'close' | 'month_change' | 'event_click') => {
        trackEvent('Calendar Interaction', {
            action,
        });
    },

    /**
     * Trackt Kalender Event-Klicks
     */
    trackCalendarEventClick: (eventType: string, eventName: string) => {
        trackEvent('Calendar Event Clicked', {
            event_type: eventType,
            event_name: eventName,
        });
    },

    /**
     * Trackt PWA Installation
     */
    trackPWAInstall: (platform: string = 'unknown') => {
        trackEvent('PWA Installed', {
            platform,
        });
    },

    /**
     * Trackt PWA Installation Prompt
     */
    trackPWAPrompt: (action: 'shown' | 'accepted' | 'dismissed') => {
        trackEvent('PWA Prompt', {
            action,
        });
    },

    /**
     * Trackt PWA Nutzung (wenn als App geöffnet)
     */
    trackPWAUsage: () => {
        if (typeof window === 'undefined') return;

        const isStandalone =
            window.matchMedia('(display-mode: standalone)').matches ||
            // @ts-ignore
            window.navigator.standalone ||
            document.referrer.includes('android-app://');

        if (isStandalone) {
            trackEvent('PWA Used', {
                display_mode: 'standalone',
            });
        }
    },

    /**
     * Trackt Mobile/Desktop Usage
     */
    trackDeviceType: () => {
        if (typeof window === 'undefined') return;

        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
        trackEvent('Device Type', {
            device: isMobile ? 'mobile' : 'desktop',
        });
    },

    /**
     * Trackt Wetter-Widget Interaktion
     */
    trackWeatherInteraction: () => {
        trackEvent('Weather Widget', {
            action: 'viewed',
        });
    },

    /**
     * Trackt Refresh Timer
     */
    trackRefreshTimer: (action: 'auto_refresh' | 'manual_refresh') => {
        trackEvent('Data Refresh', {
            action,
        });
    },
};

/**
 * TypeScript Declaration für window.plausible
 */
declare global {
    interface Window {
        plausible?: (event: string, options?: { props?: PlausibleEventProps }) => void;
    }
}
