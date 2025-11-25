import 'dotenv/config';
import axios from 'axios';
import * as cheerio from 'cheerio';

const RATE_LIMIT_DELAY = 2000; // 2 seconds between requests

interface DivinesScaling {
  pieces: number;
  normal: number;
  fine: number;
  superior: number;
  epic: number;
  legendary: number;
}

interface MundusEffect {
  type: string;
  baseValue: string;
  isPercentage: boolean;
  divinesScaling: DivinesScaling[];
}

interface MundusStone {
  name: string;
  effects: MundusEffect[];
  locations: {
    aldmeriDominion: string;
    daggerfallCovenant: string;
    ebonheartPact: string;
    cyrodiil: string;
  };
  url: string;
}

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function fetchPage(url: string): Promise<string> {
  console.log(`Fetching: ${url}`);
  const response = await axios.get(url, {
    headers: {
      'User-Agent': 'ESO-MCP-Server/0.1.0 (Educational Purpose)',
    },
  });
  await delay(RATE_LIMIT_DELAY);
  return response.data;
}

function parseValue(value: string): string {
  // Clean up the value - remove whitespace, handle percentages
  return value.trim();
}

function isPercentage(value: string): boolean {
  return value.includes('%');
}

async function scrapeMundusStoneDetails(url: string, stoneName: string): Promise<MundusEffect[]> {
  const html = await fetchPage(url);
  const $ = cheerio.load(html);

  const effects: MundusEffect[] = [];

  // Find all Divines tables (there may be multiple for stones like The Steed)
  $('table.wikitable').each((tableIndex, table) => {
    const $table = $(table);

    // Check if this is a Divines scaling table
    const headerText = $table.find('th').first().text().trim();
    if (!headerText.toLowerCase().includes('divines')) {
      return; // Skip non-Divines tables
    }

    // Get the effect type from the heading before the table
    let effectType = '';
    let prevElement = $table.prev();
    while (prevElement.length > 0 && !effectType) {
      const tagName = prevElement.prop('tagName');
      if (tagName === 'H2' || tagName === 'H3' || tagName === 'P') {
        const text = prevElement.text().trim();
        if (text && text.length < 100) {
          effectType = text;
          break;
        }
      }
      prevElement = prevElement.prev();
    }

    if (!effectType) {
      // Fallback: try to infer from stone name or table context
      effectType = `Effect ${effects.length + 1}`;
    }

    const divinesScaling: DivinesScaling[] = [];

    // Parse the table rows (skip header row)
    $table.find('tr').slice(1).each((rowIndex, row) => {
      const $row = $(row);
      const cells = $row.find('td');

      if (cells.length >= 6) {
        const pieces = parseInt(cells.eq(0).text().trim());
        const normal = parseFloat(cells.eq(1).text().trim().replace('%', ''));
        const fine = parseFloat(cells.eq(2).text().trim().replace('%', ''));
        const superior = parseFloat(cells.eq(3).text().trim().replace('%', ''));
        const epic = parseFloat(cells.eq(4).text().trim().replace('%', ''));
        const legendary = parseFloat(cells.eq(5).text().trim().replace('%', ''));

        divinesScaling.push({
          pieces,
          normal,
          fine,
          superior,
          epic,
          legendary,
        });
      }
    });

    if (divinesScaling.length > 0) {
      const baseValue = parseValue(divinesScaling[0].normal.toString());
      const isPct = isPercentage(effectType) || baseValue.includes('%');

      effects.push({
        type: effectType,
        baseValue: isPct ? `${baseValue}%` : baseValue,
        isPercentage: isPct,
        divinesScaling,
      });
    }
  });

  return effects;
}

export async function scrapeMundusStones(): Promise<MundusStone[]> {
  const mainUrl = 'https://en.uesp.net/wiki/Online:Mundus_Stones';
  const html = await fetchPage(mainUrl);
  const $ = cheerio.load(html);

  const stones: MundusStone[] = [];

  // Find the main summary table
  const summaryTable = $('table.wikitable').first();

  // Parse each stone from the summary table (skip header row at index 0)
  const rows = summaryTable.find('tr').slice(1);

  for (let i = 0; i < rows.length; i++) {
    const row = rows.eq(i);

    // Each stone row has: th (stone name) + td cells (locations, effect, values)
    const stoneTh = row.find('th').first();
    const cells = row.find('td');

    if (stoneTh.length > 0 && cells.length >= 7) {
      // Extract stone name and URL from row header
      const link = stoneTh.find('a').first();
      const name = link.text().trim();
      const relativeUrl = link.attr('href') || '';

      if (!relativeUrl.startsWith('/')) {
        continue; // Skip if no valid relative URL
      }

      const url = `https://en.uesp.net${relativeUrl}`;

      // Extract locations (cells 0-3)
      const aldmeriDominion = cells.eq(0).text().trim();
      const daggerfallCovenant = cells.eq(1).text().trim();
      const ebonheartPact = cells.eq(2).text().trim();
      const cyrodiil = cells.eq(3).text().trim();

      // Extract base effect info (cells 4-6)
      const effectType = cells.eq(4).text().trim();
      const baseValue = cells.eq(5).text().trim();

      console.log(`Processing: ${name}`);

      // Scrape detailed Divines scaling from individual stone page
      // Limit: only scrape first 3 stones for now as per user request
      let effects: MundusEffect[] = [];

      if (stones.length < 3) {
        effects = await scrapeMundusStoneDetails(url, name);
      } else {
        // For stones beyond the first 3, create minimal effect data from summary
        effects = [{
          type: effectType,
          baseValue,
          isPercentage: isPercentage(baseValue),
          divinesScaling: [], // Will be populated in future scrapes
        }];
      }

      stones.push({
        name,
        effects,
        locations: {
          aldmeriDominion,
          daggerfallCovenant,
          ebonheartPact,
          cyrodiil,
        },
        url,
      });
    }
  }

  return stones;
}
