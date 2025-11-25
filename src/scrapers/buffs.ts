import * as cheerio from 'cheerio';
import * as fs from 'fs/promises';
import * as path from 'path';
import { BaseScraper } from './base.js';
import { logger } from '../utils/logger.js';

interface BuffDebuffSources {
  abilities: string[];
  sets: string[];
  scribing: string[];
  potions: string[];
  champion: string[];
  weaponType: string[];
  other: string[];
}

interface BuffDebuffData {
  id: string;
  name: string;
  type: string | null; // 'Major', 'Minor', or null for unique
  description: string;
  icon: string | null;
  sources: BuffDebuffSources;
  pageUrl: string;
}

export class BuffsDebuffsScraper extends BaseScraper {
  private readonly DATA_DIR = path.join(process.cwd(), 'data', 'scraped', 'buffs');
  private readonly BUFFS_URL = '/wiki/Online:Buffs';

  /**
   * Scrape all buffs and debuffs
   */
  async scrape(): Promise<void> {
    logger.info('Starting buffs and debuffs scrape...');

    const html = await this.fetchPage(this.BUFFS_URL);
    const $ = cheerio.load(html);

    // Scrape buffs
    const buffs = this.parseBuffsDebuffsTable($, 'Buffs');
    logger.info(`Found ${buffs.length} buffs`);

    // Save buffs
    const buffsData = {
      buffs,
      scrapedAt: new Date().toISOString(),
      totalBuffs: buffs.length,
    };

    await fs.mkdir(this.DATA_DIR, { recursive: true });
    const buffsFile = path.join(this.DATA_DIR, 'buffs.json');
    await fs.writeFile(buffsFile, JSON.stringify(buffsData, null, 2), 'utf-8');
    logger.info(`Saved ${buffs.length} buffs to ${buffsFile}`);

    // Scrape debuffs
    const debuffs = this.parseBuffsDebuffsTable($, 'Debuffs');
    logger.info(`Found ${debuffs.length} debuffs`);

    // Save debuffs
    const debuffsData = {
      debuffs,
      scrapedAt: new Date().toISOString(),
      totalDebuffs: debuffs.length,
    };

    const debuffsFile = path.join(this.DATA_DIR, 'debuffs.json');
    await fs.writeFile(debuffsFile, JSON.stringify(debuffsData, null, 2), 'utf-8');
    logger.info(`Saved ${debuffs.length} debuffs to ${debuffsFile}`);

    logger.info('Buffs and debuffs scrape completed!');
  }

