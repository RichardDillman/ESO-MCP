import { cache } from './cache.js';
import type { Skill, SkillLine } from '../types/index.js';

export class DataLoader {
  async loadSkills(): Promise<Skill[]> {
    const data = await cache.read<Skill[]>('skills.json');
    return data || [];
  }

  async loadSkillLines(): Promise<SkillLine[]> {
    const data = await cache.read<SkillLine[]>('skill-lines.json');
    return data || [];
  }

  async saveSkills(skills: Skill[]): Promise<void> {
    await cache.write('skills.json', skills);
  }

  async saveSkillLines(skillLines: SkillLine[]): Promise<void> {
    await cache.write('skill-lines.json', skillLines);
  }

  async getMetadata(): Promise<Record<string, unknown> | null> {
    return await cache.read('metadata.json');
  }

  async saveMetadata(metadata: Record<string, unknown>): Promise<void> {
    await cache.write('metadata.json', metadata);
  }
}

export const dataLoader = new DataLoader();
