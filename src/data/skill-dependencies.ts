/**
 * Skill Dependencies and Requirements
 * Tracks what must change when recommending different skills
 */

export interface SkillDependency {
  skillName: string;
  skillLine: string;
  category: 'class' | 'weapon' | 'armor' | 'guild' | 'world' | 'alliance' | 'racial';

  // What must be equipped/changed to use this skill
  requires: {
    type: 'weapon' | 'armor' | 'class' | 'race' | 'guild_rank' | 'skill_line_rank';
    value: string | number;
    description: string;
  }[];

  // What you gain access to when meeting requirements
  unlocksPassives: string[];

  // What you lose when switching away
  conflictsWith?: {
    type: 'weapon' | 'armor' | 'class' | 'race';
    alternatives: string[];
    lostPassives: string[];
  };
}

export const SKILL_DEPENDENCIES: SkillDependency[] = [
  // Destruction Staff Skills
  {
    skillName: 'Unstable Wall of Elements',
    skillLine: 'Destruction Staff',
    category: 'weapon',
    requires: [
      {
        type: 'weapon',
        value: 'Destruction Staff',
        description: 'Must have Destruction Staff equipped on bar'
      },
      {
        type: 'skill_line_rank',
        value: 4,
        description: 'Destruction Staff skill line rank 4'
      }
    ],
    unlocksPassives: [
      'Tri Focus (DoT damage from Inferno, cleave from Lightning, shield from Ice)',
      'Penetrating Magic (2974 spell penetration)',
      'Elemental Force (100% status effect chance)',
      'Ancient Knowledge (12% DoT damage with Inferno, 12% direct with Lightning, block cost with Ice)',
      'Destruction Expert (magicka restore on kill or shield absorb)'
    ],
    conflictsWith: {
      type: 'weapon',
      alternatives: ['Two Handed', 'One Hand and Shield', 'Dual Wield', 'Bow', 'Restoration Staff'],
      lostPassives: []
    }
  },
  {
    skillName: 'Elemental Drain',
    skillLine: 'Destruction Staff',
    category: 'weapon',
    requires: [
      {
        type: 'weapon',
        value: 'Destruction Staff',
        description: 'Must have Destruction Staff equipped on bar'
      },
      {
        type: 'skill_line_rank',
        value: 2,
        description: 'Destruction Staff skill line rank 2'
      }
    ],
    unlocksPassives: ['Tri Focus', 'Penetrating Magic', 'Elemental Force', 'Ancient Knowledge', 'Destruction Expert'],
    conflictsWith: {
      type: 'weapon',
      alternatives: ['Two Handed', 'One Hand and Shield', 'Dual Wield', 'Bow', 'Restoration Staff'],
      lostPassives: []
    }
  },

  // Two-Handed Skills
  {
    skillName: 'Stampede',
    skillLine: 'Two Handed',
    category: 'weapon',
    requires: [
      {
        type: 'weapon',
        value: 'Two Handed',
        description: 'Must have Two-Handed weapon equipped on bar'
      }
    ],
    unlocksPassives: [
      'Forceful (cleave to nearby enemies)',
      'Heavy Weapons (258 weapon/spell damage with sword, 12% crit damage with axe, 2974 penetration with mace)',
      'Balanced Blade (15% reduced stamina cost)',
      'Follow Up (10% damage after heavy attack)',
      'Battle Rush (30% stamina recovery on kill)'
    ],
    conflictsWith: {
      type: 'weapon',
      alternatives: ['Destruction Staff', 'Restoration Staff', 'Dual Wield', 'Bow', 'One Hand and Shield'],
      lostPassives: []
    }
  },

  // Bow Skills
  {
    skillName: 'Endless Hail',
    skillLine: 'Bow',
    category: 'weapon',
    requires: [
      {
        type: 'weapon',
        value: 'Bow',
        description: 'Must have Bow equipped on bar'
      },
      {
        type: 'skill_line_rank',
        value: 4,
        description: 'Bow skill line rank 4'
      }
    ],
    unlocksPassives: [
      'Long Shots (damage bonus at 28+ meters)',
      'Accuracy (3% weapon critical per bow ability slotted)',
      'Hawk Eye (5% damage vs distant enemies)',
      'Hasty Retreat (movement speed after dodge)',
      'Arrow Barrage (20% snipe/heavy attack damage after roll dodge)'
    ],
    conflictsWith: {
      type: 'weapon',
      alternatives: ['Destruction Staff', 'Restoration Staff', 'Two Handed', 'Dual Wield', 'One Hand and Shield'],
      lostPassives: []
    }
  },

  // Class-Specific Skills (Arcanist)
  {
    skillName: 'Pragmatic Fatecarver',
    skillLine: 'Herald of the Tome',
    category: 'class',
    requires: [
      {
        type: 'class',
        value: 'Arcanist',
        description: 'Must be Arcanist class'
      }
    ],
    unlocksPassives: [
      'Fated Fortune (generates Crux on timed hit)',
      'Splintered Secrets (damage when consuming Crux)',
      'Harnessed Quintessence (3% damage per Crux)'
    ],
    conflictsWith: {
      type: 'class',
      alternatives: ['Dragonknight', 'Sorcerer', 'Nightblade', 'Templar', 'Warden', 'Necromancer'],
      lostPassives: []
    }
  },

  // Racial Skills
  {
    skillName: 'Adrenaline Rush',
    skillLine: 'Orc',
    category: 'racial',
    requires: [
      {
        type: 'race',
        value: 'Orc',
        description: 'Must be Orc race'
      }
    ],
    unlocksPassives: [
      'Brawny (2000 max health, 4% healing received)',
      'Unflinching (1000 max stamina, 10% health recovery)',
      'Swift Warrior (10% sprint speed, 12% sprint cost reduction)',
      'Adrenaline Rush (restore 1000 health/mag/stam on kill)'
    ],
    conflictsWith: {
      type: 'race',
      alternatives: ['Breton', 'Redguard', 'Nord', 'Dark Elf', 'High Elf', 'Wood Elf', 'Argonian', 'Khajiit', 'Imperial'],
      lostPassives: []
    }
  },

  // Guild Skills (no weapon/class conflicts)
  {
    skillName: 'Degeneration',
    skillLine: 'Mages Guild',
    category: 'guild',
    requires: [
      {
        type: 'guild_rank',
        value: 3,
        description: 'Mages Guild rank 3'
      }
    ],
    unlocksPassives: [
      'Magicka Controller (3% magicka recovery per Mages Guild ability slotted)',
      'Might of the Guild (2% spell damage per Mages Guild ability slotted)'
    ]
  },
  {
    skillName: 'Mystic Orb',
    skillLine: 'Undaunted',
    category: 'guild',
    requires: [
      {
        type: 'guild_rank',
        value: 3,
        description: 'Undaunted rank 3'
      }
    ],
    unlocksPassives: [
      'Undaunted Command (2% max stats)',
      'Undaunted Mettle (2% max health/mag/stam per different armor type worn)'
    ]
  },
];