  private parseBuffsDebuffsTable($: cheerio.CheerioAPI, tableType: 'Buffs' | 'Debuffs'): BuffDebuffData[] {
    const results: BuffDebuffData[] = [];

    // Find the appropriate heading
    const headingText = tableType === 'Buffs' ? 'Buffs' : 'Debuffs';
    let foundTable = false;

    // Find the table following the heading
    $('h2, h3').each((_, heading) => {
      const $heading = $(heading);
      const text = $heading.find('.mw-headline').text().trim();

      if (text === headingText) {
        // Find the next table after this heading
        const $table = $heading.nextAll('table.wikitable').first();

        if ($table.length === 0) {
          logger.warn(`Could not find ${tableType} table`);
          return;
        }

        foundTable = true;
        logger.info(`Parsing ${tableType} table...`);

        // Get table headers to understand column positions
        const headers: string[] = [];
        const headerIndices: Record<string, number> = {};

        $table.find('tr').first().find('th').each((idx: number, th: any) => {
          const headerText = $(th).text().trim();
          headers.push(headerText);
          headerIndices[headerText.toLowerCase()] = idx;
          logger.info(`  Header ${idx}: "${headerText}"`);
        });

        // Parse rows, handling rowspan for buff names
        let currentBuffName: string | null = null;

        $table.find('tr').slice(1).each((_: number, row: any) => {
          const $row = $(row);
          const cells = $row.find('td');

          if (cells.length === 0) return; // Skip empty rows

          try {
            let cellOffset = 0;

            // Check if this row has a name cell (first cell with rowspan or new name)
            const firstCell = cells.eq(0);
            const rowspan = firstCell.attr('rowspan');

            // If first cell has content and is not just a type cell, it's a name cell
            const firstCellText = firstCell.text().trim().replace(/\[edit\]/gi, '').trim();

            // Detect if we have a name cell: it either has rowspan OR it's not "Major"/"Minor"
            const hasNameCell = rowspan || (!firstCellText.toLowerCase().includes('major') &&
                                             !firstCellText.toLowerCase().includes('minor') &&
                                             firstCellText.length > 0);

            if (hasNameCell) {
              // This row starts a new buff/debuff name
              currentBuffName = firstCellText;
              cellOffset = 1; // Name is in first cell, other data starts at index 1
            } else {
              // This row continues the previous buff name (rowspan from previous row)
              cellOffset = 0; // Type starts at index 0
            }

            if (!currentBuffName || currentBuffName.length < 2) return;

            // Extract type (Major/Minor) - offset by whether name cell exists
            const typeCell = cells.eq(cellOffset);
            let type: string | null = typeCell.text().trim();
            if (!type || type === '' || type === '—' || type === '-') {
              type = null;
            }

            // Extract description - offset + 1
            const descCell = cells.eq(cellOffset + 1);
            const description = descCell.text().trim();
            if (!description || description.length < 2) return;

            // Extract sources - offset + 2
            const sourcesCell = cells.eq(cellOffset + 2);
            const sources = this.parseSources($, sourcesCell);

            // Extract icon - last column if it exists
            let icon: string | null = null;
            if (cells.length > cellOffset + 3) {
              const iconCell = cells.eq(cells.length - 1);
              const imgSrc = iconCell.find('img').attr('src');
              if (imgSrc) {
                icon = imgSrc.startsWith('//') ? `https:${imgSrc}` : imgSrc;
              }
            }

            const buffDebuff: BuffDebuffData = {
              id: this.sanitizeId(`${currentBuffName}${type ? `-${type.toLowerCase()}` : ''}`),
              name: currentBuffName,
              type,
              description,
              icon,
              sources,
              pageUrl: `https://en.uesp.net${this.BUFFS_URL}`,
            };

            results.push(buffDebuff);
          } catch (error) {
            logger.error(`Failed to parse ${tableType} row:`, error);
          }
        });

        return false; // break out of the heading search
      }

      return; // continue searching
    });

    if (!foundTable) {
      logger.warn(`Could not find ${tableType} table`);
    }

    return results;
  }

  private parseSources($: cheerio.CheerioAPI, sourcesCell: any): BuffDebuffSources {
    const sources: BuffDebuffSources = {
      abilities: [],
      sets: [],
      scribing: [],
      potions: [],
      champion: [],
      weaponType: [],
      other: [],
    };

    // The sources are typically organized as lists with headers like "Abilities:", "Sets:", etc.
    const cellText = sourcesCell.text();

    // Split by common separators and look for category headers
    const lines = cellText.split('\n').map((l: string) => l.trim()).filter((l: string) => l);

    let currentCategory: keyof BuffDebuffSources = 'other';

    for (const line of lines) {
      const lowerLine = line.toLowerCase();

      // Detect category headers
      if (lowerLine.includes('abilities:') || lowerLine.startsWith('abilities')) {
        currentCategory = 'abilities';
        continue;
      } else if (lowerLine.includes('sets:') || lowerLine.startsWith('sets')) {
        currentCategory = 'sets';
        continue;
      } else if (lowerLine.includes('scribing:') || lowerLine.startsWith('scribing')) {
        currentCategory = 'scribing';
        continue;
      } else if (lowerLine.includes('potions:') || lowerLine.startsWith('potions')) {
        currentCategory = 'potions';
        continue;
      } else if (lowerLine.includes('champion') || lowerLine.includes('verses')) {
        currentCategory = 'champion';
        continue;
      } else if (lowerLine.includes('weapon') || lowerLine.includes('staff')) {
        currentCategory = 'weaponType';
        continue;
      }

      // Add to current category if it's not empty and not a header
      if (line && !line.endsWith(':') && line.length > 1) {
        sources[currentCategory].push(line);
      }
    }

    // Also try to extract links for better accuracy
    sourcesCell.find('a').each((_: number, link: any) => {
      const $link = $(link);
      const linkText = $link.text().trim();
      const href = $link.attr('href') || '';

      if (!linkText || linkText.length < 2) return;

      // Try to categorize based on the link URL
      if (href.includes('Online:Sets') || href.includes('Set:')) {
        if (!sources.sets.includes(linkText)) {
          sources.sets.push(linkText);
        }
      } else if (href.includes('Online:') && !href.includes('Online:Potions')) {
        // Likely an ability or skill
        if (!sources.abilities.includes(linkText)) {
          sources.abilities.push(linkText);
        }
      }
    });

    return sources;
  }
}
