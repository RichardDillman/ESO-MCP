# ESO Logs API Integration - Setup Guide

Complete step-by-step guide for setting up ESO Logs API integration with this MCP server.

## Prerequisites

- ESO Logs account (create at https://www.esologs.com)
- Access to ESO Logs reports you want to analyze

## Step 1: Create API Client

1. **Navigate to API Clients Page**
   - Go to: https://www.esologs.com/api/clients/
   - Click "Create a Client"

2. **Configure Client Settings**

   **Name:** Choose a descriptive name (e.g., `ESO_MCP`, `MyAnalysisTool`)
   - This is just a label for your reference
   - Be descriptive so ESO Logs admins understand your use case

   **Redirect URLs:** Leave blank
   - Not needed for server-to-server authentication
   - Only required for user-facing OAuth flows

   **Public Client:** ❌ **LEAVE UNCHECKED**
   - ✅ You need a **private client** with client secret
   - Public clients only support PKCE flow (user interaction required)
   - We use client credentials flow (no user interaction)

3. **Save and Copy Credentials**

   After creating the client, you'll see:
   ```
   Client ID: a06e7973-dfa3-4799-8e72-d8ff1b0f639b
   Client Secret: hQs034u9foYAz86J4JqhZ1VNv0FvoAqlCDOceS92
   ```

   ⚠️ **IMPORTANT:** The client secret is shown only once!
   - Copy both values immediately
   - Store them securely
   - If you lose the secret, you must delete and recreate the client

## Step 2: Configure Environment Variables

Add the credentials to your `.env` file:

```env
# ESO Logs API Configuration
ESOLOGS_CLIENT_ID=a06e7973-dfa3-4799-8e72-d8ff1b0f639b
ESOLOGS_CLIENT_SECRET=hQs034u9foYAz86J4JqhZ1VNv0FvoAqlCDOceS92
```

Replace the values with your actual Client ID and Secret from Step 1.

## Step 3: Build the Project

```bash
pnpm install  # If not already installed
pnpm build
```

## Step 4: Test the Integration

### Test with Example Report

```bash
pnpm exec tsx scripts/test-esologs.ts "https://www.esologs.com/reports/YOUR_REPORT_CODE?boss=-2&source=2"
```

Example output:
```
🔍 Testing ESO Logs Integration

Report URL: https://www.esologs.com/reports/NL1mBFp4C3Tn76cz?boss=-2&source=2

📋 Parsing URL...
  Report Code: NL1mBFp4C3Tn76cz
  Fight ID: -2
  Source ID: 2

🔄 Fetching report metadata...
  Title: nSE[FFW](R)
  Fights: 48
  First Fight: Wamasu

📊 Fetching character data...
  Character: Character
  Class: Unknown
  DPS: 21,675
  Active Duration: 1454.6s
  Total Damage: 31,527,884
  Abilities: 13

🔬 Analyzing parse...
  Rating: NEEDS-IMPROVEMENT
  Issues: 4
    Critical: 1
    Major: 3
    Minor: 0

💡 Generating build recommendations...
Found 10 recommendations:
  Critical: 0
  High: 8
  Medium: 2

✅ Test completed successfully!
```

## Step 5: Use MCP Tools

Once configured, you can use the ESO Logs MCP tools:

### Get Report Metadata

```json
{
  "name": "get_esologs_metadata",
  "arguments": {
    "reportCode": "NL1mBFp4C3Tn76cz"
  }
}
```

Returns: Report title, fight list, timestamps

### Fetch Complete Report Data

```json
{
  "name": "fetch_esologs_report",
  "arguments": {
    "reportUrl": "https://www.esologs.com/reports/NL1mBFp4C3Tn76cz?boss=-2&source=2"
  }
}
```

Returns: Character data, damage data, summary data, gear, buffs

### Analyze Character Performance

```json
{
  "name": "analyze_esologs_character",
  "arguments": {
    "reportUrl": "https://www.esologs.com/reports/NL1mBFp4C3Tn76cz?boss=-2&source=2"
  }
}
```

Returns:
- **Character Info**: Name, class, spec
- **Performance Metrics**: DPS, duration, total damage
- **CMX-Style Analysis**: DPS rating, rotation issues, weaving analysis
- **Top Abilities**: Damage breakdown
- **Gear Analysis**: Equipped items
- **Buff Analysis**: Major/minor buff uptimes
- **Build Recommendations**: Prioritized suggestions for improvement
  - Critical: Must-fix issues
  - High: Important improvements
  - Medium: Optimization opportunities
  - Low: Min-max refinements

## Understanding URL Parameters

ESO Logs report URLs have the format:
```
https://www.esologs.com/reports/REPORT_CODE?boss=FIGHT_ID&source=SOURCE_ID
```

**Report Code**: Unique identifier for the combat log
- Example: `NL1mBFp4C3Tn76cz`

**Fight ID** (`boss` parameter):
- `-2`: All fights (default)
- `-3`: All trash fights
- `7`: Specific fight ID (e.g., boss encounter #7)

**Source ID** (`source` parameter):
- `2`: Specific player/character (ID from report)
- Omit for all players

## Troubleshooting

### "Client authentication failed"

**Cause:** Invalid credentials
**Fix:**
1. Verify Client ID and Secret in `.env` are correct
2. Ensure you copied the full UUID for Client ID (not just the name)
3. Check for extra spaces or quotes in `.env` file
4. Confirm client is Active on https://www.esologs.com/api/clients/

### "No data returned"

**Cause:** Invalid fight ID or source ID
**Fix:**
1. Use the explore script to see available fights:
   ```bash
   pnpm exec tsx scripts/explore-esologs-report.ts
   ```
2. Use `-2` for all fights or a specific valid fight ID
3. Check that the source ID matches a player in the report

### "Rate limit exceeded"

**Cause:** Too many API requests
**Fix:**
- ESO Logs has rate limits for API calls
- Implement caching for frequently accessed reports
- Space out requests if analyzing multiple reports

## Advanced Usage

### Explore Report Structure

```bash
pnpm exec tsx scripts/explore-esologs-report.ts
```

Shows all fights and players in a report.

### Debug API Responses

```bash
pnpm exec tsx scripts/debug-esologs-response.ts
```

Shows raw API response structure for debugging.

### Test Specific Fight

```bash
pnpm exec tsx scripts/test-specific-fight.ts
```

Tests a specific fight (currently hardcoded to fight #7).

## Security Notes

- **Never commit `.env` file** to version control
- **Keep Client Secret private** - it provides full API access
- **Rotate credentials periodically** for security
- **Delete unused clients** from https://www.esologs.com/api/clients/

## API Rate Limits

ESO Logs API has the following limits:
- **Client Credentials Flow**: TBD (check ESO Logs documentation)
- **Recommended**: Cache report data locally to minimize API calls
- **Best Practice**: Only fetch new data when reports are updated

## References

- [ESO Logs API Documentation](https://www.esologs.com/v2-api-docs/eso/)
- [API Clients Management](https://www.esologs.com/api/clients/)
- [Archon ESO API Guide](https://www.archon.gg/eso/articles/help/api-documentation)
- [OAuth 2.0 Client Credentials](https://oauth.net/2/grant-types/client-credentials/)

---

**Last Updated:** 2025-11-24
**Status:** ✅ Fully Functional
