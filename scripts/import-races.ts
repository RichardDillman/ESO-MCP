import * as fs from 'fs/promises';
import * as path from 'path';
import { prisma } from '../src/lib/prisma.js';
import { logger } from '../src/utils/logger.js';

async function importRaces() {
  const dataDir = path.join(process.cwd(), 'data', 'scraped', 'races');

  try {
    const files = await fs.readdir(dataDir);
    const jsonFiles = files.filter(f => f.endsWith('.json'));

    logger.info(`Found ${jsonFiles.length} race JSON files to import`);

    for (const file of jsonFiles) {
      try {
        const filePath = path.join(dataDir, file);
        const content = await fs.readFile(filePath, 'utf-8');
        const raceData = JSON.parse(content);

        logger.info(`Importing ${raceData.name}...`);

        // Import the race
        const raceId = file.replace('.json', '');
        await prisma.race.upsert({
          where: { id: raceId },
          update: {
            name: raceData.name,
            description: raceData.description,
            alliance: raceData.alliance,
            source: `https://en.uesp.net/wiki/Online:${raceData.name}`,
            passives: {
              deleteMany: {},
              create: raceData.passives.map((passive: any) => ({
                name: passive.name,
                rank: passive.rank,
                description: passive.description,
                unlockLevel: passive.unlockLevel,
                effects: JSON.stringify(passive.effects),
              })),
            },
          },
          create: {
            id: raceId,
            name: raceData.name,
            description: raceData.description,
            alliance: raceData.alliance,
            source: `https://en.uesp.net/wiki/Online:${raceData.name}`,
            passives: {
              create: raceData.passives.map((passive: any) => ({
                name: passive.name,
                rank: passive.rank,
                description: passive.description,
                unlockLevel: passive.unlockLevel,
                effects: JSON.stringify(passive.effects),
              })),
            },
          },
        });

        logger.info(`  Race ${raceData.name} imported with ${raceData.passives.length} passives`);
        logger.info(`✓ Completed importing ${raceData.name}`);
      } catch (error) {
        logger.error(`Failed to import ${file}:`, error);
      }
    }

    logger.info('All race imports complete!');
  } catch (error) {
    logger.error('Failed to import races:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

importRaces();
