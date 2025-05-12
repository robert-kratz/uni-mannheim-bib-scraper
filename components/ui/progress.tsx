'use client';

import * as React from 'react';
import * as ProgressPrimitive from '@radix-ui/react-progress';
import { useEffect, useState } from 'react';

const cn = (...classes: string[]) => {
    return classes.filter(Boolean).join(' ');
};

const getColorClass = (value: number) => {
    if (value < 40) return 'bg-green-500';
    if (value < 75) return 'bg-orange-500';
    return 'bg-red-500';
};

const Progress = React.forwardRef<
    React.ElementRef<typeof ProgressPrimitive.Root>,
    React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> & {
        indicatorClassName?: string;
    }
>(({ className = '', value = 0, indicatorClassName = '', ...props }, ref) => {
    // Stelle sicher, dass value im Bereich 0–100 ist
    const safeValue = Math.min(Math.max(value ?? 0, 0), 100);
    const colorClass = getColorClass(safeValue);

    return (
        <ProgressPrimitive.Root
            ref={ref}
            className={cn('relative h-4 w-full overflow-hidden rounded-full bg-secondary', className)}
            {...props}
            value={safeValue}>
            <ProgressPrimitive.Indicator
                className={cn('h-full flex-1 transition-all', colorClass, indicatorClassName)}
                style={{ transform: `translateX(-${100 - safeValue}%)` }}
            />
        </ProgressPrimitive.Root>
    );
});
Progress.displayName = ProgressPrimitive.Root.displayName;

export { Progress };
