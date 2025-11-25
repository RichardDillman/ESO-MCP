import * as cheerio from 'cheerio';
import * as fs from 'fs/promises';
import * as path from 'path';
import { logger } from '../src/utils/logger.js';

const BASE_URL = 'https://en.uesp.net';
const DATA_DIR = path.join(process.cwd(), 'data', 'scraped', 'sets');

interface SetBonus {
  pieces: number;
  effect: string;
  effectType?: string;
  stats?: Record<string, any>;
}

interface MythicItem {
  id: string;
  name: string;
  type: string;
  slots: string;
  location?: string;
  dlcRequired?: string;
  tradeable: boolean;
  bindType: string;
  description?: string;
  source: string;
  bonuses: SetBonus[];
}

const MYTHIC_ITEMS = [
  'Belharza\'s Band',
  'Bloodlord\'s Embrace',
  'Cryptcanon Vestments',
  'Death Dealer\'s Fete',
  'Dov-rha Sabatons',
  'Esoteric Environment Greaves',
  'Faun\'s Lark Cladding',
  'Gaze of Sithis',
  'Harpooner\'s Wading Kilt',
  'Huntsman\'s Warmask',
  'Lefthander\'s Aegis Belt',
  'Mad God\'s Dancing Shoes',
  'Malacath\'s Band of Brutality',
  'Markyn Ring of Majesty',
  'Monomyth Reforged',
  'Mora\'s Whispers',
  'Oakensoul Ring',
  'Pearls of Ehlnofey',
  'Rakkhat\'s Voidmantle',
  'Ring of the Pale Order',
  'Ring of the Wild Hunt',
  'Rourken Steamguards',
  'Sea-Serpent\'s Coil',
  'Shapeshifter\'s Chain',
  'Snow Treaders',
  'Spaulder of Ruin',
  'Stormweaver\'s Cavort',
  'Syrabane\'s Ward',
  'The Saint and the Seducer',
  'The Shadow Queen\'s Cowl',
  'Thrassian Stranglers',
  'Torc of the Last Ayleid King',
  'Torc of Tonal Constancy',
  'Velothi Ur-Mage\'s Amulet',
];

function sanitizeId(name: string): string {
  return name
    .toLowerCase()
    .replace(/['']/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

async function fetchPage(url: string): Promise<string> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status}`);
  }
  return response.text();
}

async function scrapeMythicItem(name: string): Promise<MythicItem | null> {
  const urlName = name.replace(/\s+/g, '_').replace(/'/g, '%27');
  const url = `${BASE_URL}/wiki/Online:${urlName}`;

  logger.info(`Scraping ${name}...`);

  try {
    const html = await fetchPage(url);
    const $ = cheerio.load(html);

    // Get the content
    const content = $('#mw-content-text .mw-parser-output');

    // Find set bonus information
    const bonuses: SetBonus[] = [];
    let description = '';
    let dlcRequired: string | undefined;
    let slots = 'Single Piece';

    // Look for bonus info - usually in item description or set box
    content.find('p, li').each((_, el) => {
      const text = $(el).text().trim();

      // Look for "(1 item)" pattern
      if (text.includes('1 item') || text.includes('(1 item)')) {
        // Split by item count patterns
        const parts = text.split(/(?=\d+\s+items?)/i);
        for (const part of parts) {
          const match = part.match(/^(\d+)\s+items?[:\s]*(.*)/i);
          if (match) {
            const pieces = parseInt(match[1]);
            const effect = match[2].trim();
            if (effect) {
              bonuses.push({
                pieces,
                effect,
                effectType: effect.startsWith('Adds') ? 'stat' : 'proc',
              });
            }
          }
        }
      }

      // Look for "While equipped" or similar patterns
      if (text.includes('While equipped') || text.includes('when equipped')) {
        if (bonuses.length === 0) {
          bonuses.push({
            pieces: 1,
            effect: text,
            effectType: 'proc',
          });
        }
      }
    });

    // Find description from first paragraph
    const firstP = content.find('p').first().text().trim();
    if (firstP && firstP.length > 20) {
      description = firstP;
    }

    // Try to find DLC from page
    const dlcMatch = $('a[href*="Online:"]').filter((_, el) => {
      const href = $(el).attr('href') || '';
      return href.includes('Chapter') || href.includes('DLC');
    }).first().text();

    if (dlcMatch) {
      dlcRequired = dlcMatch;
    }

    // Determine slot from name
    if (name.includes('Ring') || name.includes('Band')) {
      slots = 'Ring';
    } else if (name.includes('Amulet') || name.includes('Torc') || name.includes('Chain')) {
      slots = 'Necklace';
    } else if (name.includes('Belt')) {
      slots = 'Belt';
    } else if (name.includes('Greaves') || name.includes('Kilt')) {
      slots = 'Legs';
    } else if (name.includes('Sabatons') || name.includes('Treaders') || name.includes('Shoes')) {
      slots = 'Feet';
    } else if (name.includes('Mask') || name.includes('Cowl')) {
      slots = 'Head';
    } else if (name.includes('Embrace') || name.includes('Vestments') || name.includes('Cladding') || name.includes('Voidmantle')) {
      slots = 'Chest';
    } else if (name.includes('Spaulder')) {
      slots = 'Shoulders';
    } else if (name.includes('Stranglers') || name.includes('Steamguards')) {
      slots = 'Hands';
    }

    return {
      id: sanitizeId(name),
      name,
      type: 'Mythic',
      slots,
      location: 'Antiquities',
      dlcRequired,
      tradeable: false,
      bindType: 'Bind on Pickup',
      description,
      source: url,
      bonuses,
    };
  } catch (error) {
    logger.error(`Failed to scrape ${name}:`, error);
    return null;
  }
}

async function main() {
  logger.info('Scraping all mythic items...');

  const mythics: MythicItem[] = [];

  for (const name of MYTHIC_ITEMS) {
    const item = await scrapeMythicItem(name);
    if (item) {
      mythics.push(item);
    }
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  // Save to file
  const data = {
    type: 'Mythic',
    sets: mythics,
    scrapedAt: new Date().toISOString(),
    totalSets: mythics.length,
  };

  const filename = path.join(DATA_DIR, 'mythic-sets.json');
  await fs.writeFile(filename, JSON.stringify(data, null, 2), 'utf-8');

  logger.info(`Saved ${mythics.length} mythic items to ${filename}`);

  // Log any items missing bonuses
  const missingBonuses = mythics.filter(m => m.bonuses.length === 0);
  if (missingBonuses.length > 0) {
    logger.warn(`Items missing bonuses: ${missingBonuses.map(m => m.name).join(', ')}`);
  }
}

main()
  .then(() => {
    logger.info('Done!');
    process.exit(0);
  })
  .catch((error) => {
    logger.error('Fatal error:', error);
    process.exit(1);
  });
