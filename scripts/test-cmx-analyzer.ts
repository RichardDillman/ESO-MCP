import {
  analyzeCMXParse,
  parseCMXLog,
  validateWeaving,
  type CMXParseMetrics,
} from '../src/utils/cmx-analyzer.js';

console.log('=== CMX Parse Analyzer Tests ===\n');

// Test 1: Excellent Parse (160k+ DPS, minimal issues)
console.log('Test 1: Excellent Parse (165k DPS)');
const excellentParse: CMXParseMetrics = {
  totalDamage: 16500000,
  activeTime: 100,
  dps: 165000,
  abilities: [
    {
      name: 'Fatecarver',
      count: 45,
      totalDamage: 4500000,
      percentOfTotal: 27.3,
      averageTime: 2.2
    },
    {
      name: 'Crystal Fragments',
      count: 30,
      totalDamage: 3200000,
      percentOfTotal: 19.4,
      averageTime: 3.3
    },
  ],
  dotUptimes: {
    'Scalding Rune': 95.2,
    'Mystic Orb': 92.8,
    'Unstable Wall of Elements': 91.5,
  },
  barBalance: {
    frontBar: 52.0,
    backBar: 48.0,
  },
  lightAttacks: {
    count: 85,
    totalDamage: 2800000,
    averageWeaveTime: 0.08,
    missCount: 2,
    ratio: 0.85,
  },
  buffs: [
    { name: 'Major Sorcery', uptime: 98.5, isPermanent: true },
    { name: 'Minor Prophecy', uptime: 95.2, isPermanent: true },
  ],
  penetration: {
    effective: 18200,
    average: 18200,
  },
  criticalChance: 67.2,
  criticalDamage: 118.5,
};

const result1 = analyzeCMXParse(excellentParse);
console.log(`Rating: ${result1.rating}`);
console.log(`Issues: ${result1.issues.length}`);
console.log('Summary:');
console.log(result1.summary);
console.log('\n---\n');

// Test 2: Poor Parse (95k DPS, critical issues)
console.log('Test 2: Poor Parse (95k DPS, critical issues)');
const poorParse: CMXParseMetrics = {
  totalDamage: 9500000,
  activeTime: 100,
  dps: 95000,
  abilities: [
    {
      name: 'Fatecarver',
      count: 20,
      totalDamage: 1800000,
      percentOfTotal: 18.9,
      averageTime: 5.0
    },
  ],
  dotUptimes: {
    'Scalding Rune': 62.5,
    'Mystic Orb': 55.2,
  },
  barBalance: {
    frontBar: 75.0,
    backBar: 25.0,
  },
  lightAttacks: {
    count: 40,
    totalDamage: 1200000,
    averageWeaveTime: 0.28,
    missCount: 35,
    ratio: 0.40,
  },
  buffs: [
    { name: 'Major Sorcery', uptime: 68.3, isPermanent: true },
    { name: 'Minor Prophecy', uptime: 62.7, isPermanent: true },
  ],
  penetration: {
    effective: 12500,
    average: 12500,
  },
  criticalChance: 52.8,
  criticalDamage: 108.2,
};

const result2 = analyzeCMXParse(poorParse);
console.log(`Rating: ${result2.rating}`);
console.log(`Issues: ${result2.issues.length} issues found`);
console.log('Summary:');
console.log(result2.summary);
console.log('\n---\n');

// Test 3: Raw Log Parsing
console.log('Test 3: Raw Log Parsing');
const sampleLog = `[0.0] Light Attack
[1.0] Crystal Fragments
[2.1] Light Attack
[3.2] Fatecarver
[3.4] Fatecarver
[3.6] Fatecarver
[4.2] Light Attack
[5.3] Mystic Orb
[6.5] Light Attack
[7.6] Crystal Fragments
[10.2] Light Attack
[11.3] Unstable Wall of Elements`;

const logParsed = parseCMXLog(sampleLog);
const weavingAnalysis = validateWeaving(logParsed.events);

console.log(`Events Parsed: ${logParsed.events.length}`);
console.log(`Gaps Detected (>1.0s): ${logParsed.analysis.totalGaps}`);
console.log(`Largest Gap: ${logParsed.analysis.largestGap.toFixed(2)}s`);
console.log(`Weaving Efficiency: ${weavingAnalysis.weaveEfficiency.toFixed(1)}%`);
console.log(`Missed Weaves: ${weavingAnalysis.missedWeaves}`);
console.log(`Good Weaves: ${weavingAnalysis.goodWeaves}`);
console.log('\n---\n');

// Test 4: Log with Poor Weaving
console.log('Test 4: Log with Poor Weaving (double casts)');
const poorWeavingLog = `[0.0] Crystal Fragments
[1.1] Fatecarver
[2.2] Mystic Orb
[3.3] Crystal Fragments
[4.4] Light Attack
[5.5] Light Attack
[6.6] Unstable Wall of Elements`;

const poorLogParsed = parseCMXLog(poorWeavingLog);
const poorWeavingAnalysis = validateWeaving(poorLogParsed.events);

console.log(`Events Parsed: ${poorLogParsed.events.length}`);
console.log(`Weaving Efficiency: ${poorWeavingAnalysis.weaveEfficiency.toFixed(1)}%`);
console.log(`Missed Weaves: ${poorWeavingAnalysis.missedWeaves}`);
console.log(`Double Weaves (mistake): ${poorWeavingAnalysis.doubleWeaves}`);
console.log(`Good Weaves: ${poorWeavingAnalysis.goodWeaves}`);
console.log('\n---\n');

console.log('=== All CMX Analyzer Tests Complete ===');
