import 'dotenv/config';

const OAUTH_TOKEN_URL = 'https://www.esologs.com/oauth/token';
const GRAPHQL_URL = 'https://www.esologs.com/api/v2/client';

async function getAccessToken() {
  const response = await fetch(OAUTH_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: process.env.ESOLOGS_CLIENT_ID!,
      client_secret: process.env.ESOLOGS_CLIENT_SECRET!,
    }),
  });
  const data = await response.json() as { access_token: string };
  return data.access_token;
}

async function main() {
  const token = await getAccessToken();

  // Get damage for fight 3 (the kill), sourceID 1 (Eira)
  const damageResponse = await fetch(GRAPHQL_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({
      query: `query { reportData { report(code: "kXbFLrMmn8Vxgj9K") {
        table(dataType: DamageDone, fightIDs: [3], sourceID: 1)
      } } }`,
    }),
  });
  const result = await damageResponse.json() as any;
  const table = result.data?.reportData?.report?.table;

  // Check table structure
  console.log('Table type:', typeof table);
  console.log('Has data prop:', Boolean(table?.data));
  console.log('Has entries:', Boolean(table?.data?.entries));
  console.log('Entries count:', table?.data?.entries?.length);

  // Show first 5 entries
  if (table?.data?.entries) {
    console.log('\nTop 5 abilities:');
    table.data.entries.slice(0, 5).forEach((e: any, i: number) => {
      console.log(`  ${i+1}. ${e.name}: ${e.total} damage (${((e.total / table.data.totalDamage) * 100).toFixed(1)}%)`);
    });
  }
}

main().catch(console.error);
