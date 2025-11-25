import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { spawn } from 'child_process';

async function testMCPServer() {
  console.log('Starting ESO MCP Server test client...\n');

  // Spawn the MCP server process
  const serverProcess = spawn('node', ['dist/index.js'], {
    stdio: ['pipe', 'pipe', 'pipe'],
  });

  // Create transport using the server's stdio
  const transport = new StdioClientTransport({
    command: 'node',
    args: ['dist/index.js'],
  });

  // Create MCP client
  const client = new Client(
    {
      name: 'eso-mcp-test-client',
      version: '1.0.0',
    },
    {
      capabilities: {},
    }
  );

  try {
    // Connect to server
    await client.connect(transport);
    console.log('✓ Connected to MCP server\n');

    // Test 1: List available tools
    console.log('='.repeat(80));
    console.log('TEST 1: List Available Tools');
    console.log('='.repeat(80));
    const tools = await client.listTools();
    console.log(`Found ${tools.tools.length} tools:\n`);
    tools.tools.forEach(tool => {
      console.log(`- ${tool.name}: ${tool.description}`);
    });

    // Test 2: Search for mundus stones
    console.log('\n' + '='.repeat(80));
    console.log('TEST 2: Search Mundus Stones (no query - all stones)');
    console.log('='.repeat(80));
    const searchResult = await client.callTool({
      name: 'search_mundus_stones',
      arguments: {},
    });
    console.log(searchResult.content[0].text);

    // Test 3: Search for specific mundus stone
    console.log('\n' + '='.repeat(80));
    console.log('TEST 3: Search for "apprentice"');
    console.log('='.repeat(80));
    const searchApprentice = await client.callTool({
      name: 'search_mundus_stones',
      arguments: { query: 'apprentice' },
    });
    console.log(searchApprentice.content[0].text);

    // Test 4: Get detailed mundus stone info
    console.log('\n' + '='.repeat(80));
    console.log('TEST 4: Get "The Thief" details');
    console.log('='.repeat(80));
    const thiefDetails = await client.callTool({
      name: 'get_mundus_stone_details',
      arguments: { stoneId: 'The Thief' },
    });
    const thiefData = JSON.parse(thiefDetails.content[0].text);
    console.log(`\nName: ${thiefData.name}`);
    console.log(`URL: ${thiefData.url}`);
    console.log('\nEffects:');
    thiefData.effects.forEach((effect: any) => {
      console.log(`  ${effect.type}: ${effect.baseValue}`);
      console.log(`  Divines Scaling (7 pieces):`);
      const scaling = effect.divinesScaling[7];
      console.log(`    Normal: ${scaling.normal}`);
      console.log(`    Fine: ${scaling.fine}`);
      console.log(`    Superior: ${scaling.superior}`);
      console.log(`    Epic: ${scaling.epic}`);
      console.log(`    Legendary: ${scaling.legendary}`);
    });
    console.log('\nLocations:');
    console.log(`  Aldmeri Dominion: ${thiefData.locations.aldmeriDominion}`);
    console.log(`  Daggerfall Covenant: ${thiefData.locations.daggerfallCovenant}`);
    console.log(`  Ebonheart Pact: ${thiefData.locations.ebonheartPact}`);
    console.log(`  Cyrodiil: ${thiefData.locations.cyrodiil}`);

    // Test 5: Get The Steed (multi-effect stone)
    console.log('\n' + '='.repeat(80));
    console.log('TEST 5: Get "The Steed" (multi-effect stone)');
    console.log('='.repeat(80));
    const steedDetails = await client.callTool({
      name: 'get_mundus_stone_details',
      arguments: { stoneId: 'steed' },
    });
    const steedData = JSON.parse(steedDetails.content[0].text);
    console.log(`\nName: ${steedData.name}`);
    console.log(`Number of effects: ${steedData.effects.length}`);
    steedData.effects.forEach((effect: any, idx: number) => {
      console.log(`\nEffect ${idx + 1}: ${effect.type}`);
      console.log(`  Base: ${effect.baseValue}`);
      console.log(`  With 7 Legendary Divines: ${effect.divinesScaling[7].legendary}${effect.isPercentage ? '%' : ''}`);
    });

    console.log('\n' + '='.repeat(80));
    console.log('\n✓ All tests completed successfully!\n');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
    serverProcess.kill();
  }
}

testMCPServer().catch(console.error);
