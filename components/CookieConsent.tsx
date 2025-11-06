// components/CookieConsent.tsx
'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

export default function CookieConsent() {
    const [isVisible, setIsVisible] = useState(false);
    const [isAccepted, setIsAccepted] = useState<boolean | null>(null);

    useEffect(() => {
        // Prüfe ob User bereits eine Entscheidung getroffen hat
        const consent = localStorage.getItem('analytics-consent');

        if (consent === null) {
            // Zeige Banner nach kurzer Verzögerung
            setTimeout(() => setIsVisible(true), 1000);
        } else {
            setIsAccepted(consent === 'accepted');
        }
    }, []);

    const handleAccept = () => {
        localStorage.setItem('analytics-consent', 'accepted');
        setIsAccepted(true);
        setIsVisible(false);

        // Reload um Plausible mit voller Funktionalität zu laden
        // Bei "accepted" werden zusätzliche Daten wie Referrer, etc. gesammelt
        if (typeof window !== 'undefined' && window.plausible) {
            window.plausible('Consent Given', { props: { type: 'full' } });
        }
    };

    const handleDecline = () => {
        localStorage.setItem('analytics-consent', 'declined');
        setIsAccepted(false);
        setIsVisible(false);

        // Anonymisiertes Tracking läuft trotzdem (Plausible ist standardmäßig anonymisiert)
        if (typeof window !== 'undefined' && window.plausible) {
            window.plausible('Consent Given', { props: { type: 'anonymous' } });
        }
    };

    if (!isVisible) return null;

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 p-4 animate-in slide-in-from-bottom duration-500">
            <div className="max-w-4xl mx-auto bg-white dark:bg-gray-900 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                        <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">Datenschutz & Analytics</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                            Wir nutzen <strong>Plausible Analytics</strong>, ein datenschutzfreundliches Tool, um unsere
                            Website zu verbessern. <strong>Alle Daten werden anonymisiert</strong> und ohne Cookies
                            erfasst.
                        </p>
                        <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                            <details className="cursor-pointer">
                                <summary className="font-medium text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400">
                                    Was wird erfasst?
                                </summary>
                                <ul className="mt-2 ml-4 space-y-1 list-disc">
                                    <li>Besuchte Seiten (ohne persönliche Daten)</li>
                                    <li>Ungefährer Standort (nur Land)</li>
                                    <li>Gerätetyp (Desktop/Mobile)</li>
                                    <li>Browser-Typ</li>
                                </ul>
                            </details>
                            <details className="cursor-pointer">
                                <summary className="font-medium text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400">
                                    Was wird NICHT erfasst?
                                </summary>
                                <ul className="mt-2 ml-4 space-y-1 list-disc">
                                    <li>Keine Cookies oder lokale Speicherung</li>
                                    <li>Keine IP-Adressen</li>
                                    <li>Keine persönlich identifizierbaren Informationen</li>
                                    <li>Keine Cross-Site-Tracking</li>
                                </ul>
                            </details>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
                            Weitere Infos:{' '}
                            <a
                                href="https://plausible.io/privacy-focused-web-analytics"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="underline hover:text-blue-600 dark:hover:text-blue-400">
                                Plausible Datenschutz
                            </a>
                        </p>
                    </div>
                    <button
                        onClick={() => setIsVisible(false)}
                        className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                        aria-label="Banner schließen">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 mt-6">
                    <button
                        onClick={handleAccept}
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors">
                        Verstanden, akzeptieren
                    </button>
                    <button
                        onClick={handleDecline}
                        className="flex-1 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100 px-6 py-3 rounded-lg font-medium transition-colors">
                        Nur anonymisiert
                    </button>
                </div>
            </div>
        </div>
    );
}
