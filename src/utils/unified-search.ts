/**
 * Unified ESO Data Search
 * Searches across all ESO data types (skills, sets, buffs, debuffs, mundus stones, etc.)
 */

import { prisma } from '../lib/prisma.js';
import { MUNDUS_STONES_DATA } from '../data/mundus-stones-data.js';

export interface UnifiedSearchResult {
  type: 'skill' | 'set' | 'buff' | 'debuff' | 'mundus' | 'race' | 'class' | 'cap' | 'dummy';
  id: string;
  name: string;
  description?: string;
  category?: string;
  data: any; // Full data object
  relevance: number; // Search relevance score
}

/**
 * Search across all ESO data types
 */
export async function unifiedSearch(query: string, limit: number = 10): Promise<UnifiedSearchResult[]> {
  const results: UnifiedSearchResult[] = [];
  const searchTerm = query.toLowerCase();

  // Search Skills
  const skills = await prisma.skill.findMany({
    where: {
      OR: [
        { name: { contains: query } },
        { description: { contains: query } },
      ],
    },
    take: limit,
    include: {
      effects: true,
      morphs: true,
      scaling: true,
    },
  });

  for (const skill of skills) {
    const nameMatch = skill.name.toLowerCase().includes(searchTerm);
    const exactMatch = skill.name.toLowerCase() === searchTerm;
    results.push({
      type: 'skill',
      id: skill.id,
      name: skill.name,
      description: skill.description || undefined,
      category: `${skill.category} - ${skill.skillLine}`,
      data: skill,
      relevance: exactMatch ? 100 : nameMatch ? 80 : 50,
    });
  }

  // Search Sets
  const sets = await prisma.set.findMany({
    where: {
      OR: [
        { name: { contains: query } },
      ],
    },
    take: limit,
    include: {
      bonuses: true,
    },
  });

  for (const set of sets) {
    const nameMatch = set.name.toLowerCase().includes(searchTerm);
    const exactMatch = set.name.toLowerCase() === searchTerm;
    results.push({
      type: 'set',
      id: set.id,
      name: set.name,
      category: `${set.type} - ${set.location}`,
      data: set,
      relevance: exactMatch ? 100 : nameMatch ? 80 : 50,
    });
  }

  // Search Buffs
  const buffs = await prisma.buff.findMany({
    where: {
      OR: [
        { name: { contains: query } },
        { description: { contains: query } },
      ],
    },
    take: limit,
  });

  for (const buff of buffs) {
    const nameMatch = buff.name.toLowerCase().includes(searchTerm);
    const exactMatch = buff.name.toLowerCase() === searchTerm;
    results.push({
      type: 'buff',
      id: buff.id,
      name: buff.name,
      description: buff.description || undefined,
      category: buff.type || 'Buff',
      data: buff,
      relevance: exactMatch ? 100 : nameMatch ? 80 : 50,
    });
  }

  // Search Debuffs
  const debuffs = await prisma.debuff.findMany({
    where: {
      OR: [
        { name: { contains: query } },
        { description: { contains: query } },
      ],
    },
    take: limit,
  });

  for (const debuff of debuffs) {
    const nameMatch = debuff.name.toLowerCase().includes(searchTerm);
    const exactMatch = debuff.name.toLowerCase() === searchTerm;
    results.push({
      type: 'debuff',
      id: debuff.id,
      name: debuff.name,
      description: debuff.description || undefined,
      category: debuff.type || 'Debuff',
      data: debuff,
      relevance: exactMatch ? 100 : nameMatch ? 80 : 50,
    });
  }

  // Search Mundus Stones (in-memory data)
  for (const stone of MUNDUS_STONES_DATA) {
    const nameMatch = stone.name.toLowerCase().includes(searchTerm);
    const exactMatch = stone.name.toLowerCase() === searchTerm;
    const effectMatch = stone.effects.some(e => e.type.toLowerCase().includes(searchTerm));

    if (nameMatch || effectMatch) {
      results.push({
        type: 'mundus',
        id: stone.name,
        name: stone.name,
        description: stone.effects.map(e => `${e.type}: +${e.baseValue}`).join(', '),
        category: 'Mundus Stone',
        data: stone,
        relevance: exactMatch ? 100 : nameMatch ? 80 : effectMatch ? 60 : 50,
      });
    }
  }

  // Search Races
  const races = await prisma.race.findMany({
    where: {
      name: { contains: query },
    },
    take: limit,
    include: {
      passives: true,
    },
  });

  for (const race of races) {
    const nameMatch = race.name.toLowerCase().includes(searchTerm);
    const exactMatch = race.name.toLowerCase() === searchTerm;
    results.push({
      type: 'race',
      id: race.id,
      name: race.name,
      description: race.description || undefined,
      category: `Race - ${race.alliance}`,
      data: race,
      relevance: exactMatch ? 100 : nameMatch ? 80 : 50,
    });
  }

  // Search Classes
  const classes = await prisma.class.findMany({
    where: {
      name: { contains: query },
    },
    take: limit,
  });

  for (const cls of classes) {
    const nameMatch = cls.name.toLowerCase().includes(searchTerm);
    const exactMatch = cls.name.toLowerCase() === searchTerm;
    results.push({
      type: 'class',
      id: cls.id,
      name: cls.name,
      description: cls.description || undefined,
      category: 'Class',
      data: cls,
      relevance: exactMatch ? 100 : nameMatch ? 80 : 50,
    });
  }

  // Search Target Dummies
  const dummies = await prisma.targetDummy.findMany({
    where: {
      OR: [
        { name: { contains: query } },
        { description: { contains: query } },
      ],
    },
    take: limit,
  });

  for (const dummy of dummies) {
    const nameMatch = dummy.name.toLowerCase().includes(searchTerm);
    const exactMatch = dummy.name.toLowerCase() === searchTerm;
    const descMatch = dummy.description.toLowerCase().includes(searchTerm);
    results.push({
      type: 'dummy',
      id: dummy.id,
      name: dummy.name,
      description: dummy.description || undefined,
      category: 'Target Dummy',
      data: dummy,
      relevance: exactMatch ? 100 : nameMatch ? 80 : descMatch ? 60 : 50,
    });
  }

  // TODO: Add Combat Caps search when the model is created

  // Sort by relevance (highest first) and limit results
  return results
    .sort((a, b) => b.relevance - a.relevance)
    .slice(0, limit);
}

