import { prisma } from '../src/lib/prisma.js';

// Pattern matchers for auto-tagging
// Each pattern maps regex patterns to tag names
const TAG_PATTERNS: { pattern: RegExp; tags: string[] }[] = [
  // === MAJOR BUFFS ===
  { pattern: /major\s+force/i, tags: ['major-force'] },
  { pattern: /major\s+berserk/i, tags: ['major-berserk'] },
  { pattern: /major\s+breach/i, tags: ['major-breach'] },
  { pattern: /major\s+brutality/i, tags: ['major-brutality'] },
  { pattern: /major\s+sorcery/i, tags: ['major-sorcery'] },
  { pattern: /major\s+courage/i, tags: ['major-courage'] },
  { pattern: /major\s+resolve/i, tags: ['major-resolve'] },
  { pattern: /major\s+protection/i, tags: ['major-protection'] },
  { pattern: /major\s+evasion/i, tags: ['major-evasion'] },
  { pattern: /major\s+expedition/i, tags: ['major-expedition'] },
  { pattern: /major\s+heroism/i, tags: ['major-heroism'] },
  { pattern: /major\s+vitality/i, tags: ['major-vitality'] },
  { pattern: /major\s+mending/i, tags: ['major-mending'] },
  { pattern: /major\s+savagery/i, tags: ['major-savagery'] },
  { pattern: /major\s+prophecy/i, tags: ['major-prophecy'] },
  { pattern: /major\s+slayer/i, tags: ['major-slayer'] },
  { pattern: /major\s+aegis/i, tags: ['major-aegis'] },
  { pattern: /major\s+maim/i, tags: ['major-maim'] },
  { pattern: /major\s+vulnerability/i, tags: ['major-vulnerability'] },
  { pattern: /major\s+fortitude/i, tags: ['major-fortitude'] },
  { pattern: /major\s+intellect/i, tags: ['major-intellect'] },

  // === MINOR BUFFS ===
  { pattern: /minor\s+force/i, tags: ['minor-force'] },
  { pattern: /minor\s+berserk/i, tags: ['minor-berserk'] },
  { pattern: /minor\s+breach/i, tags: ['minor-breach'] },
  { pattern: /minor\s+brutality/i, tags: ['minor-brutality'] },
  { pattern: /minor\s+sorcery/i, tags: ['minor-sorcery'] },
  { pattern: /minor\s+courage/i, tags: ['minor-courage'] },
  { pattern: /minor\s+resolve/i, tags: ['minor-resolve'] },
  { pattern: /minor\s+protection/i, tags: ['minor-protection'] },
  { pattern: /minor\s+evasion/i, tags: ['minor-evasion'] },
  { pattern: /minor\s+expedition/i, tags: ['minor-expedition'] },
  { pattern: /minor\s+heroism/i, tags: ['minor-heroism'] },
  { pattern: /minor\s+vitality/i, tags: ['minor-vitality'] },
  { pattern: /minor\s+mending/i, tags: ['minor-mending'] },
  { pattern: /minor\s+savagery/i, tags: ['minor-savagery'] },
  { pattern: /minor\s+prophecy/i, tags: ['minor-prophecy'] },
  { pattern: /minor\s+slayer/i, tags: ['minor-slayer'] },
  { pattern: /minor\s+aegis/i, tags: ['minor-aegis'] },
  { pattern: /minor\s+maim/i, tags: ['minor-maim'] },
  { pattern: /minor\s+vulnerability/i, tags: ['minor-vulnerability'] },
  { pattern: /minor\s+endurance/i, tags: ['minor-endurance'] },
  { pattern: /minor\s+fortitude/i, tags: ['minor-fortitude'] },
  { pattern: /minor\s+intellect/i, tags: ['minor-intellect'] },
  { pattern: /minor\s+toughness/i, tags: ['minor-toughness'] },

  // === OTHER BUFFS/DEBUFFS ===
  { pattern: /\bempower(ed)?\b/i, tags: ['empower'] },
  { pattern: /off[\s-]?balance/i, tags: ['off-balance'] },

  // === RESOURCES (Max) ===
  { pattern: /max(imum)?\s+stamina/i, tags: ['max-stamina'] },
  { pattern: /stamina\s+by\s+\d/i, tags: ['max-stamina'] },
  { pattern: /max(imum)?\s+magicka/i, tags: ['max-magicka'] },
  { pattern: /magicka\s+by\s+\d/i, tags: ['max-magicka'] },
  { pattern: /max(imum)?\s+health/i, tags: ['max-health'] },
  { pattern: /health\s+by\s+\d/i, tags: ['max-health'] },

  // === RESOURCES (Recovery) ===
  { pattern: /stamina\s+recovery/i, tags: ['stamina-recovery'] },
  { pattern: /magicka\s+recovery/i, tags: ['magicka-recovery'] },
  { pattern: /health\s+recovery/i, tags: ['health-recovery'] },

  // === RESOURCES (Restore) ===
  { pattern: /restore(s)?\s+\d+.*stamina/i, tags: ['restore-stamina'] },
  { pattern: /restore(s)?\s+\d+.*magicka/i, tags: ['restore-magicka'] },
  { pattern: /restore(s)?\s+\d+.*health/i, tags: ['restore-health'] },
  { pattern: /return(s)?\s+\d+.*stamina/i, tags: ['restore-stamina'] },
  { pattern: /return(s)?\s+\d+.*magicka/i, tags: ['restore-magicka'] },
  { pattern: /return(s)?\s+\d+.*health/i, tags: ['restore-health'] },
  { pattern: /gain(s)?\s+\d+.*stamina/i, tags: ['restore-stamina'] },
  { pattern: /gain(s)?\s+\d+.*magicka/i, tags: ['restore-magicka'] },
  { pattern: /gain(s)?\s+\d+.*health/i, tags: ['restore-health'] },

  // === OFFENSIVE STATS ===
  { pattern: /weapon\s+damage/i, tags: ['weapon-damage'] },
  { pattern: /spell\s+damage/i, tags: ['spell-damage'] },
  { pattern: /weapon\s+(and\s+spell\s+)?damage/i, tags: ['weapon-damage', 'spell-damage'] },
  { pattern: /weapon\s+critical/i, tags: ['weapon-critical'] },
  { pattern: /spell\s+critical/i, tags: ['spell-critical'] },
  { pattern: /critical\s+(strike\s+)?damage/i, tags: ['critical-damage'] },
  { pattern: /critical\s+(strike\s+)?chance/i, tags: ['critical-chance'] },
  { pattern: /critical\s+rating/i, tags: ['critical-chance'] },
  { pattern: /penetration/i, tags: ['penetration'] },
  { pattern: /physical\s+penetration/i, tags: ['physical-penetration', 'penetration'] },
  { pattern: /spell\s+penetration/i, tags: ['spell-penetration', 'penetration'] },

  // === DEFENSIVE STATS ===
  { pattern: /physical\s+resistance/i, tags: ['physical-resistance', 'armor'] },
  { pattern: /spell\s+resistance/i, tags: ['spell-resistance', 'armor'] },
  { pattern: /physical\s+and\s+spell\s+resistance/i, tags: ['physical-resistance', 'spell-resistance', 'armor'] },
  { pattern: /\barmor\b/i, tags: ['armor'] },
  { pattern: /block\s+cost/i, tags: ['block-cost'] },
  { pattern: /blocking/i, tags: ['block-mitigation'] },
  { pattern: /healing\s+received/i, tags: ['healing-received'] },
  { pattern: /shield\s+strength/i, tags: ['shield-strength'] },
  { pattern: /damage\s+taken.*reduced/i, tags: ['damage-reduction'] },
  { pattern: /reduce(s|d)?\s+damage\s+taken/i, tags: ['damage-reduction'] },
  { pattern: /take(s)?\s+\d+%?\s+less\s+damage/i, tags: ['damage-reduction'] },

  // === DAMAGE TYPES ===
  { pattern: /flame\s+damage/i, tags: ['flame-damage'] },
  { pattern: /fire\s+damage/i, tags: ['flame-damage'] },
  { pattern: /frost\s+damage/i, tags: ['frost-damage'] },
  { pattern: /ice\s+damage/i, tags: ['frost-damage'] },
  { pattern: /shock\s+damage/i, tags: ['shock-damage'] },
  { pattern: /lightning\s+damage/i, tags: ['shock-damage'] },
  { pattern: /poison\s+damage/i, tags: ['poison-damage'] },
  { pattern: /disease\s+damage/i, tags: ['disease-damage'] },
  { pattern: /physical\s+damage/i, tags: ['physical-damage'] },
  { pattern: /magic(al)?\s+damage/i, tags: ['magic-damage'] },
  { pattern: /bleed(ing)?\s+damage/i, tags: ['bleed-damage'] },
  { pattern: /oblivion\s+damage/i, tags: ['oblivion-damage'] },

  // === CROWD CONTROL ===
  { pattern: /\bstun(s|ned|ning)?\b/i, tags: ['stun'] },
  { pattern: /\bsnare(s|d)?\b/i, tags: ['snare'] },
  { pattern: /slow(s|ed|ing)?\s+(movement|target|enemies)/i, tags: ['snare'] },
  { pattern: /immobilize(s|d)?/i, tags: ['immobilize'] },
  { pattern: /root(s|ed)?/i, tags: ['immobilize'] },
  { pattern: /\bfear(s|ed)?\b/i, tags: ['fear'] },
  { pattern: /knock(s|ed)?\s+back/i, tags: ['knockback'] },
  { pattern: /knockback/i, tags: ['knockback'] },
  { pattern: /knock(s|ed)?\s+down/i, tags: ['knockdown'] },
  { pattern: /pull(s|ed)?\s+(target|enemies|nearby)/i, tags: ['pull'] },
  { pattern: /interrupt(s|ed)?/i, tags: ['interrupt'] },
  { pattern: /silence(s|d)?/i, tags: ['silence'] },
  { pattern: /\btaunt(s|ed)?\b/i, tags: ['taunt'] },

  // === PROC CONDITIONS ===
  { pattern: /when\s+you\s+deal\s+critical/i, tags: ['on-critical'] },
  { pattern: /critical\s+(strike|hit).*proc/i, tags: ['on-critical'] },
  { pattern: /when\s+you\s+take\s+damage/i, tags: ['on-damage-taken'] },
  { pattern: /when\s+you\s+kill/i, tags: ['on-kill'] },
  { pattern: /killing\s+an?\s+(enemy|target)/i, tags: ['on-kill'] },
  { pattern: /light\s+attack/i, tags: ['on-light-attack'] },
  { pattern: /heavy\s+attack/i, tags: ['on-heavy-attack'] },
  { pattern: /when\s+you\s+deal\s+direct\s+damage/i, tags: ['on-direct-damage'] },
  { pattern: /damage\s+over\s+time/i, tags: ['on-dot-damage', 'dot'] },
  { pattern: /when\s+you\s+heal/i, tags: ['on-heal'] },
  { pattern: /when\s+you\s+block/i, tags: ['on-block'] },
  { pattern: /when\s+you\s+dodge\s+roll/i, tags: ['on-dodge'] },
  { pattern: /when\s+you\s+swap\s+bars?/i, tags: ['on-bar-swap'] },
  { pattern: /\d+\s+second\s+cooldown/i, tags: ['cooldown-based'] },

  // === MECHANICS ===
  { pattern: /area\s+of\s+effect/i, tags: ['aoe'] },
  { pattern: /\baoe\b/i, tags: ['aoe'] },
  { pattern: /enemies\s+within\s+\d+\s+meters/i, tags: ['aoe'] },
  { pattern: /nearby\s+enemies/i, tags: ['aoe'] },
  { pattern: /single\s+target/i, tags: ['single-target'] },
  { pattern: /damage\s+over\s+time/i, tags: ['dot'] },
  { pattern: /\d+\s+seconds?,?\s+dealing/i, tags: ['dot'] },
  { pattern: /heal(s|ing)?\s+over\s+time/i, tags: ['hot'] },
  { pattern: /heal(s)?\s+you\s+for/i, tags: ['self-heal'] },
  { pattern: /heal(s)?\s+(yourself|you)/i, tags: ['self-heal'] },
  { pattern: /heal(s)?\s+(nearby\s+)?allies/i, tags: ['group-heal'] },
  { pattern: /heal(s)?\s+(up\s+to\s+)?\d+\s+allies/i, tags: ['group-heal'] },
  { pattern: /damage\s+shield/i, tags: ['shield'] },
  { pattern: /shield\s+that\s+absorbs/i, tags: ['shield'] },
  { pattern: /synergy/i, tags: ['synergy'] },
  { pattern: /below\s+\d+%\s+health/i, tags: ['execute'] },
  { pattern: /execute/i, tags: ['execute'] },

  // === ULTIMATE ===
  { pattern: /ultimate/i, tags: ['ultimate-generation'] },
];

