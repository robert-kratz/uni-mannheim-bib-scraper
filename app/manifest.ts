import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: 'Uni Mannheim - Bibliotheksbelegung',
        short_name: 'Uni Mannheim Bibliotheken',
        description: 'Zeitnahe Belegung der Bibliotheken der Universität Mannheim',
        start_url: '/',
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#4f46e5',
        icons: [],
    }
}