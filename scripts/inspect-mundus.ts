import axios from 'axios';
import * as cheerio from 'cheerio';

async function inspect() {
  const response = await axios.get('https://en.uesp.net/wiki/Online:Mundus_Stones', {
    headers: {
      'User-Agent': 'ESO-MCP-Server/0.1.0 (Educational Purpose)',
    },
  });

  const $ = cheerio.load(response.data);

  console.log('=== Examining first table ===');
  const firstTable = $('table.wikitable').first();
  const rows = firstTable.find('tr');

  console.log(`Total rows: ${rows.length}\n`);

  rows.slice(0, 5).each((i, row) => {
    console.log(`\nRow ${i}:`);
    const ths = $(row).find('th');
    const tds = $(row).find('td');

    if (ths.length > 0) {
      console.log(`  Headers (${ths.length}):`);
      ths.each((j, th) => {
        const text = $(th).text().trim().substring(0, 30);
        const links = $(th).find('a');
        console.log(`    [${j}] "${text}"`);
        links.each((k, link) => {
          console.log(`       Link: ${$(link).text().trim()} -> ${$(link).attr('href')}`);
        });
      });
    }

    if (tds.length > 0) {
      console.log(`  Data cells (${tds.length}):`);
      tds.each((j, td) => {
        const text = $(td).text().trim().substring(0, 30);
        const links = $(td).find('a');
        console.log(`    [${j}] "${text}"`);
        if (links.length > 0) {
          links.each((k, link) => {
            console.log(`       Link: ${$(link).text().trim()} -> ${$(link).attr('href')}`);
          });
        }
      });
    }
  });
}

inspect().catch(console.error);
