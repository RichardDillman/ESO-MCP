import * as cheerio from 'cheerio';
import { BaseScraper } from './base.js';
import { prisma } from '../lib/prisma.js';
import { logger } from '../utils/logger.js';

interface SkillData {
  id: string;
  name: string;
  type: string;
  skillLine: string;
  category: string;
  description: string;
  source: string;
  costResource?: string;
  costAmount?: number;
  castTime?: number;
  range?: number;
  target?: string;
  effects: Array<{
    type: string;
    description: string;
    value?: string;
    target?: string;
  }>;
}

export class SkillsScraper extends BaseScraper {
  async scrape(): Promise<void> {
    logger.info('Starting Dragonknight Ardent Flame skill scrape...');

    // For Phase 1, we'll scrape one skill line: Dragonknight > Ardent Flame
    await this.scrapeDragonknightArdentFlame();

    logger.info('Skill scraping complete!');
  }

  private async scrapeDragonknightArdentFlame(): Promise<void> {
    const skillLineUrl = '/wiki/Online:Dragonknight';
    const html = await this.fetchPage(skillLineUrl);
    const $ = cheerio.load(html);

    const skillLineName = 'Ardent Flame';
    const skillLineId = this.sanitizeId(skillLineName);

    // Create or update skill line
    await prisma.skillLine.upsert({
      where: { id: skillLineId },
      update: {
        name: skillLineName,
        category: 'class',
        maxRank: 50,
      },
      create: {
        id: skillLineId,
        name: skillLineName,
        category: 'class',
        maxRank: 50,
      },
    });

    logger.info(`Created skill line: ${skillLineName}`);

    // Parse skills from the page
    const skills = await this.parseSkillsFromPage($, skillLineName);

    // Save skills to database
    for (const skillData of skills) {
      await this.saveSkill(skillData, skillLineId);
    }

    logger.info(`Scraped ${skills.length} skills from ${skillLineName}`);
  }

  private parseSkillsFromPage($: cheerio.CheerioAPI, skillLineName: string): SkillData[] {
    const skills: SkillData[] = [];

    // Find the Ardent Flame section
    const ardentFlameSection = $('h3:contains("Ardent Flame")').first();

    if (ardentFlameSection.length === 0) {
      logger.warn('Ardent Flame section not found');
      return skills;
    }

    // Get the table following the header
    const skillTable = ardentFlameSection.nextAll('table').first();

    if (skillTable.length === 0) {
      logger.warn('Skills table not found');
      return skills;
    }

    // Parse each row in the table
    skillTable.find('tr').each((_, row) => {
      const $row = $(row);
      const cells = $row.find('td');

      if (cells.length < 2) return; // Skip header rows

      const nameCell = cells.eq(0);
      const descriptionCell = cells.eq(1);

      const skillLink = nameCell.find('a').first();
      const skillName = skillLink.text().trim();

      if (!skillName) return;

      const description = descriptionCell.text().trim();
      const skillUrl = skillLink.attr('href');

      // Determine skill type from the row or description
      let skillType = 'active';
      if (description.toLowerCase().includes('passive')) {
        skillType = 'passive';
      } else if (description.toLowerCase().includes('ultimate')) {
        skillType = 'ultimate';
      }

      const skillData: SkillData = {
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

    return skills;
  }

  private async saveSkill(skillData: SkillData, skillLineId: string): Promise<void> {
    try {
      // Upsert skill
      await prisma.skill.upsert({
        where: { id: skillData.id },
        update: {
          name: skillData.name,
          type: skillData.type,
          skillLine: skillData.skillLine,
          category: skillData.category,
          description: skillData.description,
          source: skillData.source,
          costResource: skillData.costResource,
          costAmount: skillData.costAmount,
          range: skillData.range,
          target: skillData.target,
          skillLineId,
        },
        create: {
          id: skillData.id,
          name: skillData.name,
          type: skillData.type,
          skillLine: skillData.skillLine,
          category: skillData.category,
          description: skillData.description,
          source: skillData.source,
          costResource: skillData.costResource,
          costAmount: skillData.costAmount,
          range: skillData.range,
          target: skillData.target,
          skillLineId,
        },
      });

      // Save effects
      for (const effect of skillData.effects) {
        await prisma.effect.create({
          data: {
            type: effect.type,
            description: effect.description,
            value: effect.value,
            target: effect.target,
            skillId: skillData.id,
          },
        });
      }

      logger.debug(`Saved skill: ${skillData.name}`);
    } catch (error) {
      logger.error(`Failed to save skill ${skillData.name}:`, error);
    }
  }
}
