'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import nProgress from 'nprogress';
import 'nprogress/nprogress.css';

export default function NProgressBar() {
    const pathname = usePathname();
    const prevPath = useRef(pathname);

    useEffect(() => {
        // Only trigger when the pathname changes
        if (prevPath.current !== pathname) {
            nProgress.start();

            // Optionally delay ending the progress bar to simulate loading
            const timer = setTimeout(() => {
                nProgress.done();
                prevPath.current = pathname;
            }, 200);

            return () => clearTimeout(timer);
        }
    }, [pathname]);

    return null;
}
