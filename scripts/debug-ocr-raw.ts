#!/usr/bin/env tsx
/**
 * Debug OCR - Show raw text output
 */

import { parseCMXScreenshot } from '../src/utils/cmx-ocr.js';
import { resolve } from 'path';

async function debugOCR() {
  const parseScreenPath = resolve('./CMX/cmx-parse-page.png');

  console.log('🔍 Debugging Parse Screen OCR\n');

  const result = await parseCMXScreenshot(parseScreenPath, 'parse', true);

  if (result.success) {
    console.log('=== RAW OCR TEXT ===');
    console.log(result.rawText);
    console.log('\n=== END RAW TEXT ===\n');

    console.log('Extracted Data:');
    console.log(JSON.stringify(result.data, null, 2));
  } else {
    console.log('OCR Failed:', result.error);
  }
}

debugOCR().catch(console.error);
