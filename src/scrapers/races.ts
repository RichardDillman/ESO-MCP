import * as cheerio from 'cheerio';
import * as fs from 'fs/promises';
import * as path from 'path';
import { BaseScraper } from './base.js';
import { logger } from '../utils/logger.js';

interface RacePassiveData {
  name: string;
  rank: number;
  description: string;
  unlockLevel: number;
  effects: Array<{
    type: string;
    description: string;
    value?: string;
  }>;
}

interface RaceData {
  name: string;
  description: string;
  alliance?: string;
  passives: RacePassiveData[];
  baseStats?: Record<string, number>;
}

export class RaceScraper extends BaseScraper {
  private readonly DATA_DIR = path.join(process.cwd(), 'data', 'scraped', 'races');

  // Race configurations with their UESP page names and alliances
  private readonly RACES = [
    { name: 'Altmer', page: 'Altmer', alliance: 'Aldmeri Dominion' },
    { name: 'Bosmer', page: 'Bosmer', alliance: 'Aldmeri Dominion' },
    { name: 'Dunmer', page: 'Dunmer', alliance: 'Ebonheart Pact' },
    { name: 'Argonian', page: 'Argonian', alliance: 'Ebonheart Pact' },
    { name: 'Khajiit', page: 'Khajiit', alliance: 'Aldmeri Dominion' },
    { name: 'Breton', page: 'Breton', alliance: 'Daggerfall Covenant' },
    { name: 'Redguard', page: 'Redguard', alliance: 'Daggerfall Covenant' },
    { name: 'Orc', page: 'Orc', alliance: 'Daggerfall Covenant' },
    { name: 'Nord', page: 'Nord', alliance: 'Ebonheart Pact' },
    { name: 'Imperial', page: 'Imperial', alliance: 'Any' },
  ];

  /**
   * Scrape a specific batch of races
   * @param startIndex - Starting index in the RACES array
   * @param count - Number of races to scrape (max 3 recommended)
   */
  async scrapeBatch(startIndex: number = 0, count: number = 3): Promise<void> {
    const racesToScrape = this.RACES.slice(startIndex, startIndex + count);

    if (racesToScrape.length === 0) {
      logger.info('No races to scrape in this batch');
      return;
    }

    logger.info(`Starting race scrape batch (${startIndex + 1}-${startIndex + racesToScrape.length})...`);

    for (const raceConfig of racesToScrape) {
      try {
        await this.scrapeRace(raceConfig);
      } catch (error) {
        logger.error(`Failed to scrape race ${raceConfig.name}:`, error);
      }
    }

    logger.info(`Race batch scraping complete!`);
  }

  /**
   * Scrape all races (will be done in batches automatically)
   */
  async scrape(): Promise<void> {
    logger.info('Starting full race scrape...');

    // Process in batches of 3 to avoid memory issues
    for (let i = 0; i < this.RACES.length; i += 3) {
      await this.scrapeBatch(i, 3);

      // Add a longer delay between batches
      if (i + 3 < this.RACES.length) {
        logger.info('Pausing between batches...');
        await this.delay(3000);
      }
    }

    logger.info('All races scraped successfully!');
  }

  private async scrapeRace(raceConfig: { name: string; page: string; alliance: string }): Promise<void> {
    logger.info(`Scraping race: ${raceConfig.name}`);

    const raceUrl = `/wiki/Online:${raceConfig.page}`;
    const html = await this.fetchPage(raceUrl);
    const $ = cheerio.load(html);

    const raceData = this.parseRacePage($, raceConfig);

    // Save to JSON file
    const fullRaceData = {
      ...raceData,
      scrapedAt: new Date().toISOString(),
    };

    const filename = path.join(this.DATA_DIR, `${this.sanitizeId(raceConfig.name)}.json`);
    await fs.writeFile(filename, JSON.stringify(fullRaceData, null, 2), 'utf-8');
    logger.info(`Saved ${raceConfig.name} to ${filename}`);

    logger.info(`Completed scraping ${raceConfig.name}`);
  }

