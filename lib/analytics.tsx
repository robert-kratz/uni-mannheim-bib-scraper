"use client";

import React, { createContext, useContext, useCallback, useState, useEffect, ReactNode, Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import Script from "next/script";
import Link from "next/link";
import { GAEvent, ConsentSettings, GtagConsentUpdate } from "@/lib/analytics-types";
import { Switch } from "@/components/ui/switch";

const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || "";
const CONSENT_STORAGE_KEY = "cookie_consent_settings";

// --- CONTEXT INTERFACE ---
interface AnalyticsContextType {
    consentSettings: ConsentSettings | null;
    hasConsented: boolean;
    isInitialized: boolean;
    saveConsent: (settings: ConsentSettings) => void;
    acceptAll: () => void;
    rejectAll: () => void;
    resetConsent: () => void;
    trackEvent: (event: GAEvent) => void;
}

const AnalyticsContext = createContext<AnalyticsContextType | undefined>(undefined);

// --- PAGE TRACKING COMPONENT ---
function PageTracker() {
    const pathname = usePathname();
    const searchParams = useSearchParams();

    useEffect(() => {
        if (typeof window === "undefined" || !window.gtag) return;

        const url = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : "");

        window.gtag("event", "page_view", {
            page_path: pathname,
            page_location: window.location.origin + url,
            page_title: document.title,
        });
    }, [pathname, searchParams]);

    return null;
}

// --- PROVIDER COMPONENT ---
export function AnalyticsProvider({ children }: { children: ReactNode }) {
    const [consentSettings, setConsentSettings] = useState<ConsentSettings | null>(null);
    const [isInitialized, setIsInitialized] = useState(false);

    const updateGtagConsent = useCallback((settings: ConsentSettings) => {
        if (typeof window === "undefined" || !window.gtag) return;

        const consentUpdate: GtagConsentUpdate = {
            analytics_storage: settings.analytics ? "granted" : "denied",
            ad_storage: settings.marketing ? "granted" : "denied",
            ad_user_data: settings.marketing ? "granted" : "denied",
            ad_personalization: settings.marketing ? "granted" : "denied",
        };

        window.gtag("consent", "update", consentUpdate);
    }, []);

    useEffect(() => {
        if (typeof window === "undefined") return;

        const stored = localStorage.getItem(CONSENT_STORAGE_KEY);
        if (stored) {
            try {
                const parsedSettings: ConsentSettings = JSON.parse(stored);
                setConsentSettings(parsedSettings);
                const checkGtag = setInterval(() => {
                    if (typeof window.gtag === "function") {
                        updateGtagConsent(parsedSettings);
                        clearInterval(checkGtag);
                    }
                }, 100);
                setTimeout(() => clearInterval(checkGtag), 5000);
            } catch {
                localStorage.removeItem(CONSENT_STORAGE_KEY);
            }
        }
        setIsInitialized(true);
    }, [updateGtagConsent]);

    const saveConsent = useCallback(
        (settings: ConsentSettings) => {
            const finalSettings: ConsentSettings = {
                ...settings,
                necessary: true,
            };
            setConsentSettings(finalSettings);
            localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(finalSettings));
            updateGtagConsent(finalSettings);
        },
        [updateGtagConsent],
    );

    const acceptAll = useCallback(() => {
        saveConsent({
            necessary: true,
            analytics: true,
            marketing: true,
        });
    }, [saveConsent]);

    const rejectAll = useCallback(() => {
        saveConsent({
            necessary: true,
            analytics: false,
            marketing: false,
        });
    }, [saveConsent]);

    const resetConsent = useCallback(() => {
        setConsentSettings(null);
        localStorage.removeItem(CONSENT_STORAGE_KEY);
    }, []);

    const trackEvent = useCallback((event: GAEvent) => {
        if (typeof window === "undefined" || !window.gtag) return;

        window.gtag("event", event.name, event.params as Record<string, unknown>);
    }, []);

    const hasConsented = consentSettings !== null;

    return (
        <AnalyticsContext.Provider
            value={{
                consentSettings,
                hasConsented,
                isInitialized,
                saveConsent,
                acceptAll,
                rejectAll,
                resetConsent,
                trackEvent,
            }}
        >
            {children}
            <Suspense fallback={null}>
                <PageTracker />
            </Suspense>
        </AnalyticsContext.Provider>
    );
}

