import * as fs from 'fs/promises';
import * as path from 'path';
import { prisma } from '../src/lib/prisma.js';
import { logger } from '../src/utils/logger.js';

async function importSkills() {
  const dataDir = path.join(process.cwd(), 'data', 'scraped', 'skills');

  try {
    const files = await fs.readdir(dataDir);
    const jsonFiles = files.filter(f => f.endsWith('.json'));

    logger.info(`Found ${jsonFiles.length} skill line JSON files to import`);

    for (const file of jsonFiles) {
      try {
        const filePath = path.join(dataDir, file);
        const content = await fs.readFile(filePath, 'utf-8');
        const skillLineData = JSON.parse(content);

        logger.info(`Importing ${skillLineData.name}...`);

        // Import skill line
        await prisma.skillLine.upsert({
          where: { id: skillLineData.id },
          update: {
            name: skillLineData.name,
            category: skillLineData.category,
            maxRank: skillLineData.maxRank,
          },
          create: {
            id: skillLineData.id,
            name: skillLineData.name,
            category: skillLineData.category,
            maxRank: skillLineData.maxRank,
          },
        });

        logger.info(`  Skill line ${skillLineData.name} imported`);

        // Import skills
        for (const skill of skillLineData.skills) {
          await prisma.skill.upsert({
            where: { id: skill.id },
            update: {
              name: skill.name,
              type: skill.type,
              skillLine: skill.skillLine,
              category: skill.category,
              description: skill.description,
              source: skill.source,
              costResource: skill.costResource,
              costAmount: skill.costAmount,
              range: skill.range,
              skillLineId: skillLineData.id,
            },
            create: {
              id: skill.id,
              name: skill.name,
              type: skill.type,
              skillLine: skill.skillLine,
              category: skill.category,
              description: skill.description,
              source: skill.source,
              costResource: skill.costResource,
              costAmount: skill.costAmount,
              range: skill.range,
              skillLineId: skillLineData.id,
            },
          });
        }

        logger.info(`    Imported ${skillLineData.skills.length} skills`);
        logger.info(`✓ Completed importing ${skillLineData.name}`);
      } catch (error) {
        logger.error(`Failed to import ${file}:`, error);
      }
    }

    logger.info('All skill line imports complete!');
  } catch (error) {
    logger.error('Failed to import skill lines:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

importSkills();
