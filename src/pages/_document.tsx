import getConfig from 'next/config';
import { Html, Head, Main, NextScript } from 'next/document';

const { publicRuntimeConfig } = getConfig();

const GA_TAG = publicRuntimeConfig.GA_TAG || 'G-5D96HFBJ4V';

export default function Document() {
    return (
        <Html lang="en">
            <Head>
                <script async src={`https://www.googletagmanager.com/gtag/js?id=${GA_TAG}`}></script>
                <script
                    dangerouslySetInnerHTML={{
                        __html: `
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${GA_TAG}');
              `,
                    }}></script>
            </Head>
            <body>
                <Main />
                <NextScript />
            </body>
        </Html>
    );
}
