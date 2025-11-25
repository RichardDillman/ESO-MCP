#!/usr/bin/env tsx
import { parseCMXScreenshot } from '../src/utils/cmx-ocr.js';

async function debug() {
  const result = await parseCMXScreenshot('./CMX/parse2.png', 'parse');

  console.log('=== PARSE2 DEBUG ===\n');
  console.log('Success:', result.success);
  console.log('Confidence:', result.confidence?.toFixed(1) + '%\n');

  console.log('RAW TEXT (first 1500 chars):');
  console.log(result.rawText?.substring(0, 1500));
  console.log('\n---\n');

  console.log('Parsed Data:');
  console.log(JSON.stringify(result.data, null, 2));
}

debug().catch(console.error);
