import { Browser, chromium } from "playwright";

const RENDER_TIMEOUT_MS = 30000;

let browserPromise: Promise<Browser> | null = null;

const getBrowser = async (): Promise<Browser> => {
    browserPromise ??= chromium.launch({headless: true}).then((browser) => {
        browser.on("disconnected", () => {
            browserPromise = null;
        });
        return browser;
    }).catch((error) => {
        browserPromise = null;
        throw error;
    });

    return await browserPromise;
};

type RenderOptions = {
    footerTemplate: string;
};

export const renderPdf = async (html: string, {footerTemplate}: RenderOptions): Promise<Buffer> => {
    const browser = await getBrowser();
    const context = await browser.newContext({javaScriptEnabled: false});

    try {
        await context.route("**/*", (route) => route.abort());
        const page = await context.newPage();
        page.setDefaultTimeout(RENDER_TIMEOUT_MS);
        await page.setContent(html, {waitUntil: "load"});

        return await page.pdf({
            format: "A4",
            printBackground: true,
            displayHeaderFooter: true,
            headerTemplate: "<span></span>",
            footerTemplate,
            margin: {top: "14mm", right: "14mm", bottom: "18mm", left: "14mm"},
        });
    } finally {
        await context.close();
    }
};

export const closePdfRenderer = async () => {
    const browser = await browserPromise?.catch(() => null);
    browserPromise = null;
    await browser?.close();
};
