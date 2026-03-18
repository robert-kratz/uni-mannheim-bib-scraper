declare module '*.css';

interface Window {
    gtag: (...args: unknown[]) => void;
    dataLayer: unknown[];
}
