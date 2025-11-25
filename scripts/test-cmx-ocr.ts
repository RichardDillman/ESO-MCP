#!/usr/bin/env tsx
/**
 * Test CMX OCR Screenshot Parsing
 *
 * Tests the OCR functionality with sample CMX screenshots
 */

import { parseCMXScreenshot, parseCMXScreenshots, validateOCRData } from '../src/utils/cmx-ocr.js';
import { resolve } from 'path';

async function testOCR() {
  console.log('🧪 Testing CMX OCR Screenshot Parser\n');

  const infoScreenPath = resolve('./CMX/cmx-info-page.png');
  const parseScreenPath = resolve('./CMX/cmx-parse-page.png');

  // Test 1: Parse Info Screen
  console.log('📊 Test 1: Parsing Info Screen (Stats)');
  console.log('=' .repeat(60));

  const infoResult = await parseCMXScreenshot(infoScreenPath, 'info');

  if (infoResult.success) {
    console.log('✅ OCR Success!');
    console.log(`Confidence: ${infoResult.confidence?.toFixed(1)}%`);
    console.log('\nExtracted Data:');
    console.log(JSON.stringify(infoResult.data, null, 2));

    console.log('\nRaw OCR Text (first 500 chars):');
    console.log(infoResult.rawText?.substring(0, 500));

    const validation = validateOCRData(infoResult.data!);
    console.log('\nValidation:');
    console.log(`  Complete: ${validation.isComplete ? '✅' : '❌'}`);
    if (validation.missingFields.length > 0) {
      console.log(`  Missing: ${validation.missingFields.join(', ')}`);
    }
  } else {
    console.log('❌ OCR Failed:', infoResult.error);
  }

  console.log('\n');

  // Test 2: Parse Parse Screen
  console.log('📊 Test 2: Parsing Parse Screen (Abilities)');
  console.log('='.repeat(60));

  const parseResult = await parseCMXScreenshot(parseScreenPath, 'parse');

  if (parseResult.success) {
    console.log('✅ OCR Success!');
    console.log(`Confidence: ${parseResult.confidence?.toFixed(1)}%`);
    console.log('\nExtracted Data:');
    console.log(JSON.stringify(parseResult.data, null, 2));

    console.log('\nRaw OCR Text (first 500 chars):');
    console.log(parseResult.rawText?.substring(0, 500));

    const validation = validateOCRData(parseResult.data!);
    console.log('\nValidation:');
    console.log(`  Complete: ${validation.isComplete ? '✅' : '❌'}`);
    if (validation.missingFields.length > 0) {
      console.log(`  Missing: ${validation.missingFields.join(', ')}`);
    }
  } else {
    console.log('❌ OCR Failed:', parseResult.error);
  }

  console.log('\n');

  // Test 3: Parse Both and Merge
  console.log('📊 Test 3: Parsing Both Screens and Merging');
  console.log('='.repeat(60));

  const mergedResult = await parseCMXScreenshots([
    { path: infoScreenPath, type: 'info' },
    { path: parseScreenPath, type: 'parse' },
  ]);

  if (mergedResult.success) {
    console.log('✅ Merge Success!');
    console.log(`Average Confidence: ${mergedResult.confidence?.toFixed(1)}%`);
    console.log('\nMerged Data:');
    console.log(JSON.stringify(mergedResult.data, null, 2));

    const validation = validateOCRData(mergedResult.data!);
    console.log('\nValidation:');
    console.log(`  Complete: ${validation.isComplete ? '✅' : '❌'}`);
    if (validation.missingFields.length > 0) {
      console.log(`  Missing Fields: ${validation.missingFields.join(', ')}`);
      console.log('\nSuggestions:');
      validation.suggestions.forEach(s => console.log(`  - ${s}`));
    }
  } else {
    console.log('❌ Merge Failed:', mergedResult.error);
  }

  console.log('\n🎉 OCR Testing Complete!\n');
}

testOCR().catch(console.error);
