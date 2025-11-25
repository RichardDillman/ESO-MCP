import * as cheerio from 'cheerio';
import * as fs from 'fs/promises';
import * as path from 'path';
import { BaseScraper } from './base.js';
import { logger } from '../utils/logger.js';

interface ClassSkillLine {
  name: string;
  description: string;
}

interface ClassData {
  name: string;
  description: string;
  skillLines: ClassSkillLine[];
}

export class ClassScraper extends BaseScraper {
  private readonly DATA_DIR = path.join(process.cwd(), 'data', 'scraped', 'classes');

  // Class configurations with their UESP page names
  private readonly CLASSES = [
    { name: 'Dragonknight', page: 'Dragonknight', skillLines: ['Ardent Flame', 'Draconic Power', 'Earthen Heart'] },
    { name: 'Sorcerer', page: 'Sorcerer', skillLines: ['Dark Magic', 'Daedric Summoning', 'Storm Calling'] },
    { name: 'Nightblade', page: 'Nightblade', skillLines: ['Assassination', 'Shadow', 'Siphoning'] },
    { name: 'Templar', page: 'Templar', skillLines: ['Aedric Spear', 'Dawn\'s Wrath', 'Restoring Light'] },
    { name: 'Warden', page: 'Warden', skillLines: ['Animal Companions', 'Green Balance', 'Winter\'s Embrace'] },
    { name: 'Necromancer', page: 'Necromancer', skillLines: ['Grave Lord', 'Bone Tyrant', 'Living Death'] },
    { name: 'Arcanist', page: 'Arcanist', skillLines: ['Herald of the Tome', 'Apocryphal Soldier', 'Curative Runeforms'] },
  ];

  /**
   * Scrape a specific batch of classes
   * @param startIndex - Starting index in the CLASSES array
   * @param count - Number of classes to scrape (max 3 recommended)
   */
  async scrapeBatch(startIndex: number = 0, count: number = 3): Promise<void> {
    const classesToScrape = this.CLASSES.slice(startIndex, startIndex + count);

    if (classesToScrape.length === 0) {
      logger.info('No classes to scrape in this batch');
      return;
    }

    logger.info(`Starting class scrape batch (${startIndex + 1}-${startIndex + classesToScrape.length})...`);

    for (const classConfig of classesToScrape) {
      try {
        await this.scrapeClass(classConfig);
      } catch (error) {
        logger.error(`Failed to scrape class ${classConfig.name}:`, error);
      }
    }

    logger.info(`Class batch scraping complete!`);
  }

  /**
   * Scrape all classes (will be done in batches automatically)
   */
  async scrape(): Promise<void> {
    logger.info('Starting full class scrape...');

    // Process in batches of 3 to avoid memory issues
    for (let i = 0; i < this.CLASSES.length; i += 3) {
      await this.scrapeBatch(i, 3);

      // Add a longer delay between batches
      if (i + 3 < this.CLASSES.length) {
        logger.info('Pausing between batches...');
        await this.delay(3000);
      }
    }

    logger.info('All classes scraped successfully!');
  }

  private async scrapeClass(classConfig: { name: string; page: string; skillLines: string[] }): Promise<void> {
    logger.info(`Scraping class: ${classConfig.name}`);

    const classUrl = `/wiki/Online:${classConfig.page}`;
    const html = await this.fetchPage(classUrl);
    const $ = cheerio.load(html);

    const classData = this.parseClassPage($, classConfig);

    // Scrape all skill lines for this class
    const skillLinesData = [];
    for (const skillLineName of classConfig.skillLines) {
      try {
        const skillLineData = await this.scrapeSkillLineData(classConfig.name, skillLineName);
        skillLinesData.push(skillLineData);
      } catch (error) {
        logger.error(`Failed to scrape skill line ${skillLineName} for ${classConfig.name}:`, error);
      }
    }

    // Save everything to JSON file
    const fullClassData = {
      ...classData,
      skillLinesData,
      scrapedAt: new Date().toISOString(),
    };

    const filename = path.join(this.DATA_DIR, `${this.sanitizeId(classConfig.name)}.json`);
    await fs.writeFile(filename, JSON.stringify(fullClassData, null, 2), 'utf-8');
    logger.info(`Saved ${classConfig.name} to ${filename}`);

    logger.info(`Completed scraping ${classConfig.name}`);
  }

  private parseClassPage($: cheerio.CheerioAPI, classConfig: { name: string; page: string; skillLines: string[] }): ClassData {
    const classData: ClassData = {
      name: classConfig.name,
      description: '',
      skillLines: [],
    };

    // Extract class description from the first paragraph
    const firstParagraph = $('.mw-parser-output > p').first().text().trim();
    classData.description = firstParagraph || `The ${classConfig.name} class in Elder Scrolls Online.`;

    // Extract skill line descriptions
    for (const skillLineName of classConfig.skillLines) {
      // Find the skill line section
      const skillLineHeader = $(`h3:contains("${skillLineName}")`).first();

      let description = '';
      if (skillLineHeader.length > 0) {
        // Get the description from the paragraph after the header
        const descParagraph = skillLineHeader.nextAll('p').first().text().trim();
        description = descParagraph;
      }

      if (!description) {
        // Try to find it in the intro text
        const introText = $('.mw-parser-output').text();
        const skillLineMatch = introText.match(new RegExp(`${skillLineName}[^.]*is geared[^.]+\\.`, 'i'));
        if (skillLineMatch) {
          description = skillLineMatch[0];
        }
      }

      classData.skillLines.push({
        name: skillLineName,
        description: description || `The ${skillLineName} skill line for ${classConfig.name}.`,
      });
    }

    return classData;
  }

  private async scrapeSkillLineData(className: string, skillLineName: string): Promise<any> {
    logger.info(`  Scraping skill line: ${skillLineName}`);

    const skillLineUrl = `/wiki/Online:${skillLineName.replace(/'/g, '%27')}`;

    const html = await this.fetchPage(skillLineUrl);
    const $ = cheerio.load(html);

    const skillLineId = this.sanitizeId(skillLineName);
    const skills = this.parseSkillsFromSkillLinePage($, skillLineName, className);

    logger.info(`    Scraped ${skills.length} skills from ${skillLineName}`);

    return {
      id: skillLineId,
      name: skillLineName,
      category: 'class',
      maxRank: 50,
      skills,
    };
  }

  private parseSkillsFromSkillLinePage($: cheerio.CheerioAPI, skillLineName: string, _className: string): any[] {
    const skills: any[] = [];

    // Find all skill tables on the page
    // Skills are typically in wikitable with columns: Name, Line, Cast Time, Target, etc.
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
          category: 'class',
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
