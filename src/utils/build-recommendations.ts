/**
 * Build Recommendations System
 * Analyzes character data and provides gear and spell suggestions
 */

interface GearPiece {
  slot: string;
  name: string;
  quality: string;
  enchant?: string;
  trait?: string;
}

interface BuildRecommendation {
  category: 'gear' | 'skills' | 'stats' | 'passives';
  priority: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  current?: string;
  suggestion: string;
  reasoning: string;
}

/**
 * Analyze gear setup and provide recommendations
 */
export function analyzeGear(
  gear: GearPiece[],
  stats: {
    weaponDamage?: number;
    spellDamage?: number;
    criticalChance?: number;
    penetration?: number;
  }
): BuildRecommendation[] {
  const recommendations: BuildRecommendation[] = [];

  // Extract set bonuses from gear names
  const setCount = new Map<string, number>();
  for (const piece of gear) {
    // Try to extract set name (first part before of/the/etc)
    const setMatch = piece.name.match(/^([A-Za-z\s]+?)(?:\s+(?:of|the|Helmet|Chest|Legs|Shoulders|Gloves|Belt|Boots|Sword|Staff|Bow|Necklace|Ring))/i);
    if (setMatch) {
      const setName = setMatch[1].trim();
      setCount.set(setName, (setCount.get(setName) || 0) + 1);
    }
  }

  // Check for incomplete sets
  for (const [setName, count] of setCount.entries()) {
    if (count < 5 && count > 1) {
      recommendations.push({
        category: 'gear',
        priority: 'high',
        title: `Incomplete Set: ${setName}`,
        current: `${count} pieces`,
        suggestion: `Complete the ${setName} set to get 5-piece bonus`,
        reasoning: 'Incomplete sets waste potential stat bonuses. Either complete the set or replace with a different set.',
      });
    }
  }

  // Check traits
  const divinesPieces = gear.filter(g => g.trait?.toLowerCase().includes('divines')).length;
  const bodyPieces = gear.filter(g => ['chest', 'legs', 'head', 'shoulders', 'gloves', 'belt', 'boots'].some(slot =>
    g.slot.toLowerCase().includes(slot)
  )).length;

  if (divinesPieces < bodyPieces * 0.7) {
    recommendations.push({
      category: 'gear',
      priority: 'medium',
      title: 'Trait Optimization',
      current: `${divinesPieces}/${bodyPieces} Divines`,
      suggestion: 'Use Divines trait on body pieces for maximum stat bonuses',
      reasoning: 'Divines trait increases Mundus Stone bonuses by 7% per piece, significantly boosting your primary stat.',
    });
  }

  // Check enchants
  const noEnchant = gear.filter(g => !g.enchant || g.enchant === 'None').length;
  if (noEnchant > 0) {
    recommendations.push({
      category: 'gear',
      priority: 'critical',
      title: 'Missing Enchantments',
      current: `${noEnchant} pieces without enchants`,
      suggestion: 'Enchant all gear pieces with appropriate glyphs',
      reasoning: 'Missing enchantments means missing significant stat bonuses. Use weapon/spell damage on jewelry, max resource on armor.',
    });
  }

  // Check penetration
  if (stats.penetration && stats.penetration < 16000) {
    recommendations.push({
      category: 'gear',
      priority: 'high',
      title: 'Low Penetration',
      current: `${stats.penetration} penetration`,
      suggestion: 'Add penetration through sets (Alkosh, Crimson Oath) or champion points',
      reasoning: 'Penetration cap is 18,200. Low penetration significantly reduces your damage output against resistant targets.',
    });
  }

  return recommendations;
}

/**
 * Analyze skill/spell setup and provide recommendations
 */
