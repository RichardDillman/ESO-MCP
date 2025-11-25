import { RaceScraper } from '../src/scrapers/races.js';
import { logger } from '../src/utils/logger.js';

async function main() {
  const scraper = new RaceScraper();

  try {
    // Get command line arguments
    const args = process.argv.slice(2);
    const batchIndex = args[0] ? parseInt(args[0], 10) : 0;
    const batchSize = args[1] ? parseInt(args[1], 10) : 3;

    logger.info(`Starting race scraper test - Batch ${batchIndex}, Size ${batchSize}`);

    await scraper.scrapeBatch(batchIndex, batchSize);

    logger.info('Race scraper test completed successfully!');
    process.exit(0);
  } catch (error) {
    logger.error('Race scraper test failed:', error);
    process.exit(1);
  }
}

main();
