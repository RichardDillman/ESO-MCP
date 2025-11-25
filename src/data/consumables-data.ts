/**
 * Raid-Viable Consumables (Food and Potions)
 * Focus on meta options for trials and veteran content
 */

export interface Food {
  name: string;
  quality: 'purple' | 'gold';
  type: 'health_magicka' | 'health_stamina' | 'tri_stat' | 'max_resource' | 'single_stat';
  stats: {
    maxHealth?: number;
    maxMagicka?: number;
    maxStamina?: number;
    healthRecovery?: number;
    magickaRecovery?: number;
    staminaRecovery?: number;
  };
  duration: number; // minutes
  recommendedFor: string[];
  recipe?: string;
  notes?: string;
}

export interface Potion {
  name: string;
  type: 'spell_power' | 'weapon_power' | 'immovable' | 'resource' | 'tri_stat' | 'heroism';
  effects: {
    restore: {
      health?: number;
      magicka?: number;
      stamina?: number;
    };
    buffs: string[];
    ultimateGain?: number;
  };
  duration: number; // seconds for buffs
  cooldown: number; // seconds
  recommendedFor: string[];
  recipe: string;
  notes?: string;
}

// FOOD - Raid Meta Options
export const RAID_FOODS: Food[] = [
  // HIGHEST DPS - Single Stat Foods (Max DPS, less survivability)
  {
    name: 'Thrice-Baked Gorapple Pie',
    quality: 'gold',
    type: 'single_stat',
    stats: {
      maxMagicka: 5395,
    },
    duration: 120,
    recommendedFor: ['Magicka DPS - Maximum Damage'],
    notes: 'Highest magicka DPS option but no health buffer',
  },
  {
    name: 'Hearty Garlic Corn Chowder',
    quality: 'gold',
    type: 'single_stat',
    stats: {
      maxStamina: 5395,
    },
    duration: 120,
    recommendedFor: ['Stamina DPS - Maximum Damage'],
    notes: 'Highest stamina DPS option but no health buffer',
  },

  // BALANCED - Bi-Stat Foods (Only ~1% less DPS, +5395 health)
  {
    name: 'Melon-Baked Parmesan Pork',
    quality: 'gold',
    type: 'health_magicka',
    stats: {
      maxHealth: 5395,
      maxMagicka: 4936,
    },
    duration: 120,
    recommendedFor: ['Magicka DPS - Balanced'],
    notes: 'Only ~1% less DPS than single-stat, but gain 5395 max health for survivability',
  },
  {
    name: 'Braised Rabbit with Spring Vegetables',
    quality: 'gold',
    type: 'health_stamina',
    stats: {
      maxHealth: 5395,
      maxStamina: 4936,
    },
    duration: 120,
    recommendedFor: ['Stamina DPS - Balanced'],
    notes: 'Only ~1% less DPS than single-stat, but gain 5395 max health for survivability',
  },

  // Stat + Recovery Options
  {
    name: 'Ghastly Eye Bowl',
    quality: 'gold',
    type: 'health_magicka',
    stats: {
      maxHealth: 3326,
      maxMagicka: 3080,
      magickaRecovery: 338,
    },
    duration: 120,
    recommendedFor: ['Magicka DPS - Sustain Focus'],
    recipe: 'Recipe: Ghastly Eye Bowl (purchasable during Witches Festival)',
  },
  {
    name: "Witchmother's Potent Brew",
    quality: 'purple',
    type: 'health_magicka',
    stats: {
      maxHealth: 2856,
      maxMagicka: 2639,
      magickaRecovery: 315,
    },
    duration: 120,
    recommendedFor: ['Magicka DPS - Budget Option'],
    recipe: 'Recipe: Witchmother\'s Potent Brew (Witches Festival)',
    notes: 'All-around balanced option for Magicka builds',
  },
  {
    name: 'Lava Foot Soup-and-Saltrice',
    quality: 'gold',
    type: 'health_stamina',
    stats: {
      maxStamina: 3326,
      staminaRecovery: 462,
    },
    duration: 120,
    recommendedFor: ['Stamina DPS - Sustain Focus'],
  },
  {
    name: 'Dubious Camoran Throne',
    quality: 'gold',
    type: 'health_stamina',
    stats: {
      maxHealth: 3326,
      maxStamina: 3080,
      staminaRecovery: 338,
    },
    duration: 120,
    recommendedFor: ['Stamina DPS - Balanced'],
    notes: 'All-around balanced option for Stamina builds',
  },
  {
    name: 'Clockwork Citrus Filet',
    quality: 'gold',
    type: 'health_magicka',
    stats: {
      maxHealth: 3326,
      maxMagicka: 3080,
      magickaRecovery: 338,
    },
    duration: 120,
    recommendedFor: ['Magicka DPS - Balanced'],
  },

  // Tri-Stat (Premium)
  {
    name: 'Artaeum Takeaway Broth',
    quality: 'gold',
    type: 'tri_stat',
    stats: {
      maxHealth: 3326,
      maxMagicka: 3080,
      maxStamina: 3080,
      healthRecovery: 338,
      magickaRecovery: 338,
      staminaRecovery: 338,
    },
    duration: 120,
    recommendedFor: ['Hybrid Builds', 'Tanks', 'Progression'],
    recipe: 'Psijic Ambrosia merchant (expensive)',
  },

  // Tank-Specific
  {
    name: 'Bewitched Sugar Skulls',
    quality: 'gold',
    type: 'max_resource',
    stats: {
      maxHealth: 4620,
      maxMagicka: 4250,
      maxStamina: 4250,
    },
    duration: 120,
    recommendedFor: ['Tanks', 'Magicka Tanks'],
    recipe: 'Witches Festival reward',
  },
];

