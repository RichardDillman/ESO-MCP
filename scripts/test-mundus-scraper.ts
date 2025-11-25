import { scrapeMundusStones } from './scrape-mundus-stones.js';

async function test() {
  console.log('Testing Mundus Stones scraper...\n');

  try {
    const mundusStones = await scrapeMundusStones();

    console.log(`\nFound ${mundusStones.length} Mundus Stones\n`);
    console.log('='.repeat(80));

    mundusStones.forEach(stone => {
      console.log(`\n${stone.name}`);
      console.log('-'.repeat(stone.name.length));

      console.log('\nEffects:');
      stone.effects.forEach(effect => {
        console.log(`  • ${effect.type}: ${effect.baseValue}`);

        if (effect.divinesScaling.length > 0) {
          const maxDivines = effect.divinesScaling[effect.divinesScaling.length - 1];
          const maxValue = effect.isPercentage
            ? `${maxDivines.legendary}%`
            : maxDivines.legendary;
          console.log(`    (Max with Divines: ${maxValue})`);
          console.log(`    Scaling data points: ${effect.divinesScaling.length}`);
        }
      });

      console.log('\nLocations:');
      console.log(`  Aldmeri Dominion: ${stone.locations.aldmeriDominion}`);
      console.log(`  Daggerfall Covenant: ${stone.locations.daggerfallCovenant}`);
      console.log(`  Ebonheart Pact: ${stone.locations.ebonheartPact}`);
      console.log(`  Cyrodiil: ${stone.locations.cyrodiil}`);

      console.log(`\nURL: ${stone.url}`);
      console.log('='.repeat(80));
    });

    console.log('\n✓ Scraping completed successfully');
  } catch (error) {
    console.error('\n✗ Error:', error);
    process.exit(1);
  }
}

test();
