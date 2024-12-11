import React from 'react';
import Link from 'next/link';

const Footer: React.FC = () => {
    return (
        <footer className="flex flex-col space-y-8">
            <div className="flex justify-between items-center md:items-start flex-col md:flex-row space-y-4 md:space-y-0 p-4">
                <h4 className="text-sm font-semibold text-left">
                    2024 &copy; Made by{' '}
                    <Link className="hover:underline" href="https://rjks.us/">
                        Robert Julian Kratz
                    </Link>
                </h4>
                <div className="flex justify-end items-center space-x-4">
                    <Link className="text-center text-xs hover:underline transition" href="/privacy-policy">
                        Privacy Policy
                    </Link>
                    <Link className="text-center text-xs hover:underline transition" href="/legal-notice">
                        Legal Notice
                    </Link>
                    <Link
                        className="text-center text-sm hover:underline transition"
                        target="_blank"
                        href="https://github.com/robert-kratz/uni-mannheim-bib-scraper">
                        {/* GitHub Icon */}
                        <svg /* ... */></svg>
                    </Link>
                </div>
            </div>
            <p className="text-xs text-gray-400 text-center">Data is updated every 10 minutes.</p>
        </footer>
    );
};

export default Footer;
