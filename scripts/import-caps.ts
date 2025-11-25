import { prisma } from '../src/lib/prisma.js';
import * as fs from 'fs/promises';
import * as path from 'path';
import { logger } from '../src/utils/logger.js';

interface CapStat {
  statName: string;
  conversionInfo: string;
}

interface CapData {
  id: string;
  name: string;
  category: string;
  capValue: string | null;
  capType: string;
  description: string;
  notes: string | null;
  stats: CapStat[];
}

interface CapsFile {
  caps: CapData[];
  metadata: {
    source: string;
    gameVersion: string;
    lastUpdated: string;
  };
}

async function importCaps() {
  logger.info('Starting caps import...');

  try {
    // Read caps data
    const dataPath = path.join(process.cwd(), 'data', 'scraped', 'caps', 'caps.json');
    const fileContent = await fs.readFile(dataPath, 'utf-8');
    const capsData: CapsFile = JSON.parse(fileContent);

    logger.info(`Found ${capsData.caps.length} caps to import`);

    // Import each cap
    for (const cap of capsData.caps) {
      logger.info(`Importing cap: ${cap.name}`);

      // Upsert the cap
      await prisma.cap.upsert({
        where: { id: cap.id },
        update: {
          name: cap.name,
          category: cap.category,
          capValue: cap.capValue,
          capType: cap.capType,
          description: cap.description,
          notes: cap.notes,
        },
        create: {
          id: cap.id,
          name: cap.name,
          category: cap.category,
          capValue: cap.capValue,
          capType: cap.capType,
          description: cap.description,
          notes: cap.notes,
        },
      });

      // Delete existing stat relationships for this cap
      await prisma.statAffectsCap.deleteMany({
        where: { capId: cap.id },
      });

      // Create new stat relationships
      for (const stat of cap.stats) {
        await prisma.statAffectsCap.create({
          data: {
            capId: cap.id,
            statName: stat.statName,
            conversionInfo: stat.conversionInfo,
          },
        });
      }

      logger.info(`  ✓ Imported ${cap.name} with ${cap.stats.length} associated stats`);
    }

    // Update metadata
    await prisma.metadata.upsert({
      where: { key: 'caps_version' },
      update: {
        value: capsData.metadata.gameVersion,
      },
      create: {
        key: 'caps_version',
        value: capsData.metadata.gameVersion,
      },
    });

    await prisma.metadata.upsert({
      where: { key: 'caps_last_updated' },
      update: {
        value: capsData.metadata.lastUpdated,
      },
      create: {
        key: 'caps_last_updated',
        value: capsData.metadata.lastUpdated,
      },
    });

    logger.info(`✅ Successfully imported ${capsData.caps.length} caps!`);
  } catch (error) {
    logger.error('Failed to import caps:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the import
importCaps().catch((error) => {
  logger.error('Import failed:', error);
  process.exit(1);
});