  private parseRacePage(
    $: cheerio.CheerioAPI,
    raceConfig: { name: string; page: string; alliance: string }
  ): RaceData {
    const raceData: RaceData = {
      name: raceConfig.name,
      description: '',
      alliance: raceConfig.alliance,
      passives: [],
    };

    // Extract race description from the first paragraph after the main heading
    const firstParagraph = $('.mw-parser-output > p').first().text().trim();
    raceData.description = firstParagraph || `The ${raceConfig.name} race in Elder Scrolls Online.`;

    // Find racial passives in the skills table
    // Racial passives are typically in a table with headers like "Name", "Rank", "Description"
    $('table.wikitable').each((_, table) => {
      const $table = $(table);

      // Check if this is the racial passives table
      const headers: string[] = [];
      $table.find('tr').first().find('th').each((_, th) => {
        headers.push($(th).text().trim());
      });

      // Look for skill/passive tables
      if (headers.some(h => h.toLowerCase().includes('name') || h.toLowerCase().includes('skill'))) {
        $table.find('tr').slice(1).each((_, row) => {
          const $row = $(row);
          const cells = $row.find('td');

          if (cells.length === 0) return;

          // Extract passive name from the first cell
          const nameCell = cells.eq(0);
          const passiveName = nameCell.find('a').first().text().trim() || nameCell.text().trim();

          if (!passiveName) return;

          // Extract description (usually in last cell)
          const descriptionCell = cells.last();
          const description = descriptionCell.text().trim();

          // Try to extract rank and unlock level from the description or separate columns
          let rank = 1;
          let unlockLevel = 1;

          // Check if there are rank indicators in the description
          const rankMatch = description.match(/Rank\s+(\d+)/i);
          if (rankMatch) {
            rank = parseInt(rankMatch[1], 10);
          }

          // Check for unlock level
          const levelMatch = description.match(/(?:unlocks?\s+at|level)\s+(\d+)/i);
          if (levelMatch) {
            unlockLevel = parseInt(levelMatch[1], 10);
          }

          // Try to find multiple ranks of the same passive
          // If the passive name already exists, increment the rank
          const existingPassive = raceData.passives.find(p => p.name === passiveName);
          if (existingPassive) {
            rank = existingPassive.rank + 1;
          }

          // Parse effects from the description
          const effects = this.parseEffects(description);

          const passive: RacePassiveData = {
            name: passiveName,
            rank,
            description,
            unlockLevel,
            effects,
          };

          raceData.passives.push(passive);
        });
      }
    });

    // If we didn't find passives in tables, try looking for them in the page content
    if (raceData.passives.length === 0) {
      raceData.passives = this.parsePassivesFromContent($);
    }

    return raceData;
  }

  private parsePassivesFromContent($: cheerio.CheerioAPI): RacePassiveData[] {
    const passives: RacePassiveData[] = [];

    // Look for skill sections (usually h3 or h4 headers followed by description)
    $('h3, h4').each((_, heading) => {
      const $heading = $(heading);
      const headingText = $heading.text().trim();

      // Skip non-skill headings
      if (headingText.toLowerCase().includes('passive') ||
          headingText.toLowerCase().includes('skill') ||
          /^[A-Z]/.test(headingText)) {

        // Get the content after this heading until the next heading
        const content = $heading.nextUntil('h2, h3, h4').text().trim();

        if (content) {
          // Try to extract rank and level info
          const rankMatches = content.matchAll(/Rank\s+(\d+).*?unlocks?\s+at.*?level\s+(\d+)/gi);

          let rankCount = 0;
          for (const match of rankMatches) {
            rankCount++;
            const passive: RacePassiveData = {
              name: headingText.replace(/\[edit\]/gi, '').trim(),
              rank: parseInt(match[1], 10) || rankCount,
              description: content,
              unlockLevel: parseInt(match[2], 10) || 1,
              effects: this.parseEffects(content),
            };
            passives.push(passive);
          }

          // If no rank matches, create a single passive
          if (rankCount === 0 && content.length > 0) {
            const passive: RacePassiveData = {
              name: headingText.replace(/\[edit\]/gi, '').trim(),
              rank: 1,
              description: content,
              unlockLevel: 1,
              effects: this.parseEffects(content),
            };
            passives.push(passive);
          }
        }
      }
    });

    return passives;
  }

  private parseEffects(description: string): Array<{ type: string; description: string; value?: string }> {
    const effects: Array<{ type: string; description: string; value?: string }> = [];

    // Common effect patterns in ESO racial passives
    const patterns = [
      { regex: /increases?\s+(.+?)\s+by\s+(\d+\.?\d*%?)/gi, type: 'stat_increase' },
      { regex: /restores?\s+(\d+)\s+(.+)/gi, type: 'restore' },
      { regex: /reduces?\s+(.+?)\s+by\s+(\d+\.?\d*%?)/gi, type: 'reduction' },
      { regex: /grants?\s+(.+)/gi, type: 'grant' },
      { regex: /immunity\s+to\s+(.+)/gi, type: 'immunity' },
      { regex: /resistance\s+to\s+(.+)/gi, type: 'resistance' },
    ];

    for (const pattern of patterns) {
      const matches = description.matchAll(pattern.regex);
      for (const match of matches) {
        effects.push({
          type: pattern.type,
          description: match[0],
          value: match[2] || match[1],
        });
      }
    }

    // If no specific effects found, use the whole description as a single effect
    if (effects.length === 0) {
      effects.push({
        type: 'passive',
        description: description,
      });
    }

    return effects;
  }
}
