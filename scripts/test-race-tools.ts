import { prisma } from '../src/lib/prisma.js';
import { logger } from '../src/utils/logger.js';

async function testRaceSearch() {
  logger.info('Testing race search...');

  // Test 1: Search for Altmer
  const altmer = await prisma.race.findMany({
    where: {
      name: { contains: 'Altmer' },
    },
    include: {
      passives: true,
    },
  });

  logger.info(`Found ${altmer.length} race(s) matching "Altmer"`);
  if (altmer.length > 0) {
    logger.info(`Race: ${altmer[0].name}, Alliance: ${altmer[0].alliance}, Passives: ${altmer[0].passives.length}`);
  }

  // Test 2: Search by alliance
  const ebonheartRaces = await prisma.race.findMany({
    where: {
      alliance: 'Ebonheart Pact',
    },
  });

  logger.info(`\nFound ${ebonheartRaces.length} races in Ebonheart Pact:`);
  ebonheartRaces.forEach(race => {
    logger.info(`  - ${race.name}`);
  });

  // Test 3: Get all races
  const allRaces = await prisma.race.findMany({
    orderBy: { name: 'asc' },
  });

  logger.info(`\nTotal races in database: ${allRaces.length}`);
  allRaces.forEach(race => {
    logger.info(`  - ${race.name} (${race.alliance || 'Any'})`);
  });

  // Test 4: Get detailed race info with passives
  const dunmer = await prisma.race.findFirst({
    where: {
      name: 'Dunmer',
    },
    include: {
      passives: {
        orderBy: [
          { name: 'asc' },
          { rank: 'asc' },
        ],
      },
    },
  });

  if (dunmer) {
    logger.info(`\nDunmer Details:`);
    logger.info(`  Name: ${dunmer.name}`);
    logger.info(`  Alliance: ${dunmer.alliance}`);
    logger.info(`  Description: ${dunmer.description.substring(0, 100)}...`);
    logger.info(`  Passives (${dunmer.passives.length}):`);

    dunmer.passives.forEach(passive => {
      logger.info(`    - ${passive.name} (Rank ${passive.rank}, Unlocks at Level ${passive.unlockLevel})`);
      const effects = JSON.parse(passive.effects);
      logger.info(`      Effects: ${effects.length} effect(s)`);
    });
  }
}

async function main() {
  try {
    await testRaceSearch();
    logger.info('\n✅ All race tool tests completed successfully!');
    process.exit(0);
  } catch (error) {
    logger.error('❌ Race tool test failed:', error);
    process.exit(1);
  }
}

main();
