/**
 * CMX Screenshot OCR Parser
 *
 * Uses Tesseract.js to extract text from CMX parse screenshots
 * and convert them to structured data for analysis.
 */

import { createWorker } from 'tesseract.js';
import sharp from 'sharp';
import { promises as fs } from 'fs';

export interface CMXScreenshotData {
  dps?: number;
  activeTime?: number;
  totalDamage?: number;
  lightAttacks?: {
    count?: number;
    totalDamage?: number;
    averageWeaveTime?: number;
    missCount?: number;
    ratio?: number;
  };
  penetration?: {
    effective?: number;
    average?: number;
  };
  criticalChance?: number;
  criticalDamage?: number;
  abilities?: Array<{
    name: string;
    count?: number;
    totalDamage?: number;
    percentOfTotal?: number;
    averageTime?: number;
  }>;
  dotUptimes?: Record<string, number>;
  buffs?: Array<{
    name: string;
    uptime: number;
    isPermanent?: boolean;
  }>;
  barBalance?: {
    frontBar?: number;
    backBar?: number;
  };
}

export interface OCRResult {
  success: boolean;
  data?: CMXScreenshotData;
  rawText?: string;
  error?: string;
  confidence?: number;
}

/**
 * Preprocess image for better OCR results
 */
async function preprocessImage(imagePath: string): Promise<Buffer> {
  try {
    // Enhance image for OCR on dark backgrounds:
    // - Resize to larger size for better text recognition
    // - Keep moderate processing to preserve readability
    const processed = await sharp(imagePath)
      .resize({
        width: 3000,
        fit: 'inside',
        withoutEnlargement: false,
        kernel: 'lanczos3'
      })
      .grayscale()
      .normalise() // Auto-adjust levels
      .sharpen()
      .toBuffer();

    return processed;
  } catch (error) {
    throw new Error(`Image preprocessing failed: ${error}`);
  }
}

/**
 * Extract numbers from text (handles K/M suffixes)
 * @unused - Currently not needed, but kept for future enhancements
 */
// function parseNumber(text: string): number | undefined {
//   const cleaned = text.replace(/[,\s]/g, '');
//   const match = cleaned.match(/(\d+\.?\d*)([KMk]?)/);

//   if (!match) return undefined;

//   const value = parseFloat(match[1]);
//   const suffix = match[2].toUpperCase();

//   if (suffix === 'K') return value * 1000;
//   if (suffix === 'M') return value * 1000000;
//   return value;
// }

/**
 * Parse CMX Info screen (general stats)
 */
function parseInfoScreen(text: string): Partial<CMXScreenshotData> {
  const data: Partial<CMXScreenshotData> = {};

  // Clean up text for better matching
  const cleanText = text.replace(/[|]/g, ' ');

  // DPS patterns - look for various formats
  // "DPS 166637" - should be near "Player" and before "Damage"
  const dpsMatch = cleanText.match(/DPS\s+(\d+)/i);
  if (dpsMatch) {
    data.dps = parseInt(dpsMatch[1]);
  }

  // Active Time: "Active Time: 2:05.99" or "2:05.99" (mm:ss.ms format)
  const timeMatch = cleanText.match(/Active\s+Time[:\s]+(\d+):(\d+)\.?(\d*)/i);
  if (timeMatch) {
    const minutes = parseInt(timeMatch[1]);
    const seconds = parseInt(timeMatch[2]);
    const ms = timeMatch[3] ? parseInt(timeMatch[3]) : 0;
    data.activeTime = minutes * 60 + seconds + ms / 100;
  }

  // Bar Balance: "Bar1 Time: 84.2%" and "Bar2 Time: 15.8%"
  const bar1Match = cleanText.match(/Bar\s*1\s+.*?Time[:\s]+(\d+\.?\d*)%/i);
  const bar2Match = cleanText.match(/Bar\s*2\s+.*?Time[:\s]+(\d+\.?\d*)%/i);
  if (bar1Match || bar2Match) {
    data.barBalance = {
      frontBar: bar1Match ? parseFloat(bar1Match[1]) : undefined,
      backBar: bar2Match ? parseFloat(bar2Match[1]) : undefined
    };
  }

  // Penetration - look for numeric value
  const penMatch = cleanText.match(/Penetration[:\s]+(\d+)/i);
  if (penMatch) {
    data.penetration = {
      effective: parseInt(penMatch[1]),
      average: parseInt(penMatch[1])
    };
  }

  // Critical Chance
  const critChanceMatch = cleanText.match(/Crit(?:ical)?[:\s]+(\d+\.?\d*)%/i);
  if (critChanceMatch) {
    data.criticalChance = parseFloat(critChanceMatch[1]);
  }

  // Light Attack stats from skill lines
  // Pattern: "Light Attack" followed by numbers
  const laPattern = /Light\s+Attack.*?(\d+)\s+(\d+)\s+(\d+)\s+(\d+\.?\d*)/i;
  const laMatch = cleanText.match(laPattern);
  if (laMatch) {
    // Format appears to be: count, weave, miss, time
    data.lightAttacks = {
      count: parseInt(laMatch[1]),
      averageWeaveTime: parseFloat(laMatch[4]) / 1000, // Convert ms to seconds
      missCount: parseInt(laMatch[3])
    };
  }

  return data;
}

/**
 * Parse CMX Parse screen (abilities breakdown)
 */
