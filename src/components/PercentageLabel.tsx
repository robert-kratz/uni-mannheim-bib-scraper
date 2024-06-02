const classNames = (...classes: string[]) => {
    return classes.filter(Boolean).join(' ');
};

export default function PercentageLabel({ percentage }: { percentage: number }) {
    // let color = 'bg-green-500';

    if (percentage > 75) {
        return (
            <div className="w-10 h-10 rounded-full flex justify-center items-center bg-red-500">
                <p className="text-white text-xs">{percentage}%</p>
            </div>
        );
    }
    if (percentage > 50) {
        return (
            <div className="w-10 h-10 rounded-full flex justify-center items-center bg-yellow-500">
                <p className="text-white text-xs">{percentage}%</p>
            </div>
        );
    }

    return (
        <div className="w-10 h-10 rounded-full flex justify-center items-center bg-green-500">
            <p className="text-white text-xs">{percentage}%</p>
        </div>
    );
}