/**
 * Get detailed information for a specific result
 */
export async function getDetailedInfo(type: string, id: string): Promise<any> {
  switch (type) {
    case 'skill':
      return await prisma.skill.findUnique({
        where: { id },
        include: {
          effects: true,
          morphs: true,
          scaling: true,
          requirements: true,
          baseSkill: true,
          morphedSkills: {
            include: { morphs: true },
          },
        },
      });

    case 'set':
      return await prisma.set.findUnique({
        where: { id },
        include: { bonuses: true },
      });

    case 'buff':
      return await prisma.buff.findUnique({
        where: { id },
      });

    case 'debuff':
      return await prisma.debuff.findUnique({
        where: { id },
      });

    case 'mundus':
      return MUNDUS_STONES_DATA.find(s => s.name === id);

    case 'race':
      return await prisma.race.findUnique({
        where: { id },
        include: { passives: true },
      });

    case 'class':
      return await prisma.class.findUnique({
        where: { id },
      });

    case 'dummy':
      const dummy = await prisma.targetDummy.findUnique({
        where: { id },
      });
      if (dummy) {
        return {
          ...dummy,
          buffsProvided: JSON.parse(dummy.buffsProvided),
          debuffsProvided: JSON.parse(dummy.debuffsProvided),
        };
      }
      return null;

    case 'cap':
      // TODO: Implement when combat caps model is created
      throw new Error('Combat caps not yet implemented');

    default:
      throw new Error(`Unknown type: ${type}`);
  }
}
