import axios from 'axios';
import * as cheerio from 'cheerio';
import { logger } from '../src/utils/logger.js';

async function debugSetsScraper() {
  try {
    const url = 'https://en.uesp.net/wiki/Online:Craftable_Sets';
    logger.info(`Fetching ${url}...`);

    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'ESO-MCP-Server/1.0 (Educational/Research)',
      },
    });

    const $ = cheerio.load(response.data);

    // Find the first set table
    const $table = $('table.wikitable').first();

    logger.info('Table found, examining structure...');

    // Get headers
    const headers: string[] = [];
    $table.find('tr').first().find('th').each((idx, th) => {
      const headerText = $(th).text().trim();
      headers.push(headerText);
      logger.info(`Header ${idx}: "${headerText}"`);
    });

    // Check first 3 data rows
    for (let rowIdx = 1; rowIdx <= 3; rowIdx++) {
      logger.info(`\n\n========== ROW ${rowIdx} ==========`);
      const $row = $table.find('tr').eq(rowIdx);
      const cells = $row.find('td');
      const rowHtml = $row.html()?.substring(0, 300);

      logger.info(`Row HTML preview: ${rowHtml}...`);
      logger.info(`Row has ${cells.length} cells`);

      cells.each((idx, cell) => {
      const $cell = $(cell);
      const text = $cell.text().trim();
      const html = $cell.html();

      logger.info(`\nCell ${idx} (${headers[idx] || 'unknown'}):`);
      logger.info(`  Text length: ${text.length}`);
      logger.info(`  Text preview: ${text.substring(0, 200)}...`);

      if (idx === 0) {
        logger.info(`\n=== FIRST CELL HTML (Set Name) ===`);
        logger.info(html?.substring(0, 500));

        // Try to extract set name
        const setName = $cell.find('a').first().text().trim();
        logger.info(`\n  Extracted set name from link: "${setName}"`);
      }

      if (headers[idx]?.toLowerCase().includes('bonus') || idx === 1) {
        logger.info(`\n=== BONUSES COLUMN HTML ===`);
        logger.info(html?.substring(0, 800));
        logger.info(`\n=== BONUSES COLUMN TEXT ===`);
        logger.info(text.substring(0, 500));
      }
    });
    } // end for loop

  } catch (error) {
    logger.error('Debug failed:', error);
  }
}

debugSetsScraper();
