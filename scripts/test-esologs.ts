#!/usr/bin/env tsx
/**
 * Test ESO Logs Integration
 *
 * This script tests the ESO Logs API integration.
 *
 * Prerequisites:
 * 1. Create API client at https://www.esologs.com/profile
 * 2. Add ESOLOGS_CLIENT_ID and ESOLOGS_CLIENT_SECRET to .env
 *
 * Usage:
 *   tsx scripts/test-esologs.ts [reportUrl]
 *
 * Example:
 *   tsx scripts/test-esologs.ts "https://www.esologs.com/reports/NL1mBFp4C3Tn76cz?boss=-2&source=2"
 */

import 'dotenv/config';
import {
  parseReportCode,
  parseReportParams,
  fetchReportMetadata,
  fetchCharacterData,
  convertToGMXFormat,
} from '../src/utils/esologs-api.js';
import { analyzeCMXParse } from '../src/utils/cmx-analyzer.js';
import { generateBuildRecommendations } from '../src/utils/build-recommendations.js';

async function testESOLogs(reportUrl: string) {
  console.log('🔍 Testing ESO Logs Integration\n');
  console.log('Report URL:', reportUrl, '\n');

  // Check credentials
  if (!process.env.ESOLOGS_CLIENT_ID || !process.env.ESOLOGS_CLIENT_SECRET) {
    console.error('❌ Error: ESO Logs credentials not configured');
    console.error('Please set ESOLOGS_CLIENT_ID and ESOLOGS_CLIENT_SECRET in .env file');
    console.error('Get credentials at: https://www.esologs.com/profile');
    process.exit(1);
  }

  try {
    // Parse URL
    console.log('📋 Parsing URL...');
    const reportCode = parseReportCode(reportUrl);
    const params = parseReportParams(reportUrl);
    console.log(`  Report Code: ${reportCode}`);
    console.log(`  Fight ID: ${params.fightID}`);
    console.log(`  Source ID: ${params.sourceID}\n`);

    // Fetch metadata
    console.log('🔄 Fetching report metadata...');
    const metadata = await fetchReportMetadata(reportCode);
    console.log(`  Title: ${metadata.title}`);
    console.log(`  Fights: ${metadata.fights.length}`);
    if (metadata.fights.length > 0) {
      console.log(`  First Fight: ${metadata.fights[0].name}`);
    }
    console.log('');

    // Fetch full character data
    console.log('📊 Fetching character data...');
    const characterData = await fetchCharacterData(reportUrl);
    console.log(`  Character: ${characterData.name}`);
    console.log(`  Class: ${characterData.class}`);
    console.log(`  DPS: ${Math.round(characterData.damage.dps).toLocaleString()}`);
    console.log(`  Active Duration: ${characterData.damage.activeDuration.toFixed(1)}s`);
    console.log(`  Total Damage: ${characterData.damage.totalDamage.toLocaleString()}`);
    console.log(`  Abilities: ${characterData.damage.abilities.length}`);
    console.log('');

    // Convert to CMX format and analyze
    console.log('🔬 Analyzing parse...');
    const cmxFormat = convertToGMXFormat(characterData);
    const analysis = analyzeCMXParse(cmxFormat);
    console.log(`  Rating: ${analysis.rating.toUpperCase()}`);
    console.log(`  Issues: ${analysis.issues.length}`);

    const critical = analysis.issues.filter(i => i.severity === 'critical').length;
    const major = analysis.issues.filter(i => i.severity === 'major').length;
    const minor = analysis.issues.filter(i => i.severity === 'minor').length;
    console.log(`    Critical: ${critical}`);
    console.log(`    Major: ${major}`);
    console.log(`    Minor: ${minor}`);
    console.log('');

    // Generate build recommendations
    console.log('💡 Generating build recommendations...');
    const buildRecs = generateBuildRecommendations(characterData);
    console.log(buildRecs.summary);

    if (buildRecs.recommendations.length > 0) {
      console.log('📝 Top 5 Recommendations:\n');
      buildRecs.recommendations.slice(0, 5).forEach((rec, i) => {
        console.log(`${i + 1}. [${rec.priority.toUpperCase()}] ${rec.title}`);
        if (rec.current) {
          console.log(`   Current: ${rec.current}`);
        }
        console.log(`   → ${rec.suggestion}`);
        console.log(`   Why: ${rec.reasoning}\n`);
      });
    }

    console.log('✅ Test completed successfully!');
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    if (error.message.includes('credentials')) {
      console.error('\nPlease ensure you have:');
      console.error('1. Created an API client at https://www.esologs.com/profile');
      console.error('2. Added ESOLOGS_CLIENT_ID and ESOLOGS_CLIENT_SECRET to .env');
    }
    process.exit(1);
  }
}

// Get report URL from command line or use default example
const reportUrl = process.argv[2] ||
  'https://www.esologs.com/reports/NL1mBFp4C3Tn76cz?boss=-2&source=2';

testESOLogs(reportUrl).catch(console.error);
