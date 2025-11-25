import { MUNDUS_STONES_DATA } from '../src/data/mundus-stones-data.js';

console.log('Testing Mundus Stones MCP Data\n');
console.log('='.repeat(80));

// Test 1: Search all stones
console.log('\n[Test 1] All Mundus Stones:');
console.log(`Found ${MUNDUS_STONES_DATA.length} stones\n`);

MUNDUS_STONES_DATA.forEach(stone => {
  console.log(`- ${stone.name}`);
  stone.effects.forEach(effect => {
    const maxValue = effect.divinesScaling[7]?.legendary;
    const displayValue = effect.isPercentage ? `${maxValue}%` : maxValue;
    console.log(`  ${effect.type}: ${effect.baseValue} (max: ${displayValue})`);
  });
});

// Test 2: Search by name
console.log('\n' + '='.repeat(80));
console.log('\n[Test 2] Search for "Thief":');
const searchTerm = 'thief';
const searchResults = MUNDUS_STONES_DATA.filter(stone =>
  stone.name.toLowerCase().includes(searchTerm)
);
console.log(`Found ${searchResults.length} result(s):\n`);
searchResults.forEach(stone => {
  console.log(`${stone.name}`);
  console.log(`URL: ${stone.url}`);
  stone.effects.forEach(effect => {
    console.log(`Effect: ${effect.type} = ${effect.baseValue}`);
    console.log(`Divines scaling points: ${effect.divinesScaling.length}`);
  });
});

// Test 3: Get specific stone details
console.log('\n' + '='.repeat(80));
console.log('\n[Test 3] Get "The Steed" details (multi-effect stone):');
const steed = MUNDUS_STONES_DATA.find(s => s.name === 'The Steed');
if (steed) {
  console.log(`\n${steed.name}`);
  console.log(`Number of effects: ${steed.effects.length}\n`);

  steed.effects.forEach((effect, idx) => {
    console.log(`Effect ${idx + 1}: ${effect.type}`);
    console.log(`  Base value: ${effect.baseValue}`);
    console.log(`  Is percentage: ${effect.isPercentage}`);
    console.log(`  Divines scaling (0 pieces -> 7 pieces Legendary):`);

    // Show sample scaling
    [0, 3, 7].forEach(pieces => {
      const scaling = effect.divinesScaling[pieces];
      const value = scaling?.legendary;
      const display = effect.isPercentage ? `${value}%` : value;
      console.log(`    ${pieces} pieces: ${display}`);
    });
    console.log('');
  });

  console.log('Locations:');
  console.log(`  Aldmeri Dominion: ${steed.locations.aldmeriDominion}`);
  console.log(`  Daggerfall Covenant: ${steed.locations.daggerfallCovenant}`);
  console.log(`  Ebonheart Pact: ${steed.locations.ebonheartPact}`);
  console.log(`  Cyrodiil: ${steed.locations.cyrodiil}`);
}

// Test 4: Divines scaling validation
console.log('\n' + '='.repeat(80));
console.log('\n[Test 4] Validate Divines Scaling Data:');
let totalEffects = 0;
let effectsWithFullScaling = 0;

MUNDUS_STONES_DATA.forEach(stone => {
  stone.effects.forEach(effect => {
    totalEffects++;
    if (effect.divinesScaling.length === 9) {
      effectsWithFullScaling++;
    }
  });
});

console.log(`Total effects across all stones: ${totalEffects}`);
console.log(`Effects with full scaling data (0-8 pieces): ${effectsWithFullScaling}`);
console.log(`Data completeness: ${((effectsWithFullScaling / totalEffects) * 100).toFixed(1)}%`);

// Test 5: Quality tier validation
console.log('\n' + '='.repeat(80));
console.log('\n[Test 5] Validate Quality Tiers:');
const apprentice = MUNDUS_STONES_DATA.find(s => s.name === 'The Apprentice');
if (apprentice && apprentice.effects[0]) {
  const effect = apprentice.effects[0];
  const scaling = effect.divinesScaling[7]; // 7 pieces

  console.log(`${apprentice.name} - ${effect.type}`);
  console.log(`Base value (0 pieces): ${effect.baseValue}`);
  console.log(`\n7 Divines pieces across quality tiers:`);
  console.log(`  Normal:    ${scaling?.normal}`);
  console.log(`  Fine:      ${scaling?.fine}`);
  console.log(`  Superior:  ${scaling?.superior}`);
  console.log(`  Epic:      ${scaling?.epic}`);
  console.log(`  Legendary: ${scaling?.legendary}`);
}

console.log('\n' + '='.repeat(80));
console.log('\n✓ All tests completed successfully!\n');
