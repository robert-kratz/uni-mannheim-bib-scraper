import Link from 'next/link';

export default function Footer() {
    return (
        <footer className="flex flex-col md:flex-row justify-between items-center p-4">
            <div className="p-4 md:p-0">
                <Link className="text-center text-xs" href="https://rjks.us/">
                    Made by Robert Julian Kratz
                </Link>
            </div>
            <div className="flex justify-end items-center space-x-4">
                <Link
                    className="text-center text-sm hover:underline transition"
                    href="https://github.com/robert-kratz/uni-mannheim-bib-scraper">
                    Github
                </Link>
                <Link className="text-center text-sm hover:underline transition" href="https://rjks.us/privacy-policy">
                    Privacy Policy
                </Link>
                <Link
                    className="text-center text-sm hover:underline transition"
                    href="https://www.rjks.us/legal-notice">
                    Legal Notice
                </Link>
            </div>
        </footer>
    );
}
