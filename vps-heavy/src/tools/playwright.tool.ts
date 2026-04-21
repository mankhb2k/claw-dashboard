import { chromium, Browser, Page } from 'playwright';
import * as fs from 'fs/promises';
import { Logger } from '../logger.ts';

const logger = new Logger('PlaywrightTool');

export interface PlaywrightParams {
  url?: string; // URL to capture
  html?: string; // Raw HTML to render
  format?: 'png' | 'jpeg' | 'pdf'; // Output format
  width?: number; // Viewport width (default 1920)
  height?: number; // Viewport height (default 1080)
  fullPage?: boolean; // Capture full page (not just viewport)
  waitFor?: number; // Wait time in ms before capturing
  selector?: string; // CSS selector to wait for
}

interface PlaywrightResult {
  outputPath: string;
  width: number;
  height: number;
  format: string;
  mimeType: string;
}

export class PlaywrightTool {
  private browser: Browser | null = null;

  async ensureBrowser(): Promise<Browser> {
    if (this.browser) {
      return this.browser;
    }

    logger.log('Launching Chromium browser...');
    this.browser = await chromium.launch({
      headless: true,
      args: ['--disable-gpu', '--no-sandbox'],
    });
    return this.browser;
  }

  async closeBrowser(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      logger.log('Browser closed');
    }
  }

  async capture(params: PlaywrightParams, deadline: number): Promise<PlaywrightResult> {
    const browser = await this.ensureBrowser();
    const timeoutMs = deadline - Date.now();

    if (timeoutMs <= 0) {
      throw new Error('Job deadline exceeded before processing');
    }

    const page = await browser.newPage({
      viewport: {
        width: params.width || 1920,
        height: params.height || 1080,
      },
    });

    const format = params.format || 'png';
    const outputPath = `/tmp/openclaw_playwright_${Date.now()}.${format}`;

    try {
      // Navigate to URL or set HTML
      if (params.url) {
        await page.goto(params.url, { waitUntil: 'networkidle', timeout: timeoutMs });
      } else if (params.html) {
        await page.setContent(params.html, { waitUntil: 'networkidle', timeout: timeoutMs });
      } else {
        throw new Error('Either url or html must be provided');
      }

      // Wait for specific selector if provided
      if (params.selector) {
        await page.waitForSelector(params.selector, { timeout: timeoutMs });
      }

      // Wait additional time if specified
      if (params.waitFor) {
        await page.waitForTimeout(Math.min(params.waitFor, timeoutMs));
      }

      // Get actual dimensions
      const dimensions = await page.evaluate(() => ({
        width: document.documentElement.clientWidth,
        height: document.documentElement.clientHeight,
      }));

      // Capture screenshot or PDF
      logger.log('Capturing page', { format, fullPage: params.fullPage });

      if (format === 'pdf') {
        await page.pdf({
          path: outputPath,
          format: 'A4',
          margin: { top: '10mm', right: '10mm', bottom: '10mm', left: '10mm' },
        });
      } else {
        await page.screenshot({
          path: outputPath,
          type: format as 'png' | 'jpeg',
          fullPage: params.fullPage,
          quality: format === 'jpeg' ? 85 : undefined,
        });
      }

      const stat = await fs.stat(outputPath);
      logger.log('Screenshot/PDF captured', { outputPath, size: stat.size });

      return {
        outputPath,
        width: dimensions.width,
        height: dimensions.height,
        format,
        mimeType: this.getMimeType(format),
      };
    } catch (err) {
      logger.error('Playwright capture error:', err);
      throw err;
    } finally {
      await page.close();
    }
  }

  private getMimeType(format: string): string {
    const mimeTypes: Record<string, string> = {
      png: 'image/png',
      jpeg: 'image/jpeg',
      pdf: 'application/pdf',
    };
    return mimeTypes[format] || 'application/octet-stream';
  }
}
