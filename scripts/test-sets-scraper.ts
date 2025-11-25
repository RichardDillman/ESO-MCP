import { SetsScraper } from '../src/scrapers/sets.js';
import { logger } from '../src/utils/logger.js';

async function main() {
  const scraper = new SetsScraper();

  try {
    const args = process.argv.slice(2);
    const setType = args[0]; // e.g., "Craftable", "Dungeon", etc.

    if (setType) {
      logger.info(`Starting sets scraper test - Type: ${setType}`);
      await scraper.scrapeSetType(setType);
    } else {
      logger.info('No set type specified, scraping Craftable sets as test');
      await scraper.scrapeSetType('Craftable');
    }

    logger.info('Sets scraper test completed successfully!');
    process.exit(0);
  } catch (error) {
    logger.error('Sets scraper test failed:', error);
    process.exit(1);
  }
}

main();
