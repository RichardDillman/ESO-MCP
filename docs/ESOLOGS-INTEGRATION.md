# ESO Logs Integration Plan

## Overview

ESO Logs provides a GraphQL API for accessing combat log data, which is much more reliable than OCR'ing screenshots or CMX data.

## API Resources

- **API Documentation**: https://www.esologs.com/v2-api-docs/eso/
- **Client Management**: https://www.esologs.com/profile (create API clients)
- **Help & FAQ**: https://articles.esologs.com/help/help-and-faq-collection
- **Python Client (reference)**: https://github.com/knowlen/esologs-python

## Authentication

ESO Logs uses OAuth 2.0 with three flows:
1. **Client Credentials Flow** - For public data access (what we need)
2. **Authorization Code Flow** - For user-specific data
3. **PKCE Flow** - For mobile/browser apps

### Required Environment Variables

```env
ESOLOGS_CLIENT_ID=your_client_id_here
ESOLOGS_CLIENT_SECRET=your_client_secret_here
```

## API Endpoints

### Base URLs
- **API v2**: `https://www.esologs.com/api/v2/`
- **OAuth Token**: `https://www.esologs.com/oauth/token`

### GraphQL Schema
- Full schema available at: https://www.esologs.com/v2-api-docs/eso/

## Data We Can Extract

From the example URLs provided:
- **Damage Done**: https://www.esologs.com/reports/NL1mBFp4C3Tn76cz?boss=-2&difficulty=0&type=damage-done&source=2
- **Summary**: https://www.esologs.com/reports/NL1mBFp4C3Tn76cz?boss=-2&difficulty=0&type=summary&source=2

### Report Code: `NL1mBFp4C3Tn76cz`

Key data to extract:
1. **Character Stats**
   - Name
   - DPS
   - Total Damage
   - Active Time
   - Class/Build

2. **Abilities**
   - Ability name
   - Damage %
   - Cast count
   - Critical %

3. **Buffs/Debuffs**
   - Uptime %
   - Stack counts

4. **Resources**
   - Magicka/Stamina usage
   - Resource management

## Implementation Plan

### Phase 1: Authentication ✅
- [x] Create OAuth client credentials flow
- [x] Store access tokens with expiry
- [x] Add token refresh logic

### Phase 2: Report Fetching ✅
- [x] Parse report code from URL
- [x] Fetch report metadata
- [x] Extract fight information
- [x] Identify characters/sources

### Phase 3: Combat Data Extraction ✅
- [x] Get damage done data
- [x] Get summary stats
- [x] Get ability breakdown
- [x] Get buff/debuff uptimes

### Phase 4: MCP Tools ✅
- [x] `fetch_esologs_report` - Get full report data
- [x] `analyze_esologs_character` - Analyze specific character with gear/spell recommendations
- [x] `get_esologs_metadata` - Get report metadata (fights, duration)
- [ ] `compare_esologs_parses` - Compare multiple reports (future enhancement)
- [ ] `get_esologs_rankings` - Get character rankings (future enhancement)

### Phase 5: Integration with CMX Analysis ✅
- [x] Convert ESO Logs data to CMX format
- [x] Use existing `analyzeCMXParse` function
- [x] Provide unified analysis across both sources

### Phase 6: Build Recommendations ✅
- [x] Gear analysis (set completion, traits, enchants, penetration)
- [x] Skill analysis (spammable damage, DoT coverage, execute abilities, passive bonuses)
- [x] Stat distribution analysis (primary damage, max resource, crit chance/damage)
- [x] Priority-based recommendation system (critical, high, medium, low)

## Example GraphQL Queries

### Get Report Summary
```graphql
query {
  reportData {
    report(code: "NL1mBFp4C3Tn76cz") {
      title
      startTime
      endTime
      fights {
        id
        name
        difficulty
        kill
        fightPercentage
      }
    }
  }
}
```

### Get Character DPS
```graphql
query {
  reportData {
    report(code: "NL1mBFp4C3Tn76cz") {
      table(
        dataType: DamageDone
        fightIDs: [-2]
        sourceID: 2
      )
    }
  }
}
```

