import * as cheerio from 'cheerio';
import { BaseScraper } from './base.js';
import { prisma } from '../lib/prisma.js';
import { logger } from '../utils/logger.js';
import { MundusStoneData } from '../types/mundus.js';

export class MundusScraper extends BaseScraper {
  // Known Mundus Stone names
  private readonly STONE_NAMES = [
    'The Apprentice',
    'The Atronach',
    'The Lady',
    'The Lord',
    'The Lover',
    'The Mage',
    'The Ritual',
    'The Serpent',
    'The Shadow',
    'The Steed',
    'The Thief',
    'The Tower',
    'The Warrior',
  ];

  async scrape(): Promise<void> {
    logger.info('Starting Mundus Stones scrape...');

    const mundusUrl = '/wiki/Online:Mundus_Stones';
    const html = await this.fetchPage(mundusUrl);
    const $ = cheerio.load(html);

    const mundusStones = this.parseMundusStones($);

    logger.info(`Found ${mundusStones.length} Mundus Stones`);

    for (const stone of mundusStones) {
      await this.saveMundusStone(stone);
    }

    logger.info('Mundus Stones scraping complete!');
  }

  private parseMundusStones($: cheerio.CheerioAPI): MundusStoneData[] {
    const stones: MundusStoneData[] = [];

    // Find the main wikitable with Mundus Stones
    // The table has columns: Stone, AldmeriDominion, DaggerfallCovenant, EbonheartPact, Cyrodiil, Effect, Value
    $('table.wikitable').each((tableIdx, table) => {
      const $table = $(table);

      // Find ALL header cells (might be across multiple rows)
      const allHeaders: string[] = [];
      $table.find('tr').each((rowIdx, row) => {
        const $row = $(row);
        const hasTh = $row.find('th').length > 0;
        if (hasTh || rowIdx === 0) {
          $row.find('th, td').each((_, cell) => {
            const text = $(cell).text().trim();
            if (text) allHeaders.push(text);
          });
        }
      });

      const headerText = allHeaders.join(' ');
      logger.debug(`Table ${tableIdx} headers: ${headerText.substring(0, 100)}`);

      // Check if this is the Mundus Stones table by looking for "Stone" and "Effect" columns
      if (!headerText.includes('Stone') || !headerText.includes('Effect')) {
        logger.debug(`Skipping table ${tableIdx} - doesn't have Stone/Effect columns`);
        return;
      }

      logger.debug(`Found Mundus Stones table at index ${tableIdx}`);

      // Find column indices by checking all rows for headers
      let stoneColumnIndex = -1;
      let effectColumnIndex = -1;
      let valueColumnIndex = -1;

      $table.find('tr').first().find('th, td').each((idx, cell) => {
        const colName = $(cell).text().trim();
        if (colName === 'Stone') stoneColumnIndex = idx;
        else if (colName === 'Effect') effectColumnIndex = idx;
        else if (colName === 'Value') valueColumnIndex = idx;
      });

      // If not found in first row, try second row
      if (stoneColumnIndex === -1 || effectColumnIndex === -1) {
        $table.find('tr').eq(1).find('th, td').each((idx, cell) => {
          const colName = $(cell).text().trim();
          if (colName === 'Stone' && stoneColumnIndex === -1) stoneColumnIndex = idx;
          else if (colName === 'Effect' && effectColumnIndex === -1) effectColumnIndex = idx;
          else if (colName === 'Value' && valueColumnIndex === -1) valueColumnIndex = idx;
        });
      }

      if (stoneColumnIndex === -1 || effectColumnIndex === -1) {
        logger.debug(`Could not find Stone or Effect columns in table ${tableIdx}`);
        return;
      }

      logger.debug(`Column indices - Stone: ${stoneColumnIndex}, Effect: ${effectColumnIndex}, Value: ${valueColumnIndex}`);

      // Parse each data row (skip first 2 rows for headers)
      const rows = $table.find('tr');

      rows.slice(2).each((_, row) => {
        const $row = $(row);
        const cells = $row.find('td');

        if (cells.length < Math.max(stoneColumnIndex, effectColumnIndex) + 1) {
          return;
        }

        // Extract stone name - it's in the URL parameter centeron=The+[Name]
        const stoneCell = cells.eq(stoneColumnIndex);

        let name = '';
        stoneCell.find('a').each((_, link): boolean | void => {
          if (name) return false; // Already found, break

          const href = $(link).attr('href') || '';

          // Extract from centeron URL parameter
          const centeronMatch = href.match(/centeron=([^&]+)/);
          if (centeronMatch) {
            const centeronValue = decodeURIComponent(centeronMatch[1].replace(/\+/g, ' '));

            // Check if this matches a stone name
            for (const stoneName of this.STONE_NAMES) {
              if (centeronValue === stoneName || centeronValue.includes(stoneName)) {
                name = stoneName;
                return false;
              }
            }
          }
        });

        if (!name) {
          return;
        }

        // Extract effect
        const effectCell = cells.eq(effectColumnIndex);
        const effectText = effectCell.text().trim();

        if (!effectText) return;

        // Extract value if available
        let value: string | undefined;
        if (valueColumnIndex !== -1 && cells.length > valueColumnIndex) {
          const valueCell = cells.eq(valueColumnIndex);
          const valueText = valueCell.text().trim();

          // Extract first numerical value
          const valueMatch = valueText.match(/(\d+(?:\.\d+)?%?)/);
          if (valueMatch) {
            value = valueMatch[1];
          }
        }

        const stoneData: MundusStoneData = {
          name,
          effect: effectText,
          value,
          description: effectText,
        };

        stones.push(stoneData);
      });
    });

    return stones;
  }

  private async saveMundusStone(stoneData: MundusStoneData): Promise<void> {
    try {
      const id = this.sanitizeId(stoneData.name);
      const source = `https://en.uesp.net/wiki/Online:Mundus_Stones`;

      await prisma.mundusStone.upsert({
        where: { id },
        update: {
          name: stoneData.name,
          effect: stoneData.effect,
          value: stoneData.value,
          description: stoneData.description,
          location: stoneData.location,
          source,
        },
        create: {
          id,
          name: stoneData.name,
          effect: stoneData.effect,
          value: stoneData.value,
          description: stoneData.description,
          location: stoneData.location,
          source,
        },
      });

      logger.debug(`Saved Mundus Stone: ${stoneData.name}`);
    } catch (error) {
      logger.error(`Failed to save Mundus Stone ${stoneData.name}:`, error);
    }
  }
}