/**
 * Check if a skill recommendation requires equipment/character changes
 */
export function checkSkillRequirements(
  skillName: string,
  currentWeapon?: string,
  currentClass?: string,
  currentRace?: string
): {
  canUse: boolean;
  requiredChanges: string[];
  passivesGained: string[];
  passivesLost: string[];
  warnings: string[];
} {
  const skillDep = SKILL_DEPENDENCIES.find(d =>
    d.skillName.toLowerCase() === skillName.toLowerCase()
  );

  if (!skillDep) {
    return {
      canUse: true,
      requiredChanges: [],
      passivesGained: [],
      passivesLost: [],
      warnings: ['Skill not found in dependency database - assuming no restrictions']
    };
  }

  const requiredChanges: string[] = [];
  const passivesGained: string[] = [];
  const passivesLost: string[] = [];
  const warnings: string[] = [];
  let canUse = true;

  // Check weapon requirements
  for (const req of skillDep.requires) {
    if (req.type === 'weapon' && currentWeapon && currentWeapon !== req.value) {
      canUse = false;
      requiredChanges.push(`❌ Change weapon: ${currentWeapon} → ${req.value}`);

      // Find what you're losing
      const currentWeaponDep = SKILL_DEPENDENCIES.find(d =>
        d.requires.some(r => r.type === 'weapon' && r.value === currentWeapon)
      );
      if (currentWeaponDep) {
        passivesLost.push(...currentWeaponDep.unlocksPassives);
      }
    }

    if (req.type === 'class' && currentClass && typeof req.value === 'string' && currentClass.toLowerCase() !== req.value.toLowerCase()) {
      canUse = false;
      requiredChanges.push(`❌ IMPOSSIBLE: Requires ${req.value} class (you are ${currentClass})`);
      warnings.push('⚠️  Cannot change class without remaking character!');
    }

    if (req.type === 'race' && currentRace && typeof req.value === 'string' && currentRace.toLowerCase() !== req.value.toLowerCase()) {
      canUse = false;
      requiredChanges.push(`❌ VERY EXPENSIVE: Requires ${req.value} race (you are ${currentRace})`);
      warnings.push('⚠️  Race change requires Crown Store purchase!');
    }
  }

  // Add passives gained
  if (canUse || requiredChanges.some(c => c.includes('weapon'))) {
    passivesGained.push(...skillDep.unlocksPassives);
  }

  return {
    canUse,
    requiredChanges,
    passivesGained,
    passivesLost,
    warnings
  };
}

/**
 * Get smart recommendations that account for equipment changes
 */
export function getSmartRecommendation(
  suggestedSkill: string,
  currentWeapon?: string,
  currentClass?: string,
  currentRace?: string
): string {
  const check = checkSkillRequirements(suggestedSkill, currentWeapon, currentClass, currentRace);

  if (!check.canUse && check.warnings.some(w => w.includes('IMPOSSIBLE'))) {
    return `❌ Cannot recommend ${suggestedSkill}: Requires different class`;
  }

  if (!check.canUse && check.warnings.some(w => w.includes('Race change'))) {
    return `⚠️  ${suggestedSkill} requires race change (Crown Store purchase)`;
  }

  if (check.requiredChanges.length === 0) {
    return `✅ ${suggestedSkill} - Can use with current setup`;
  }

  let recommendation = `🔄 ${suggestedSkill} - Requires changes:\n`;
  recommendation += check.requiredChanges.map(c => `   ${c}`).join('\n');

  if (check.passivesLost.length > 0) {
    recommendation += `\n\n   Lost Passives:\n`;
    recommendation += check.passivesLost.map(p => `   ❌ ${p}`).join('\n');
  }

  if (check.passivesGained.length > 0) {
    recommendation += `\n\n   Gained Passives:\n`;
    recommendation += check.passivesGained.map(p => `   ✅ ${p}`).join('\n');
  }

  return recommendation;
}
