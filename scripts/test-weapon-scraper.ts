import { WeaponSkillsScraper } from '../src/scrapers/weapon-skills.js';
import { logger } from '../src/utils/logger.js';

async function main() {
  const scraper = new WeaponSkillsScraper();

  try {
    const args = process.argv.slice(2);
    const batchIndex = args[0] ? parseInt(args[0], 10) : 0;
    const batchSize = args[1] ? parseInt(args[1], 10) : 3;

    logger.info(`Starting weapon skills scraper test - Batch ${batchIndex}, Size ${batchSize}`);

    await scraper.scrapeBatch(batchIndex, batchSize);

    logger.info('Weapon skills scraper test completed successfully!');
    process.exit(0);
  } catch (error) {
    logger.error('Weapon skills scraper test failed:', error);
    process.exit(1);
  }
}

main();
