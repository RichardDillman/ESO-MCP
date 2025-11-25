#!/usr/bin/env tsx
/**
 * Debug ESO Logs API Response
 * Shows the raw structure returned by the API
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

async function debugQuery() {
  console.log('🔍 Debugging ESO Logs API Response\n');

  const token = await getAccessToken();
  console.log('✅ Got access token\n');

  // Query for damage data
  const damageQuery = `
    query($code: String!, $fightIDs: [Int], $sourceID: Int) {
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
        fightIDs: [-2],
        sourceID: 2,
      },
    }),
  });

  const result = await response.json();

  console.log('📊 Damage Data Response:');
  console.log(JSON.stringify(result, null, 2));
  console.log('\n---\n');

  // Check what type the table is
  const table = result.data?.reportData?.report?.table;
  console.log('Table type:', typeof table);
  console.log('Table value:', table);
}

debugQuery().catch(console.error);
