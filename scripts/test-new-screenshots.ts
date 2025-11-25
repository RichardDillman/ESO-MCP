#!/usr/bin/env tsx
import { parseCMXScreenshots } from '../src/utils/cmx-ocr.js';

async function test() {
  const result = await parseCMXScreenshots([
    { path: './CMX/info2.png', type: 'info' },
    { path: './CMX/parse2.png', type: 'parse' }
  ]);

  console.log('=== NEW UNCOMPRESSED SCREENSHOTS TEST ===\n');
  console.log('Success:', result.success);
  console.log('Confidence:', result.confidence?.toFixed(1) + '%');
  console.log('\nExtracted Data:');
  console.log(JSON.stringify(result.data, null, 2));
}

test().catch(console.error);
