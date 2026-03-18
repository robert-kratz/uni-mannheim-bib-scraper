export interface GAEvent {
    name: string;
    params?: Record<string, string | number | boolean | undefined>;
}

export interface ConsentSettings {
    necessary: boolean;
    analytics: boolean;
    marketing: boolean;
}

export interface GtagConsentUpdate {
    analytics_storage: "granted" | "denied";
    ad_storage: "granted" | "denied";
    ad_user_data: "granted" | "denied";
    ad_personalization: "granted" | "denied";
}
