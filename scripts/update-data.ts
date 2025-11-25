import 'dotenv/config';
import { SkillsScraper } from '../src/scrapers/skills.js';
import { MundusScraper } from '../src/scrapers/mundus.js';
import { logger, LogLevel } from '../src/utils/logger.js';
import { prisma } from '../src/lib/prisma.js';

async function main() {
  logger.setLevel(LogLevel.DEBUG);
  logger.info('Starting ESO data update...');

  try {
    // Update metadata
    await prisma.metadata.upsert({
      where: { key: 'lastUpdate' },
      update: { value: new Date().toISOString() },
      create: { key: 'lastUpdate', value: new Date().toISOString() },
    });

    // Run scrapers
    const skillsScraper = new SkillsScraper();
    await skillsScraper.scrape();

    const mundusScraper = new MundusScraper();
    await mundusScraper.scrape();

    logger.info('Data update complete!');

    // Display summary
    const skillCount = await prisma.skill.count();
    const skillLineCount = await prisma.skillLine.count();
    const mundusCount = await prisma.mundusStone.count();

    logger.info(`Summary:`);
    logger.info(`  - Skill Lines: ${skillLineCount}`);
    logger.info(`  - Skills: ${skillCount}`);
    logger.info(`  - Mundus Stones: ${mundusCount}`);
  } catch (error) {
    logger.error('Data update failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