export function analyzeSkills(
  abilities: Array<{ name: string; percentOfTotal: number; total: number }>,
  buffs: Array<{ name: string; uptime: number }>
): BuildRecommendation[] {
  const recommendations: BuildRecommendation[] = [];

  // Check if spammable is top damage
  const topAbility = abilities[0];
  if (topAbility && topAbility.percentOfTotal < 15) {
    recommendations.push({
      category: 'skills',
      priority: 'high',
      title: 'Low Spammable Damage',
      current: `${topAbility.name}: ${topAbility.percentOfTotal.toFixed(1)}%`,
      suggestion: 'Increase spammable usage or switch to a higher damage spammable',
      reasoning: 'Your main spammable should be 15-25% of total damage. Low percentage suggests rotation issues or weak spammable choice.',
    });
  }

  // Check for DoT abilities
  const dotNames = [
    'Barbed Trap', 'Endless Hail', 'Unstable Wall', 'Mystic Orb',
    'Burning Embers', 'Poison Injection', 'Entropy', 'Degeneration',
    'Twisting Path', 'Solar Barrage', 'Stampede'
  ];

  const dotsUsed = abilities.filter(a =>
    dotNames.some(dot => a.name.toLowerCase().includes(dot.toLowerCase()))
  ).length;

  if (dotsUsed < 3) {
    recommendations.push({
      category: 'skills',
      priority: 'high',
      title: 'Insufficient DoT Coverage',
      current: `${dotsUsed} DoT abilities`,
      suggestion: 'Add more damage-over-time abilities to your rotation',
      reasoning: 'DoTs provide consistent damage and free up GCDs for weaving. Aim for 3-5 different DoTs.',
    });
  }

  // Check for execute abilities
  const executeNames = ['Killer\'s Blade', 'Executioner', 'Impale', 'Mages\' Fury'];
  const hasExecute = abilities.some(a =>
    executeNames.some(exec => a.name.toLowerCase().includes(exec.toLowerCase()))
  );

  if (!hasExecute) {
    recommendations.push({
      category: 'skills',
      priority: 'medium',
      title: 'Missing Execute',
      suggestion: 'Add an execute ability for sub-25% health burst damage',
      reasoning: 'Execute abilities deal significantly more damage to low-health targets, improving overall DPS.',
    });
  }

  // Check for passive skill line buffs
  const fightersGuildAbilities = abilities.filter(a =>
    a.name.toLowerCase().includes('trap') ||
    a.name.toLowerCase().includes('dawnbreaker')
  );

  if (fightersGuildAbilities.length === 0) {
    recommendations.push({
      category: 'passives',
      priority: 'medium',
      title: 'Missing Fighters Guild Passives',
      suggestion: 'Slot a Fighters Guild ability for passive bonuses',
      reasoning: 'Fighters Guild passives provide 3% weapon damage per slotted ability. Slotting Barbed Trap or Dawnbreaker activates these bonuses.',
    });
  }

  // Check major/minor buff uptimes
  const importantBuffs = [
    { name: 'Major Brutality', target: 95 },
    { name: 'Major Sorcery', target: 95 },
    { name: 'Major Savagery', target: 95 },
    { name: 'Major Prophecy', target: 95 },
    { name: 'Minor Berserk', target: 90 },
    { name: 'Minor Slayer', target: 90 },
  ];

  for (const buff of importantBuffs) {
    const currentBuff = buffs.find(b => b.name.toLowerCase().includes(buff.name.toLowerCase()));
    if (!currentBuff) {
      recommendations.push({
        category: 'skills',
        priority: 'high',
        title: `Missing ${buff.name}`,
        suggestion: `Add ability that provides ${buff.name}`,
        reasoning: `${buff.name} is a core damage buff that should have near-permanent uptime.`,
      });
    } else if (currentBuff.uptime < buff.target) {
      recommendations.push({
        category: 'skills',
        priority: 'medium',
        title: `Low ${buff.name} Uptime`,
        current: `${currentBuff.uptime.toFixed(1)}% uptime`,
        suggestion: `Maintain ${buff.name} above ${buff.target}% uptime`,
        reasoning: 'Inconsistent buff uptime reduces overall damage. Pre-buff before combat and refresh proactively.',
      });
    }
  }

  return recommendations;
}

/**
 * Analyze stat distribution and provide recommendations
 */