// --- CUSTOM HOOK ---
export function useAnalytics() {
    const context = useContext(AnalyticsContext);
    if (context === undefined) {
        throw new Error("useAnalytics must be used within an AnalyticsProvider");
    }
    return context;
}

// --- GOOGLE ANALYTICS SCRIPT COMPONENT ---
export function GoogleAnalyticsScript() {
    if (!GA_MEASUREMENT_ID) return null;

    return (
        <>
            <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`} strategy="lazyOnload" />
            <Script
                id="gtag-init"
                strategy="lazyOnload"
                dangerouslySetInnerHTML={{
                    __html: `
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          
          gtag('consent', 'default', {
            'analytics_storage': 'denied',
            'ad_storage': 'denied',
            'ad_user_data': 'denied',
            'ad_personalization': 'denied',
            'wait_for_update': 500
          });
          
          gtag('js', new Date());
          gtag('config', '${GA_MEASUREMENT_ID}', {
            page_path: window.location.pathname,
            anonymize_ip: true,
            cookie_flags: 'SameSite=None;Secure'
          });
        `,
                }}
            />
        </>
    );
}

// --- COOKIE BANNER COMPONENT ---
export function CookieBanner() {
    const { hasConsented, isInitialized, acceptAll, rejectAll, saveConsent } = useAnalytics();
    const [showDetails, setShowDetails] = useState(false);
    const [customSettings, setCustomSettings] = useState<ConsentSettings>({
        necessary: true,
        analytics: false,
        marketing: false,
    });

    if (!isInitialized || hasConsented) return null;

    const handleCustomSave = () => {
        saveConsent(customSettings);
    };

    return (
        <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:bottom-6 md:max-w-sm z-40 border-2 border-foreground/10 bg-card/95 backdrop-blur-md">
            {!showDetails ? (
                <div className="p-4 space-y-3">
                    <p className="font-mono text-xs text-muted-foreground leading-relaxed">
                        Wir verwenden Cookies, um die Website zu verbessern.{" "}
                        <Link
                            href="/datenschutz"
                            className="text-foreground hover:underline transition-colors"
                        >
                            Datenschutzerklärung
                        </Link>
                        .
                    </p>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setShowDetails(true)}
                            className="font-mono text-xs text-muted-foreground hover:text-foreground transition-colors uppercase tracking-wider"
                        >
                            Einstellungen
                        </button>
                        <span className="text-muted-foreground/30">·</span>
                        <button
                            onClick={rejectAll}
                            className="font-mono text-xs text-muted-foreground hover:text-foreground transition-colors uppercase tracking-wider"
                        >
                            Ablehnen
                        </button>
                        <button
                            onClick={acceptAll}
                            className="ml-auto px-4 py-1.5 font-mono text-xs font-bold uppercase tracking-wider bg-foreground text-background border-2 border-foreground hover:opacity-90 transition-all duration-200"
                        >
                            Akzeptieren
                        </button>
                    </div>
                </div>
            ) : (
                <div className="p-4 space-y-3">
                    <h3 className="font-mono text-xs font-bold text-foreground uppercase tracking-[0.2em]">
                        Cookie-Einstellungen
                    </h3>

                    <div className="space-y-2">
                        <div className="flex items-center justify-between py-2 px-3 border border-foreground/10 bg-secondary opacity-75">
                            <div className="flex-1 pr-3">
                                <span className="font-mono text-xs font-semibold text-foreground">Notwendig</span>
                            </div>
                            <Switch checked={true} disabled />
                        </div>

                        <div className="flex items-center justify-between py-2 px-3 border border-foreground/10 bg-secondary hover:border-foreground/30 transition-colors">
                            <div className="flex-1 pr-3">
                                <span className="font-mono text-xs font-semibold text-foreground">Analyse</span>
                            </div>
                            <Switch
                                checked={customSettings.analytics}
                                onCheckedChange={(checked) =>
                                    setCustomSettings((prev) => ({ ...prev, analytics: checked }))
                                }
                            />
                        </div>

                        <div className="flex items-center justify-between py-2 px-3 border border-foreground/10 bg-secondary hover:border-foreground/30 transition-colors">
                            <div className="flex-1 pr-3">
                                <span className="font-mono text-xs font-semibold text-foreground">Marketing</span>
                            </div>
                            <Switch
                                checked={customSettings.marketing}
                                onCheckedChange={(checked) =>
                                    setCustomSettings((prev) => ({ ...prev, marketing: checked }))
                                }
                            />
                        </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-2 border-t-2 border-foreground/10">
                        <button
                            onClick={() => setShowDetails(false)}
                            className="font-mono text-xs text-muted-foreground hover:text-foreground transition-colors uppercase tracking-wider"
                        >
                            Zurück
                        </button>
                        <button
                            onClick={handleCustomSave}
                            className="px-4 py-1.5 font-mono text-xs font-bold uppercase tracking-wider bg-foreground text-background border-2 border-foreground hover:opacity-90 transition-all duration-200"
                        >
                            Speichern
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

// --- STANDALONE EVENT TRACKING ---
function trackEvent(eventName: string, props?: Record<string, string | number | boolean>) {
    if (typeof window === "undefined" || !window.gtag) return;

    window.gtag("event", eventName, props);
}

export const analytics = {
    trackLibrarySelection: (libraryId: string, libraryName: string) => {
        trackEvent("library_selected", {
            library_id: libraryId,
            library_name: libraryName,
        });
    },

    trackFavoriteToggle: (libraryId: string, isFavorite: boolean) => {
        trackEvent("favorite_toggled", {
            library_id: libraryId,
            action: isFavorite ? "added" : "removed",
        });
    },

    trackShowOnlyFavorites: (enabled: boolean) => {
        trackEvent("show_only_favorites", {
            enabled: enabled ? "yes" : "no",
        });
    },

    trackPredictionToggle: (enabled: boolean, libraryId?: string) => {
        const props: Record<string, string | number | boolean> = {
            enabled: enabled ? "yes" : "no",
        };
        if (libraryId) props.library_id = libraryId;
        trackEvent("prediction_toggle", props);
    },

    trackThemeChange: (theme: "light" | "dark" | "system") => {
        trackEvent("theme_changed", { theme });
    },

    trackDateChange: (date: string, source: "calendar" | "url" | "navigation") => {
        trackEvent("date_changed", { date, source });
    },

    trackCalendarInteraction: (action: "open" | "close" | "month_change" | "event_click") => {
        trackEvent("calendar_interaction", { action });
    },

    trackCalendarEventClick: (eventType: string, eventName: string) => {
        trackEvent("calendar_event_clicked", {
            event_type: eventType,
            event_name: eventName,
        });
    },

    trackPWAInstall: (platform: string = "unknown") => {
        trackEvent("pwa_installed", { platform });
    },

    trackPWAPrompt: (action: "shown" | "accepted" | "dismissed") => {
        trackEvent("pwa_prompt", { action });
    },

    trackPWAUsage: () => {
        if (typeof window === "undefined") return;

        const isStandalone =
            window.matchMedia("(display-mode: standalone)").matches ||
            // @ts-ignore
            window.navigator.standalone ||
            document.referrer.includes("android-app://");

        if (isStandalone) {
            trackEvent("pwa_used", { display_mode: "standalone" });
        }
    },

    trackDeviceType: () => {
        if (typeof window === "undefined") return;

        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
        trackEvent("device_type", { device: isMobile ? "mobile" : "desktop" });
    },

    trackWeatherInteraction: () => {
        trackEvent("weather_widget", { action: "viewed" });
    },

    trackRefreshTimer: (action: "auto_refresh" | "manual_refresh") => {
        trackEvent("data_refresh", { action });
    },
};
