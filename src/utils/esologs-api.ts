/**
 * ESO Logs API Client
 * Implements OAuth 2.0 authentication and GraphQL queries for ESO Logs
 * API Documentation: https://www.esologs.com/v2-api-docs/eso/
 */

import 'dotenv/config';

interface OAuthToken {
  access_token: string;
  token_type: string;
  expires_in: number;
  expires_at: number; // Timestamp when token expires
}

interface ReportMetadata {
  code: string;
  title: string;
  startTime: number;
  endTime: number;
  fights: Fight[];
}

interface Fight {
  id: number;
  name: string;
  difficulty: number;
  kill: boolean;
  fightPercentage: number;
  startTime: number;
  endTime: number;
}

interface DamageData {
  abilities: Array<{
    name: string;
    total: number;
    percentage: number;
    type: number;
  }>;
  totalDamage: number;
  dps: number;
  activeDuration: number;
}

interface SummaryData {
  stats: {
    Armor?: number;
    'Spell Resistance'?: number;
    'Weapon Damage'?: number;
    'Spell Damage'?: number;
    'Critical Chance'?: number;
    'Critical Damage'?: number;
    Penetration?: number;
  };
  gear: Array<{
    slot: string;
    name: string;
    quality: string;
    enchant?: string;
    trait?: string;
  }>;
  buffs: Array<{
    name: string;
    uptime: number;
  }>;
}

interface CharacterData {
  name: string;
  class: string;
  spec: string;
  report: ReportMetadata;
  damage: DamageData;
  summary: SummaryData;
}

const OAUTH_TOKEN_URL = 'https://www.esologs.com/oauth/token';
const GRAPHQL_URL = 'https://www.esologs.com/api/v2/client';

let cachedToken: OAuthToken | null = null;

/**
 * Get OAuth access token using client credentials flow
 */
async function getAccessToken(): Promise<string> {
  const clientId = process.env.ESOLOGS_CLIENT_ID;
  const clientSecret = process.env.ESOLOGS_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error(
      'ESO Logs credentials not configured. Please set ESOLOGS_CLIENT_ID and ESOLOGS_CLIENT_SECRET in .env file.\n' +
      'Get credentials at: https://www.esologs.com/profile'
    );
  }

  // Check if cached token is still valid
  if (cachedToken && cachedToken.expires_at > Date.now() + 60000) {
    return cachedToken.access_token;
  }

  // Request new token
  const response = await fetch(OAUTH_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: clientId,
      client_secret: clientSecret,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OAuth token request failed: ${response.status} ${error}`);
  }

  const tokenData = await response.json() as Omit<OAuthToken, 'expires_at'>;

  // Cache token with expiry time
  cachedToken = {
    ...tokenData,
    expires_at: Date.now() + (tokenData.expires_in * 1000),
  };

  return cachedToken.access_token;
}

/**
 * Execute GraphQL query against ESO Logs API
 */
async function executeGraphQL<T>(query: string, variables?: Record<string, any>): Promise<T> {
  const token = await getAccessToken();

  const response = await fetch(GRAPHQL_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      query,
      variables,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`GraphQL request failed: ${response.status} ${error}`);
  }

  const result = await response.json() as { data?: T; errors?: any[] };

  if (result.errors) {
    throw new Error(`GraphQL errors: ${JSON.stringify(result.errors)}`);
  }

  return result.data as T;
}

/**
 * Parse report code from ESO Logs URL
 * Example: https://www.esologs.com/reports/NL1mBFp4C3Tn76cz?boss=-2 -> NL1mBFp4C3Tn76cz
 */
export function parseReportCode(url: string): string {
  const match = url.match(/reports\/([A-Za-z0-9]+)/);
  if (!match) {
    throw new Error(`Invalid ESO Logs URL: ${url}`);
  }
  return match[1];
}

/**
 * Parse URL parameters for fight ID and source ID
 */
export function parseReportParams(url: string): { fightID?: number; sourceID?: number } {
  const urlObj = new URL(url);
  const boss = urlObj.searchParams.get('boss');
  const source = urlObj.searchParams.get('source');

  return {
    fightID: boss ? parseInt(boss) : undefined,
    sourceID: source ? parseInt(source) : undefined,
  };
}

/**
 * Fetch report metadata
 */
export async function fetchReportMetadata(reportCode: string): Promise<ReportMetadata> {
  const query = `
    query($code: String!) {
      reportData {
        report(code: $code) {
          title
          startTime
          endTime
          fights {
            id
            name
            difficulty
            kill
            fightPercentage
            startTime
            endTime
          }
        }
      }
    }
  `;

  const data = await executeGraphQL<any>(query, { code: reportCode });

  return {
    code: reportCode,
    title: data.reportData.report.title,
    startTime: data.reportData.report.startTime,
    endTime: data.reportData.report.endTime,
    fights: data.reportData.report.fights,
  };
}

/**
 * Fetch damage-done data for a specific character
 */
export async function fetchDamageData(
  reportCode: string,
  fightIDs: number[],
  sourceID?: number
): Promise<DamageData> {
  const query = `
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

  const data = await executeGraphQL<any>(query, {
    code: reportCode,
    fightIDs,
    sourceID,
  });

  // Parse the table response (it might be a JSON string or already an object)
  let tableData = data.reportData.report.table;
  if (typeof tableData === 'string') {
    tableData = JSON.parse(tableData);
  }

  // Access the data property which contains the actual data
  const reportData = tableData.data || tableData;

  // Calculate total damage
  const totalDamage = reportData.entries?.reduce((sum: number, entry: any) => sum + (entry.total || 0), 0) || 0;

  // Extract abilities from entries
  const abilities = reportData.entries?.map((entry: any) => ({
    name: entry.name || 'Unknown',
    total: entry.total || 0,
    percentage: totalDamage > 0 ? (entry.total / totalDamage * 100) : 0,
    type: entry.type || 0,
  })) || [];

  // Calculate duration (use activeTime if available, otherwise totalTime)
  const duration = (reportData.activeTime || reportData.totalTime || 0) / 1000;

  return {
    abilities,
    totalDamage,
    dps: duration > 0 ? totalDamage / duration : 0,
    activeDuration: duration,
  };
}

