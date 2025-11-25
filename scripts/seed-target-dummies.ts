#!/usr/bin/env tsx
/**
 * Seed Target Dummy data
 */

import { prisma } from '../src/lib/prisma.js';

const TARGET_DUMMIES = [
  {
    id: 'iron-atronach-trial',
    name: 'Iron Atronach (Trial Dummy)',
    health: 21000000,
    buffsProvided: JSON.stringify([
      { name: 'Hircine\'s Veneer', description: 'Stamina recovery from set' },
      { name: 'Worm\'s Raiment', description: 'Magicka recovery from set' },
      { name: 'Aggressive Horn', description: 'Increases magicka and stamina, and critical damage' },
      { name: 'Major Force', description: 'Increases critical damage by 10%' },
      { name: 'Major Courage', description: 'Increases weapon and spell damage by 258' },
      { name: 'Minor Brutality', description: 'Increases weapon damage by 10%' },
      { name: 'Minor Savagery', description: 'Increases weapon critical by 1320' },
      { name: 'Minor Prophecy', description: 'Increases spell critical by 1320' },
      { name: 'Minor Sorcery', description: 'Increases spell damage by 10%' },
      { name: 'Minor Berserk', description: 'Increases damage done by 5%' },
      { name: 'Major Slayer', description: 'Increases damage done to Dungeon, Trial, and Arena Monsters by 15%' },
      { name: 'Minor Toughness', description: 'Increases max health by 10%' },
    ]),
    debuffsProvided: JSON.stringify([
      { name: 'Brittle', description: 'Increases critical damage taken by 10%' },
      { name: 'Minor Vulnerability', description: 'Increases damage taken by 5%' },
      { name: 'Major Vulnerability', description: 'Increases damage taken by 10%' },
    ]),
    description: 'Trial dummy providing full raid buffs for optimal DPS testing. This represents best-case scenario with full group support.',
    usage: 'Use for: Rotation practice, build optimization, comparing gear/skill changes, measuring maximum DPS potential',
    source: 'Official ESO Trial Dummy',
  },
  {
    id: 'iron-atronach-robust',
    name: 'Iron Atronach (Robust Dummy)',
    health: 21000000,
    buffsProvided: JSON.stringify([
      { name: 'Hircine\'s Veneer', description: 'Stamina recovery from set' },
      { name: 'Worm\'s Raiment', description: 'Magicka recovery from set' },
    ]),
    debuffsProvided: JSON.stringify([]),
    description: 'Trial dummy with NO buffs - represents solo/self-sufficient DPS testing.',
    usage: 'Use for: Solo build testing, realistic content scenarios, measuring self-buffed DPS',
    source: 'Official ESO Trial Dummy',
  },
  {
    id: 'iron-atronach-precursor',
    name: 'Iron Atronach (Precursor Dummy)',
    health: 6000000,
    buffsProvided: JSON.stringify([
      { name: 'Hircine\'s Veneer', description: 'Stamina recovery from set' },
      { name: 'Worm\'s Raiment', description: 'Magicka recovery from set' },
      { name: 'Aggressive Horn', description: 'Increases magicka and stamina, and critical damage' },
      { name: 'Major Force', description: 'Increases critical damage by 10%' },
      { name: 'Major Courage', description: 'Increases weapon and spell damage by 258' },
      { name: 'Minor Brutality', description: 'Increases weapon damage by 10%' },
      { name: 'Minor Savagery', description: 'Increases weapon critical by 1320' },
      { name: 'Minor Prophecy', description: 'Increases spell critical by 1320' },
      { name: 'Minor Sorcery', description: 'Increases spell damage by 10%' },
      { name: 'Minor Berserk', description: 'Increases damage done by 5%' },
      { name: 'Major Slayer', description: 'Increases damage done to Dungeon, Trial, and Arena Monsters by 15%' },
      { name: 'Minor Toughness', description: 'Increases max health by 10%' },
    ]),
    debuffsProvided: JSON.stringify([
      { name: 'Brittle', description: 'Increases critical damage taken by 10%' },
      { name: 'Minor Vulnerability', description: 'Increases damage taken by 5%' },
      { name: 'Major Vulnerability', description: 'Increases damage taken by 10%' },
    ]),
    description: '6M health trial dummy with full raid buffs for shorter parse testing.',
    usage: 'Use for: Quick rotation testing, shorter parses, warmup before full 21M parse',
    source: 'Official ESO Trial Dummy',
  },
  {
    id: 'stone-husk-3m',
    name: 'Stone Husk (3M)',
    health: 3000000,
    buffsProvided: JSON.stringify([]),
    debuffsProvided: JSON.stringify([]),
    description: 'Basic 3M health dummy with no buffs or debuffs.',
    usage: 'Use for: Basic skill testing, quick damage checks, beginner practice',
    source: 'Craftable',
  },
  {
    id: 'stone-husk-6m',
    name: 'Stone Husk (6M)',
    health: 6000000,
    buffsProvided: JSON.stringify([]),
    debuffsProvided: JSON.stringify([]),
    description: 'Basic 6M health dummy with no buffs or debuffs.',
    usage: 'Use for: Intermediate testing, dungeon DPS approximation',
    source: 'Craftable',
  },
];

async function seedTargetDummies() {
  console.log('🎯 Seeding Target Dummy data...\n');

  for (const dummy of TARGET_DUMMIES) {
    try {
      await prisma.targetDummy.upsert({
        where: { id: dummy.id },
        update: dummy,
        create: dummy,
      });
      console.log(`✅ ${dummy.name}`);
    } catch (error) {
      console.error(`❌ Failed to seed ${dummy.name}:`, error);
    }
  }

  console.log('\n✅ Target dummy seeding complete!');
}

seedTargetDummies()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
