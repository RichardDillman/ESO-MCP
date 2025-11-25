/**
 * Build Recommendations System
 * Analyzes character data and provides gear and spell suggestions
 * Uses the database to look up set bonuses and identify optimizations
 */

import { prisma } from '../lib/prisma.js';

interface GearPiece {
  slot: string;
  name: string;
  quality: string;
  enchant?: string;
  trait?: string;
}

interface BuildRecommendation {
  category: 'gear' | 'skills' | 'stats' | 'passives' | 'optimization';
  priority: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  current?: string;
  suggestion: string;
  reasoning: string;
  dpsImpact?: string;
}

interface SetInfo {
  id: string;
  name: string;
  type: string;
  bonuses: Array<{
    pieces: number;
    effect: string | null;
    effectType: string | null;
  }>;
  buffsProvided: string[];
  tags: string[];
}

interface BuffSource {
  name: string;
  source: 'set' | 'skill' | 'mundus' | 'potion';
  sourceName: string;
}

/**
 * Extract set name from gear piece name
 * E.g., "Medusa's Inferno Staff" -> "Medusa"
 */
function extractSetName(gearName: string): string | null {
  // Common patterns for set names in gear
  // Remove suffixes like "of the...", slot names, etc.
  const cleanName = gearName
    .replace(/\s+(Inferno|Lightning|Ice|Restoration)\s+Staff$/i, '')
    .replace(/\s+(Sword|Axe|Mace|Dagger|Greatsword|Battle Axe|Maul|Bow|Shield)$/i, '')
    .replace(/\s+(Helmet|Hat|Hood|Mask|Cowl)$/i, '')
    .replace(/\s+(Jack|Robe|Jerkin|Cuirass|Harness)$/i, '')
    .replace(/\s+(Guards|Breeches|Greaves)$/i, '')
    .replace(/\s+(Epaulets|Pauldron|Arm Cops)$/i, '')
    .replace(/\s+(Bracers|Gloves|Gauntlets)$/i, '')
    .replace(/\s+(Belt|Sash|Girdle)$/i, '')
    .replace(/\s+(Boots|Shoes|Sabatons)$/i, '')
    .replace(/\s+(Necklace|Amulet|Pendant)$/i, '')
    .replace(/\s+(Ring|Band)$/i, '')
    .replace(/'s$/i, '')
    .trim();

  return cleanName || null;
}

/**
 * Parse buff names from a set bonus effect text
 */
function parseBuffsFromEffect(effect: string): string[] {
  const buffs: string[] = [];

  // Major/Minor buff patterns
  const buffPattern = /(Major|Minor)\s+([A-Z][a-z]+)/g;
  let match;
  while ((match = buffPattern.exec(effect)) !== null) {
    buffs.push(`${match[1]} ${match[2]}`);
  }

  // Also check for "Empower" which doesn't have Major/Minor prefix
  if (/\bEmpower\b/i.test(effect)) {
    buffs.push('Empower');
  }

  return buffs;
}

/**
 * Look up sets from database based on gear names
 */
async function lookupSetsFromGear(gear: GearPiece[]): Promise<Map<string, SetInfo>> {
  const setInfoMap = new Map<string, SetInfo>();

  // Extract potential set names from gear
  const potentialSetNames = new Set<string>();
  for (const piece of gear) {
    const setName = extractSetName(piece.name);
    if (setName) {
      potentialSetNames.add(setName);
    }
  }

  // Look up each potential set in the database
  for (const setName of potentialSetNames) {
    try {
      // Try exact match first, then fuzzy match
      const dbSet = await prisma.set.findFirst({
        where: {
          OR: [
            { name: setName },
            { name: { contains: setName } },
          ],
        },
        include: {
          bonuses: true,
        },
      });

      if (dbSet) {
        // Get tags for this set
        const itemTags = await prisma.itemTag.findMany({
          where: {
            itemId: dbSet.id,
            itemType: 'set',
          },
          include: {
            tag: true,
          },
        });

        const tags = itemTags.map(it => it.tag.name);

        // Parse buffs from bonuses
        const buffsProvided: string[] = [];
        for (const bonus of dbSet.bonuses) {
          if (bonus.effect) {
            buffsProvided.push(...parseBuffsFromEffect(bonus.effect));
          }
        }

        setInfoMap.set(setName, {
          id: dbSet.id,
          name: dbSet.name,
          type: dbSet.type,
          bonuses: dbSet.bonuses.map((b: { pieces: number; effect: string | null; effectType: string | null }) => ({
            pieces: b.pieces,
            effect: b.effect,
            effectType: b.effectType,
          })),
          buffsProvided: [...new Set(buffsProvided)],
          tags,
        });
      }
    } catch (_error) {
      // Silently continue if lookup fails
    }
  }

  return setInfoMap;
}

/**
 * Count how many pieces of each set the player has equipped
 */
function countSetPieces(gear: GearPiece[], setInfoMap: Map<string, SetInfo>): Map<string, number> {
  const setCounts = new Map<string, number>();

  for (const piece of gear) {
    const setName = extractSetName(piece.name);
    if (setName && setInfoMap.has(setName)) {
      setCounts.set(setName, (setCounts.get(setName) || 0) + 1);
    }
  }

  return setCounts;
}

/**
 * Identify all buff sources (from sets and skills)
 */
function identifyBuffSources(
  setInfoMap: Map<string, SetInfo>,
  setCounts: Map<string, number>,
  abilities: Array<{ name: string; percentOfTotal: number }>,
  _buffs: Array<{ name: string; uptime: number }>
): Map<string, BuffSource[]> {
  const buffSources = new Map<string, BuffSource[]>();

  // Add sources from sets
  for (const [setName, setInfo] of setInfoMap) {
    const pieceCount = setCounts.get(setName) || 0;

    // Check which bonuses are active based on piece count
    for (const bonus of setInfo.bonuses) {
      if (pieceCount >= bonus.pieces && bonus.effect) {
        const buffsFromBonus = parseBuffsFromEffect(bonus.effect);
        for (const buff of buffsFromBonus) {
          if (!buffSources.has(buff)) {
            buffSources.set(buff, []);
          }
          buffSources.get(buff)!.push({
            name: buff,
            source: 'set',
            sourceName: `${setInfo.name} (${bonus.pieces}pc)`,
          });
        }
      }
    }
  }

  // Add sources from skills (check ability names for known buff providers)
  const skillBuffMap: Record<string, string[]> = {
    'Trap Beast': ['Minor Force'],
    'Barbed Trap': ['Minor Force'],
    'Lightweight Beast Trap': ['Minor Force'],
    'Accelerate': ['Minor Force', 'Major Expedition'],
    'Channeled Acceleration': ['Minor Force', 'Major Expedition'],
    'Race Against Time': ['Minor Force', 'Major Expedition'],
    'Entropy': ['Major Sorcery', 'Major Prophecy'],
    'Degeneration': ['Major Sorcery', 'Major Prophecy'],
    'Structured Entropy': ['Major Sorcery', 'Major Prophecy'],
    'Camouflaged Hunter': ['Minor Berserk'],
    'Expert Hunter': ['Minor Berserk'],
    'Evil Hunter': ['Minor Berserk'],
    'Consuming Trap': ['Minor Force'],
    'Unstable Wall': [],
    'Elemental Blockade': [],
    'Molten Armaments': ['Major Brutality'],
    'Potent Brew': ['Major Sorcery'],
    'Rally': ['Major Brutality'],
    'Momentum': ['Major Brutality'],
    'Forward Momentum': ['Major Brutality'],
    'Inner Light': ['Major Prophecy', 'Major Savagery'],
    'Radiant Magelight': ['Major Prophecy', 'Major Savagery'],
    'Critical Surge': ['Major Brutality', 'Major Sorcery'],
    'Power Surge': ['Major Brutality', 'Major Sorcery'],
  };

  for (const ability of abilities) {
    const abilityName = ability.name;
    for (const [skillName, providedBuffs] of Object.entries(skillBuffMap)) {
      if (abilityName.toLowerCase().includes(skillName.toLowerCase())) {
        for (const buff of providedBuffs) {
          if (!buffSources.has(buff)) {
            buffSources.set(buff, []);
          }
          buffSources.get(buff)!.push({
            name: buff,
            source: 'skill',
            sourceName: abilityName,
          });
        }
      }
    }
  }

  return buffSources;
}

/**
 * Find sets that provide a specific buff
 */
async function findSetsProvidingBuff(buffName: string, limit: number = 5): Promise<SetInfo[]> {
  // Search for sets tagged with this buff
  const tagName = buffName.toLowerCase().replace(/\s+/g, '-');

  const taggedItems = await prisma.itemTag.findMany({
    where: {
      tag: {
        name: { contains: tagName },
      },
      itemType: 'set',
    },
    include: {
      tag: true,
    },
    take: limit * 2, // Get extra to filter
  });

  const setIds = [...new Set(taggedItems.map(it => it.itemId))];

  const sets = await prisma.set.findMany({
    where: {
      id: { in: setIds },
    },
    include: {
      bonuses: true,
    },
    take: limit,
  });

  return sets.map(s => ({
    id: s.id,
    name: s.name,
    type: s.type,
    bonuses: s.bonuses.map(b => ({
      pieces: b.pieces,
      effect: b.effect,
      effectType: b.effectType,
    })),
    buffsProvided: [],
    tags: [],
  }));
}

/**
 * Analyze gear setup and provide recommendations using database
 */
export async function analyzeGearWithDatabase(
  gear: GearPiece[],
  stats: {
    weaponDamage?: number;
    spellDamage?: number;
    criticalChance?: number;
    criticalDamage?: number;
    penetration?: number;
  },
  abilities: Array<{ name: string; percentOfTotal: number; total: number }>,
  buffs: Array<{ name: string; uptime: number }>
): Promise<BuildRecommendation[]> {
  const recommendations: BuildRecommendation[] = [];

  // Look up sets from database
  const setInfoMap = await lookupSetsFromGear(gear);
  const setCounts = countSetPieces(gear, setInfoMap);

  // Identify all buff sources
  const buffSources = identifyBuffSources(setInfoMap, setCounts, abilities, buffs);

  // Check for redundant buff sources (same buff from multiple sources)
  for (const [buff, sources] of buffSources) {
    if (sources.length > 1) {
      // Filter to active sources only
      const setSources = sources.filter(s => s.source === 'set');
      const skillSources = sources.filter(s => s.source === 'skill');

      if (setSources.length > 0 && skillSources.length > 0) {
        recommendations.push({
          category: 'optimization',
          priority: 'high',
          title: `Redundant ${buff} Sources`,
          current: sources.map(s => s.sourceName).join(' + '),
          suggestion: `You're getting ${buff} from both gear (${setSources[0].sourceName}) and skills (${skillSources[0].sourceName}). Consider swapping the set for more stats.`,
          reasoning: `${buff} doesn't stack from multiple sources. You're wasting a set bonus that could provide other benefits.`,
          dpsImpact: 'Could gain 3-8% DPS by using a different set',
        });
      } else if (setSources.length > 1) {
        recommendations.push({
          category: 'optimization',
          priority: 'high',
          title: `Multiple Sets Provide ${buff}`,
          current: setSources.map(s => s.sourceName).join(' + '),
          suggestion: `Both ${setSources[0].sourceName} and ${setSources[1].sourceName} provide ${buff}. One is redundant.`,
          reasoning: `${buff} doesn't stack. Consider replacing one set with something that provides different benefits.`,
          dpsImpact: 'Could gain 5-10% DPS by avoiding redundant buffs',
        });
      }
    }
  }

  // Check for incomplete sets
  for (const [setName, count] of setCounts) {
    const setInfo = setInfoMap.get(setName);
    if (setInfo) {
      // Find the highest bonus threshold not met
      const maxBonus = Math.max(...setInfo.bonuses.map(b => b.pieces));
      if (count < maxBonus && count >= 2) {
        const missingPieces = maxBonus - count;
        const lockedBonuses = setInfo.bonuses.filter(b => b.pieces > count);

        if (lockedBonuses.length > 0) {
          recommendations.push({
            category: 'gear',
            priority: 'high',
            title: `Incomplete Set: ${setInfo.name}`,
            current: `${count}/${maxBonus} pieces`,
            suggestion: `Add ${missingPieces} more piece(s) to unlock: ${lockedBonuses.map(b => `(${b.pieces}pc) ${b.effect?.substring(0, 50)}...`).join(', ')}`,
            reasoning: `You're missing significant set bonuses. The ${maxBonus}-piece bonus is often the most powerful.`,
          });
        }
      }
    }
  }

  // Check for missing important buffs and suggest sets
  const importantBuffs = [
    'Minor Force',
    'Major Brutality',
    'Major Sorcery',
    'Minor Berserk',
    'Major Savagery',
    'Major Prophecy',
  ];

  for (const buffName of importantBuffs) {
    const sources = buffSources.get(buffName);
    const buffUptime = buffs.find(b => b.name.toLowerCase().includes(buffName.toLowerCase()))?.uptime;

    if (!sources || sources.length === 0) {
      // Check if the buff is present but we couldn't identify the source
      if (!buffUptime || buffUptime < 50) {
        // Find sets that provide this buff
        const setsWithBuff = await findSetsProvidingBuff(buffName, 3);

        if (setsWithBuff.length > 0) {
          recommendations.push({
            category: 'gear',
            priority: buffName.includes('Force') || buffName.includes('Berserk') ? 'high' : 'medium',
            title: `Missing ${buffName}`,
            suggestion: `Consider using: ${setsWithBuff.map(s => s.name).join(', ')}`,
            reasoning: `${buffName} is a key damage buff. Getting it from gear frees up skill slots.`,
            dpsImpact: buffName.includes('Force') ? '~10% crit damage increase' :
              buffName.includes('Brutality') || buffName.includes('Sorcery') ? '~20% damage increase' :
                undefined,
          });
        }
      }
    }
  }

  // Check penetration against cap
  if (stats.penetration) {
    const penCap = 18200;
    if (stats.penetration > penCap + 1000) {
      const overPen = stats.penetration - penCap;
      recommendations.push({
        category: 'optimization',
        priority: 'medium',
        title: 'Penetration Over Cap',
        current: `${stats.penetration} penetration (cap: ${penCap})`,
        suggestion: `You have ${overPen} wasted penetration. Consider swapping penetration gear/glyphs for damage.`,
        reasoning: 'Penetration above the cap provides no benefit. Those stats could be weapon/spell damage instead.',
        dpsImpact: `~${Math.round(overPen / 100)}% potential DPS gain from reallocation`,
      });
    } else if (stats.penetration < 10000) {
      recommendations.push({
        category: 'stats',
        priority: 'high',
        title: 'Low Penetration',
        current: `${stats.penetration} penetration`,
        suggestion: 'Add penetration through sets (Alkosh, Crimson Oath), CP, or group support',
        reasoning: `Target resistance is ${penCap}. Low penetration significantly reduces damage output.`,
        dpsImpact: 'Could be losing 15-30% damage to unmitigated resistance',
      });
    }
  }

  // Check critical damage against soft cap
  if (stats.criticalDamage) {
    const critCap = 125;
    if (stats.criticalDamage > critCap + 10) {
      recommendations.push({
        category: 'optimization',
        priority: 'low',
        title: 'Critical Damage at Diminishing Returns',
        current: `${stats.criticalDamage.toFixed(1)}% crit damage`,
        suggestion: `Crit damage above ${critCap}% has heavy diminishing returns. Consider reallocating to other stats.`,
        reasoning: 'The crit damage formula reduces effectiveness beyond 125%. Other stats may provide better returns.',
      });
    }
  }

  // Check traits
  const divinesPieces = gear.filter(g => g.trait?.toLowerCase().includes('divines')).length;
  const bodyPieces = gear.filter(g =>
    ['chest', 'legs', 'head', 'shoulders', 'gloves', 'belt', 'boots'].some(slot =>
      g.slot.toLowerCase().includes(slot)
    )
  ).length;

  if (bodyPieces > 0 && divinesPieces < bodyPieces * 0.7) {
    recommendations.push({
      category: 'gear',
      priority: 'medium',
      title: 'Trait Optimization',
      current: `${divinesPieces}/${bodyPieces} body pieces with Divines`,
      suggestion: 'Use Divines trait on body pieces for maximum Mundus Stone benefit',
      reasoning: 'Divines increases Mundus bonus by 7% per piece. On 7 body pieces, this adds significant stats.',
    });
  }

  // Check enchants
  const noEnchant = gear.filter(g => !g.enchant || g.enchant === 'None' || g.enchant === '').length;
  if (noEnchant > 0) {
    recommendations.push({
      category: 'gear',
      priority: 'critical',
      title: 'Missing Enchantments',
      current: `${noEnchant} pieces without enchants`,
      suggestion: 'Enchant all gear: weapon/spell damage on jewelry, max resource on armor',
      reasoning: 'Each missing enchant is ~200-400 lost stats. Gold enchants are essential for competitive DPS.',
    });
  }

  return recommendations;
}

/**
 * Analyze gear setup and provide recommendations (legacy non-async version)
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
    const setName = extractSetName(piece.name);
    if (setName) {
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
 * Generate complete build recommendations from character data (async version with DB)
 */
export async function generateBuildRecommendationsAsync(characterData: {
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
}): Promise<{
  recommendations: BuildRecommendation[];
  summary: string;
  setsIdentified: string[];
  buffsFromGear: string[];
}> {
  const allRecommendations: BuildRecommendation[] = [];

  // Convert abilities format
  const abilitiesWithPercent = characterData.damage.abilities.map(a => ({
    name: a.name,
    total: a.total,
    percentOfTotal: a.percentage,
  }));

  // Enhanced gear analysis with database
  const gearRecs = await analyzeGearWithDatabase(
    characterData.summary.gear,
    characterData.summary.stats,
    abilitiesWithPercent,
    characterData.summary.buffs
  );
  allRecommendations.push(...gearRecs);

  // Skills analysis
  allRecommendations.push(
    ...analyzeSkills(abilitiesWithPercent, characterData.summary.buffs)
  );

  // Stats analysis
  allRecommendations.push(...analyzeStatDistribution(characterData.summary.stats));

  // Sort by priority
  const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
  allRecommendations.sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority]);

  // Get set info for summary
  const setInfoMap = await lookupSetsFromGear(characterData.summary.gear);
  const setCounts = countSetPieces(characterData.summary.gear, setInfoMap);
  const buffSources = identifyBuffSources(setInfoMap, setCounts, abilitiesWithPercent, characterData.summary.buffs);

  // Generate summary
  const critical = allRecommendations.filter(r => r.priority === 'critical').length;
  const high = allRecommendations.filter(r => r.priority === 'high').length;
  const medium = allRecommendations.filter(r => r.priority === 'medium').length;
  const optimization = allRecommendations.filter(r => r.category === 'optimization').length;

  let summary = `Found ${allRecommendations.length} recommendations:\n`;
  summary += `  Critical: ${critical}\n`;
  summary += `  High: ${high}\n`;
  summary += `  Medium: ${medium}\n`;
  if (optimization > 0) {
    summary += `  Optimization opportunities: ${optimization}\n`;
  }
  summary += '\n';

  if (critical > 0) {
    summary += 'Priority: Address critical issues first for immediate DPS gains.\n';
  } else if (optimization > 0) {
    summary += 'Priority: Check optimization recommendations - you may have redundant buffs.\n';
  } else if (high > 0) {
    summary += 'Priority: Focus on high-priority items for significant improvements.\n';
  } else {
    summary += 'Your build is well-optimized! Focus on rotation and weaving for further gains.\n';
  }

  // Collect buffs from gear
  const buffsFromGear: string[] = [];
  for (const [buff, sources] of buffSources) {
    const gearSources = sources.filter(s => s.source === 'set');
    if (gearSources.length > 0) {
      buffsFromGear.push(`${buff} (from ${gearSources[0].sourceName})`);
    }
  }

  return {
    recommendations: allRecommendations,
    summary,
    setsIdentified: [...setInfoMap.keys()],
    buffsFromGear,
  };
}

/**
 * Generate complete build recommendations from character data (legacy sync version)
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