export function analyzeStatDistribution(stats: {
  weaponDamage?: number;
  spellDamage?: number;
  maxMagicka?: number;
  maxStamina?: number;
  criticalChance?: number;
  criticalDamage?: number;
  penetration?: number;
}): BuildRecommendation[] {
  const recommendations: BuildRecommendation[] = [];

  const isStamina = (stats.weaponDamage || 0) > (stats.spellDamage || 0);
  const primaryDamage = isStamina ? stats.weaponDamage : stats.spellDamage;
  const primaryResource = isStamina ? stats.maxStamina : stats.maxMagicka;

  // Check primary damage stat
  if (primaryDamage && primaryDamage < 6000) {
    recommendations.push({
      category: 'stats',
      priority: 'critical',
      title: 'Low Primary Damage Stat',
      current: `${primaryDamage} ${isStamina ? 'weapon' : 'spell'} damage`,
      suggestion: 'Increase to 6,500+ through gear, food, and champion points',
      reasoning: 'Primary damage stat should be 6,500-7,500 buffed for competitive DPS. Low values indicate gear or CP issues.',
    });
  } else if (primaryDamage && primaryDamage < 6500) {
    recommendations.push({
      category: 'stats',
      priority: 'medium',
      title: 'Improve Primary Damage Stat',
      current: `${primaryDamage} ${isStamina ? 'weapon' : 'spell'} damage`,
      suggestion: 'Aim for 6,500-7,500 through optimization',
      reasoning: 'Higher primary stat directly increases all ability damage.',
    });
  }

  // Check max resource
  if (primaryResource && primaryResource < 25000) {
    recommendations.push({
      category: 'stats',
      priority: 'high',
      title: 'Low Max Resource',
      current: `${primaryResource} ${isStamina ? 'stamina' : 'magicka'}`,
      suggestion: 'Increase max resource to 28,000-32,000',
      reasoning: 'Max resource affects ability damage and sustain. Use food and enchants to increase.',
    });
  }

  // Check critical chance
  if (stats.criticalChance && stats.criticalChance < 60) {
    recommendations.push({
      category: 'stats',
      priority: 'high',
      title: 'Low Critical Chance',
      current: `${stats.criticalChance.toFixed(1)}% crit`,
      suggestion: 'Increase to 67%+ with Thief mundus and gear',
      reasoning: 'Critical chance should be ~67% (50% base + Thief mundus + gear). Low crit reduces burst potential.',
    });
  }

  // Check critical damage
  if (stats.criticalDamage && stats.criticalDamage < 110) {
    recommendations.push({
      category: 'stats',
      priority: 'medium',
      title: 'Low Critical Damage',
      current: `${stats.criticalDamage.toFixed(1)}% crit damage`,
      suggestion: 'Increase to 115-125% through CP and gear',
      reasoning: 'Critical damage multiplies all crits. Aim for 115-125% for optimal damage without diminishing returns.',
    });
  } else if (stats.criticalDamage && stats.criticalDamage > 130) {
    recommendations.push({
      category: 'stats',
      priority: 'low',
      title: 'Critical Damage at Diminishing Returns',
      current: `${stats.criticalDamage.toFixed(1)}% crit damage`,
      suggestion: 'Consider reallocating points above 125% to other stats',
      reasoning: 'Crit damage has diminishing returns above 125%. You may get better returns from other stats.',
    });
  }

  return recommendations;
}

/**
 * Generate complete build recommendations from character data
 */
export function generateBuildRecommendations(characterData: {
  damage: {
    dps: number;
    abilities: Array<{ name: string; total: number; percentage: number }>;
  };
  summary: {
    stats: any;
    gear: GearPiece[];
    buffs: Array<{ name: string; uptime: number }>;
  };
  class?: string;
}): {
  recommendations: BuildRecommendation[];
  summary: string;
} {
  const allRecommendations: BuildRecommendation[] = [];

  // Gear analysis
  allRecommendations.push(
    ...analyzeGear(
      characterData.summary.gear,
      characterData.summary.stats
    )
  );

  // Skills analysis
  const abilitiesWithPercent = characterData.damage.abilities.map(a => ({
    name: a.name,
    total: a.total,
    percentOfTotal: a.percentage,
  }));

  allRecommendations.push(
    ...analyzeSkills(
      abilitiesWithPercent,
      characterData.summary.buffs
    )
  );

  // Stats analysis
  allRecommendations.push(...analyzeStatDistribution(characterData.summary.stats));

  // Sort by priority
  const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
  allRecommendations.sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority]);

  // Generate summary
  const critical = allRecommendations.filter(r => r.priority === 'critical').length;
  const high = allRecommendations.filter(r => r.priority === 'high').length;
  const medium = allRecommendations.filter(r => r.priority === 'medium').length;

  let summary = `Found ${allRecommendations.length} recommendations:\n`;
  summary += `  Critical: ${critical}\n`;
  summary += `  High: ${high}\n`;
  summary += `  Medium: ${medium}\n\n`;

  if (critical > 0) {
    summary += 'Priority: Address critical issues first for immediate DPS gains.\n';
  } else if (high > 0) {
    summary += 'Priority: Focus on high-priority items for significant improvements.\n';
  } else {
    summary += 'Your build is well-optimized! Focus on rotation and weaving for further gains.\n';
  }

  return {
    recommendations: allRecommendations,
    summary,
  };
}
