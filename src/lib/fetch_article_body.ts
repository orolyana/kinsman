import { Readability } from '@mozilla/readability';
import { JSDOM } from 'jsdom';
import axios from 'axios';
import { Log } from './log';
import { Site } from '../site';

export const fetchArticleBody = (url: string) => new Promise<string | null>((resolve) => {
    axios.get(url, {
        timeout: Site.PE_DATA_TIMEOUT_MS,
        headers: {
            Connection: 'keep-alive'
        }
    }).then((response) => {
        if (response.status === 200) {
            let originalConsoleError: any, originalConsoleWarn: any;
            try {
                const res: any = response.data;

                // Suppress console output during parsing
                originalConsoleError = console.error;
                originalConsoleWarn = console.warn;
                console.error = () => { };
                console.warn = () => { };

                const dom = new JSDOM(res, { url });
                const document = dom.window.document;
                const reader = new Readability(document);
                const article = reader.parse();

                // Restore console functions
                console.error = originalConsoleError;
                console.warn = originalConsoleWarn;

                if (!article?.content) {
                    resolve(null);
                } else {
                    const articleDOM = new JSDOM(article.content);
                    const articleText = articleDOM.window.document.body.textContent;
                    const cleanText = (articleText?.trim() || "")
                        .replace(/ {2,}/g, " ")
                        .replace(/[\n]{2,}/g, " ");

                    resolve(cleanText);
                }
            } catch (error) {
                // Ensure we restore console even on error
                console.error = originalConsoleError;
                console.warn = originalConsoleWarn;

                // Log.dev(error);
                resolve(null);
            }
        } else {
            Log.dev(`HTTP STATUS ${response.status} - ${response.statusText}`);
            resolve(null);
        }
    }).catch((error) => {
        // Log.dev(error);
        resolve(null);
    });
});
