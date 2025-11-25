import axios, { AxiosInstance } from 'axios';
import { logger } from '../utils/logger.js';

export abstract class BaseScraper {
  protected client: AxiosInstance;
  protected baseUrl = 'https://en.uesp.net';
  protected rateLimitDelay = 1500; // ms between requests

  constructor() {
    this.client = axios.create({
      baseURL: this.baseUrl,
      headers: {
        'User-Agent': 'ESO-MCP-Server/0.1.0 (Educational Purpose)',
      },
      timeout: 30000,
    });
  }

  protected async delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  protected async fetchPage(url: string, retries = 3): Promise<string> {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        logger.debug(`Fetching ${url} (attempt ${attempt}/${retries})`);
        const response = await this.client.get(url);
        await this.delay(this.rateLimitDelay);
        return response.data;
      } catch (error) {
        logger.warn(`Failed to fetch ${url} on attempt ${attempt}:`, error);
        if (attempt === retries) {
          throw error;
        }
        await this.delay(this.rateLimitDelay * attempt);
      }
    }
    throw new Error(`Failed to fetch ${url} after ${retries} attempts`);
  }

  protected sanitizeId(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  }

  abstract scrape(): Promise<void>;
}
