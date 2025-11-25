import { prisma } from '../src/lib/prisma.js';
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';

const SETS_DIR = 'data/scraped/sets';

interface SetBonus {
  pieces: number;
  effect: string;
  effectType?: string;
  stats?: Record<string, any>;
  cooldown?: number;
}

interface SetData {
  id: string;
  name: string;
  type: string;
  slots?: string;
  weaponTypes?: string[];
  location?: string;
  dropSource?: string;
  craftingSites?: string[];
  dlcRequired?: string;
  tradeable: boolean;
  bindType?: string;
  description?: string;
  patch?: string;
  source: string;
  bonuses: SetBonus[];
}

async function importSets() {
  console.log('📦 Importing sets from JSON files...\n');

  const files = readdirSync(SETS_DIR).filter((f) => f.endsWith('.json'));
  let totalImported = 0;
  let totalSkipped = 0;

  for (const file of files) {
    const filePath = join(SETS_DIR, file);
    console.log(`📄 Processing ${file}...`);

    try {
      const content = readFileSync(filePath, 'utf-8');
      const data = JSON.parse(content);

      // Handle both { sets: [...] } and [...] formats
      const sets: SetData[] = data.sets || data;

      if (!Array.isArray(sets) || sets.length === 0) {
        console.log(`   ⚠️  No sets found in ${file}`);
        continue;
      }

      for (const set of sets) {
        try {
          // Parse slots as JSON array if it's a string
          let slotsJson = '[]';
          if (set.slots) {
            if (Array.isArray(set.slots)) {
              slotsJson = JSON.stringify(set.slots);
            } else if (typeof set.slots === 'string') {
              slotsJson = JSON.stringify([set.slots]);
            }
          }

          // Parse weaponTypes
          let weaponTypesJson: string | null = null;
          if (set.weaponTypes) {
            weaponTypesJson = JSON.stringify(
              Array.isArray(set.weaponTypes) ? set.weaponTypes : [set.weaponTypes]
            );
          }

          // Parse dropSource
          let dropSourceJson: string | null = null;
          if (set.dropSource) {
            dropSourceJson = JSON.stringify(
              Array.isArray(set.dropSource) ? set.dropSource : [set.dropSource]
            );
          }

          // Parse craftingSites
          let craftingSitesJson: string | null = null;
          if (set.craftingSites) {
            craftingSitesJson = JSON.stringify(
              Array.isArray(set.craftingSites) ? set.craftingSites : [set.craftingSites]
            );
          }

          // Upsert the set
          await prisma.set.upsert({
            where: { id: set.id },
            create: {
              id: set.id,
              name: set.name,
              type: set.type,
              slots: slotsJson,
              weaponTypes: weaponTypesJson,
              location: set.location || null,
              dropSource: dropSourceJson,
              craftingSites: craftingSitesJson,
              dlcRequired: set.dlcRequired || null,
              tradeable: set.tradeable ?? false,
              bindType: set.bindType || null,
              description: set.description || null,
              patch: set.patch || null,
              source: set.source,
            },
            update: {
              name: set.name,
              type: set.type,
              slots: slotsJson,
              weaponTypes: weaponTypesJson,
              location: set.location || null,
              dropSource: dropSourceJson,
              craftingSites: craftingSitesJson,
              dlcRequired: set.dlcRequired || null,
              tradeable: set.tradeable ?? false,
              bindType: set.bindType || null,
              description: set.description || null,
              patch: set.patch || null,
              source: set.source,
            },
          });

          // Delete existing bonuses and re-create
          await prisma.setBonus.deleteMany({ where: { setId: set.id } });

          // Create bonuses
          for (const bonus of set.bonuses || []) {
            await prisma.setBonus.create({
              data: {
                setId: set.id,
                pieces: bonus.pieces,
                effect: bonus.effect || null,
                effectType: bonus.effectType || null,
                stats: bonus.stats ? JSON.stringify(bonus.stats) : null,
                cooldown: bonus.cooldown || null,
              },
            });
          }

          totalImported++;
        } catch (error: any) {
          console.error(`   ❌ Failed to import set ${set.name}: ${error.message}`);
          totalSkipped++;
        }
      }

      console.log(`   ✅ Imported ${sets.length} sets from ${file}`);
    } catch (error: any) {
      console.error(`   ❌ Failed to process ${file}: ${error.message}`);
    }
  }

  console.log(`\n📊 Summary:`);
  console.log(`   Total imported: ${totalImported}`);
  console.log(`   Total skipped: ${totalSkipped}`);

  // Verify count
  const dbCount = await prisma.set.count();
  const bonusCount = await prisma.setBonus.count();
  console.log(`\n📈 Database now has:`);
  console.log(`   Sets: ${dbCount}`);
  console.log(`   Set Bonuses: ${bonusCount}`);
}

importSets()
  .then(() => {
    console.log('\n🎉 Set import complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
