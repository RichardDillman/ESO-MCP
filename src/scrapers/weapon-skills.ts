import * as cheerio from 'cheerio';
import * as fs from 'fs/promises';
import * as path from 'path';
import { BaseScraper } from './base.js';
import { logger } from '../utils/logger.js';

interface WeaponSkillLineData {
  id: string;
  name: string;
  category: string;
  maxRank: number;
  skills: any[];
}

export class WeaponSkillsScraper extends BaseScraper {
  private readonly DATA_DIR = path.join(process.cwd(), 'data', 'scraped', 'skills');

  // Weapon skill line configurations
  private readonly WEAPON_SKILLS = [
    { name: 'Two Handed', page: 'Two_Handed', category: 'weapon' },
    { name: 'One Hand and Shield', page: 'One_Hand_and_Shield', category: 'weapon' },
    { name: 'Dual Wield', page: 'Dual_Wield', category: 'weapon' },
    { name: 'Bow', page: 'Bow', category: 'weapon' },
    { name: 'Destruction Staff', page: 'Destruction_Staff', category: 'weapon' },
    { name: 'Restoration Staff', page: 'Restoration_Staff', category: 'weapon' },
  ];

  /**
   * Scrape a specific batch of weapon skill lines
   */
  async scrapeBatch(startIndex: number = 0, count: number = 3): Promise<void> {
    const skillLinesToScrape = this.WEAPON_SKILLS.slice(startIndex, startIndex + count);

    if (skillLinesToScrape.length === 0) {
      logger.info('No weapon skill lines to scrape in this batch');
      return;
    }

    logger.info(`Starting weapon skill line scrape batch (${startIndex + 1}-${startIndex + skillLinesToScrape.length})...`);

    for (const skillLineConfig of skillLinesToScrape) {
      try {
        await this.scrapeWeaponSkillLine(skillLineConfig);
      } catch (error) {
        logger.error(`Failed to scrape weapon skill line ${skillLineConfig.name}:`, error);
      }
    }

    logger.info(`Weapon skill line batch scraping complete!`);
  }

  /**
   * Scrape all weapon skill lines
   */
  async scrape(): Promise<void> {
    logger.info('Starting full weapon skill lines scrape...');

    for (let i = 0; i < this.WEAPON_SKILLS.length; i += 3) {
      await this.scrapeBatch(i, 3);

      if (i + 3 < this.WEAPON_SKILLS.length) {
        logger.info('Pausing between batches...');
        await this.delay(3000);
      }
    }

    logger.info('All weapon skill lines scraped successfully!');
  }

  private async scrapeWeaponSkillLine(skillLineConfig: { name: string; page: string; category: string }): Promise<void> {
    logger.info(`Scraping weapon skill line: ${skillLineConfig.name}`);

    const skillLineUrl = `/wiki/Online:${skillLineConfig.page}`;
    const html = await this.fetchPage(skillLineUrl);
    const $ = cheerio.load(html);

    const skillLineId = this.sanitizeId(skillLineConfig.name);
    const skills = this.parseSkillsFromSkillLinePage($, skillLineConfig.name);

    const skillLineData: WeaponSkillLineData = {
      id: skillLineId,
      name: skillLineConfig.name,
      category: skillLineConfig.category,
      maxRank: 50,
      skills,
    };

    // Save to JSON file
    const fullData = {
      ...skillLineData,
      scrapedAt: new Date().toISOString(),
    };

    const filename = path.join(this.DATA_DIR, `${skillLineId}.json`);
    await fs.writeFile(filename, JSON.stringify(fullData, null, 2), 'utf-8');
    logger.info(`Saved ${skillLineConfig.name} to ${filename} (${skills.length} skills)`);

    logger.info(`Completed scraping ${skillLineConfig.name}`);
  }

  private parseSkillsFromSkillLinePage($: cheerio.CheerioAPI, skillLineName: string): any[] {
    const skills: any[] = [];

    // Find all skill tables on the page
    $('table.wikitable').each((_, table) => {
      const $table = $(table);

      // Check if this is a skills table
      const headers: string[] = [];
      $table.find('tr').first().find('th').each((_, th) => {
        headers.push($(th).text().trim());
      });

      // Look for skill tables (they have "Name" column)
      if (!headers.some(h => h.toLowerCase().includes('name'))) {
        return;
      }

      // Skip if it's a morph or progression table
      const tableText = $table.text().toLowerCase();
      if (tableText.includes('morph') && tableText.includes('base skill')) {
        return;
      }

      // Parse each row
      $table.find('tr').slice(1).each((_, row) => {
        const $row = $(row);
        const cells = $row.find('td');

        if (cells.length === 0) return;

        // Extract skill name from the first cell
        const nameCell = cells.eq(0);
        const skillLink = nameCell.find('a').first();
        const skillName = skillLink.text().trim();

        if (!skillName) return;

        // Get description - usually the last cell or a cell with lots of text
        let description = '';
        let maxCellLength = 0;
        cells.each((idx, cell) => {
          const cellText = $(cell).text().trim();
          if (cellText.length > maxCellLength && idx > 0) {
            maxCellLength = cellText.length;
            description = cellText;
          }
        });

        const skillUrl = skillLink.attr('href');

        // Determine skill type
        let skillType = 'active';
        const rowClass = $row.attr('class') || '';
        const descLower = description.toLowerCase();

        if (descLower.includes('passive') || rowClass.includes('passive')) {
          skillType = 'passive';
        } else if (descLower.includes('ultimate') || rowClass.includes('ultimate')) {
          skillType = 'ultimate';
        }

        const skillData: any = {
          id: this.sanitizeId(skillName),
          name: skillName,
          type: skillType,
          skillLine: skillLineName,
          category: 'weapon',
          description,
          source: `https://en.uesp.net${skillUrl}`,
          effects: [],
        };

        // Parse cost if available
        const costMatch = description.match(/(\d+)\s*(Magicka|Stamina|Ultimate)/i);
        if (costMatch) {
          skillData.costAmount = parseInt(costMatch[1]);
          skillData.costResource = costMatch[2].toLowerCase();
        }

        // Parse range if available
        const rangeMatch = description.match(/(\d+)\s*meters?/i);
        if (rangeMatch) {
          skillData.range = parseInt(rangeMatch[1]);
        }

        skills.push(skillData);
      });
    });

    return skills;
  }
}
