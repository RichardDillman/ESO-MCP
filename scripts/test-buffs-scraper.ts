import { BuffsDebuffsScraper } from '../src/scrapers/buffs.js';
import { logger } from '../src/utils/logger.js';

async function main() {
  const scraper = new BuffsDebuffsScraper();

  try {
    logger.info('Starting buffs/debuffs scraper test...');
    await scraper.scrape();
    logger.info('Buffs/debuffs scraper test completed successfully!');
    process.exit(0);
  } catch (error) {
    logger.error('Buffs/debuffs scraper test failed:', error);
    process.exit(1);
  }
}

main();