function parseParseScreen(text: string): Partial<CMXScreenshotData> {
  const data: Partial<CMXScreenshotData> = {
    abilities: []
  };

  // Clean up text
  const cleanText = text.replace(/[|]/g, ' ');

  // DPS is on the Parse screen
  const dpsMatch = cleanText.match(/DPS\s+(\d+)/i);
  if (dpsMatch) {
    data.dps = parseInt(dpsMatch[1]);
  }

  // Active Time: "Active Time: 2:05.99" (mm:ss.ms format)
  const timeMatch = cleanText.match(/Active\s+Time[:\s]+(\d+):(\d+)\.?(\d*)/i);
  if (timeMatch) {
    const minutes = parseInt(timeMatch[1]);
    const seconds = parseInt(timeMatch[2]);
    const ms = timeMatch[3] ? parseInt(timeMatch[3]) : 0;
    data.activeTime = minutes * 60 + seconds + ms / 100;
  }

  // Total Damage
  const totalDmgMatch = cleanText.match(/Damage\s+(\d+)/i);
  if (totalDmgMatch) {
    data.totalDamage = parseInt(totalDmgMatch[1]);
  }

  // Parse ability lines from the damage table
  // Format: "[icon] (id) Ability Name percentage% DPS Damage ..."
  // Example: "Bd (54432) Biting Jabs 15.4% 25711 3239315"
  const lines = cleanText.split('\n');

  for (const line of lines) {
    // Look for lines with ability ID in parentheses followed by name and percentage
    const abilityMatch = line.match(/\((\d+)\)\s+([A-Za-z][A-Za-z\s'()]+?)\s+(\d+\.?\d*)%\s+\d+\s+(\d+)/);

    if (abilityMatch) {
      // const abilityId = abilityMatch[1]; // Not currently used
      const name = abilityMatch[2].trim();
      const percent = parseFloat(abilityMatch[3]);
      const damage = parseInt(abilityMatch[4]);

      // Filter out noise (need reasonable percentage and damage)
      if (percent > 0 && percent <= 100 && damage > 1000) {
        data.abilities!.push({
          name,
          totalDamage: damage,
          percentOfTotal: percent
        });
      }
    }
  }

  return data;
}

/**
 * Perform OCR on a CMX screenshot
 */
export async function parseCMXScreenshot(
  imagePath: string,
  screenType: 'info' | 'parse' | 'auto' = 'auto',
  debug: boolean = false
): Promise<OCRResult> {
  let worker;

  try {
    // Verify file exists
    await fs.access(imagePath);

    // Preprocess image
    const processedImage = await preprocessImage(imagePath);

    // Save debug image if requested
    if (debug) {
      const debugPath = imagePath.replace(/\.(png|jpg|jpeg)$/i, '-debug.png');
      await fs.writeFile(debugPath, processedImage);
      console.log(`Debug image saved to: ${debugPath}`);
    }

    // Initialize Tesseract worker
    worker = await createWorker('eng');

    // Configure for better recognition
    await worker.setParameters({
      preserve_interword_spaces: '1' as any,
      tessedit_pageseg_mode: 6 as any, // Assume uniform block of text
    });

    // Perform OCR
    const { data: { text, confidence } } = await worker.recognize(processedImage);

    // Parse based on screen type
    let parsedData: Partial<CMXScreenshotData> = {};

    if (screenType === 'info' || screenType === 'auto') {
      parsedData = { ...parsedData, ...parseInfoScreen(text) };
    }

    if (screenType === 'parse' || screenType === 'auto') {
      const parseData = parseParseScreen(text);
      parsedData = { ...parsedData, ...parseData };
    }

    return {
      success: true,
      data: parsedData,
      rawText: text,
      confidence
    };

  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  } finally {
    if (worker) {
      await worker.terminate();
    }
  }
}

/**
 * Parse multiple CMX screenshots and merge data
 */
export async function parseCMXScreenshots(
  screenshots: { path: string; type: 'info' | 'parse' }[]
): Promise<OCRResult> {
  try {
    const results = await Promise.all(
      screenshots.map(({ path, type }) => parseCMXScreenshot(path, type))
    );

    // Check for failures
    const failures = results.filter(r => !r.success);
    if (failures.length > 0) {
      return {
        success: false,
        error: `Failed to parse ${failures.length} screenshot(s): ${failures.map(f => f.error).join(', ')}`
      };
    }

    // Merge all data
    const mergedData: CMXScreenshotData = {};
    let totalConfidence = 0;

    for (const result of results) {
      if (result.data) {
        Object.assign(mergedData, result.data);
      }
      totalConfidence += result.confidence || 0;
    }

    return {
      success: true,
      data: mergedData,
      confidence: totalConfidence / results.length
    };

  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

/**
 * Validate OCR results and identify missing fields
 */
export function validateOCRData(data: CMXScreenshotData): {
  isComplete: boolean;
  missingFields: string[];
  suggestions: string[];
} {
  const missingFields: string[] = [];
  const suggestions: string[] = [];

  // Check critical fields
  if (!data.dps) {
    missingFields.push('dps');
    suggestions.push('DPS value could not be extracted. Verify screenshot shows DPS clearly.');
  }

  if (!data.activeTime) {
    missingFields.push('activeTime');
    suggestions.push('Active time not found. Check if "Active Time" or "Active" is visible.');
  }

  if (!data.lightAttacks?.count) {
    missingFields.push('lightAttacks.count');
    suggestions.push('Light attack count missing. Ensure LA stats are visible in screenshot.');
  }

  if (!data.abilities || data.abilities.length === 0) {
    missingFields.push('abilities');
    suggestions.push('No abilities parsed. Use the Parse screen screenshot for ability breakdown.');
  }

  return {
    isComplete: missingFields.length === 0,
    missingFields,
    suggestions
  };
}
