// hooks/useDeviceWidth.ts
import { useState, useEffect } from 'react';

/**
 * useDeviceWidth
 * @returns {number} deviceWidth
 */
export function useDeviceWidth(): number {
    const [deviceWidth, setDeviceWidth] = useState<number>(0);

    useEffect(() => {
        setDeviceWidth(window.innerWidth);
    }, []);

    return deviceWidth;
}
