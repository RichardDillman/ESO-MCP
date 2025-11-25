#!/usr/bin/env tsx
/**
 * Analyze specific parse with detailed breakdown
 */

import 'dotenv/config';
import { prisma } from '../src/lib/prisma.js';
import { SKILLLINE_PASSIVES, detectSkillLinePassives } from '../src/data/skillline-passives-data.js';
import { getSmartRecommendation, checkSkillRequirements } from '../src/data/skill-dependencies.js';

const OAUTH_TOKEN_URL = 'https://www.esologs.com/oauth/token';
const GRAPHQL_URL = 'https://www.esologs.com/api/v2/client';

async function getAccessToken(): Promise<string> {
  const clientId = process.env.ESOLOGS_CLIENT_ID;
  const clientSecret = process.env.ESOLOGS_CLIENT_SECRET;

  const response = await fetch(OAUTH_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: clientId!,
      client_secret: clientSecret!,
    }),
  });

  const tokenData = await response.json() as any;
  return tokenData.access_token;
}

async function analyzeParse() {
  console.log('📊 Analyzing Your Parse\n');

  const token = await getAccessToken();

  // Get report info first
  const reportQuery = `
    query($code: String!) {
      reportData {
        report(code: $code) {
          title
          fights {
            id
            name
            startTime
            endTime
          }
        }
      }
    }
  `;

  const reportResponse = await fetch(GRAPHQL_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      query: reportQuery,
      variables: {
        code: 'kXbFLrMmn8Vxgj9K',
      },
    }),
  });

  const reportResult = await reportResponse.json();
  const fights = reportResult.data.reportData.report.fights;
  const lastFight = fights[fights.length - 1];

  console.log(`Report: ${reportResult.data.reportData.report.title}`);
  console.log(`Last Fight: ${lastFight.name} (ID: ${lastFight.id})`);
  console.log(`Duration: ${((lastFight.endTime - lastFight.startTime) / 1000).toFixed(1)}s\n`);

  // Get damage data
  const damageQuery = `
    query($code: String!, $fightIDs: [Int]!, $sourceID: Int) {
      reportData {
        report(code: $code) {
          table(
            dataType: DamageDone
            fightIDs: $fightIDs
            sourceID: $sourceID
          )
        }
      }
    }
  `;

  const damageResponse = await fetch(GRAPHQL_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      query: damageQuery,
      variables: {
        code: 'kXbFLrMmn8Vxgj9K',
        fightIDs: [lastFight.id],
        sourceID: 1,
      },
    }),
  });

  const damageResult = await damageResponse.json();
  const table = damageResult.data.reportData.report.table.data;

  // Calculate totals
  const totalDamage = table.entries.reduce((sum: number, e: any) => sum + e.total, 0);
  const duration = (table.activeTime || table.totalTime) / 1000;
  const dps = totalDamage / duration;

  // Get buffs data
  const buffsQuery = `
    query($code: String!, $fightIDs: [Int]!, $sourceID: Int) {
      reportData {
        report(code: $code) {
          table(
            dataType: Buffs
            fightIDs: $fightIDs
            sourceID: $sourceID
          )
        }
      }
    }
  `;

  const buffsResponse = await fetch(GRAPHQL_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      query: buffsQuery,
      variables: {
        code: 'kXbFLrMmn8Vxgj9K',
        fightIDs: [lastFight.id],
        sourceID: 1,
      },
    }),
  });

  const buffsResult = await buffsResponse.json();
  const buffsTable = buffsResult.data.reportData.report.table.data;

  console.log('=== PERFORMANCE ===');
  console.log(`DPS: ${Math.round(dps).toLocaleString()}`);
  console.log(`Total Damage: ${totalDamage.toLocaleString()}`);
  console.log(`Active Time: ${duration.toFixed(1)}s\n`);

  console.log('=== TOP 15 ABILITIES ===');
  table.entries
    .sort((a: any, b: any) => b.total - a.total)
    .slice(0, 15)
    .forEach((entry: any, i: number) => {
      const percent = (entry.total / totalDamage * 100).toFixed(1);
      const damage = (entry.total / 1000).toFixed(0);
      console.log(`${i + 1}. ${entry.name.padEnd(30)} ${percent.padStart(5)}% | ${damage.padStart(6)}K damage`);
    });

  // Calculate DPS analysis
  console.log('\n=== DPS ANALYSIS ===');
  const topAbility = table.entries[0];
  const topPercent = (topAbility.total / totalDamage * 100);

  if (topPercent < 15) {
    console.log(`⚠️  Top ability (${topAbility.name}) only ${topPercent.toFixed(1)}% of damage`);
    console.log('   → Your spammable should be 15-25% of total damage');
  }

  // Check for DoTs
  const dotNames = ['Barbed Trap', 'Endless Hail', 'Unstable Wall', 'Mystic Orb', 'Degeneration', 'Twisting Path'];
  const dots = table.entries.filter((e: any) =>
    dotNames.some(dot => e.name.toLowerCase().includes(dot.toLowerCase()))
  );

  console.log(`\nDoTs in use: ${dots.length}`);
  if (dots.length < 3) {
    console.log('⚠️  You should have 3-5 DoTs in your rotation');
  }

  dots.forEach((dot: any) => {
    const percent = (dot.total / totalDamage * 100).toFixed(1);
    console.log(`   - ${dot.name}: ${percent}%`);
  });

  // Buff Analysis
  console.log('\n=== BUFF ANALYSIS ===');

  // Get trial dummy buffs from database
  const trialDummy = await prisma.targetDummy.findUnique({
    where: { id: 'iron-atronach-trial' },
  });

  if (!trialDummy) {
    console.error('⚠️  Trial dummy data not found in database. Run: pnpm exec tsx scripts/seed-target-dummies.ts');
    return;
  }

  const dummyBuffs = JSON.parse(trialDummy.buffsProvided).map((b: any) => b.name);
  const dummyBuffsList = dummyBuffs
    .filter((b: string) => !b.includes('Veneer') && !b.includes('Raiment'))
    .join(', ');

  const criticalBuffs = [
    { name: 'Major Sorcery', target: 95, category: 'Spell Damage', dummyProvides: false },
    { name: 'Major Brutality', target: 95, category: 'Weapon Damage', dummyProvides: false },
    { name: 'Major Prophecy', target: 95, category: 'Spell Critical', dummyProvides: false },
    { name: 'Major Savagery', target: 95, category: 'Weapon Critical', dummyProvides: false },
  ];

  console.log(`ℹ️  ${trialDummy.name} provides: ${dummyBuffsList}`);
  console.log('   (These buffs won\'t be available in most content - you need to provide them yourself)\n');

  const buffIssues: string[] = [];
  const selfBuffs: string[] = [];

  // Check for slotted skills that provide passive buffs
  const slottedSkills = table.entries.map((e: any) => e.name);
  const slottedSkillsLower = slottedSkills.map(s => s.toLowerCase());
  const hasInspiredScholarship = slottedSkillsLower.some(s => s.includes('inspired scholarship'));
  const hasMercilessResolve = slottedSkillsLower.some(s => s.includes('merciless resolve'));

  // Detect skill line passives
  const skillLinePassives = detectSkillLinePassives(slottedSkills);

  for (const criticalBuff of criticalBuffs) {
    const buff = buffsTable.auras.find((a: any) =>
      a.name.toLowerCase().includes(criticalBuff.name.toLowerCase())
    );

    // Check if buff is provided by slotted passive skills
    let providedBySlot = false;
    let slotSource = '';

    if (criticalBuff.name === 'Major Sorcery' && hasInspiredScholarship) {
      providedBySlot = true;
      slotSource = 'Inspired Scholarship (slotted)';
    }
    if (criticalBuff.name === 'Major Brutality' && hasInspiredScholarship) {
      providedBySlot = true;
      slotSource = 'Inspired Scholarship (slotted)';
    }
    if (criticalBuff.name === 'Major Prophecy' && hasMercilessResolve) {
      providedBySlot = true;
      slotSource = 'Merciless Resolve (slotted)';
    }
    if (criticalBuff.name === 'Major Savagery' && hasMercilessResolve) {
      providedBySlot = true;
      slotSource = 'Merciless Resolve (slotted)';
    }

    if (!buff && !providedBySlot) {
      buffIssues.push(`❌ ${criticalBuff.name} (${criticalBuff.category}): 0% - MISSING`);
      console.log(`❌ ${criticalBuff.name.padEnd(20)}   0.0% (${criticalBuff.category}) - MISSING`);
    } else if (providedBySlot) {
      console.log(`✅ ${criticalBuff.name.padEnd(20)} 100.0% (${criticalBuff.category}) - ${slotSource}`);
    } else {
      const uptime = ((buff.totalUptime || 0) / (duration * 1000) * 100);
      const status = uptime >= criticalBuff.target ? '✅' : '⚠️';
      console.log(`${status} ${criticalBuff.name.padEnd(20)} ${uptime.toFixed(1).padStart(5)}% (${criticalBuff.category})`);

      if (uptime < criticalBuff.target) {
        buffIssues.push(`⚠️  ${criticalBuff.name}: ${uptime.toFixed(1)}% (target: ${criticalBuff.target}%)`);
      }
    }
  }

  // Show detected slotted skills
  console.log('\n=== DETECTED SLOTTED SKILLS ===');
  if (hasInspiredScholarship) {
    console.log('✅ Inspired Scholarship (provides Major Sorcery + Major Brutality when slotted)');
  }
  if (hasMercilessResolve) {
    console.log('✅ Merciless Resolve (provides Major Prophecy + Major Savagery when slotted)');
  }
  if (slottedSkillsLower.some(s => s.includes('barbed trap'))) {
    console.log('✅ Barbed Trap (provides Minor Force when active)');
  }
  if (slottedSkillsLower.some(s => s.includes('solar barrage'))) {
    console.log('✅ Solar Barrage (provides Empower when active)');
  }

  // Show active skill line passives
  const activePassives = skillLinePassives.filter(sp => sp.isActive);
  if (activePassives.length > 0) {
    console.log('\n=== SKILL LINE PASSIVES ACTIVE ===');
    activePassives.forEach(sp => {
      console.log(`✅ ${sp.passive.passiveName} (${sp.passive.skillLine}): ${sp.passive.buffProvided}`);
      console.log(`   ${sp.reason}`);
    });
  }

  // Check what self-buffs you're providing that trial dummy won't
  console.log('\n=== SELF-PROVIDED BUFFS (What you bring to trials) ===');
  const importantSelfBuffs = [
    'Minor Slayer',
    'Minor Force',
    'Empower',
    'Major Resolve',
  ];

  for (const buffName of importantSelfBuffs) {
    const buff = buffsTable.auras.find((a: any) =>
      a.name.toLowerCase().includes(buffName.toLowerCase())
    );

    if (buff) {
      const uptime = ((buff.totalUptime || 0) / (duration * 1000) * 100);
      console.log(`✅ ${buffName.padEnd(20)} ${uptime.toFixed(1).padStart(5)}%`);
    } else {
      console.log(`⚠️  ${buffName.padEnd(20)}   0.0% - Consider adding`);
    }
  }

  if (buffIssues.length > 0) {
    console.log('\n⚠️  Critical Buff Issues:');
    buffIssues.forEach(issue => console.log(`   ${issue}`));
    console.log('\n💡 These are YOUR responsibility - trial dummy provides them but real content won\'t!');
  } else {
    console.log('\n✅ All critical buffs at target uptime!');
  }

  // DPS Rating
  console.log('\n=== RATING ===');
  if (dps >= 120000) {
    console.log('✅ EXCELLENT - You\'re hitting end-game DPS targets!');
  } else if (dps >= 100000) {
    console.log('✅ GOOD - Solid DPS, small optimizations will push you higher');
  } else if (dps >= 80000) {
    console.log('⚠️  NEEDS IMPROVEMENT - Focus on rotation and weaving');
  } else {
    console.log('❌ POOR - Review rotation, gear, and CP allocation');
  }

  console.log(`\nTarget for trials: 100K+ DPS`);
  console.log(`Target for vet HM: 120K+ DPS`);

  // Food and Potion Recommendations
  console.log('\n=== CONSUMABLES RECOMMENDATIONS ===');

  // Detect if using spell damage focused build
  const isSpellDamageBuild = slottedSkillsLower.some(s =>
    s.includes('fatecarver') || s.includes('staff') || s.includes('spell')
  );

  console.log('📝 Food:');
  if (isSpellDamageBuild) {
    console.log('   ✅ Ghastly Eye Bowl (Max Health + Max Magicka + Magicka Recovery)');
    console.log('   ✅ Witchmother\'s Potent Brew (Max Health + Max Magicka + Magicka Recovery)');
    console.log('   ✅ Artaeum Takeaway Broth (Max Health + Max Magicka + Health Recovery + Magicka Recovery)');
  } else {
    console.log('   ✅ Dubious Camoran Throne (Max Health + Max Stamina + Stamina Recovery)');
    console.log('   ✅ Artaeum Takeaway Broth (Max Health + Max Stamina + Health Recovery + Stamina Recovery)');
  }

  console.log('\n📝 Potions:');
  if (isSpellDamageBuild) {
    console.log('   ✅ Essence of Spell Power (Tri-Pot):');
    console.log('      - Restore Health + Magicka + Stamina');
    console.log('      - Major Sorcery (20% Spell Damage) for 47.6s');
    console.log('      - Major Prophecy (1320 Spell Critical) for 47.6s');
    console.log('      - Major Intellect (20% Magicka Recovery) for 47.6s');
    console.log('   Recipe: Cornflower + Lady\'s Smock + Namira\'s Rot + Lorkhan\'s Tears');
  } else {
    console.log('   ✅ Essence of Weapon Power (Tri-Pot):');
    console.log('      - Restore Health + Magicka + Stamina');
    console.log('      - Major Brutality (20% Weapon Damage) for 47.6s');
    console.log('      - Major Savagery (1320 Weapon Critical) for 47.6s');
    console.log('      - Major Endurance (20% Stamina Recovery) for 47.6s');
    console.log('   Recipe: Dragonthorn + Blessed Thistle + Namira\'s Rot + Lorkhan\'s Tears');
  }

  console.log('\n💡 Pro Tips:');
  console.log('   - Use potions on cooldown (45s) for 100% Major buff uptime');
  console.log('   - Pre-pot before combat starts (potion already active when parse begins)');
  console.log('   - Gold-quality food gives better stats than purple');

  // Skill swap recommendations with dependencies
  console.log('\n=== SKILL SWAP RECOMMENDATIONS ===');

  // Detect current weapon from abilities
  let currentWeapon = 'Unknown';
  if (slottedSkillsLower.some(s => s.includes('stampede'))) {
    currentWeapon = 'Two Handed';
  }

  console.log(`Current detected weapon: ${currentWeapon}`);
  console.log('');

  const recommendations = [
    { remove: 'Stampede', add: 'Unstable Wall of Elements', reason: 'Add critical DoT (5-7K DPS gain)' },
  ];

  for (const rec of recommendations) {
    console.log(`Replace: ${rec.remove} → ${rec.add}`);
    console.log(`Reason: ${rec.reason}`);

    const check = checkSkillRequirements(rec.add, currentWeapon);
    if (check.requiredChanges.length > 0) {
      console.log('');
      console.log('⚠️  Required Changes:');
      check.requiredChanges.forEach(c => console.log(`   ${c}`));
    }

    if (check.passivesLost.length > 0) {
      console.log('');
      console.log('❌ Lost Passives (from current weapon):');
      check.passivesLost.slice(0, 3).forEach(p => console.log(`   - ${p}`));
      if (check.passivesLost.length > 3) {
        console.log(`   ... and ${check.passivesLost.length - 3} more`);
      }
    }

    if (check.passivesGained.length > 0) {
      console.log('');
      console.log('✅ Gained Passives (from new weapon):');
      check.passivesGained.slice(0, 3).forEach(p => console.log(`   - ${p}`));
      if (check.passivesGained.length > 3) {
        console.log(`   ... and ${check.passivesGained.length - 3} more`);
      }
    }

    console.log('');
  }
}

analyzeParse()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
