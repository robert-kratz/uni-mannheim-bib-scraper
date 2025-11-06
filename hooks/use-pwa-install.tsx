// hooks/use-pwa-install.tsx
'use client';

import { useEffect, useState } from 'react';
import { analytics } from '@/lib/analytics';

interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function usePWAInstall() {
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    const [isInstallable, setIsInstallable] = useState(false);

    useEffect(() => {
        const handleBeforeInstallPrompt = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e as BeforeInstallPromptEvent);
            setIsInstallable(true);
            analytics.trackPWAPrompt('shown');
        };

        const handleAppInstalled = () => {
            setIsInstallable(false);
            setDeferredPrompt(null);
            const platform = navigator.userAgent.includes('Android')
                ? 'android'
                : navigator.userAgent.includes('iPhone') || navigator.userAgent.includes('iPad')
                ? 'ios'
                : 'desktop';
            analytics.trackPWAInstall(platform);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        window.addEventListener('appinstalled', handleAppInstalled);

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
            window.removeEventListener('appinstalled', handleAppInstalled);
        };
    }, []);

    const promptInstall = async () => {
        if (!deferredPrompt) return false;

        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;

        analytics.trackPWAPrompt(outcome);

        if (outcome === 'accepted') {
            setDeferredPrompt(null);
            setIsInstallable(false);
            return true;
        }

        return false;
    };

    return { isInstallable, promptInstall };
}
