type BackButtonProps = {
    onClick: () => void;
    disabled: boolean;
};

export default function BackButton({ onClick, disabled }: BackButtonProps) {
    const buttonClicked = () => {
        if (disabled) return;

        onClick();
    };

    return (
        <div
            onClick={buttonClicked}
            className="cursor-pointer flex justify-center items-center bg-gray-100 hover:bg-gray-200 transition border border-gray-300 rounded-md p-2.5">
            <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="size-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 15 3 9m0 0 6-6M3 9h12a6 6 0 0 1 0 12h-3" />
            </svg>
        </div>
    );
}