// POTIONS - Raid Meta Options
export const RAID_POTIONS: Potion[] = [
  // Magicka DPS (Most Common)
  {
    name: 'Essence of Spell Power (Tri-Pot)',
    type: 'spell_power',
    effects: {
      restore: {
        health: 2800,
        magicka: 5400,
        stamina: 5400,
      },
      buffs: [
        'Major Sorcery (20% Spell Damage)',
        'Major Prophecy (1320 Spell Critical)',
        'Major Intellect (20% Magicka Recovery)',
      ],
    },
    duration: 47.6,
    cooldown: 45,
    recommendedFor: ['Magicka DPS', 'Magicka Healer'],
    recipe: 'Cornflower + Lady\'s Smock + Namira\'s Rot + Lorkhan\'s Tears',
  },

  // Stamina DPS
  {
    name: 'Essence of Weapon Power (Tri-Pot)',
    type: 'weapon_power',
    effects: {
      restore: {
        health: 2800,
        magicka: 5400,
        stamina: 5400,
      },
      buffs: [
        'Major Brutality (20% Weapon Damage)',
        'Major Savagery (1320 Weapon Critical)',
        'Major Endurance (20% Stamina Recovery)',
      ],
    },
    duration: 47.6,
    cooldown: 45,
    recommendedFor: ['Stamina DPS', 'Hybrid DPS'],
    recipe: 'Dragonthorn + Blessed Thistle + Namira\'s Rot + Lorkhan\'s Tears',
  },

  // Tank (Immovable)
  {
    name: 'Essence of Immovability',
    type: 'immovable',
    effects: {
      restore: {
        health: 2800,
        magicka: 5400,
        stamina: 5400,
      },
      buffs: [
        'Major Fortitude (20% Health Recovery)',
        'Unstoppable (Immunity to knockback/stun)',
      ],
    },
    duration: 47.6,
    cooldown: 45,
    recommendedFor: ['Tanks'],
    recipe: 'Columbine + Mountain Flower + Namira\'s Rot + Lorkhan\'s Tears',
  },

  // Healer (Resource)
  {
    name: 'Essence of Magicka (Mag-Heavy)',
    type: 'resource',
    effects: {
      restore: {
        health: 2800,
        magicka: 10800, // Double magicka restore
        stamina: 5400,
      },
      buffs: [
        'Major Intellect (20% Magicka Recovery)',
      ],
    },
    duration: 47.6,
    cooldown: 45,
    recommendedFor: ['Healers', 'Heavy Parse Sustain'],
    recipe: 'Bugloss + Columbine + Namira\'s Rot + Lorkhan\'s Tears',
  },

  // Tri-Stat Restoration (When buffs covered by skills)
  {
    name: 'Essence of Tri-Stat Restoration',
    type: 'tri_stat',
    effects: {
      restore: {
        health: 2800,
        magicka: 5400,
        stamina: 5400,
      },
      buffs: [],
    },
    duration: 0,
    cooldown: 45,
    recommendedFor: ['All roles when Major Buffs covered by skills'],
    recipe: 'Columbine + Mountain Flower + Bugloss + Lorkhan\'s Tears',
    notes: 'Use when you already have Major Sorcery/Brutality and Major Prophecy/Savagery from skills. Helps sustain both resource pools.',
  },

  // Heroism (Ultimate Generation)
  {
    name: 'Essence of Heroism',
    type: 'heroism',
    effects: {
      restore: {
        health: 2800,
        magicka: 5400,
        stamina: 5400,
      },
      buffs: [],
      ultimateGain: 106,
    },
    duration: 0,
    cooldown: 45,
    recommendedFor: ['Parse optimization with frequent ultimates'],
    recipe: 'Cornflower + Columbine + Dragonthorn + Lorkhan\'s Tears',
    notes: 'Very expensive ingredients. Superior for Ultimate generation but costs significantly more than other potions.',
  },
];

/**
 * Get recommended consumables based on build type
 */
