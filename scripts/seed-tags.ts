import { prisma } from '../src/lib/prisma.js';

// Define all starter tags
const TAGS = [
  // === BUFFS (Major) ===
  { name: 'major-berserk', category: 'buff', displayName: 'Major Berserk', description: 'Increases all damage done by 10%' },
  { name: 'major-breach', category: 'debuff', displayName: 'Major Breach', description: 'Reduces target Physical and Spell Resistance by 5948' },
  { name: 'major-brutality', category: 'buff', displayName: 'Major Brutality', description: 'Increases Weapon Damage by 20%' },
  { name: 'major-courage', category: 'buff', displayName: 'Major Courage', description: 'Increases Weapon and Spell Damage by 430' },
  { name: 'major-evasion', category: 'buff', displayName: 'Major Evasion', description: 'Reduces damage from area attacks by 20%' },
  { name: 'major-expedition', category: 'buff', displayName: 'Major Expedition', description: 'Increases movement speed by 30%' },
  { name: 'major-force', category: 'buff', displayName: 'Major Force', description: 'Increases critical damage done by 20%' },
  { name: 'major-fortitude', category: 'buff', displayName: 'Major Fortitude', description: 'Increases Health Recovery by 30%' },
  { name: 'major-heroism', category: 'buff', displayName: 'Major Heroism', description: 'Generates 3 Ultimate every 1.5 seconds' },
  { name: 'major-intellect', category: 'buff', displayName: 'Major Intellect', description: 'Increases Magicka Recovery by 30%' },
  { name: 'major-maim', category: 'debuff', displayName: 'Major Maim', description: 'Reduces target damage done by 10%' },
  { name: 'major-mending', category: 'buff', displayName: 'Major Mending', description: 'Increases healing done by 16%' },
  { name: 'major-prophecy', category: 'buff', displayName: 'Major Prophecy', description: 'Increases Spell Critical by 2629' },
  { name: 'major-protection', category: 'buff', displayName: 'Major Protection', description: 'Reduces damage taken by 10%' },
  { name: 'major-resolve', category: 'buff', displayName: 'Major Resolve', description: 'Increases Physical and Spell Resistance by 5948' },
  { name: 'major-savagery', category: 'buff', displayName: 'Major Savagery', description: 'Increases Weapon Critical by 2629' },
  { name: 'major-slayer', category: 'buff', displayName: 'Major Slayer', description: 'Increases damage done to Dungeon, Trial and Arena Monsters by 10%' },
  { name: 'major-sorcery', category: 'buff', displayName: 'Major Sorcery', description: 'Increases Spell Damage by 20%' },
  { name: 'major-vitality', category: 'buff', displayName: 'Major Vitality', description: 'Increases healing received and Shield Strength by 12%' },
  { name: 'major-vulnerability', category: 'debuff', displayName: 'Major Vulnerability', description: 'Increases damage target takes by 10%' },

  // === BUFFS (Minor) ===
  { name: 'minor-berserk', category: 'buff', displayName: 'Minor Berserk', description: 'Increases all damage done by 5%' },
  { name: 'minor-breach', category: 'debuff', displayName: 'Minor Breach', description: 'Reduces target Physical and Spell Resistance by 2974' },
  { name: 'minor-brutality', category: 'buff', displayName: 'Minor Brutality', description: 'Increases Weapon Damage by 10%' },
  { name: 'minor-courage', category: 'buff', displayName: 'Minor Courage', description: 'Increases Weapon and Spell Damage by 215' },
  { name: 'minor-endurance', category: 'buff', displayName: 'Minor Endurance', description: 'Increases Stamina Recovery by 15%' },
  { name: 'minor-evasion', category: 'buff', displayName: 'Minor Evasion', description: 'Reduces damage from area attacks by 10%' },
  { name: 'minor-expedition', category: 'buff', displayName: 'Minor Expedition', description: 'Increases movement speed by 15%' },
  { name: 'minor-force', category: 'buff', displayName: 'Minor Force', description: 'Increases critical damage done by 10%' },
  { name: 'minor-fortitude', category: 'buff', displayName: 'Minor Fortitude', description: 'Increases Health Recovery by 15%' },
  { name: 'minor-heroism', category: 'buff', displayName: 'Minor Heroism', description: 'Generates 1 Ultimate every 1.5 seconds' },
  { name: 'minor-intellect', category: 'buff', displayName: 'Minor Intellect', description: 'Increases Magicka Recovery by 15%' },
  { name: 'minor-maim', category: 'debuff', displayName: 'Minor Maim', description: 'Reduces target damage done by 5%' },
  { name: 'minor-mending', category: 'buff', displayName: 'Minor Mending', description: 'Increases healing done by 8%' },
  { name: 'minor-prophecy', category: 'buff', displayName: 'Minor Prophecy', description: 'Increases Spell Critical by 1314' },
  { name: 'minor-protection', category: 'buff', displayName: 'Minor Protection', description: 'Reduces damage taken by 5%' },
  { name: 'minor-resolve', category: 'buff', displayName: 'Minor Resolve', description: 'Increases Physical and Spell Resistance by 2974' },
  { name: 'minor-savagery', category: 'buff', displayName: 'Minor Savagery', description: 'Increases Weapon Critical by 1314' },
  { name: 'minor-slayer', category: 'buff', displayName: 'Minor Slayer', description: 'Increases damage done to Dungeon, Trial and Arena Monsters by 5%' },
  { name: 'minor-sorcery', category: 'buff', displayName: 'Minor Sorcery', description: 'Increases Spell Damage by 10%' },
  { name: 'minor-toughness', category: 'buff', displayName: 'Minor Toughness', description: 'Increases Max Health by 10%' },
  { name: 'minor-vitality', category: 'buff', displayName: 'Minor Vitality', description: 'Increases healing received and Shield Strength by 6%' },
  { name: 'minor-vulnerability', category: 'debuff', displayName: 'Minor Vulnerability', description: 'Increases damage target takes by 5%' },
  { name: 'minor-aegis', category: 'buff', displayName: 'Minor Aegis', description: 'Take 5% less damage from Dungeon, Trial and Arena Monsters' },
  { name: 'major-aegis', category: 'buff', displayName: 'Major Aegis', description: 'Take 10% less damage from Dungeon, Trial and Arena Monsters' },

  // === OTHER BUFFS ===
  { name: 'empower', category: 'buff', displayName: 'Empower', description: 'Increases damage against monsters with Heavy Attacks by 70%' },
  { name: 'off-balance', category: 'debuff', displayName: 'Off Balance', description: 'Target is Off Balance and can be stunned with Heavy Attack' },

  // === RESOURCES ===
  { name: 'max-stamina', category: 'resource', displayName: 'Max Stamina', description: 'Increases maximum Stamina' },
  { name: 'max-magicka', category: 'resource', displayName: 'Max Magicka', description: 'Increases maximum Magicka' },
  { name: 'max-health', category: 'resource', displayName: 'Max Health', description: 'Increases maximum Health' },
  { name: 'stamina-recovery', category: 'resource', displayName: 'Stamina Recovery', description: 'Increases Stamina Recovery' },
  { name: 'magicka-recovery', category: 'resource', displayName: 'Magicka Recovery', description: 'Increases Magicka Recovery' },
  { name: 'health-recovery', category: 'resource', displayName: 'Health Recovery', description: 'Increases Health Recovery' },
  { name: 'restore-stamina', category: 'resource', displayName: 'Restore Stamina', description: 'Restores Stamina instantly or over time' },
  { name: 'restore-magicka', category: 'resource', displayName: 'Restore Magicka', description: 'Restores Magicka instantly or over time' },
  { name: 'restore-health', category: 'resource', displayName: 'Restore Health', description: 'Restores Health instantly or over time' },
  { name: 'ultimate-generation', category: 'resource', displayName: 'Ultimate Generation', description: 'Generates Ultimate' },
  { name: 'cost-reduction', category: 'resource', displayName: 'Cost Reduction', description: 'Reduces ability costs' },

  // === OFFENSIVE STATS ===
  { name: 'weapon-damage', category: 'offensive', displayName: 'Weapon Damage', description: 'Increases Weapon Damage' },
  { name: 'spell-damage', category: 'offensive', displayName: 'Spell Damage', description: 'Increases Spell Damage' },
  { name: 'weapon-critical', category: 'offensive', displayName: 'Weapon Critical', description: 'Increases Weapon Critical rating' },
  { name: 'spell-critical', category: 'offensive', displayName: 'Spell Critical', description: 'Increases Spell Critical rating' },
  { name: 'critical-damage', category: 'offensive', displayName: 'Critical Damage', description: 'Increases Critical Damage' },
  { name: 'critical-chance', category: 'offensive', displayName: 'Critical Chance', description: 'Increases Critical Chance' },
  { name: 'penetration', category: 'offensive', displayName: 'Penetration', description: 'Increases Penetration (Physical or Spell)' },
  { name: 'physical-penetration', category: 'offensive', displayName: 'Physical Penetration', description: 'Increases Physical Penetration' },
  { name: 'spell-penetration', category: 'offensive', displayName: 'Spell Penetration', description: 'Increases Spell Penetration' },

  // === DEFENSIVE STATS ===
  { name: 'physical-resistance', category: 'defensive', displayName: 'Physical Resistance', description: 'Increases Physical Resistance' },
  { name: 'spell-resistance', category: 'defensive', displayName: 'Spell Resistance', description: 'Increases Spell Resistance' },
  { name: 'armor', category: 'defensive', displayName: 'Armor', description: 'Increases Armor (Physical and Spell Resistance)' },
  { name: 'block-cost', category: 'defensive', displayName: 'Block Cost', description: 'Reduces Block Cost' },
  { name: 'block-mitigation', category: 'defensive', displayName: 'Block Mitigation', description: 'Increases damage blocked' },
  { name: 'healing-received', category: 'defensive', displayName: 'Healing Received', description: 'Increases healing received' },
  { name: 'shield-strength', category: 'defensive', displayName: 'Shield Strength', description: 'Increases damage shield strength' },
  { name: 'damage-reduction', category: 'defensive', displayName: 'Damage Reduction', description: 'Reduces damage taken' },

  // === DAMAGE TYPES ===
  { name: 'flame-damage', category: 'damage-type', displayName: 'Flame Damage', description: 'Deals Flame damage' },
  { name: 'frost-damage', category: 'damage-type', displayName: 'Frost Damage', description: 'Deals Frost damage' },
  { name: 'shock-damage', category: 'damage-type', displayName: 'Shock Damage', description: 'Deals Shock damage' },
  { name: 'poison-damage', category: 'damage-type', displayName: 'Poison Damage', description: 'Deals Poison damage' },
  { name: 'disease-damage', category: 'damage-type', displayName: 'Disease Damage', description: 'Deals Disease damage' },
  { name: 'physical-damage', category: 'damage-type', displayName: 'Physical Damage', description: 'Deals Physical damage' },
  { name: 'magic-damage', category: 'damage-type', displayName: 'Magic Damage', description: 'Deals Magic damage' },
  { name: 'bleed-damage', category: 'damage-type', displayName: 'Bleed Damage', description: 'Deals Bleed damage' },
  { name: 'oblivion-damage', category: 'damage-type', displayName: 'Oblivion Damage', description: 'Deals Oblivion damage (ignores resistances)' },

  // === CROWD CONTROL ===
  { name: 'stun', category: 'crowd-control', displayName: 'Stun', description: 'Stuns the target' },
  { name: 'snare', category: 'crowd-control', displayName: 'Snare', description: 'Slows target movement speed' },
  { name: 'immobilize', category: 'crowd-control', displayName: 'Immobilize', description: 'Immobilizes the target' },
  { name: 'fear', category: 'crowd-control', displayName: 'Fear', description: 'Causes target to flee in fear' },
  { name: 'knockback', category: 'crowd-control', displayName: 'Knockback', description: 'Knocks the target back' },
  { name: 'knockdown', category: 'crowd-control', displayName: 'Knockdown', description: 'Knocks the target down' },
  { name: 'pull', category: 'crowd-control', displayName: 'Pull', description: 'Pulls the target to you' },
  { name: 'interrupt', category: 'crowd-control', displayName: 'Interrupt', description: 'Interrupts casting' },
  { name: 'silence', category: 'crowd-control', displayName: 'Silence', description: 'Silences the target' },
  { name: 'taunt', category: 'crowd-control', displayName: 'Taunt', description: 'Forces target to attack you' },

  // === PROC CONDITIONS ===
  { name: 'on-critical', category: 'proc', displayName: 'On Critical', description: 'Triggers on critical hit' },
  { name: 'on-damage-taken', category: 'proc', displayName: 'On Damage Taken', description: 'Triggers when taking damage' },
  { name: 'on-kill', category: 'proc', displayName: 'On Kill', description: 'Triggers on killing an enemy' },
  { name: 'on-light-attack', category: 'proc', displayName: 'On Light Attack', description: 'Triggers on light attack' },
  { name: 'on-heavy-attack', category: 'proc', displayName: 'On Heavy Attack', description: 'Triggers on heavy attack' },
  { name: 'on-direct-damage', category: 'proc', displayName: 'On Direct Damage', description: 'Triggers on direct damage' },
  { name: 'on-dot-damage', category: 'proc', displayName: 'On DoT Damage', description: 'Triggers on damage over time' },
  { name: 'on-heal', category: 'proc', displayName: 'On Heal', description: 'Triggers when healing' },
  { name: 'on-block', category: 'proc', displayName: 'On Block', description: 'Triggers when blocking' },
  { name: 'on-dodge', category: 'proc', displayName: 'On Dodge', description: 'Triggers when dodge rolling' },
  { name: 'on-bar-swap', category: 'proc', displayName: 'On Bar Swap', description: 'Triggers when swapping ability bars' },
  { name: 'cooldown-based', category: 'proc', displayName: 'Cooldown Based', description: 'Has an internal cooldown' },

  // === ROLE/BUILD ===
  { name: 'tank', category: 'role', displayName: 'Tank', description: 'Useful for tanking' },
  { name: 'healer', category: 'role', displayName: 'Healer', description: 'Useful for healing' },
  { name: 'dps', category: 'role', displayName: 'DPS', description: 'Useful for damage dealing' },
  { name: 'pvp', category: 'role', displayName: 'PvP', description: 'Useful in player vs player' },
  { name: 'pve', category: 'role', displayName: 'PvE', description: 'Useful in player vs environment' },
  { name: 'support', category: 'role', displayName: 'Support', description: 'Provides group support' },

  // === MECHANICS ===
  { name: 'aoe', category: 'mechanic', displayName: 'AoE', description: 'Area of Effect damage or healing' },
  { name: 'single-target', category: 'mechanic', displayName: 'Single Target', description: 'Single target damage or healing' },
  { name: 'dot', category: 'mechanic', displayName: 'DoT', description: 'Damage over Time' },
  { name: 'hot', category: 'mechanic', displayName: 'HoT', description: 'Heal over Time' },
  { name: 'burst', category: 'mechanic', displayName: 'Burst', description: 'High burst damage' },
  { name: 'execute', category: 'mechanic', displayName: 'Execute', description: 'Increased damage at low health' },
  { name: 'shield', category: 'mechanic', displayName: 'Shield', description: 'Provides a damage shield' },
  { name: 'self-heal', category: 'mechanic', displayName: 'Self Heal', description: 'Heals yourself' },
  { name: 'group-heal', category: 'mechanic', displayName: 'Group Heal', description: 'Heals group members' },
  { name: 'synergy', category: 'mechanic', displayName: 'Synergy', description: 'Provides a synergy for allies' },

  // === SET TYPES (for filtering) ===
  { name: 'craftable-set', category: 'set-type', displayName: 'Craftable', description: 'Can be crafted' },
  { name: 'overland-set', category: 'set-type', displayName: 'Overland', description: 'Drops in overland zones' },
  { name: 'dungeon-set', category: 'set-type', displayName: 'Dungeon', description: 'Drops in dungeons' },
  { name: 'trial-set', category: 'set-type', displayName: 'Trial', description: 'Drops in trials' },
  { name: 'arena-set', category: 'set-type', displayName: 'Arena', description: 'Drops in arenas' },
  { name: 'mythic-set', category: 'set-type', displayName: 'Mythic', description: 'Mythic item' },
  { name: 'pvp-set', category: 'set-type', displayName: 'PvP Set', description: 'Obtained through PvP' },
  { name: 'monster-set', category: 'set-type', displayName: 'Monster Set', description: 'Monster helm set' },
];

async function seedTags() {
  console.log('🏷️  Seeding tags...');

  let created = 0;
  let skipped = 0;

  for (const tag of TAGS) {
    try {
      await prisma.tag.upsert({
        where: { name: tag.name },
        create: tag,
        update: {
          category: tag.category,
          displayName: tag.displayName,
          description: tag.description,
        },
      });
      created++;
    } catch (error) {
      console.error(`Failed to create tag ${tag.name}:`, error);
      skipped++;
    }
  }

  console.log(`✅ Created/updated ${created} tags, skipped ${skipped}`);

  // Show summary by category
  const categories = await prisma.tag.groupBy({
    by: ['category'],
    _count: { id: true },
  });

  console.log('\n📊 Tags by category:');
  for (const cat of categories) {
    console.log(`   ${cat.category}: ${cat._count.id}`);
  }
}

seedTags()
  .then(() => {
    console.log('\n🎉 Tag seeding complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
