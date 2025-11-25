#!/usr/bin/env tsx
import { parseCMXScreenshots } from '../src/utils/cmx-ocr.js';
import { analyzeCMXParse } from '../src/utils/cmx-analyzer.js';

async function analyze() {
  console.log('📊 Analyzing Redvelvet\'s CMX Parse\n');

  const result = await parseCMXScreenshots([
    { path: './CMX/redvevet-info.png', type: 'info' },
    { path: './CMX/redvelvet-parse.png', type: 'parse' }
  ]);

  console.log('OCR Success:', result.success);
  console.log('Confidence:', result.confidence?.toFixed(1) + '%\n');

  if (!result.success || !result.data) {
    console.log('❌ OCR Error:', result.error);
    return;
  }

  console.log('=== EXTRACTED DATA ===');
  console.log('DPS:', result.data.dps?.toLocaleString() || 'N/A');
  console.log('Active Time:', result.data.activeTime ? (result.data.activeTime / 60).toFixed(2) + ' minutes (' + result.data.activeTime.toFixed(1) + 's)' : 'N/A');
  console.log('Total Damage:', result.data.totalDamage?.toLocaleString() || 'N/A');
  console.log('Bar Balance:', result.data.barBalance ? `${result.data.barBalance.frontBar}% / ${result.data.barBalance.backBar}%` : 'N/A');
  console.log('Light Attacks:', result.data.lightAttacks?.count || 'N/A');
  console.log('  - Weave Time:', result.data.lightAttacks?.averageWeaveTime ? (result.data.lightAttacks.averageWeaveTime * 1000).toFixed(1) + 'ms' : 'N/A');
  console.log('  - Misses:', result.data.lightAttacks?.missCount || 'N/A');
  console.log('Abilities Parsed:', result.data.abilities?.length || 0);

  if (result.data.abilities && result.data.abilities.length > 0) {
    console.log('\n=== TOP 5 ABILITIES ===');
    result.data.abilities.slice(0, 5).forEach((ability, i) => {
      console.log(`${i + 1}. ${ability.name}: ${ability.percentOfTotal}% (${(ability.totalDamage / 1000000).toFixed(1)}M damage)`);
    });
  }

  console.log('\n=== VALIDATION ===');
  const validation = result.validation;
  console.log('Complete:', validation?.isComplete ? '✅ YES' : '❌ NO');
  if (validation?.missingFields && validation.missingFields.length > 0) {
    console.log('Missing Fields:', validation.missingFields.join(', '));
  }

  // Analyze the parse
  if (result.data.dps && result.data.activeTime) {
    console.log('\n=== PERFORMANCE ANALYSIS ===\n');

    const parseMetrics = {
      dps: result.data.dps,
      activeTime: result.data.activeTime,
      totalDamage: result.data.totalDamage || result.data.dps * result.data.activeTime,
      barBalance: result.data.barBalance,
      lightAttacks: result.data.lightAttacks,
      abilities: result.data.abilities || [],
      dotUptimes: result.data.dotUptimes || {},
      buffs: result.data.buffs || [],
      penetration: result.data.penetration,
      criticalChance: result.data.criticalChance,
      criticalDamage: result.data.criticalDamage
    };

    const analysis = analyzeCMXParse(parseMetrics);

    console.log('📈 Parse Rating:', analysis.rating.toUpperCase());
    console.log('Total Issues:', analysis.issues.length);

    const critical = analysis.issues.filter(i => i.severity === 'critical').length;
    const major = analysis.issues.filter(i => i.severity === 'major').length;
    const minor = analysis.issues.filter(i => i.severity === 'minor').length;

    console.log(`  - Critical: ${critical}`);
    console.log(`  - Major: ${major}`);
    console.log(`  - Minor: ${minor}`);

    if (analysis.issues.length > 0) {
      console.log('\n=== WHAT TO IMPROVE ===\n');

      const criticalIssues = analysis.issues.filter(i => i.severity === 'critical');
      const majorIssues = analysis.issues.filter(i => i.severity === 'major');
      const minorIssues = analysis.issues.filter(i => i.severity === 'minor');

      if (criticalIssues.length > 0) {
        console.log('🔴 CRITICAL (Fix Immediately):');
        criticalIssues.forEach((issue, i) => {
          console.log(`\n${i + 1}. ${issue.message}`);
          console.log(`   Current: ${issue.currentValue}`);
          console.log(`   Target: ${issue.targetValue}`);
          console.log(`   → ${issue.recommendation}`);
        });
      }

      if (majorIssues.length > 0) {
        console.log('\n🟡 MAJOR (Important):');
        majorIssues.forEach((issue, i) => {
          console.log(`\n${i + 1}. ${issue.message}`);
          console.log(`   → ${issue.recommendation}`);
        });
      }

      if (minorIssues.length > 0 && minorIssues.length <= 3) {
        console.log('\n🟢 MINOR (Optimization):');
        minorIssues.forEach((issue, i) => {
          console.log(`\n${i + 1}. ${issue.message}`);
          console.log(`   → ${issue.recommendation}`);
        });
      }
    } else {
      console.log('\n✅ No issues found! Excellent parse!');
    }

    // Calculate expected LA count
    if (result.data.lightAttacks?.count && result.data.activeTime) {
      const expectedLAs = Math.floor(result.data.activeTime / 1.0);
      const actualLAs = result.data.lightAttacks.count;
      const laEfficiency = (actualLAs / expectedLAs * 100).toFixed(1);

      console.log('\n=== LIGHT ATTACK EFFICIENCY ===');
      console.log(`Actual LAs: ${actualLAs}`);
      console.log(`Expected LAs (~1/sec): ${expectedLAs}`);
      console.log(`Efficiency: ${laEfficiency}%`);

      if (parseFloat(laEfficiency) < 50) {
        console.log('⚠️  Very low LA count! Focus on maintaining consistent light attack weaving.');
      } else if (parseFloat(laEfficiency) < 70) {
        console.log('⚠️  Low LA count. Practice weaving LAs between every skill.');
      } else if (parseFloat(laEfficiency) < 85) {
        console.log('✅ Good LA count. Keep improving!');
      } else {
        console.log('✅ Excellent LA count!');
      }
    }
  }
}

analyze().catch(console.error);
