import * as fs from 'fs/promises';
import * as path from 'path';
import { prisma } from '../src/lib/prisma.js';
import { logger } from '../src/utils/logger.js';

async function importClasses() {
  const dataDir = path.join(process.cwd(), 'data', 'scraped', 'classes');

  try {
    const files = await fs.readdir(dataDir);
    const jsonFiles = files.filter(f => f.endsWith('.json'));

    logger.info(`Found ${jsonFiles.length} class JSON files to import`);

    for (const file of jsonFiles) {
      try {
        const filePath = path.join(dataDir, file);
        const content = await fs.readFile(filePath, 'utf-8');
        const classData = JSON.parse(content);

        logger.info(`Importing ${classData.name}...`);

        // Import the class
        const classId = file.replace('.json', '');
        await prisma.class.upsert({
          where: { id: classId },
          update: {
            name: classData.name,
            description: classData.description,
            source: `https://en.uesp.net/wiki/Online:${classData.name}`,
          },
          create: {
            id: classId,
            name: classData.name,
            description: classData.description,
            source: `https://en.uesp.net/wiki/Online:${classData.name}`,
          },
        });

        logger.info(`  Class ${classData.name} imported`);

        // Import skill lines and skills
        if (classData.skillLinesData) {
          for (const skillLine of classData.skillLinesData) {
            // Import skill line
            await prisma.skillLine.upsert({
              where: { id: skillLine.id },
              update: {
                name: skillLine.name,
                category: skillLine.category,
                maxRank: skillLine.maxRank,
              },
              create: {
                id: skillLine.id,
                name: skillLine.name,
                category: skillLine.category,
                maxRank: skillLine.maxRank,
              },
            });

            logger.info(`  Skill line ${skillLine.name} imported`);

            // Import skills
            for (const skill of skillLine.skills) {
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
                  skillLineId: skillLine.id,
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
                  skillLineId: skillLine.id,
                },
              });
            }

            logger.info(`    Imported ${skillLine.skills.length} skills`);
          }
        }

        logger.info(`✓ Completed importing ${classData.name}`);
      } catch (error) {
        logger.error(`Failed to import ${file}:`, error);
      }
    }

    logger.info('All class imports complete!');
  } catch (error) {
    logger.error('Failed to import classes:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

importClasses();
