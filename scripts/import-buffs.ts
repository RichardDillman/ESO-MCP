import * as fs from 'fs/promises';
import * as path from 'path';
import { prisma } from '../src/lib/prisma.js';
import { logger } from '../src/utils/logger.js';

async function importBuffsDebuffs() {
  const dataDir = path.join(process.cwd(), 'data', 'scraped', 'buffs');

  try {
    // Import Buffs
    const buffsFile = path.join(dataDir, 'buffs.json');
    const buffsContent = await fs.readFile(buffsFile, 'utf-8');
    const buffsData = JSON.parse(buffsContent);

    logger.info(`Importing ${buffsData.buffs.length} buffs...`);

    for (const buff of buffsData.buffs) {
      await prisma.buff.upsert({
        where: { id: buff.id },
        update: {
          name: buff.name,
          type: buff.type,
          description: buff.description,
          icon: buff.icon,
          sources: JSON.stringify(buff.sources),
          pageUrl: buff.pageUrl,
        },
        create: {
          id: buff.id,
          name: buff.name,
          type: buff.type,
          description: buff.description,
          icon: buff.icon,
          sources: JSON.stringify(buff.sources),
          pageUrl: buff.pageUrl,
        },
      });
    }

    logger.info(`✓ Imported ${buffsData.buffs.length} buffs`);

    // Import Debuffs
    const debuffsFile = path.join(dataDir, 'debuffs.json');
    const debuffsContent = await fs.readFile(debuffsFile, 'utf-8');
    const debuffsData = JSON.parse(debuffsContent);

    logger.info(`Importing ${debuffsData.debuffs.length} debuffs...`);

    for (const debuff of debuffsData.debuffs) {
      await prisma.debuff.upsert({
        where: { id: debuff.id },
        update: {
          name: debuff.name,
          type: debuff.type,
          description: debuff.description,
          icon: debuff.icon,
          sources: JSON.stringify(debuff.sources),
          pageUrl: debuff.pageUrl,
        },
        create: {
          id: debuff.id,
          name: debuff.name,
          type: debuff.type,
          description: debuff.description,
          icon: debuff.icon,
          sources: JSON.stringify(debuff.sources),
          pageUrl: debuff.pageUrl,
        },
      });
    }

    logger.info(`✓ Imported ${debuffsData.debuffs.length} debuffs`);

    logger.info(`All buffs and debuffs imported successfully!`);
  } catch (error) {
    logger.error('Failed to import buffs/debuffs:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

importBuffsDebuffs();
