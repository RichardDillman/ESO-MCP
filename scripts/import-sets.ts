import * as fs from 'fs/promises';
import * as path from 'path';
import { prisma } from '../src/lib/prisma.js';
import { logger } from '../src/utils/logger.js';

async function importSets() {
  const dataDir = path.join(process.cwd(), 'data', 'scraped', 'sets');

  try {
    const files = await fs.readdir(dataDir);
    const jsonFiles = files.filter(f => f.endsWith('.json'));

    logger.info(`Found ${jsonFiles.length} set type JSON files to import`);

    let totalSets = 0;
    let totalBonuses = 0;

    for (const file of jsonFiles) {
      try {
        const filePath = path.join(dataDir, file);
        const content = await fs.readFile(filePath, 'utf-8');
        const setTypeData = JSON.parse(content);

        logger.info(`Importing ${setTypeData.type} sets from ${file}...`);

        // Import each set
        for (const setData of setTypeData.sets) {
          // Upsert the set
          await prisma.set.upsert({
            where: { id: setData.id },
            update: {
              name: setData.name,
              type: setData.type,
              slots: setData.slots,
              weaponTypes: setData.weaponTypes || null,
              location: setData.location || null,
              dropSource: setData.dropSource || null,
              craftingSites: setData.craftingSites || null,
              dlcRequired: setData.dlcRequired || null,
              tradeable: setData.tradeable,
              bindType: setData.bindType || null,
              description: setData.description || null,
              patch: setData.patch || null,
              source: setData.source,
            },
            create: {
              id: setData.id,
              name: setData.name,
              type: setData.type,
              slots: setData.slots,
              weaponTypes: setData.weaponTypes || null,
              location: setData.location || null,
              dropSource: setData.dropSource || null,
              craftingSites: setData.craftingSites || null,
              dlcRequired: setData.dlcRequired || null,
              tradeable: setData.tradeable,
              bindType: setData.bindType || null,
              description: setData.description || null,
              patch: setData.patch || null,
              source: setData.source,
            },
          });

          // Delete existing bonuses for this set to avoid duplicates
          await prisma.setBonus.deleteMany({
            where: { setId: setData.id },
          });

          // Import bonuses
          for (const bonus of setData.bonuses) {
            await prisma.setBonus.create({
              data: {
                pieces: bonus.pieces,
                stats: bonus.stats || null,
                effect: bonus.effect || null,
                effectType: bonus.effectType || null,
                cooldown: bonus.cooldown || null,
                setId: setData.id,
              },
            });
            totalBonuses++;
          }

          totalSets++;
        }

        logger.info(`  Imported ${setTypeData.sets.length} ${setTypeData.type} sets`);
        logger.info(`✓ Completed importing ${file}`);
      } catch (error) {
        logger.error(`Failed to import ${file}:`, error);
      }
    }

    logger.info(`All set imports complete! Total: ${totalSets} sets, ${totalBonuses} bonuses`);
  } catch (error) {
    logger.error('Failed to import sets:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

importSets();
