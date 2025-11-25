import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class DataCache {
  private dataDir: string;

  constructor(dataDir?: string) {
    this.dataDir = dataDir || path.join(__dirname, '../../data');
  }

  async ensureDataDir(): Promise<void> {
    try {
      await fs.access(this.dataDir);
    } catch {
      await fs.mkdir(this.dataDir, { recursive: true });
    }
  }

  async read<T>(filename: string): Promise<T | null> {
    try {
      const filePath = path.join(this.dataDir, filename);
      const data = await fs.readFile(filePath, 'utf-8');
      return JSON.parse(data) as T;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return null;
      }
      throw error;
    }
  }

  async write<T>(filename: string, data: T): Promise<void> {
    await this.ensureDataDir();
    const filePath = path.join(this.dataDir, filename);
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
  }

  async exists(filename: string): Promise<boolean> {
    try {
      const filePath = path.join(this.dataDir, filename);
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  async delete(filename: string): Promise<void> {
    try {
      const filePath = path.join(this.dataDir, filename);
      await fs.unlink(filePath);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        throw error;
      }
    }
  }
}

export const cache = new DataCache();
