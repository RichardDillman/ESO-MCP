import { ArmorSkillsScraper } from '../src/scrapers/armor-skills.js';
import { logger } from '../src/utils/logger.js';

async function main() {
  const scraper = new ArmorSkillsScraper();

  try {
    logger.info('Starting armor skills scraper test');

    await scraper.scrape();

    logger.info('Armor skills scraper test completed successfully!');
    process.exit(0);
  } catch (error) {
    logger.error('Armor skills scraper test failed:', error);
    process.exit(1);
  }
}

main();
