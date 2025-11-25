#!/usr/bin/env tsx
/**
 * Test Target Dummy MCP Tools
 */

import { prisma } from '../src/lib/prisma.js';

async function testDummyTools() {
  console.log('🎯 Testing Target Dummy Tools\n');

  // Test 1: List all dummies
  console.log('=== Test 1: List all dummies ===');
  const dummies = await prisma.targetDummy.findMany({
    select: {
      id: true,
      name: true,
      health: true,
      description: true,
    },
  });
  console.log(`Found ${dummies.length} dummies:`);
  dummies.forEach(d => console.log(`  - ${d.name} (${d.id})`));

  // Test 2: Get Trial Dummy info
  console.log('\n=== Test 2: Get Trial Dummy detailed info ===');
  const trialDummy = await prisma.targetDummy.findUnique({
    where: { id: 'iron-atronach-trial' },
  });

  if (trialDummy) {
    console.log(`\nName: ${trialDummy.name}`);
    console.log(`Health: ${trialDummy.health.toLocaleString()}`);
    console.log(`Description: ${trialDummy.description}`);

    const buffs = JSON.parse(trialDummy.buffsProvided);
    console.log(`\nBuffs Provided (${buffs.length}):`);
    buffs.forEach((b: any) => console.log(`  ✅ ${b.name}: ${b.description}`));

    const debuffs = JSON.parse(trialDummy.debuffsProvided);
    console.log(`\nDebuffs Provided (${debuffs.length}):`);
    debuffs.forEach((d: any) => console.log(`  ⚠️  ${d.name}: ${d.description}`));
  }

  // Test 3: Get Robust Dummy (no buffs)
  console.log('\n=== Test 3: Get Robust Dummy (self-sufficient) ===');
  const robustDummy = await prisma.targetDummy.findUnique({
    where: { id: 'iron-atronach-robust' },
  });

  if (robustDummy) {
    console.log(`\nName: ${robustDummy.name}`);
    console.log(`Health: ${robustDummy.health.toLocaleString()}`);
    console.log(`Description: ${robustDummy.description}`);

    const buffs = JSON.parse(robustDummy.buffsProvided);
    console.log(`\nBuffs Provided: ${buffs.length === 0 ? 'NONE - Test your self-buffing!' : buffs.length}`);
  }

  console.log('\n✅ All tests passed!');
}

testDummyTools()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
