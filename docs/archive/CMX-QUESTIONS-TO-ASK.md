# CMX MCP Tools - Test Questions & Expected Responses

This guide shows you what questions to ask Claude (or the MCP client) to test the CMX OCR tools.

---

## 1. Parse a Single Screenshot

### Question to Ask:
```
"Parse this CMX screenshot for me: /Volumes/PRO-G40/Docker/ESO-MCP/CMX/cmx-parse-page.png"
```

### What Claude Should Do:
1. Use the `parse_cmx_screenshot` tool
2. Extract DPS, active time, abilities
3. Return the parsed data

### Expected Response:
```json
{
  "success": true,
  "data": {
    "dps": 166637,
    "activeTime": 125.99,
    "abilities": [
      { "name": "Biting Jabs", "totalDamage": 3239315, "percentOfTotal": 15.4 },
      { "name": "Merciless Resolve", "totalDamage": 2464794, "percentOfTotal": 11.7 }
      // ... more abilities
    ]
  },
  "confidence": 75.0,
  "validation": {
    "isComplete": false,
    "missingFields": ["lightAttacks.count"],
    "suggestions": [...]
  }
}
```

---

## 2. Parse Both Info and Parse Screens Together

### Question to Ask:
```
"Analyze my CMX parse using both these screenshots:
- Info screen: /Volumes/PRO-G40/Docker/ESO-MCP/CMX/cmx-info-page.png
- Parse screen: /Volumes/PRO-G40/Docker/ESO-MCP/CMX/cmx-parse-page.png"
```

### What Claude Should Do:
1. Use the `parse_cmx_screenshots` tool
2. Merge data from both screenshots
3. Validate completeness
4. Provide analysis

### Expected Response:
```json
{
  "success": true,
  "data": {
    "dps": 166637,
    "activeTime": 125.99,
    "barBalance": { "frontBar": 84.2, "backBar": 15.8 },
    "lightAttacks": { "count": 89, "averageWeaveTime": 0.139, "missCount": 0 },
    "abilities": [ /* 8 abilities */ ]
  },
  "confidence": 74.5,
  "validation": {
    "isComplete": true,
    "missingFields": [],
    "suggestions": []
  }
}
```

Claude should then say: **"Your parse is complete! DPS: 166,637 over 2:05.99..."**

---

## 3. Analyze the Parse (with analysis tool)

### Question to Ask:
```
"I got 166k DPS on a 2 minute parse. Here's my data:
- DPS: 166637
- Active Time: 125.99s
- Light Attacks: 89 (0.139s weave, 0 misses)
- Bar Balance: 84.2% / 15.8%
- Top ability: Biting Jabs at 15.4%

Analyze my parse and tell me what to improve."
```

### What Claude Should Do:
1. Use the `analyze_cmx_parse` tool
2. Identify issues (if any)
3. Provide recommendations

### Expected Response:
```
Parse Rating: EXCELLENT
DPS: 166,637 (over 2:05.99)

Issues Found: 0 critical, 1 minor

Minor Issues:
- Bar imbalance detected (84.2% front / 15.8% back)
  → Try to balance bar time closer to 60/40 for optimal rotation

Your weaving is excellent (0.139s average, 0 misses)!
Keep up the good work.
```

---

## 4. Get Manual Entry Help

### Question to Ask:
```
"I need help entering my CMX parse data manually. Show me the guided entry form."
```

### What Claude Should Do:
1. Use `manual_cmx_entry` tool with `mode: "guided"`
2. Return step-by-step prompts

### Expected Response:
```
# CMX Manual Entry - Guided Mode

Please provide the following information from your CMX parse:

## Essential Stats (Required)
1. DPS: [Your DPS value]
2. Active Time: [Combat duration in seconds]

## Rotation Stats
3. Top Damage Ability: [Ability name and % of total]
4. DoT Uptimes: [List DoTs with uptime %]
5. Bar Balance: [Front bar % / Back bar %]

## Weaving Stats
6. Light Attacks: [Count]
7. Weave Time: [Average in ms]
8. Missed LAs: [Count]

...
```

---

## 5. Quick DPS Check

### Question to Ask:
```
"Quick check - is my DPS good? I got 166k DPS on a 2 minute parse."
```

### What Claude Should Do:
1. Use `manual_cmx_entry` with `mode: "quick"`
2. Provide quick assessment

### Expected Response:
```
# Quick DPS Assessment

166k DPS is EXCELLENT for a 2-minute parse!

- 160k+ = Excellent (top tier)
- 140-160k = Good (solid performance)
- 130-140k = Needs improvement
- <130k = Critical issues

Your DPS is in the top tier. Great work!

For a full analysis, provide:
- Active time
- Weave time
- Penetration
```

---

## 6. Validate Incomplete Data

### Question to Ask:
```
"Check if my parse data is complete:
{
  \"dps\": 166637,
  \"activeTime\": 125.99,
  \"lightAttacks\": { \"count\": 89 }
}"
```

### What Claude Should Do:
1. Use `manual_cmx_entry` with `mode: "validate"` and `existingData`
2. Check for missing fields

