import { prisma } from '../src/lib/prisma.js';
import { readFileSync } from 'fs';
import { join } from 'path';

interface SkillMorphData {
  skillLine: string;
  category: string;
  morphs: string[];
}

interface SkillMorphsFile {
  skillMorphs: Record<string, SkillMorphData>;
}

interface BuffSources {
  abilities: string[];
  sets: string[];
  scribing: string[];
  potions: string[];
  champion: string[];
  weaponType: string[];
  other: string[];
}

async function enhanceBuffSources() {
  console.log('Enhancing buff sources with skill morphs...\n');

  // Load skill morphs data
  const morphsPath = join(process.cwd(), 'data', 'skill-morphs.json');
  const morphsData: SkillMorphsFile = JSON.parse(readFileSync(morphsPath, 'utf-8'));

  // Get all buffs
  const buffs = await prisma.buff.findMany();
  let enhanced = 0;

  for (const buff of buffs) {
    try {
      const sources: BuffSources = JSON.parse(buff.sources);
      let modified = false;

      // Check each ability in sources
      const enhancedAbilities: string[] = [];

      for (const ability of sources.abilities) {
        enhancedAbilities.push(ability);

        // Check if this ability has morphs
        const morphData = morphsData.skillMorphs[ability];
        if (morphData) {
          for (const morph of morphData.morphs) {
            if (!enhancedAbilities.includes(morph) && !sources.abilities.includes(morph)) {
              enhancedAbilities.push(morph);
              modified = true;
            }
          }
        }
      }

      if (modified) {
        // Sort alphabetically
        enhancedAbilities.sort();
        sources.abilities = enhancedAbilities;

        // Update the other field to match
        sources.other = [enhancedAbilities.join(', ')];

        await prisma.buff.update({
          where: { id: buff.id },
          data: {
            sources: JSON.stringify(sources),
          },
        });

        console.log(`  Enhanced ${buff.type} ${buff.name}: added ${enhancedAbilities.length - buff.sources.split(',').length + 1} morphs`);
        enhanced++;
      }
    } catch (error: any) {
      console.error(`  Failed to enhance ${buff.name}: ${error.message}`);
    }
  }

  console.log(`\nEnhanced ${enhanced} buffs with skill morphs`);
}

enhanceBuffSources()
  .then(() => {
    console.log('\nDone!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