// Get tags that match the text
function getMatchingTags(text: string): string[] {
  const matchedTags = new Set<string>();

  for (const { pattern, tags } of TAG_PATTERNS) {
    if (pattern.test(text)) {
      tags.forEach((tag) => matchedTags.add(tag));
    }
  }

  return Array.from(matchedTags);
}

// Tag an item
async function tagItem(
  itemId: string,
  itemType: string,
  tagNames: string[],
  tagCache: Map<string, string>
): Promise<number> {
  let tagged = 0;

  for (const tagName of tagNames) {
    const tagId = tagCache.get(tagName);
    if (!tagId) {
      console.warn(`  ⚠️  Tag not found: ${tagName}`);
      continue;
    }

    try {
      await prisma.itemTag.upsert({
        where: {
          tagId_itemId_itemType: { tagId, itemId, itemType },
        },
        create: { tagId, itemId, itemType },
        update: {},
      });
      tagged++;
    } catch (error) {
      // Ignore duplicate errors
    }
  }

  return tagged;
}

async function autoTagItems() {
  console.log('🏷️  Auto-tagging items based on descriptions...\n');

  // Load all tags into cache
  const tags = await prisma.tag.findMany();
  const tagCache = new Map(tags.map((t) => [t.name, t.id]));
  console.log(`📚 Loaded ${tags.length} tags\n`);

  let totalTagged = 0;

  // === TAG BUFFS ===
  console.log('🔵 Tagging Buffs...');
  const buffs = await prisma.buff.findMany();
  for (const buff of buffs) {
    const text = `${buff.name} ${buff.description} ${buff.type || ''}`;
    const matchedTags = getMatchingTags(text);

    // Add the buff type as a tag (e.g., major-force for "Major" type "Force" buff)
    if (buff.type && buff.name) {
      const buffTag = `${buff.type.toLowerCase()}-${buff.name.toLowerCase().replace(/\s+/g, '-')}`;
      if (tagCache.has(buffTag)) {
        matchedTags.push(buffTag);
      }
    }

    if (matchedTags.length > 0) {
      const count = await tagItem(buff.id, 'buff', matchedTags, tagCache);
      totalTagged += count;
    }
  }
  console.log(`   Tagged ${buffs.length} buffs\n`);

  // === TAG DEBUFFS ===
  console.log('🔴 Tagging Debuffs...');
  const debuffs = await prisma.debuff.findMany();
  for (const debuff of debuffs) {
    const text = `${debuff.name} ${debuff.description} ${debuff.type || ''}`;
    const matchedTags = getMatchingTags(text);

    if (debuff.type && debuff.name) {
      const debuffTag = `${debuff.type.toLowerCase()}-${debuff.name.toLowerCase().replace(/\s+/g, '-')}`;
      if (tagCache.has(debuffTag)) {
        matchedTags.push(debuffTag);
      }
    }

    if (matchedTags.length > 0) {
      const count = await tagItem(debuff.id, 'debuff', matchedTags, tagCache);
      totalTagged += count;
    }
  }
  console.log(`   Tagged ${debuffs.length} debuffs\n`);

  // === TAG SETS ===
  console.log('⚔️  Tagging Sets...');
  const sets = await prisma.set.findMany({ include: { bonuses: true } });
  for (const set of sets) {
    // Combine all text for matching
    const bonusTexts = set.bonuses.map((b) => `${b.effect || ''} ${b.stats || ''}`).join(' ');
    const text = `${set.name} ${set.description || ''} ${bonusTexts}`;
    const matchedTags = getMatchingTags(text);

    // Add set type tag
    const setTypeTag = `${set.type.toLowerCase()}-set`;
    if (tagCache.has(setTypeTag)) {
      matchedTags.push(setTypeTag);
    }

    if (matchedTags.length > 0) {
      const count = await tagItem(set.id, 'set', matchedTags, tagCache);
      totalTagged += count;
    }

    // Also tag individual set bonuses
    for (const bonus of set.bonuses) {
      const bonusText = `${bonus.effect || ''} ${bonus.stats || ''}`;
      const bonusTags = getMatchingTags(bonusText);
      if (bonusTags.length > 0) {
        const count = await tagItem(bonus.id.toString(), 'set_bonus', bonusTags, tagCache);
        totalTagged += count;
      }
    }
  }
  console.log(`   Tagged ${sets.length} sets\n`);

  // === TAG MUNDUS STONES ===
  console.log('🌟 Tagging Mundus Stones...');
  const mundusStones = await prisma.mundusStone.findMany();
  for (const mundus of mundusStones) {
    const text = `${mundus.name} ${mundus.effect} ${mundus.description}`;
    const matchedTags = getMatchingTags(text);

    if (matchedTags.length > 0) {
      const count = await tagItem(mundus.id, 'mundus', matchedTags, tagCache);
      totalTagged += count;
    }
  }
  console.log(`   Tagged ${mundusStones.length} mundus stones\n`);

  // === TAG RACIAL PASSIVES ===
  console.log('👥 Tagging Racial Passives...');
  const racialPassives = await prisma.racialPassive.findMany();
  for (const passive of racialPassives) {
    const text = `${passive.name} ${passive.description} ${passive.effects}`;
    const matchedTags = getMatchingTags(text);

    if (matchedTags.length > 0) {
      const count = await tagItem(passive.id.toString(), 'racial_passive', matchedTags, tagCache);
      totalTagged += count;
    }
  }
  console.log(`   Tagged ${racialPassives.length} racial passives\n`);

  // === TAG SKILLS ===
  console.log('✨ Tagging Skills...');
  const skills = await prisma.skill.findMany({ include: { effects: true } });
  for (const skill of skills) {
    const effectTexts = skill.effects.map((e) => e.description).join(' ');
    const text = `${skill.name} ${skill.description} ${effectTexts}`;
    const matchedTags = getMatchingTags(text);

    if (matchedTags.length > 0) {
      const count = await tagItem(skill.id, 'skill', matchedTags, tagCache);
      totalTagged += count;
    }
  }
  console.log(`   Tagged ${skills.length} skills\n`);

  // === SUMMARY ===
  console.log('📊 Summary:');
  const itemTagCounts = await prisma.itemTag.groupBy({
    by: ['itemType'],
    _count: { id: true },
  });

  for (const count of itemTagCounts) {
    console.log(`   ${count.itemType}: ${count._count.id} tags`);
  }

  const totalItemTags = await prisma.itemTag.count();
  console.log(`\n✅ Total item-tag associations: ${totalItemTags}`);
}

autoTagItems()
  .then(() => {
    console.log('\n🎉 Auto-tagging complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
