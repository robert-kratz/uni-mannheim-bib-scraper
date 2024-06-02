import Link from 'next/link';

export default function Footer() {
    return (
        <footer className="flex flex-col md:flex-row justify-between items-center p-4">
            <div className="p-4 md:p-0">
                <Link className="text-center text-xs" target="_blank" href="https://rjks.us/">
                    {new Date().getFullYear()} &copy; Made by Robert Julian Kratz
                </Link>
            </div>
            <div className="flex justify-end items-center space-x-4">
                <Link className="text-center text-xs hover:underline transition" href="https://rjks.us/privacy-policy">
                    Privacy Policy
                </Link>
                <Link
                    className="text-center text-xs hover:underline transition"
                    href="https://www.rjks.us/legal-notice">
                    Legal Notice
                </Link>
                <Link
                    className="text-center text-sm hover:underline transition"
                    target="_blank"
                    href="https://github.com/robert-kratz/uni-mannheim-bib-scraper">
                    <svg viewBox="0 0 24 24" aria-hidden="true" className="size-8 fill-slate-900">
                        <path
                            fill-rule="evenodd"
                            clip-rule="evenodd"
                            d="M12 2C6.477 2 2 6.463 2 11.97c0 4.404 2.865 8.14 6.839 9.458.5.092.682-.216.682-.48 0-.236-.008-.864-.013-1.695-2.782.602-3.369-1.337-3.369-1.337-.454-1.151-1.11-1.458-1.11-1.458-.908-.618.069-.606.069-.606 1.003.07 1.531 1.027 1.531 1.027.892 1.524 2.341 1.084 2.91.828.092-.643.35-1.083.636-1.332-2.22-.251-4.555-1.107-4.555-4.927 0-1.088.39-1.979 1.029-2.675-.103-.252-.446-1.266.098-2.638 0 0 .84-.268 2.75 1.022A9.607 9.607 0 0 1 12 6.82c.85.004 1.705.114 2.504.336 1.909-1.29 2.747-1.022 2.747-1.022.546 1.372.202 2.386.1 2.638.64.696 1.028 1.587 1.028 2.675 0 3.83-2.339 4.673-4.566 4.92.359.307.678.915.678 1.846 0 1.332-.012 2.407-.012 2.734 0 .267.18.577.688.48 3.97-1.32 6.833-5.054 6.833-9.458C22 6.463 17.522 2 12 2Z"></path>
                    </svg>
                </Link>
            </div>
        </footer>
    );
}
