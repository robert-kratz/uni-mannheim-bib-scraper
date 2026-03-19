import { LucideGithub } from 'lucide-react';

export default function Footer() {
    return (
        <footer className="mt-12 py-8 border-t-2 border-foreground/10">
            <div className="container max-w-7xl mx-auto px-4">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 sm:gap-6">
                    <p className="font-mono text-xs text-muted-foreground uppercase tracking-wider text-center sm:text-left">
                        © {new Date().getFullYear()}{' '}
                        <a
                            href="https://rjks.us"
                            target="_blank"
                            className="text-foreground hover:underline">
                            Robert Julian Kratz
                        </a>{' '}
                        &{' '}
                        <a href="https://itsgil.com" target="_blank" className="text-foreground hover:underline">
                            Virgil Baclanov
                        </a>
                    </p>
                    <div className="flex flex-wrap justify-center sm:justify-end items-center gap-x-4 gap-y-3">
                        <a
                            href="https://rjks.us/de/impressum"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-mono text-xs uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors">
                            Impressum
                        </a>
                        <a
                            href="https://rjks.us/de/datenschutz"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-mono text-xs uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors">
                            Datenschutz
                        </a>
                        <a
                            href="https://www.bib.uni-mannheim.de/standorte/freie-sitzplaetze/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-mono text-xs uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors">
                            Auslastung
                        </a>
                        <a
                            href="https://www.uni-mannheim.de/studium/termine/semesterzeiten"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-mono text-xs uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors">
                            Semesterzeiten
                        </a>
                        <a
                            href="https://github.com/robert-kratz/uni-mannheim-bib-scraper"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 border-2 border-foreground/10 hover:border-foreground/30 text-muted-foreground hover:text-foreground transition-colors">
                            <LucideGithub size={16} />
                        </a>
                    </div>
                </div>
            </div>
        </footer>
    );
}
