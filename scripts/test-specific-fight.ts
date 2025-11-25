#!/usr/bin/env tsx
/**
 * Test specific fight data
 */

import 'dotenv/config';

const OAUTH_TOKEN_URL = 'https://www.esologs.com/oauth/token';
const GRAPHQL_URL = 'https://www.esologs.com/api/v2/client';

async function getAccessToken(): Promise<string> {
  const clientId = process.env.ESOLOGS_CLIENT_ID;
  const clientSecret = process.env.ESOLOGS_CLIENT_SECRET;

  const response = await fetch(OAUTH_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: clientId!,
      client_secret: clientSecret!,
    }),
  });

  const tokenData = await response.json() as any;
  return tokenData.access_token;
}

async function testFight() {
  console.log('🔍 Testing Specific Fight Data\n');

  const token = await getAccessToken();

  // Try fight ID 7 (Exarchanic Yaseyla - a successful kill)
  const damageQuery = `
    query($code: String!, $fightIDs: [Int]!, $sourceID: Int) {
      reportData {
        report(code: $code) {
          table(
            dataType: DamageDone
            fightIDs: $fightIDs
            sourceID: $sourceID
          )
        }
      }
    }
  `;

  console.log('Testing Fight ID 7 (Exarchanic Yaseyla) for source ID 2 (Beaming You Softly)...\n');

  const response = await fetch(GRAPHQL_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      query: damageQuery,
      variables: {
        code: 'NL1mBFp4C3Tn76cz',
        fightIDs: [7],
        sourceID: 2,
      },
    }),
  });

  const result = await response.json();
  const table = result.data.reportData.report.table;

  console.log('Table structure:', JSON.stringify(table, null, 2));

  if (table.data) {
    console.log('\n=== Data Summary ===');
    console.log(`Entries: ${table.data.entries?.length || 0}`);
    console.log(`Total Time: ${table.data.totalTime}ms`);
    console.log(`Active Time: ${table.data.activeTime}ms`);

    if (table.data.entries && table.data.entries.length > 0) {
      console.log('\n=== Top 5 Abilities ===');
      table.data.entries.slice(0, 5).forEach((entry: any, i: number) => {
        console.log(`${i + 1}. ${entry.name || entry.guid}: ${entry.total?.toLocaleString() || 0} damage`);
      });
    }
  }
}

testFight().catch(console.error);