## MCP Tool Examples

### Fetch Report
```json
{
  "name": "fetch_esologs_report",
  "arguments": {
    "reportCode": "NL1mBFp4C3Tn76cz",
    "fightID": -2,
    "sourceID": 2
  }
}
```

### Analyze Character
```json
{
  "name": "analyze_esologs_character",
  "arguments": {
    "reportUrl": "https://www.esologs.com/reports/NL1mBFp4C3Tn76cz?boss=-2&difficulty=0&type=damage-done&source=2"
  }
}
```

## Benefits Over CMX Screenshots

1. **Structured Data** - Clean JSON instead of OCR
2. **Complete Stats** - All combat data available
3. **Historical Data** - Access past parses
4. **Multiple Characters** - Compare entire raid groups
5. **Reliable** - No OCR errors or confidence issues
6. **Rankings** - Access to percentile rankings

## Implementation Details

### Files Created

1. **`src/utils/esologs-api.ts`** - ESO Logs API client
   - OAuth 2.0 authentication with token caching
   - GraphQL query execution
   - Report metadata fetching
   - Damage and summary data extraction
   - URL parsing utilities
   - CMX format conversion

2. **`src/utils/build-recommendations.ts`** - Build recommendation system
   - Gear analysis (set completion, traits, enchants)
   - Skill/spell analysis (rotation optimization, passive buffs)
   - Stat distribution analysis
   - Priority-based recommendations

3. **MCP Tools** (added to `src/index.ts`)
   - `fetch_esologs_report` - Fetch complete report data
   - `analyze_esologs_character` - Full analysis with recommendations
   - `get_esologs_metadata` - Get report metadata

## Usage

### Prerequisites

1. Create API client at https://www.esologs.com/profile
2. Add credentials to `.env`:
   ```env
   ESOLOGS_CLIENT_ID=your_client_id_here
   ESOLOGS_CLIENT_SECRET=your_client_secret_here
   ```

### Example Usage

#### Get Report Metadata
```json
{
  "name": "get_esologs_metadata",
  "arguments": {
    "reportCode": "NL1mBFp4C3Tn76cz"
  }
}
```

#### Fetch Full Report
```json
{
  "name": "fetch_esologs_report",
  "arguments": {
    "reportUrl": "https://www.esologs.com/reports/NL1mBFp4C3Tn76cz?boss=-2&source=2"
  }
}
```

#### Analyze Character with Recommendations
```json
{
  "name": "analyze_esologs_character",
  "arguments": {
    "reportUrl": "https://www.esologs.com/reports/NL1mBFp4C3Tn76cz?boss=-2&source=2"
  }
}
```

Returns:
- Character info (name, class, spec)
- Performance metrics (DPS, duration, total damage)
- CMX-style analysis (DPS rating, rotation issues, weaving, buffs, penetration, crit)
- Top 10 abilities
- Gear equipped
- Major buffs (>50% uptime)
- **Build recommendations** organized by priority:
  - Critical: Must-fix issues (missing enchants, very low stats)
  - High: Important improvements (incomplete sets, low buff uptimes)
  - Medium: Optimization opportunities (trait optimization, execute abilities)
  - Low: Min-max refinements (stat diminishing returns)

## Next Steps

1. ✅ Add credentials to `.env`
2. ✅ Test with provided example URLs
3. [ ] Enhance character/class detection from summary data
4. [ ] Add support for comparing multiple parses
5. [ ] Add support for rankings/percentiles
6. [ ] Improve gear set detection (handle more set name variations)
7. [ ] Add class-specific skill recommendations

---

**Status**: ✅ **Implemented** - Ready to use with ESO Logs API credentials

**Sources**:
- [ESO Logs API Documentation](https://www.esologs.com/v2-api-docs/eso/)
- [Python Client Reference](https://github.com/knowlen/esologs-python)
- [Help & FAQ](https://articles.esologs.com/help/help-and-faq-collection)