### Expected Response:
```
# CMX Data Validation

**Completeness:** ⚠️ Incomplete

**Missing Fields:**
- abilities
- barBalance
- penetration
- criticalChance
- criticalDamage
- lightAttacks.averageWeaveTime
- lightAttacks.missCount

**Suggestions:**
- No abilities parsed. Use the Parse screen screenshot for ability breakdown.
- Light attack weave time missing. This is critical for identifying weaving issues.
- Penetration value not found. Check effective penetration vs 18200 cap.
```

---

## 7. Parse and Analyze in One Go

### Question to Ask:
```
"Parse and analyze these CMX screenshots:
- /Volumes/PRO-G40/Docker/ESO-MCP/CMX/cmx-info-page.png
- /Volumes/PRO-G40/Docker/ESO-MCP/CMX/cmx-parse-page.png

Tell me what I need to improve."
```

### What Claude Should Do:
1. Use `parse_cmx_screenshots` to extract data
2. Use `analyze_cmx_parse` to analyze
3. Provide comprehensive feedback

### Expected Response:
```
I've parsed your CMX screenshots. Here's your analysis:

**Parse Summary:**
- DPS: 166,637 (Excellent!)
- Active Time: 2:05.99
- Weaving: 0.139s average (Good)
- Bar Balance: 84.2% / 15.8% (Slightly imbalanced)

**Top Abilities:**
1. Biting Jabs - 15.4% (3.2M damage)
2. Merciless Resolve - 11.7% (2.5M damage)
3. Killer's Blade - 11.3% (2.4M damage)

**Rating:** EXCELLENT

**Minor Issues:**
- Bar imbalance: Try to spend more time on back bar (currently 15.8%, aim for 30-40%)

**Recommendations:**
- Your rotation and weaving are solid
- Consider balancing bar time for optimal DoT uptimes
- Keep practicing - you're performing at a high level!
```

---

## 8. Compare Two Parses

### Question to Ask:
```
"I did two parses. Compare them:

Parse 1 (old gear):
- DPS: 145000
- Active Time: 120s
- Weave: 0.150s

Parse 2 (new gear):
- DPS: 166637
- Active Time: 125.99s
- Weave: 0.139s

Which is better and why?"
```

### What Claude Should Do:
1. Manually compare the data
2. Calculate DPS difference
3. Identify improvements

### Expected Response:
```
**Parse 2 is significantly better!**

**Improvements:**
- DPS increased by 21,637 (+14.9%)
- Weaving improved by 0.011s (7.3% faster)
- Slightly longer parse time (more sustained DPS)

**Key Factors:**
1. Better weaving (0.139s vs 0.150s) = more light attack damage
2. New gear likely provides better stats/penetration
3. Longer active time shows better sustain

**Conclusion:** Your new gear and improved weaving make a significant difference. Keep using this setup!
```

---

## 9. Test New Uncompressed Screenshots

### Question to Ask:
```
"Parse these new screenshots and tell me my DPS:
- /Volumes/PRO-G40/Docker/ESO-MCP/CMX/info2.png
- /Volumes/PRO-G40/Docker/ESO-MCP/CMX/parse2.png"
```

### Expected Response:
```
**Parse Results:**
- DPS: 25,613
- Active Time: 8:00.50 (480.5 seconds)
- Bar Balance: 85.7% / 14.3%
- Light Attacks: 30 total, 0.016s weave, 8 misses

**Analysis:**
This is a longer, sustained parse (8 minutes). Your DPS of 25.6k suggests this might be:
- A different character/build (lower DPS spec)
- A parse with frequent interruptions or mechanics
- A different content type (not trial dummy)

**Weaving Issues Detected:**
- Only 30 light attacks in 8 minutes (very low)
- 8 missed weaves
- Your weave time is excellent (0.016s) when you do weave

**Recommendation:**
Focus on maintaining consistent light attack weaving. You should have ~240+ LAs in an 8-minute parse.
```

---

## 10. Error Handling Test

### Question to Ask:
```
"Parse this screenshot: /path/that/does/not/exist.png"
```

### Expected Response:
```
❌ OCR failed: ENOENT: no such file or directory

The screenshot path doesn't exist. Please check:
1. File path is correct
2. File exists at that location
3. You have permission to read it

Try: ls -l /path/that/does/not/exist.png
```

---

## Summary of Available MCP Tools

1. **`parse_cmx_screenshot`** - Parse a single screenshot
2. **`parse_cmx_screenshots`** - Parse and merge multiple screenshots
3. **`manual_cmx_entry`** - Get manual entry help (guided/quick/validate)
4. **`analyze_cmx_parse`** - Analyze parsed data for issues
5. **`analyze_cmx_log`** - Analyze raw combat log text

---

## Quick Test Checklist

- [ ] Parse single screenshot (parse screen)
- [ ] Parse single screenshot (info screen)
- [ ] Parse both and merge
- [ ] Analyze parsed data
- [ ] Get manual entry guide
- [ ] Quick DPS check
- [ ] Validate incomplete data
- [ ] Test with new screenshots (info2/parse2)
- [ ] Test error handling (bad path)

---

**Ready to test!** Just ask Claude any of the questions above and it should use the appropriate MCP tool automatically.
