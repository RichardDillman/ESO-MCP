/**
 * Skill Line Passives that provide buffs
 * These are conditional buffs based on having skills from that line slotted or active
 */

export interface SkillLinePassive {
  skillLine: string;
  category: string; // class, weapon, armor, guild, world, alliance
  passiveName: string;
  buffProvided: string;
  condition: string;
  description: string;
}

export const SKILLLINE_PASSIVES: SkillLinePassive[] = [
  // Nightblade - Assassination
  {
    skillLine: 'Assassination',
    category: 'class',
    passiveName: 'Hemorrhage',
    buffProvided: 'Minor Savagery',
    condition: 'When you deal critical damage with an Assassination ability slotted',
    description: 'Grants Minor Savagery (1320 Weapon Critical) when dealing critical damage while having an Assassination ability slotted',
  },

  // Nightblade - Shadow
  {
    skillLine: 'Shadow',
    category: 'class',
    passiveName: 'Refreshing Shadows',
    buffProvided: 'Major Resolve',
    condition: 'When you have a Shadow ability slotted',
    description: 'Grants Major Resolve (5948 Physical and Spell Resistance) when you have a Shadow ability slotted',
  },

  // Templar - Dawn's Wrath
  {
    skillLine: "Dawn's Wrath",
    category: 'class',
    passiveName: 'Illuminate',
    buffProvided: 'Minor Sorcery',
    condition: "Casting a Dawn's Wrath ability",
    description: "Grants Minor Sorcery (10% Spell Damage) for 20 seconds when casting a Dawn's Wrath ability",
  },

  // Templar - Restoring Light
  {
    skillLine: 'Restoring Light',
    category: 'class',
    passiveName: 'Sacred Ground',
    buffProvided: 'Minor Mending',
    condition: 'Standing in your Restoring Light area effects',
    description: 'Grants Minor Mending (8% healing done) when standing in Restoring Light ground effects',
  },

  // Dragonknight - Earthen Heart
  {
    skillLine: 'Earthen Heart',
    category: 'class',
    passiveName: 'Eternal Mountain',
    buffProvided: 'Major Resolve',
    condition: 'When you have an Earthen Heart ability slotted',
    description: 'Grants Major Resolve (5948 Physical and Spell Resistance) when you have an Earthen Heart ability slotted',
  },

  // Sorcerer - Storm Calling
  {
    skillLine: 'Storm Calling',
    category: 'class',
    passiveName: 'Capacitor',
    buffProvided: 'Minor Prophecy',
    condition: 'When you have a Storm Calling ability slotted',
    description: 'Grants Minor Prophecy (1320 Spell Critical) when you have a Storm Calling ability slotted',
  },

  // Warden - Animal Companions
  {
    skillLine: 'Animal Companions',
    category: 'class',
    passiveName: 'Bond With Nature',
    buffProvided: 'Minor Berserk',
    condition: 'When you have an Animal Companions ability active',
    description: 'Grants Minor Berserk (5% damage done) for 10 seconds when you activate an Animal Companions ability',
  },

  // Necromancer - Living Death
  {
    skillLine: 'Living Death',
    category: 'class',
    passiveName: 'Curative Curse',
    buffProvided: 'Minor Vitality',
    condition: 'When you have a Living Death ability slotted',
    description: 'Grants Minor Vitality (8% healing received) when you have a Living Death ability slotted',
  },

  // Arcanist - Curative Runeforms
  {
    skillLine: 'Curative Runeforms',
    category: 'class',
    passiveName: 'Healing Tides',
    buffProvided: 'Minor Mending',
    condition: 'When you have a Curative Runeforms ability slotted',
    description: 'Grants Minor Mending (8% healing done) when you have a Curative Runeforms ability slotted',
  },

  // Two-Handed
  {
    skillLine: 'Two Handed',
    category: 'weapon',
    passiveName: 'Forceful',
    buffProvided: 'Major Brutality',
    condition: 'When you have a Two Handed ability slotted on both bars',
    description: 'Grants Major Brutality (20% Weapon Damage) when you have a Two Handed ability slotted on both bars',
  },

  // Dual Wield
  {
    skillLine: 'Dual Wield',
    category: 'weapon',
    passiveName: 'Controlled Fury',
    buffProvided: 'Minor Berserk',
    condition: 'At low health with Dual Wield equipped',
    description: 'Grants Minor Berserk (5% damage done) when you fall below 25% health with Dual Wield weapons equipped',
  },

  // Bow
  {
    skillLine: 'Bow',
    category: 'weapon',
    passiveName: 'Hawk Eye',
    buffProvided: 'Damage Bonus',
    condition: 'Against targets 15+ meters away',
    description: 'Increases damage done by 5% against enemies more than 15 meters away',
  },

  // Mages Guild
  {
    skillLine: 'Mages Guild',
    category: 'guild',
    passiveName: 'Might of the Guild',
    buffProvided: 'Spell Damage',
    condition: 'Per Mages Guild ability slotted',
    description: 'Increases Spell Damage by 2% per Mages Guild ability slotted',
  },

  // Fighters Guild
  {
    skillLine: 'Fighters Guild',
    category: 'guild',
    passiveName: 'Slayer',
    buffProvided: 'Weapon Damage',
    condition: 'Per Fighters Guild ability slotted',
    description: 'Increases Weapon Damage by 3% per Fighters Guild ability slotted',
  },

  // Psijic Order
  {
    skillLine: 'Psijic Order',
    category: 'guild',
    passiveName: 'Concentrated Barrier',
    buffProvided: 'Major Resolve',
    condition: 'When you have a Psijic Order ability slotted',
    description: 'Grants Major Resolve (5948 Physical and Spell Resistance) when you have a Psijic Order ability slotted',
  },

  // Undaunted
  {
    skillLine: 'Undaunted',
    category: 'guild',
    passiveName: 'Undaunted Mettle',
    buffProvided: 'Max Stats',
    condition: 'Per different armor type equipped',
    description: 'Increases Max Health, Magicka, and Stamina by 2% per different armor type equipped',
  },

  // Heavy Armor
  {
    skillLine: 'Heavy Armor',
    category: 'armor',
    passiveName: 'Resolve',
    buffProvided: 'Major Resolve',
    condition: 'When wearing 5+ pieces of Heavy Armor',
    description: 'Grants Major Resolve (5948 Physical and Spell Resistance) when wearing 5 or more pieces of Heavy Armor',
  },

  // Medium Armor
  {
    skillLine: 'Medium Armor',
    category: 'armor',
    passiveName: 'Dexterity',
    buffProvided: 'Weapon Critical',
    condition: 'Per piece of Medium Armor equipped',
    description: 'Increases Weapon Critical by 219 per piece of Medium Armor equipped',
  },

  // Light Armor
  {
    skillLine: 'Light Armor',
    category: 'armor',
    passiveName: 'Prodigy',
    buffProvided: 'Spell Critical',
    condition: 'Per piece of Light Armor equipped',
    description: 'Increases Spell Critical by 219 per piece of Light Armor equipped',
  },

  // Assault (Alliance War)
  {
    skillLine: 'Assault',
    category: 'alliance',
    passiveName: 'Continuous Attack',
    buffProvided: 'Major Gallop',
    condition: 'When you have an Assault ability slotted',
    description: 'Grants Major Gallop (30% mounted speed) when you have an Assault ability slotted',
  },

  // Support (Alliance War)
  {
    skillLine: 'Support',
    category: 'alliance',
    passiveName: 'Magicka Aid',
    buffProvided: 'Magicka Recovery',
    condition: 'When you have a Support ability slotted',
    description: 'Increases Magicka Recovery by 10% when you have a Support ability slotted',
  },
];

