import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: 'Uni Mannheim Libary',
        short_name: 'Uni Mannheim Libary',
        description: 'A web app for the Uni Mannheim Libary.',
        start_url: '/',
        display: 'standalone',
        background_color: '#f7f7f7',
        theme_color: '#f7f7f7',
        icons: [
            {
                src: '/icon-192x192.png',
                sizes: '192x192',
                type: 'image/png',
            },
            {
                src: '/icon-512x512.png',
                sizes: '512x512',
                type: 'image/png',
            },
        ],
    };
}
