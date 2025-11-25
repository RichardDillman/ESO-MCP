import { ClassScraper } from '../src/scrapers/classes.js';
import { logger } from '../src/utils/logger.js';

async function main() {
  const scraper = new ClassScraper();

  try {
    // Get command line arguments
    const args = process.argv.slice(2);
    const batchIndex = args[0] ? parseInt(args[0], 10) : 0;
    const batchSize = args[1] ? parseInt(args[1], 10) : 3;

    logger.info(`Starting class scraper test - Batch ${batchIndex}, Size ${batchSize}`);

    await scraper.scrapeBatch(batchIndex, batchSize);

    logger.info('Class scraper test completed successfully!');
    process.exit(0);
  } catch (error) {
    logger.error('Class scraper test failed:', error);
    process.exit(1);
  }
}

main();