export function getRecommendedConsumables(
  role: 'magicka_dps' | 'stamina_dps' | 'hybrid_dps' | 'tank' | 'healer',
  budget: 'budget' | 'standard' | 'premium' = 'standard'
): {
  food: Food[];
  potions: Potion[];
  tips: string[];
} {
  const food: Food[] = [];
  const potions: Potion[] = [];
  const tips: string[] = [];

  switch (role) {
    case 'magicka_dps':
      if (budget === 'premium') {
        // Max DPS option
        food.push(RAID_FOODS.find(f => f.name === 'Thrice-Baked Gorapple Pie')!);
        tips.push('Using single-stat food: Maximum DPS but no health buffer - requires confident mechanics');
      } else if (budget === 'standard') {
        // Balanced option - recommended for most players
        food.push(RAID_FOODS.find(f => f.name === 'Melon-Baked Parmesan Pork')!);
        tips.push('Balanced bi-stat food: Only ~1% less DPS than single-stat, but +5395 health for survivability');
      } else {
        // Budget option
        food.push(RAID_FOODS.find(f => f.name === "Witchmother's Potent Brew")!);
        tips.push('Budget option with magicka recovery - good all-around choice');
      }

      // Check if player has Major Sorcery/Prophecy from skills
      potions.push(RAID_POTIONS.find(p => p.name === 'Essence of Spell Power (Tri-Pot)')!);
      tips.push('Pre-pot 3 seconds before combat starts');
      tips.push('Use potion on cooldown (every 45s) for 100% Major buff uptime');
      tips.push('If you have Major Sorcery + Major Prophecy from slotted skills, consider Tri-Stat Restoration potion instead');
      break;

    case 'stamina_dps':
      if (budget === 'premium') {
        // Max DPS option
        food.push(RAID_FOODS.find(f => f.name === 'Hearty Garlic Corn Chowder')!);
        tips.push('Using single-stat food: Maximum DPS but no health buffer - requires confident mechanics');
      } else if (budget === 'standard') {
        // Balanced option - recommended for most players
        food.push(RAID_FOODS.find(f => f.name === 'Braised Rabbit with Spring Vegetables')!);
        tips.push('Balanced bi-stat food: Only ~1% less DPS than single-stat, but +5395 health for survivability');
      } else {
        // Budget option
        food.push(RAID_FOODS.find(f => f.name === 'Dubious Camoran Throne')!);
        tips.push('Budget option with stamina recovery - good all-around choice');
      }

      potions.push(RAID_POTIONS.find(p => p.name === 'Essence of Weapon Power (Tri-Pot)')!);
      tips.push('Pre-pot 3 seconds before combat starts');
      tips.push('Use potion on cooldown (every 45s) for 100% Major buff uptime');
      tips.push('If you have Major Brutality + Major Savagery from slotted skills, consider Tri-Stat Restoration potion instead');
      break;

    case 'hybrid_dps':
      food.push(RAID_FOODS.find(f => f.name === 'Artaeum Takeaway Broth')!);
      potions.push(RAID_POTIONS.find(p => p.name === 'Essence of Spell Power (Tri-Pot)')!);
      potions.push(RAID_POTIONS.find(p => p.name === 'Essence of Weapon Power (Tri-Pot)')!);
      tips.push('Choose potion based on primary damage type');
      break;

    case 'tank':
      food.push(RAID_FOODS.find(f => f.name === 'Bewitched Sugar Skulls')!);
      food.push(RAID_FOODS.find(f => f.name === 'Artaeum Takeaway Broth')!);
      potions.push(RAID_POTIONS.find(p => p.name === 'Essence of Immovability')!);
      tips.push('Use Immovability potions for hard CC immunity');
      tips.push('Pre-pot before pull for immediate Unstoppable');
      break;

    case 'healer':
      food.push(RAID_FOODS.find(f => f.name === 'Artaeum Takeaway Broth')!);
      potions.push(RAID_POTIONS.find(p => p.name === 'Essence of Magicka (Mag-Heavy)')!);
      potions.push(RAID_POTIONS.find(p => p.name === 'Essence of Spell Power (Tri-Pot)')!);
      tips.push('Magicka-heavy potions for sustain during intense healing phases');
      tips.push('Spell Power potions for damage phases');
      break;
  }

  return {
    food: food.filter(Boolean),
    potions: potions.filter(Boolean),
    tips,
  };
}

/**
 * Calculate expected stat gains from food
 */
export function calculateFoodBenefit(food: Food, baseStats: {
  maxHealth: number;
  maxMagicka: number;
  maxStamina: number;
}): {
  newStats: typeof baseStats;
  percentGain: { health: number; magicka: number; stamina: number };
} {
  const newStats = {
    maxHealth: baseStats.maxHealth + (food.stats.maxHealth || 0),
    maxMagicka: baseStats.maxMagicka + (food.stats.maxMagicka || 0),
    maxStamina: baseStats.maxStamina + (food.stats.maxStamina || 0),
  };

  const percentGain = {
    health: ((food.stats.maxHealth || 0) / baseStats.maxHealth) * 100,
    magicka: ((food.stats.maxMagicka || 0) / baseStats.maxMagicka) * 100,
    stamina: ((food.stats.maxStamina || 0) / baseStats.maxStamina) * 100,
  };

  return { newStats, percentGain };
}
