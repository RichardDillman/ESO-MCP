#!/usr/bin/env tsx
import { parseCMXScreenshot } from '../src/utils/cmx-ocr.js';

async function debug() {
  const result = await parseCMXScreenshot('./CMX/redvelvet-parse.png', 'parse');

  console.log('=== REDVELVET PARSE DEBUG ===\n');
  console.log('Success:', result.success);
  console.log('Confidence:', result.confidence?.toFixed(1) + '%\n');

  console.log('RAW TEXT (first 2000 chars):');
  console.log(result.rawText?.substring(0, 2000));
  console.log('\n---\n');

  console.log('Extracted Data:');
  console.log(JSON.stringify(result.data, null, 2));
}

debug().catch(console.error);