/**
 * Check which skill line passive buffs are active based on slotted/active abilities
 */
export function detectSkillLinePassives(abilities: string[]): {
  passive: SkillLinePassive;
  isActive: boolean;
  reason: string;
}[] {
  const results: { passive: SkillLinePassive; isActive: boolean; reason: string }[] = [];
  const lowerAbilities = abilities.map(a => a.toLowerCase());

  for (const passive of SKILLLINE_PASSIVES) {
    let isActive = false;
    let reason = '';

    switch (passive.skillLine) {
      case 'Assassination':
        // Check for any assassination abilities (Death Stroke, Mark Target, Killer's Blade, etc.)
        if (lowerAbilities.some(a => a.includes('stroke') || a.includes('mark') || a.includes('killer'))) {
          isActive = true;
          reason = 'Assassination ability detected';
        }
        break;

      case "Dawn's Wrath":
        // Check for Dawn's Wrath abilities (Solar Barrage, Radiant Glory, etc.)
        if (lowerAbilities.some(a => a.includes('solar') || a.includes('radiant') || a.includes('backlash'))) {
          isActive = true;
          reason = "Dawn's Wrath ability active";
        }
        break;

      case 'Mages Guild':
        // Count Mages Guild abilities (Entropy/Degeneration, Meteor, Scalding Rune, etc.)
        const magesGuildCount = lowerAbilities.filter(a =>
          a.includes('entropy') || a.includes('degeneration') ||
          a.includes('meteor') || a.includes('rune') || a.includes('magelight')
        ).length;
        if (magesGuildCount > 0) {
          isActive = true;
          reason = `${magesGuildCount} Mages Guild ability slotted`;
        }
        break;

      // Add more detection logic as needed
    }

    results.push({ passive, isActive, reason });
  }

  return results;
}
