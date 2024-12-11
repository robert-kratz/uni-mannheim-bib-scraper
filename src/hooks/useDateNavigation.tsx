import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function useDateNavigation(initialDate: string) {
    const [selectedDate, setSelectedDate] = useState<string>(initialDate);
    const router = useRouter();

    const goToNextDay = () => {
        const date = new Date(selectedDate);
        date.setDate(date.getDate() + 1);
        const newDate = date.toISOString();
        setSelectedDate(newDate);
        router.push(`?date=${newDate}`);
    };

    const goToPreviousDay = () => {
        const date = new Date(selectedDate);
        date.setDate(date.getDate() - 1);
        const newDate = date.toISOString();
        setSelectedDate(newDate);
        router.push(`?date=${newDate}`);
    };

    const isSameDay = (date: Date): boolean => {
        const currentDate = new Date();
        return (
            currentDate.getFullYear() === date.getFullYear() &&
            currentDate.getMonth() === date.getMonth() &&
            currentDate.getDate() === date.getDate()
        );
    };

    const canGoToNextDay = isSameDay(new Date(selectedDate));

    return { selectedDate, setSelectedDate, goToNextDay, goToPreviousDay, canGoToNextDay };
}
