#!/usr/bin/env tsx
/**
 * Test Unified Search
 */

import { unifiedSearch, getDetailedInfo } from '../src/utils/unified-search.js';

async function testSearch() {
  console.log('🔍 Testing Unified ESO Search\n');

  // Test 1: Tide King's Gaze
  console.log('=== Searching for "Tide King\'s Gaze" ===');
  const tideResults = await unifiedSearch("Tide King's Gaze");
  console.log(`Found ${tideResults.length} results:\n`);
  tideResults.forEach((r, i) => {
    console.log(`${i + 1}. [${r.type.toUpperCase()}] ${r.name}`);
    console.log(`   Category: ${r.category || 'N/A'}`);
    console.log(`   Relevance: ${r.relevance}%`);
    if (r.description) {
      console.log(`   Description: ${r.description.substring(0, 100)}...`);
    }
    console.log('');
  });

  // Test 2: Languid Eye
  console.log('\n=== Searching for "Languid Eye" ===');
  const languidResults = await unifiedSearch("Languid Eye");
  console.log(`Found ${languidResults.length} results:\n`);
  languidResults.forEach((r, i) => {
    console.log(`${i + 1}. [${r.type.toUpperCase()}] ${r.name}`);
    console.log(`   Category: ${r.category || 'N/A'}`);
    console.log(`   Relevance: ${r.relevance}%`);
    if (r.description) {
      console.log(`   Description: ${r.description.substring(0, 100)}...`);
    }
    console.log('');
  });

  // Get details for first result from each
  if (tideResults.length > 0) {
    console.log('\n=== Detailed Info for Tide King\'s Gaze ===');
    const details = await getDetailedInfo(tideResults[0].type, tideResults[0].id);
    console.log(JSON.stringify(details, null, 2));
  }

  if (languidResults.length > 0) {
    console.log('\n=== Detailed Info for Languid Eye ===');
    const details = await getDetailedInfo(languidResults[0].type, languidResults[0].id);
    console.log(JSON.stringify(details, null, 2));
  }

  // Test 3: General search
  console.log('\n\n=== Searching for "Arcanist" ===');
  const arcanistResults = await unifiedSearch("Arcanist", 5);
  console.log(`Found ${arcanistResults.length} results:\n`);
  arcanistResults.forEach((r, i) => {
    console.log(`${i + 1}. [${r.type.toUpperCase()}] ${r.name} (${r.category})`);
  });
}

testSearch()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });
