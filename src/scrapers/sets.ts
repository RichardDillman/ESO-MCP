import * as cheerio from 'cheerio';
import * as fs from 'fs/promises';
import * as path from 'path';
import { BaseScraper } from './base.js';
import { logger } from '../utils/logger.js';

interface SetBonus {
  pieces: number;
  stats?: string;
  effect?: string;
  effectType?: string;
}

interface SetData {
  id: string;
  name: string;
  type: string; // Arena, Craftable, Dungeon, Monster, Mythic, Overland, PVP, Trial, Jewelry, Weapon, Class
  slots: string; // What pieces are available
  armorWeight?: string; // Light, Medium, Heavy, Any, N/A
  weaponTypes?: string;
  location?: string;
  dropSource?: string;
  craftingSites?: string;
  dlcRequired?: string;
  tradeable: boolean;
  bindType?: string;
  description?: string;
  source: string;
  bonuses: SetBonus[];
  traitsNeeded?: number;
}

export class SetsScraper extends BaseScraper {
  private readonly DATA_DIR = path.join(process.cwd(), 'data', 'scraped', 'sets');

  private readonly SET_TYPES = [
    { name: 'Arena', page: 'Arena_Sets', category: 'Arena' },
    { name: 'Craftable', page: 'Craftable_Sets', category: 'Craftable' },
    { name: 'Dungeon', page: 'Dungeon_Sets', category: 'Dungeon' },
    { name: 'Monster', page: 'Monster_Helm_Sets', category: 'Monster' },
    { name: 'Mythic', page: 'Mythic_Items', category: 'Mythic' },
    { name: 'Overland', page: 'Overland_Sets', category: 'Overland' },
    { name: 'PVP', page: 'PVP_Sets', category: 'PVP' },
    { name: 'Trial', page: 'Trial_Sets', category: 'Trial' },
    { name: 'Jewelry', page: 'Jewelry_Sets', category: 'Jewelry' },
    { name: 'Weapon', page: 'Weapon_Sets', category: 'Weapon' },
    { name: 'Class', page: 'Class_Sets', category: 'Class' },
  ];

  /**
   * Scrape a specific set type
   */
  async scrapeSetType(typeName: string): Promise<void> {
    const setType = this.SET_TYPES.find(t => t.name === typeName);
    if (!setType) {
      throw new Error(`Unknown set type: ${typeName}`);
    }

    logger.info(`Scraping ${setType.name} sets...`);

    const setsUrl = `/wiki/Online:${setType.page}`;
    const html = await this.fetchPage(setsUrl);
    const $ = cheerio.load(html);

    const sets = this.parseSetsPage($, setType.category);

    logger.info(`Found ${sets.length} ${setType.name} sets`);

    // Save to JSON file
    const fullData = {
      type: setType.category,
      sets,
      scrapedAt: new Date().toISOString(),
      totalSets: sets.length,
    };

    const filename = path.join(this.DATA_DIR, `${this.sanitizeId(setType.name)}-sets.json`);
    await fs.writeFile(filename, JSON.stringify(fullData, null, 2), 'utf-8');
    logger.info(`Saved ${sets.length} ${setType.name} sets to ${filename}`);
  }

  /**
   * Scrape all set types
   */
  async scrape(): Promise<void> {
    logger.info('Starting full sets scrape...');

    for (const setType of this.SET_TYPES) {
      try {
        await this.scrapeSetType(setType.name);

        // Pause between types
        if (this.SET_TYPES.indexOf(setType) < this.SET_TYPES.length - 1) {
          logger.info('Pausing between set types...');
          await this.delay(3000);
        }
      } catch (error) {
        logger.error(`Failed to scrape ${setType.name} sets:`, error);
      }
    }

    logger.info('All set types scraped successfully!');
  }

  private parseSetsPage($: cheerio.CheerioAPI, setCategory: string): SetData[] {
    const sets: SetData[] = [];

    // Find all tables with set information
    $('table.wikitable').each((_, table) => {
      const $table = $(table);

      // Check if this is a sets table by looking for headers
      const headers: string[] = [];
      const headerIndices: Record<string, number> = {};

      $table.find('tr').first().find('th').each((idx, th) => {
        const headerText = $(th).text().trim().toLowerCase();
        headers.push(headerText);
        headerIndices[headerText] = idx;
      });

      // Look for set tables (they typically have "set name" and "bonuses" columns)
      const hasSetName = headers.some(h => h.includes('set') || h.includes('name'));
      const hasBonuses = headers.some(h => h.includes('bonus'));

      if (!hasSetName || !hasBonuses) {
        return;
      }

      // Parse each set row
      $table.find('tr').slice(1).each((_, row) => {
        const $row = $(row);

        // Get both th and td cells (set name is in th, rest in td)
        const thCells = $row.find('th');
        const tdCells = $row.find('td');

        // Skip if not enough cells
        if (tdCells.length < 2) return;

        try {
          // Extract set name from th tag
          let setName = '';
          if (thCells.length > 0) {
            setName = thCells.eq(0).find('a').first().text().trim();
          }

          // Fallback to first td if no th found
          if (!setName && tdCells.length > 0) {
            setName = tdCells.eq(0).find('a').first().text().trim() || tdCells.eq(0).text().trim();
          }

          if (!setName || setName.length < 2) return;

          // Extract armor weight / set type
          let armorWeight: string | undefined;
          let slots = 'Unknown';

          // For craftable sets, they can be any weight
          if (setCategory === 'Craftable') {
            armorWeight = 'Any';
            slots = 'All';
          } else if (setCategory === 'Monster') {
            // For monster sets, head + shoulders in any weight
            armorWeight = 'Any';
            slots = 'Head, Shoulders';
          } else if (setCategory === 'Mythic') {
            // For mythic items, single piece
            armorWeight = 'N/A';
            slots = 'Single Piece';
          }

          // Find traits needed (first td cell for craftable sets)
          let traitsNeeded: number | undefined;
          const firstTd = tdCells.eq(0).text().trim();
          if (/^\d+$/.test(firstTd) && parseInt(firstTd) >= 2 && parseInt(firstTd) <= 9) {
            traitsNeeded = parseInt(firstTd);
          }

          // Find bonuses - for craftable sets it's typically the second td cell
          // The bonuses cell is the longest one containing "items:"
          let bonusesText = '';
          tdCells.each((_, cell) => {
            const cellText = $(cell).text().trim();
            if (cellText.includes('items:') || cellText.includes('2 items')) {
              bonusesText = cellText;
            }
          });

          // Find location/source column - typically the last td cell
          let location = '';
          if (tdCells.length > 0) {
            location = tdCells.eq(tdCells.length - 1).text().trim();
            // Don't use location if it looks like bonuses
            if (location.includes('items:')) {
              location = '';
            }
          }

          // Parse bonuses
          const bonuses = this.parseBonuses(bonusesText);

          const setData: SetData = {
            id: this.sanitizeId(setName),
            name: setName,
            type: setCategory,
            slots,
            armorWeight,
            location: location || undefined,
            craftingSites: setCategory === 'Craftable' ? location : undefined,
            dropSource: setCategory !== 'Craftable' ? location : undefined,
            tradeable: setCategory === 'Craftable' || setCategory === 'Overland',
            bindType: setCategory === 'Craftable' ? 'Bind on Equip' : 'Bind on Pickup',
            source: `https://en.uesp.net/wiki/Online:${setCategory}_Sets`,
            bonuses,
            traitsNeeded,
          };

          sets.push(setData);
        } catch (error) {
          logger.error(`Failed to parse set row:`, error);
        }
      });
    });

    return sets;
  }

  private parseBonuses(bonusText: string): SetBonus[] {
    const bonuses: SetBonus[] = [];

    // Common patterns: "(2 items) +X stat" or "(5 items) Effect description"
    const bonusPattern = /\((\d+)\s+items?\)[:\s]*(.*?)(?=\(|$)/gi;

    let match;
    while ((match = bonusPattern.exec(bonusText)) !== null) {
      const pieces = parseInt(match[1]);
      const description = match[2].trim();

      if (!description) continue;

      // Determine if it's a stat or effect
      const isStatBonus = /^(Adds?|Increases?)\s+\d+/.test(description);

      const bonus: SetBonus = {
        pieces,
      };

      if (isStatBonus) {
        bonus.stats = description;
        bonus.effectType = 'stat';
      } else {
        bonus.effect = description;
        bonus.effectType = 'proc';
      }

      bonuses.push(bonus);
    }

    // If no bonuses found with the pattern, try line-by-line
    if (bonuses.length === 0) {
      const lines = bonusText.split('\n').filter(l => l.trim());
      for (const line of lines) {
        const pieceMatch = line.match(/(\d+)\s+items?/i);
        if (pieceMatch) {
          bonuses.push({
            pieces: parseInt(pieceMatch[1]),
            effect: line.replace(/\d+\s+items?[:\s]*/i, '').trim(),
            effectType: 'unknown',
          });
        }
      }
    }

    return bonuses;
  }
}
