#!/usr/bin/env tsx
/**
 * Explore ESO Logs Report Structure
 * Lists all fights and sources in the report
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

async function exploreReport() {
  console.log('🔍 Exploring ESO Logs Report Structure\n');

  const token = await getAccessToken();

  // Get report with fights and players
  const reportQuery = `
    query($code: String!) {
      reportData {
        report(code: $code) {
          title
          startTime
          endTime
          fights {
            id
            name
            startTime
            endTime
            encounterID
            difficulty
            kill
            fightPercentage
          }
          masterData {
            actors {
              id
              name
              type
              subType
            }
          }
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
      query: reportQuery,
      variables: {
        code: 'NL1mBFp4C3Tn76cz',
      },
    }),
  });

  const result = await response.json();
  const report = result.data.reportData.report;

  console.log(`📋 Report: ${report.title}`);
  console.log(`Fights: ${report.fights.length}\n`);

  console.log('=== FIGHTS ===');
  report.fights.slice(0, 10).forEach((fight: any) => {
    console.log(`ID: ${fight.id} | ${fight.name} | Kill: ${fight.kill} | ${fight.fightPercentage}%`);
  });

  console.log('\n=== ACTORS (Players) ===');
  const players = report.masterData.actors.filter((a: any) => a.type === 'Player');
  players.slice(0, 10).forEach((player: any) => {
    console.log(`ID: ${player.id} | ${player.name} | ${player.subType || 'Unknown class'}`);
  });

  console.log(`\nTotal Players: ${players.length}`);
}

exploreReport().catch(console.error);