/**
 * Fetch summary data (stats, gear, buffs) for a specific character
 */
export async function fetchSummaryData(
  reportCode: string,
  fightIDs: number[],
  sourceID?: number
): Promise<SummaryData> {
  const query = `
    query($code: String!, $fightIDs: [Int], $sourceID: Int) {
      reportData {
        report(code: $code) {
          table(
            dataType: Summary
            fightIDs: $fightIDs
            sourceID: $sourceID
          )
        }
      }
    }
  `;

  const data = await executeGraphQL<any>(query, {
    code: reportCode,
    fightIDs,
    sourceID,
  });

  // Parse the table response (it might be a JSON string or already an object)
  let tableData = data.reportData.report.table;
  if (typeof tableData === 'string') {
    tableData = JSON.parse(tableData);
  }

  // Extract stats, gear, and buffs from the table
  // Note: Actual structure depends on ESO Logs API response
  return {
    stats: tableData.stats || {},
    gear: tableData.gear || [],
    buffs: tableData.buffs || [],
  };
}

/**
 * Fetch complete character data from ESO Logs report
 */
export async function fetchCharacterData(reportUrl: string): Promise<CharacterData> {
  const reportCode = parseReportCode(reportUrl);
  const params = parseReportParams(reportUrl);

  // Get report metadata to find valid fight IDs
  const metadata = await fetchReportMetadata(reportCode);

  // If fightID is -2 or not specified, use all fights
  // Otherwise use the specific fight ID
  let fightIDs: number[];
  if (!params.fightID || params.fightID === -2) {
    // Use all successful kills
    fightIDs = metadata.fights
      .filter(f => f.kill)
      .map(f => f.id);

    // If no kills, use all fights
    if (fightIDs.length === 0) {
      fightIDs = metadata.fights.map(f => f.id);
    }
  } else {
    fightIDs = [params.fightID];
  }

  // Fetch damage and summary data in parallel (we already have metadata)
  const [damageData, summaryData] = await Promise.all([
    fetchDamageData(reportCode, fightIDs, params.sourceID),
    fetchSummaryData(reportCode, fightIDs, params.sourceID),
  ]);

  return {
    name: 'Character', // TODO: Extract from summary
    class: 'Unknown', // TODO: Extract from summary
    spec: 'Unknown', // TODO: Extract from summary
    report: metadata,
    damage: damageData,
    summary: summaryData,
  };
}

/**
 * Convert ESO Logs data to CMX format for analysis
 */
export function convertToGMXFormat(characterData: CharacterData): any {
  return {
    dps: characterData.damage.dps,
    activeTime: characterData.damage.activeDuration,
    totalDamage: characterData.damage.totalDamage,
    abilities: characterData.damage.abilities.map(ability => ({
      name: ability.name,
      totalDamage: ability.total,
      percentOfTotal: ability.percentage,
      count: 0, // Not available from ESO Logs
    })),
    buffs: characterData.summary.buffs.map(buff => ({
      name: buff.name,
      uptime: buff.uptime,
      isPermanent: buff.uptime > 90,
    })),
    penetration: characterData.summary.stats.Penetration ? {
      effective: characterData.summary.stats.Penetration,
      average: characterData.summary.stats.Penetration,
    } : undefined,
    criticalChance: characterData.summary.stats['Critical Chance'] || 0,
    criticalDamage: characterData.summary.stats['Critical Damage'] || 0,
    lightAttacks: {
      count: 0, // Not available from ESO Logs
      totalDamage: 0,
      averageWeaveTime: 0,
      missCount: 0,
      ratio: 0,
    },
    barBalance: {
      frontBar: 50, // Not available from ESO Logs
      backBar: 50,
    },
    dotUptimes: {},
  };
}
