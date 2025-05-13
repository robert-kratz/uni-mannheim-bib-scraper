import { Github, GithubIcon, LucideGithub } from 'lucide-react';
import Script from 'next/script';

export default function Footer() {
    return (
        <footer className="mt-12 py-6 bg-secondary/30 dark:bg-secondary/10 border-t border-border">
            <div className="container max-w-7xl mx-auto px-4">
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                    <p className="text-sm text-muted-foreground">
                        © {new Date().getFullYear()}{' '}
                        <a href="https://github.com/robert-kratz" className="text-accent hover:underline">
                            Made by Robert Julian Kratz
                        </a>{' '}
                        &{' '}
                        <a href="https://github.com/its-gil" className="text-accent hover:underline">
                            Virgil Baclanov
                        </a>
                    </p>
                    <div className="flex items-center gap-4">
                        <a
                            href="https://www.bib.uni-mannheim.de/standorte/freie-sitzplaetze/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                            Auslastung
                        </a>
                        <a
                            href="https://www.uni-mannheim.de/studium/termine/semesterzeiten"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                            Semesterzeiten
                        </a>
                        <a
                            href="https://github.com/robert-kratz/uni-mannheim-bib-scraper"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                            <LucideGithub size={20} className="mr-1 " />
                        </a>
                    </div>
                </div>
            </div>
        </footer>
    );
}
