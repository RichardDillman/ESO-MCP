#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import axios from 'axios';
import nodemailer from 'nodemailer';
import { prisma } from './lib/prisma.js';
import { MUNDUS_STONES_DATA } from './data/mundus-stones-data.js';
import {
  calculateAbilityDamage,
  calculateRotationDPS,
  compareRotations,
  type CharacterStats,
  type TargetStats,
  type AbilityInfo,
  type RotationStep,
} from './utils/dps-calculator.js';
import {
  analyzeCMXParse,
  parseCMXLog,
  validateWeaving,
  type CMXParseMetrics,
} from './utils/cmx-analyzer.js';
import {
  parseCMXScreenshot,
  parseCMXScreenshots,
  validateOCRData,
  type CMXScreenshotData,
} from './utils/cmx-ocr.js';
import {
  fetchReportMetadata,
  fetchCharacterData,
  convertToGMXFormat,
} from './utils/esologs-api.js';
import { generateBuildRecommendationsAsync } from './utils/build-recommendations.js';
import { unifiedSearch, getDetailedInfo } from './utils/unified-search.js';
import {
  GRIMOIRES,
  FOCUS_SCRIPTS,
  AFFIX_SCRIPTS,
  SIGNATURE_SCRIPTS,
  validateScribedSkill,
  describeScribedSkill,
} from './data/scribing-data.js';

const server = new Server(
  {
    name: 'eso-mcp-server',
    version: '0.1.0',
  },
  {
    capabilities: {
      tools: {},
      resources: {},
    },
  }
);

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'search_eso',
        description: 'Universal search across ALL ESO data (skills, sets, buffs, debuffs, mundus stones, races, classes, caps). Use this FIRST for any ESO query.',
        inputSchema: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'Search query - searches across all ESO data types',
            },
            limit: {
              type: 'number',
              description: 'Maximum number of results (default: 10)',
            },
          },
          required: ['query'],
        },
      },
      {
        name: 'get_eso_details',
        description: 'Get detailed information about a specific ESO item found via search_eso',
        inputSchema: {
          type: 'object',
          properties: {
            type: {
              type: 'string',
              enum: ['skill', 'set', 'buff', 'debuff', 'mundus', 'race', 'class', 'cap', 'dummy'],
              description: 'Type of item (from search_eso result)',
            },
            id: {
              type: 'string',
              description: 'ID of the item (from search_eso result)',
            },
          },
          required: ['type', 'id'],
        },
      },
      {
        name: 'search_skills',
        description: 'Search for ESO skills by name, skill line, type, or resource (legacy - prefer search_eso)',
        inputSchema: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'Search query for skill name or description',
            },
            skillLine: {
              type: 'string',
              description: 'Filter by skill line name',
            },
            category: {
              type: 'string',
              enum: ['class', 'weapon', 'armor', 'guild', 'world', 'alliance', 'crafting'],
              description: 'Filter by skill category',
            },
            type: {
              type: 'string',
              enum: ['active', 'passive', 'ultimate'],
              description: 'Filter by skill type',
            },
          },
        },
      },
      {
        name: 'get_skill_details',
        description: 'Get detailed information about a specific skill by name or ID',
        inputSchema: {
          type: 'object',
          properties: {
            skillId: {
              type: 'string',
              description: 'The skill ID or name to look up',
            },
          },
          required: ['skillId'],
        },
      },
      {
        name: 'search_mundus_stones',
        description: 'Search for Mundus Stones by name or effect',
        inputSchema: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'Search query for Mundus Stone name or effect',
            },
          },
        },
      },
      {
        name: 'get_mundus_stone_details',
        description: 'Get detailed information about a specific Mundus Stone',
        inputSchema: {
          type: 'object',
          properties: {
            stoneId: {
              type: 'string',
              description: 'The Mundus Stone ID or name to look up',
            },
          },
          required: ['stoneId'],
        },
      },
      {
        name: 'send_chat_message',
        description:
          'Send a plain text message to a configured Google Chat incoming webhook (GOOGLE_CHAT_WEBHOOK_URL env var)',
        inputSchema: {
          type: 'object',
          properties: {
            text: {
              type: 'string',
              description: 'Message text to send to Google Chat',
            },
          },
          required: ['text'],
        },
      },
      {
        name: 'send_push_message',
        description:
          'Send a plain text push notification via ntfy.sh. Configure NTFY_TOPIC or NTFY_URL environment variables.',
        inputSchema: {
          type: 'object',
          properties: {
            text: {
              type: 'string',
              description: 'Message text to send to the ntfy topic',
            },
          },
          required: ['text'],
        },
      },
      {
        name: 'send_sms_via_email',
        description:
          'Send a text via your carrier’s email-to-SMS gateway. Configure SMTP_HOST/PORT/USER/PASS/SMTP_FROM and SMS_GATEWAY_ADDRESS env vars.',
        inputSchema: {
          type: 'object',
          properties: {
            text: {
              type: 'string',
              description: 'Message text to send to your SMS gateway address',
            },
          },
          required: ['text'],
        },
      },
      {
        name: 'send_slack_message',
        description:
          'Send a plain text message to a Slack incoming webhook (SLACK_WEBHOOK_URL env var).',
        inputSchema: {
          type: 'object',
          properties: {
            text: {
              type: 'string',
              description: 'Message text to send to Slack',
            },
          },
          required: ['text'],
        },
      },
      {
        name: 'search_races',
        description: 'Search for ESO races by name or alliance',
        inputSchema: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'Search query for race name',
            },
            alliance: {
              type: 'string',
              enum: ['Aldmeri Dominion', 'Daggerfall Covenant', 'Ebonheart Pact', 'Any'],
              description: 'Filter by alliance',
            },
          },
        },
      },
      {
        name: 'get_race_details',
        description: 'Get detailed information about a specific race including all racial passives',
        inputSchema: {
          type: 'object',
          properties: {
            raceId: {
              type: 'string',
              description: 'The race ID or name to look up',
            },
          },
          required: ['raceId'],
        },
      },
      {
        name: 'search_classes',
        description: 'Search for ESO classes by name',
        inputSchema: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'Search query for class name',
            },
          },
        },
      },
      {
        name: 'get_class_details',
        description: 'Get detailed information about a specific class',
        inputSchema: {
          type: 'object',
          properties: {
            classId: {
              type: 'string',
              description: 'The class ID or name to look up',
            },
          },
          required: ['classId'],
        },
      },
      {
        name: 'search_sets',
        description: 'Search for ESO armor and weapon sets by name or type',
        inputSchema: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'Search query for set name',
            },
            type: {
              type: 'string',
              enum: ['Arena', 'Craftable', 'Dungeon', 'Monster', 'Mythic', 'Overland', 'PVP', 'Trial', 'Jewelry', 'Weapon', 'Class'],
              description: 'Filter by set type',
            },
          },
        },
      },
      {
        name: 'get_set_details',
        description: 'Get detailed information about a specific set including all bonuses',
        inputSchema: {
          type: 'object',
          properties: {
            setId: {
              type: 'string',
              description: 'The set ID or name to look up',
            },
          },
          required: ['setId'],
        },
      },
      {
        name: 'search_buffs',
        description: 'Search for ESO buffs by name or type (Major/Minor)',
        inputSchema: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'Search query for buff name',
            },
            type: {
              type: 'string',
              enum: ['Major', 'Minor'],
              description: 'Filter by buff type',
            },
          },
        },
      },
      {
        name: 'get_buff_details',
        description: 'Get detailed information about a specific buff including sources',
        inputSchema: {
          type: 'object',
          properties: {
            buffId: {
              type: 'string',
              description: 'The buff ID or name to look up',
            },
          },
          required: ['buffId'],
        },
      },
      {
        name: 'search_debuffs',
        description: 'Search for ESO debuffs by name or type (Major/Minor)',
        inputSchema: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'Search query for debuff name',
            },
            type: {
              type: 'string',
              enum: ['Major', 'Minor'],
              description: 'Filter by debuff type',
            },
          },
        },
      },
      {
        name: 'get_debuff_details',
        description: 'Get detailed information about a specific debuff including sources',
        inputSchema: {
          type: 'object',
          properties: {
            debuffId: {
              type: 'string',
              description: 'The debuff ID or name to look up',
            },
          },
          required: ['debuffId'],
        },
      },
      {
        name: 'search_caps',
        description: 'Search for ESO combat caps by name, category, or type',
        inputSchema: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'Search query for cap name',
            },
            category: {
              type: 'string',
              enum: ['offensive', 'defensive', 'resource', 'movement'],
              description: 'Filter by cap category',
            },
            capType: {
              type: 'string',
              enum: ['hard', 'soft', 'none'],
              description: 'Filter by cap type (hard cap, soft cap, or no cap)',
            },
          },
        },
      },
      {
        name: 'get_cap_details',
        description: 'Get detailed information about a specific combat cap including affected stats',
        inputSchema: {
          type: 'object',
          properties: {
            capId: {
              type: 'string',
              description: 'The cap ID or name to look up',
            },
          },
          required: ['capId'],
        },
      },
      {
        name: 'search_stats_by_cap',
        description: 'Find which stats are affected by or contribute to a specific cap',
        inputSchema: {
          type: 'object',
          properties: {
            statName: {
              type: 'string',
              description: 'The stat name to search for (e.g., "Penetration", "Critical", "Armor")',
            },
          },
          required: ['statName'],
        },
      },
      {
        name: 'calculate_ability_damage',
        description: 'Calculate damage for a single ability given character stats and target. Returns detailed breakdown of damage calculation.',
        inputSchema: {
          type: 'object',
          properties: {
            abilityInfo: {
              type: 'object',
              description: 'Ability information including coefficient, resource scaling, DOT info',
              properties: {
                coefficient: { type: 'number', description: 'Damage coefficient (e.g., 0.94 for light attack)' },
                resourceScaling: { type: 'string', enum: ['magicka', 'stamina', 'health'], description: 'Which resource scales the ability' },
                isDOT: { type: 'boolean', description: 'Is this a damage-over-time ability?' },
                tickCount: { type: 'number', description: 'Number of ticks for DOT' },
                duration: { type: 'number', description: 'Duration in seconds' },
                castTime: { type: 'number', description: 'Cast time in seconds' },
              },
              required: ['coefficient'],
            },
            characterStats: {
              type: 'object',
              description: 'Character stats',
              properties: {
                weaponDamage: { type: 'number' },
                spellDamage: { type: 'number' },
                maxMagicka: { type: 'number' },
                maxStamina: { type: 'number' },
                weaponCritical: { type: 'number' },
                spellCritical: { type: 'number' },
                criticalDamage: { type: 'number', description: 'As percentage (e.g., 80 for 80%)' },
                penetration: { type: 'number' },
                damageDoneBonus: { type: 'number', description: 'Sum of additive %damage bonuses as decimal (e.g., 0.25 for 25%)' },
              },
            },
            targetResistance: {
              type: 'number',
              description: 'Target resistance (default: 18200 for trial dummy)',
            },
          },
          required: ['abilityInfo', 'characterStats'],
        },
      },
      {
        name: 'calculate_rotation_dps',
        description: 'Calculate DPS for a full skill rotation. Returns total damage, rotation time, DPS, and per-ability breakdown.',
        inputSchema: {
          type: 'object',
          properties: {
            rotation: {
              type: 'array',
              description: 'Array of rotation steps',
              items: {
                type: 'object',
                properties: {
                  abilityInfo: {
                    type: 'object',
                    properties: {
                      coefficient: { type: 'number' },
                      resourceScaling: { type: 'string', enum: ['magicka', 'stamina', 'health'] },
                      isDOT: { type: 'boolean' },
                      tickCount: { type: 'number' },
                      castTime: { type: 'number' },
                    },
                    required: ['coefficient'],
                  },
                  castTime: { type: 'number', description: 'Time to cast this step in seconds' },
                },
                required: ['abilityInfo', 'castTime'],
              },
            },
            characterStats: {
              type: 'object',
              description: 'Character stats',
            },
            targetResistance: {
              type: 'number',
              description: 'Target resistance (default: 18200)',
            },
          },
          required: ['rotation', 'characterStats'],
        },
      },
      {
        name: 'compare_rotations',
        description: 'Compare DPS between two different skill rotations. Returns DPS for each rotation, difference, and percent change.',
        inputSchema: {
          type: 'object',
          properties: {
            rotation1: {
              type: 'array',
              description: 'First rotation to compare',
            },
            rotation2: {
              type: 'array',
              description: 'Second rotation to compare',
            },
            characterStats: {
              type: 'object',
              description: 'Character stats',
            },
            targetResistance: {
              type: 'number',
              description: 'Target resistance (default: 18200)',
            },
          },
          required: ['rotation1', 'rotation2', 'characterStats'],
        },
      },
      {
        name: 'analyze_cmx_parse',
        description: 'Analyze Combat Metrics (CMX) parse data to identify issues and provide improvement suggestions. Returns rating, issues by category, and actionable recommendations.',
        inputSchema: {
          type: 'object',
          properties: {
            parseMetrics: {
              type: 'object',
              description: 'CMX parse metrics including DPS, rotation, weaving, buffs, and stats',
              properties: {
                totalDamage: { type: 'number' },
                activeTime: { type: 'number' },
                dps: { type: 'number' },
                abilities: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      name: { type: 'string' },
                      count: { type: 'number' },
                      totalDamage: { type: 'number' },
                      percentOfTotal: { type: 'number' },
                    },
                  },
                },
                dotUptimes: { type: 'object', description: 'DoT name -> uptime %' },
                barBalance: {
                  type: 'object',
                  properties: {
                    frontBar: { type: 'number' },
                    backBar: { type: 'number' },
                  },
                },
                lightAttacks: {
                  type: 'object',
                  properties: {
                    count: { type: 'number' },
                    totalDamage: { type: 'number' },
                    averageWeaveTime: { type: 'number' },
                    missCount: { type: 'number' },
                    ratio: { type: 'number' },
                  },
                },
                buffs: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      name: { type: 'string' },
                      uptime: { type: 'number' },
                      isPermanent: { type: 'boolean' },
                    },
                  },
                },
                penetration: {
                  type: 'object',
                  properties: {
                    effective: { type: 'number' },
                    average: { type: 'number' },
                  },
                },
                criticalChance: { type: 'number' },
                criticalDamage: { type: 'number' },
              },
              required: ['dps', 'activeTime'],
            },
          },
          required: ['parseMetrics'],
        },
      },
      {
        name: 'analyze_cmx_log',
        description: 'Parse and analyze raw CMX combat log text. Detects rotation gaps, validates weaving, and provides detailed analysis.',
        inputSchema: {
          type: 'object',
          properties: {
            logText: {
              type: 'string',
              description: 'Raw CMX log text with timestamped ability casts. Format: [HH:MM:SS] Ability Name or [seconds] Ability Name',
            },
          },
          required: ['logText'],
        },
      },
      {
        name: 'parse_cmx_screenshot',
        description: 'Parse CMX screenshot using OCR to extract parse data. Supports Info screen and Parse screen screenshots.',
        inputSchema: {
          type: 'object',
          properties: {
            imagePath: {
              type: 'string',
              description: 'Absolute path to the CMX screenshot image file',
            },
            screenType: {
              type: 'string',
              enum: ['info', 'parse', 'auto'],
              description: 'Type of CMX screen: "info" (stats screen), "parse" (abilities screen), or "auto" (detect automatically)',
            },
          },
          required: ['imagePath'],
        },
      },
      {
        name: 'parse_cmx_screenshots',
        description: 'Parse multiple CMX screenshots and merge the data. Useful when you have both Info and Parse screens.',
        inputSchema: {
          type: 'object',
          properties: {
            screenshots: {
              type: 'array',
              description: 'Array of screenshot objects with path and type',
              items: {
                type: 'object',
                properties: {
                  path: { type: 'string', description: 'Absolute path to screenshot' },
                  type: { type: 'string', enum: ['info', 'parse'], description: 'Screenshot type' },
                },
                required: ['path', 'type'],
              },
            },
          },
          required: ['screenshots'],
        },
      },
      {
        name: 'manual_cmx_entry',
        description: 'Interactive helper for manually entering CMX parse data. Provides guided prompts for each field.',
        inputSchema: {
          type: 'object',
          properties: {
            mode: {
              type: 'string',
              enum: ['guided', 'quick', 'validate'],
              description: '"guided" for step-by-step entry, "quick" for minimal DPS check, "validate" to check existing data',
            },
            existingData: {
              type: 'object',
              description: 'Optional existing parse data to validate or supplement',
            },
          },
          required: ['mode'],
        },
      },
      {
        name: 'fetch_esologs_report',
        description: 'Fetch complete parse data from ESO Logs report URL. Extracts damage, stats, gear, and buffs for analysis.',
        inputSchema: {
          type: 'object',
          properties: {
            reportUrl: {
              type: 'string',
              description: 'Full ESO Logs report URL (e.g., https://www.esologs.com/reports/CODE?boss=-2&source=2)',
            },
          },
          required: ['reportUrl'],
        },
      },
      {
        name: 'analyze_esologs_character',
        description: 'Fetch ESO Logs data and analyze character performance. Provides DPS analysis, rotation feedback, and gear/spell suggestions.',
        inputSchema: {
          type: 'object',
          properties: {
            reportUrl: {
              type: 'string',
              description: 'Full ESO Logs report URL for the character to analyze',
            },
          },
          required: ['reportUrl'],
        },
      },
      {
        name: 'get_esologs_metadata',
        description: 'Get report metadata including title, fights, and duration. Useful for browsing report contents before analysis.',
        inputSchema: {
          type: 'object',
          properties: {
            reportCode: {
              type: 'string',
              description: 'ESO Logs report code (e.g., "NL1mBFp4C3Tn76cz")',
            },
          },
          required: ['reportCode'],
        },
      },
      {
        name: 'get_target_dummy_info',
        description: 'Get information about a specific target dummy including buffs/debuffs it provides. Essential for parse analysis.',
        inputSchema: {
          type: 'object',
          properties: {
            dummyId: {
              type: 'string',
              description: 'Dummy ID (e.g., "iron-atronach-trial", "iron-atronach-robust", "stone-husk-3m")',
            },
          },
          required: ['dummyId'],
        },
      },
      {
        name: 'list_target_dummies',
        description: 'List all available target dummies with their basic info',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'validate_scribed_skill',
        description: 'Validate a scribed skill combination (grimoire + focus + affix + signature). Checks for compatibility and restrictions.',
        inputSchema: {
          type: 'object',
          properties: {
            grimoire: {
              type: 'string',
              description: 'Grimoire name (e.g., "Vault", "Elemental Explosion")',
            },
            focus: {
              type: 'string',
              description: 'Focus script ID (e.g., "fell_focus", "elemental_focus")',
            },
            affix: {
              type: 'string',
              description: 'Affix script ID (e.g., "flame_sigil", "bleeding_edge")',
            },
            signature: {
              type: 'string',
              description: 'Signature script ID (e.g., "explosive_finale", "crushing_sweep")',
            },
            playerClass: {
              type: 'string',
              description: 'Optional player class for class-specific restrictions (e.g., "arcanist", "dragonknight")',
            },
          },
          required: ['grimoire', 'focus', 'affix', 'signature'],
        },
      },
      {
        name: 'list_scribing_options',
        description: 'List all available scribing grimoires, focus scripts, affix scripts, and signature scripts',
        inputSchema: {
          type: 'object',
          properties: {
            type: {
              type: 'string',
              enum: ['grimoires', 'focus', 'affix', 'signature', 'all'],
              description: 'Type of scribing component to list',
            },
          },
          required: ['type'],
        },
      },
      {
        name: 'describe_scribed_skill',
        description: 'Get a detailed description of a scribed skill combination',
        inputSchema: {
          type: 'object',
          properties: {
            grimoire: {
              type: 'string',
              description: 'Grimoire name',
            },
            focus: {
              type: 'string',
              description: 'Focus script ID',
            },
            affix: {
              type: 'string',
              description: 'Affix script ID',
            },
            signature: {
              type: 'string',
              description: 'Signature script ID',
            },
          },
          required: ['grimoire', 'focus', 'affix', 'signature'],
        },
      },
      {
        name: 'search_by_tag',
        description: 'Search for ESO items by tag. Find all items with specific attributes like "major-force", "max-stamina", "flame-damage", etc.',
        inputSchema: {
          type: 'object',
          properties: {
            tag: {
              type: 'string',
              description: 'Tag name to search for (e.g., "major-force", "max-stamina", "penetration", "stun")',
            },
            category: {
              type: 'string',
              enum: ['buff', 'debuff', 'resource', 'offensive', 'defensive', 'damage-type', 'crowd-control', 'proc', 'role', 'mechanic', 'set-type'],
              description: 'Optional: filter by tag category',
            },
            itemType: {
              type: 'string',
              enum: ['skill', 'set', 'set_bonus', 'buff', 'debuff', 'mundus', 'racial_passive'],
              description: 'Optional: filter by item type',
            },
            limit: {
              type: 'number',
              description: 'Maximum number of results (default: 20)',
            },
          },
          required: ['tag'],
        },
      },
      {
        name: 'list_tags',
        description: 'List all available tags, optionally filtered by category',
        inputSchema: {
          type: 'object',
          properties: {
            category: {
              type: 'string',
              enum: ['buff', 'debuff', 'resource', 'offensive', 'defensive', 'damage-type', 'crowd-control', 'proc', 'role', 'mechanic', 'set-type'],
              description: 'Optional: filter by tag category',
            },
          },
        },
      },
      {
        name: 'get_item_tags',
        description: 'Get all tags associated with a specific item',
        inputSchema: {
          type: 'object',
          properties: {
            itemId: {
              type: 'string',
              description: 'The item ID',
            },
            itemType: {
              type: 'string',
              enum: ['skill', 'set', 'set_bonus', 'buff', 'debuff', 'mundus', 'racial_passive'],
              description: 'The item type',
            },
          },
          required: ['itemId', 'itemType'],
        },
      },
    ],
  };
});

// Helper function for CMX log recommendations
function generateLogRecommendations(
  parsed: { events: any[]; gaps: any[]; analysis: any },
  weaving: { missedWeaves: number; doubleWeaves: number; goodWeaves: number; weaveEfficiency: number }
): string[] {
  const recommendations: string[] = [];

  // Check for gaps
  if (parsed.analysis.totalGaps > 5) {
    recommendations.push(
      `You have ${parsed.analysis.totalGaps} gaps >1.0s in your rotation. Reduce downtime by maintaining DoT uptimes and filling with light attacks or spammables.`
    );
  }

  if (parsed.analysis.largestGap > 3.0) {
    recommendations.push(
      `Largest gap is ${parsed.analysis.largestGap.toFixed(1)}s. This suggests significant rotation breaks. Ensure you're maintaining constant pressure.`
    );
  }

  // Check weaving efficiency
  if (weaving.weaveEfficiency < 80) {
    recommendations.push(
      `Weaving efficiency is ${weaving.weaveEfficiency.toFixed(1)}%. Practice light attacking between every skill for maximum DPS.`
    );
  }

  if (weaving.missedWeaves > 10) {
    recommendations.push(
      `${weaving.missedWeaves} missed light attacks detected. Ensure you're weaving LA before each skill cast.`
    );
  }

  if (weaving.doubleWeaves > 5) {
    recommendations.push(
      `${weaving.doubleWeaves} double light attacks detected. This indicates you're pressing LA twice instead of LA + Skill.`
    );
  }

  if (recommendations.length === 0) {
    recommendations.push('Rotation looks clean! Good weaving and minimal gaps detected.');
  }

  return recommendations;
}

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  switch (name) {
    case 'search_eso': {
      const { query, limit } = args as { query: string; limit?: number };

      const results = await unifiedSearch(query, limit || 10);

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(results, null, 2),
          },
        ],
      };
    }

    case 'get_eso_details': {
      const { type, id } = args as { type: string; id: string };

      const details = await getDetailedInfo(type, id);

      if (!details) {
        return {
          content: [
            {
              type: 'text',
              text: `No details found for ${type} with ID: ${id}`,
            },
          ],
          isError: true,
        };
      }

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(details, null, 2),
          },
        ],
      };
    }

    case 'search_skills': {
      const { query, skillLine, category, type } = args as {
        query?: string;
        skillLine?: string;
        category?: string;
        type?: string;
      };

      const skills = await prisma.skill.findMany({
        where: {
          ...(query && {
            OR: [
              { name: { contains: query } },
              { description: { contains: query } },
            ],
          }),
          ...(skillLine && { skillLine: { contains: skillLine } }),
          ...(category && { category }),
          ...(type && { type }),
        },
        take: 20,
        include: {
          effects: true,
          morphs: true,
          scaling: true,
          requirements: true,
        },
      });

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(skills, null, 2),
          },
        ],
      };
    }

    case 'get_skill_details': {
      const { skillId } = args as { skillId: string };

      const skill = await prisma.skill.findFirst({
        where: {
          OR: [{ id: skillId }, { name: { equals: skillId } }],
        },
        include: {
          effects: true,
          morphs: true,
          scaling: true,
          requirements: true,
          baseSkill: true,
          morphedSkills: {
            include: {
              morphs: true,
            },
          },
        },
      });

      if (!skill) {
        return {
          content: [
            {
              type: 'text',
              text: `Skill not found: ${skillId}`,
            },
          ],
          isError: true,
        };
      }

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(skill, null, 2),
          },
        ],
      };
    }

    case 'search_mundus_stones': {
      const { query } = args as { query?: string };

      let stones = MUNDUS_STONES_DATA;

      if (query) {
        const searchTerm = query.toLowerCase();
        stones = stones.filter(
          stone =>
            stone.name.toLowerCase().includes(searchTerm) ||
            stone.effects.some(effect => effect.type.toLowerCase().includes(searchTerm)) ||
            stone.locations.aldmeriDominion.toLowerCase().includes(searchTerm) ||
            stone.locations.daggerfallCovenant.toLowerCase().includes(searchTerm) ||
            stone.locations.ebonheartPact.toLowerCase().includes(searchTerm) ||
            stone.locations.cyrodiil.toLowerCase().includes(searchTerm)
        );
      }

      // Return summary information (not full divines scaling)
      const summary = stones.map(stone => ({
        name: stone.name,
        effects: stone.effects.map(e => ({
          type: e.type,
          baseValue: e.baseValue,
          maxDivines: e.isPercentage
            ? `${e.divinesScaling[7]?.legendary}%`
            : e.divinesScaling[7]?.legendary,
        })),
        locations: stone.locations,
        url: stone.url,
      }));

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(summary, null, 2),
          },
        ],
      };
    }

    case 'get_mundus_stone_details': {
      const { stoneId } = args as { stoneId: string };

      const stone = MUNDUS_STONES_DATA.find(
        s => s.name.toLowerCase() === stoneId.toLowerCase() || s.name.toLowerCase().includes(stoneId.toLowerCase())
      );

      if (!stone) {
        return {
          content: [
            {
              type: 'text',
              text: `Mundus Stone not found: ${stoneId}`,
            },
          ],
          isError: true,
        };
      }

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(stone, null, 2),
          },
        ],
      };
    }

    case 'send_chat_message': {
      const { text } = args as { text: string };
      const webhookUrl = process.env.GOOGLE_CHAT_WEBHOOK_URL;

      if (!webhookUrl) {
        return {
          content: [
            {
              type: 'text',
              text: 'Missing GOOGLE_CHAT_WEBHOOK_URL environment variable.',
            },
          ],
          isError: true,
        };
      }

      try {
        await axios.post(webhookUrl, { text });

        return {
          content: [
            {
              type: 'text',
              text: 'Message sent to Google Chat.',
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Failed to send message to Google Chat: ${error}`,
            },
          ],
          isError: true,
        };
      }
    }

    case 'send_push_message': {
      const { text } = args as { text: string };
      const ntfyUrl =
        process.env.NTFY_URL ??
        (process.env.NTFY_TOPIC ? `https://ntfy.sh/${process.env.NTFY_TOPIC}` : undefined);

      if (!ntfyUrl) {
        return {
          content: [
            {
              type: 'text',
              text: 'Missing NTFY_TOPIC or NTFY_URL environment variable.',
            },
          ],
          isError: true,
        };
      }

      try {
        await axios.post(ntfyUrl, text, {
          headers: { 'Content-Type': 'text/plain' },
        });

        return {
          content: [
            {
              type: 'text',
              text: 'Push notification sent via ntfy.',
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Failed to send push notification: ${error}`,
            },
          ],
          isError: true,
        };
      }
    }

    case 'send_sms_via_email': {
      const { text } = args as { text: string };
      const smtpHost = process.env.SMTP_HOST;
      const smtpPort = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 587;
      const smtpUser = process.env.SMTP_USER;
      const smtpPass = process.env.SMTP_PASS;
      const fromAddress = process.env.SMTP_FROM ?? smtpUser;
      const toAddress = process.env.SMS_GATEWAY_ADDRESS;
      const secure = process.env.SMTP_SECURE === 'true';

      if (!smtpHost || !fromAddress || !toAddress) {
        return {
          content: [
            {
              type: 'text',
              text: 'Missing SMTP_HOST/SMTP_FROM/SMS_GATEWAY_ADDRESS environment variable.',
            },
          ],
          isError: true,
        };
      }

      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure,
        auth: smtpUser && smtpPass ? { user: smtpUser, pass: smtpPass } : undefined,
      });

      try {
        await transporter.sendMail({
          from: fromAddress,
          to: toAddress,
          subject: 'Notification',
          text,
        });

        return {
          content: [
            {
              type: 'text',
              text: 'SMS sent via email gateway.',
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Failed to send SMS via email gateway: ${error}`,
            },
          ],
          isError: true,
        };
      }
    }

    case 'send_slack_message': {
      const { text } = args as { text: string };
      const webhookUrl = process.env.SLACK_WEBHOOK_URL;

      if (!webhookUrl) {
        return {
          content: [
            {
              type: 'text',
              text: 'Missing SLACK_WEBHOOK_URL environment variable.',
            },
          ],
          isError: true,
        };
      }

      try {
        await axios.post(webhookUrl, { text });

        return {
          content: [
            {
              type: 'text',
              text: 'Message sent to Slack.',
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Failed to send message to Slack: ${error}`,
            },
          ],
          isError: true,
        };
      }
    }

    case 'search_races': {
      const { query, alliance } = args as {
        query?: string;
        alliance?: string;
      };

      const races = await prisma.race.findMany({
        where: {
          ...(query && {
            name: { contains: query },
          }),
          ...(alliance && { alliance }),
        },
        include: {
          passives: true,
        },
      });

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(races, null, 2),
          },
        ],
      };
    }

    case 'get_race_details': {
      const { raceId } = args as { raceId: string };

      const race = await prisma.race.findFirst({
        where: {
          OR: [
            { id: raceId },
            { name: { equals: raceId } },
            { name: { contains: raceId } },
          ],
        },
        include: {
          passives: {
            orderBy: [
              { name: 'asc' },
              { rank: 'asc' },
            ],
          },
        },
      });

      if (!race) {
        return {
          content: [
            {
              type: 'text',
              text: `Race not found: ${raceId}`,
            },
          ],
          isError: true,
        };
      }

      // Parse the effects JSON strings back to objects
      const raceWithParsedEffects = {
        ...race,
        passives: race.passives.map(passive => ({
          ...passive,
          effects: JSON.parse(passive.effects),
        })),
      };

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(raceWithParsedEffects, null, 2),
          },
        ],
      };
    }

    case 'search_classes': {
      const { query } = args as { query?: string };

      const classes = await prisma.class.findMany({
        where: query ? {
          name: { contains: query },
        } : {},
        orderBy: { name: 'asc' },
      });

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(classes, null, 2),
          },
        ],
      };
    }

    case 'get_class_details': {
      const { classId } = args as { classId: string };

      const classData = await prisma.class.findFirst({
        where: {
          OR: [
            { id: classId },
            { name: { equals: classId } },
            { name: { contains: classId } },
          ],
        },
      });

      if (!classData) {
        return {
          content: [
            {
              type: 'text',
              text: `Class not found: ${classId}`,
            },
          ],
          isError: true,
        };
      }

      // Also get the skill lines for this class
      const skillLines = await prisma.skillLine.findMany({
        where: {
          category: 'class',
          // Get skill lines that have skills from this class
          skills: {
            some: {
              skillLine: { contains: '' }, // All skills
            },
          },
        },
        include: {
          skills: {
            where: {
              category: 'class',
            },
            take: 5, // Limit to prevent huge responses
          },
        },
      });

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              ...classData,
              skillLines,
            }, null, 2),
          },
        ],
      };
    }

    case 'search_sets': {
      const { query, type } = args as {
        query?: string;
        type?: string;
      };

      const sets = await prisma.set.findMany({
        where: {
          ...(query && {
            name: { contains: query },
          }),
          ...(type && { type }),
        },
        take: 20,
        include: {
          bonuses: true,
        },
      });

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(sets, null, 2),
          },
        ],
      };
    }

    case 'get_set_details': {
      const { setId } = args as { setId: string };

      const set = await prisma.set.findFirst({
        where: {
          OR: [
            { id: setId },
            { name: { equals: setId } },
            { name: { contains: setId } },
          ],
        },
        include: {
          bonuses: {
            orderBy: { pieces: 'asc' },
          },
        },
      });

      if (!set) {
        return {
          content: [
            {
              type: 'text',
              text: `Set not found: ${setId}`,
            },
          ],
          isError: true,
        };
      }

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(set, null, 2),
          },
        ],
      };
    }

    case 'search_buffs': {
      const { query, type } = args as {
        query?: string;
        type?: string;
      };

      const buffs = await prisma.buff.findMany({
        where: {
          ...(query && {
            name: { contains: query },
          }),
          ...(type && { type }),
        },
        take: 20,
      });

      // Parse sources JSON for each buff
      const buffsWithParsedSources = buffs.map((buff) => ({
        ...buff,
        sources: JSON.parse(buff.sources),
      }));

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(buffsWithParsedSources, null, 2),
          },
        ],
      };
    }

    case 'get_buff_details': {
      const { buffId } = args as { buffId: string };

      const buff = await prisma.buff.findFirst({
        where: {
          OR: [
            { id: buffId },
            { name: { equals: buffId } },
            { name: { contains: buffId } },
          ],
        },
      });

      if (!buff) {
        return {
          content: [
            {
              type: 'text',
              text: `Buff not found: ${buffId}`,
            },
          ],
          isError: true,
        };
      }

      // Parse sources JSON
      const buffWithParsedSources = {
        ...buff,
        sources: JSON.parse(buff.sources),
      };

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(buffWithParsedSources, null, 2),
          },
        ],
      };
    }

    case 'search_debuffs': {
      const { query, type } = args as {
        query?: string;
        type?: string;
      };

      const debuffs = await prisma.debuff.findMany({
        where: {
          ...(query && {
            name: { contains: query },
          }),
          ...(type && { type }),
        },
        take: 20,
      });

      // Parse sources JSON for each debuff
      const debuffsWithParsedSources = debuffs.map((debuff) => ({
        ...debuff,
        sources: JSON.parse(debuff.sources),
      }));

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(debuffsWithParsedSources, null, 2),
          },
        ],
      };
    }

    case 'get_debuff_details': {
      const { debuffId } = args as { debuffId: string };

      const debuff = await prisma.debuff.findFirst({
        where: {
          OR: [
            { id: debuffId },
            { name: { equals: debuffId } },
            { name: { contains: debuffId } },
          ],
        },
      });

      if (!debuff) {
        return {
          content: [
            {
              type: 'text',
              text: `Debuff not found: ${debuffId}`,
            },
          ],
          isError: true,
        };
      }

      // Parse sources JSON
      const debuffWithParsedSources = {
        ...debuff,
        sources: JSON.parse(debuff.sources),
      };

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(debuffWithParsedSources, null, 2),
          },
        ],
      };
    }

    case 'search_caps': {
      const { query, category, capType } = args as {
        query?: string;
        category?: string;
        capType?: string;
      };

      const caps = await prisma.cap.findMany({
        where: {
          ...(query && {
            name: { contains: query },
          }),
          ...(category && { category }),
          ...(capType && { capType }),
        },
        include: {
          affectedByStats: true,
        },
        take: 20,
      });

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(caps, null, 2),
          },
        ],
      };
    }

    case 'get_cap_details': {
      const { capId } = args as { capId: string };

      const cap = await prisma.cap.findFirst({
        where: {
          OR: [
            { id: capId },
            { name: { equals: capId } },
            { name: { contains: capId } },
          ],
        },
        include: {
          affectedByStats: true,
        },
      });

      if (!cap) {
        return {
          content: [
            {
              type: 'text',
              text: `Cap not found: ${capId}`,
            },
          ],
          isError: true,
        };
      }

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(cap, null, 2),
          },
        ],
      };
    }

    case 'search_stats_by_cap': {
      const { statName } = args as { statName: string };

      const statsRelations = await prisma.statAffectsCap.findMany({
        where: {
          statName: { contains: statName },
        },
        include: {
          cap: true,
        },
      });

      if (statsRelations.length === 0) {
        return {
          content: [
            {
              type: 'text',
              text: `No caps found for stat: ${statName}`,
            },
          ],
        };
      }

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(statsRelations, null, 2),
          },
        ],
      };
    }

    case 'calculate_ability_damage': {
      const { abilityInfo, characterStats, targetResistance } = args as {
        abilityInfo: AbilityInfo;
        characterStats: CharacterStats;
        targetResistance?: number;
      };

      const targetStats: TargetStats = {
        resistance: targetResistance || 18200,
      };

      const result = calculateAbilityDamage(abilityInfo, characterStats, targetStats);

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    }

    case 'calculate_rotation_dps': {
      const { rotation, characterStats, targetResistance } = args as {
        rotation: RotationStep[];
        characterStats: CharacterStats;
        targetResistance?: number;
      };

      const targetStats: TargetStats = {
        resistance: targetResistance || 18200,
      };

      const result = calculateRotationDPS(rotation, characterStats, targetStats);

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    }

    case 'compare_rotations': {
      const { rotation1, rotation2, characterStats, targetResistance } = args as {
        rotation1: RotationStep[];
        rotation2: RotationStep[];
        characterStats: CharacterStats;
        targetResistance?: number;
      };

      const targetStats: TargetStats = {
        resistance: targetResistance || 18200,
      };

      const result = compareRotations(rotation1, rotation2, characterStats, targetStats);

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    }

    case 'analyze_cmx_parse': {
      const { parseMetrics } = args as { parseMetrics: CMXParseMetrics };

      const analysis = analyzeCMXParse(parseMetrics);

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(analysis, null, 2),
          },
        ],
      };
    }

    case 'analyze_cmx_log': {
      const { logText } = args as { logText: string };

      const parsed = parseCMXLog(logText);
      const weaving = validateWeaving(parsed.events);

      const result = {
        eventCount: parsed.events.length,
        gaps: parsed.gaps,
        gapAnalysis: parsed.analysis,
        weavingAnalysis: weaving,
        recommendations: generateLogRecommendations(parsed, weaving),
      };

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    }

    case 'parse_cmx_screenshot': {
      const { imagePath, screenType } = args as { imagePath: string; screenType?: 'info' | 'parse' | 'auto' };

      const result = await parseCMXScreenshot(imagePath, screenType || 'auto');

      if (!result.success) {
        return {
          content: [
            {
              type: 'text',
              text: `OCR failed: ${result.error}`,
            },
          ],
          isError: true,
        };
      }

      // Validate the OCR data
      const validation = validateOCRData(result.data!);

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              ...result,
              validation,
            }, null, 2),
          },
        ],
      };
    }

    case 'parse_cmx_screenshots': {
      const { screenshots } = args as { screenshots: Array<{ path: string; type: 'info' | 'parse' }> };

      const result = await parseCMXScreenshots(screenshots);

      if (!result.success) {
        return {
          content: [
            {
              type: 'text',
              text: `OCR failed: ${result.error}`,
            },
          ],
          isError: true,
        };
      }

      // Validate the merged data
      const validation = validateOCRData(result.data!);

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              ...result,
              validation,
            }, null, 2),
          },
        ],
      };
    }

    case 'manual_cmx_entry': {
      const { mode, existingData } = args as { mode: 'guided' | 'quick' | 'validate'; existingData?: Partial<CMXParseMetrics> };

      let guidance = '';

      if (mode === 'guided') {
        guidance = `
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

## Buff Stats
9. Major/Minor Buffs: [List with uptimes]

## Combat Stats
10. Penetration: [Effective penetration value]
11. Critical Chance: [% value]
12. Critical Damage: [% value]

Once you provide this data, I'll analyze it with the analyze_cmx_parse tool.
        `;
      } else if (mode === 'quick') {
        guidance = `
# CMX Manual Entry - Quick Mode

For a quick DPS check, provide:
1. DPS: [Your DPS value]
2. Active Time: [Seconds]

Optional but recommended:
3. Weave Time: [Average ms]
4. Penetration: [Value]

I'll give you a basic analysis and tell you what's missing for a full report.
        `;
      } else if (mode === 'validate') {
        if (!existingData) {
          return {
            content: [
              {
                type: 'text',
                text: 'Validate mode requires existingData parameter',
              },
            ],
            isError: true,
          };
        }

        const validation = validateOCRData(existingData as CMXScreenshotData);
        guidance = `
# CMX Data Validation

**Completeness:** ${validation.isComplete ? '✅ Complete' : '⚠️ Incomplete'}

${validation.missingFields.length > 0 ? `
**Missing Fields:**
${validation.missingFields.map(f => `- ${f}`).join('\n')}

**Suggestions:**
${validation.suggestions.map(s => `- ${s}`).join('\n')}
` : '**All critical fields present!**'}
        `;
      }

      return {
        content: [
          {
            type: 'text',
            text: guidance,
          },
        ],
      };
    }

    case 'fetch_esologs_report': {
      const { reportUrl } = args as { reportUrl: string };

      try {
        const characterData = await fetchCharacterData(reportUrl);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(characterData, null, 2),
            },
          ],
        };
      } catch (error: any) {
        return {
          content: [
            {
              type: 'text',
              text: `Failed to fetch ESO Logs data: ${error.message}`,
            },
          ],
          isError: true,
        };
      }
    }

    case 'analyze_esologs_character': {
      const { reportUrl } = args as { reportUrl: string };

      try {
        const characterData = await fetchCharacterData(reportUrl);
        const cmxFormat = convertToGMXFormat(characterData);
        const analysis = analyzeCMXParse(cmxFormat);
        // Use the async version that queries the database for set information
        const buildRecs = await generateBuildRecommendationsAsync(characterData);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                character: {
                  name: characterData.name,
                  class: characterData.class,
                  spec: characterData.spec,
                },
                report: {
                  title: characterData.report.title,
                  code: characterData.report.code,
                },
                performance: {
                  dps: Math.round(characterData.damage.dps),
                  activeDuration: characterData.damage.activeDuration.toFixed(1),
                  totalDamage: characterData.damage.totalDamage,
                },
                analysis,
                topAbilities: characterData.damage.abilities.slice(0, 10),
                gear: characterData.summary.gear,
                buffs: characterData.summary.buffs.filter(b => b.uptime > 50),
                gearAnalysis: {
                  setsIdentified: buildRecs.setsIdentified,
                  buffsFromGear: buildRecs.buffsFromGear,
                },
                buildRecommendations: {
                  summary: buildRecs.summary,
                  optimization: buildRecs.recommendations.filter(r => r.category === 'optimization'),
                  critical: buildRecs.recommendations.filter(r => r.priority === 'critical'),
                  high: buildRecs.recommendations.filter(r => r.priority === 'high'),
                  medium: buildRecs.recommendations.filter(r => r.priority === 'medium'),
                  low: buildRecs.recommendations.filter(r => r.priority === 'low'),
                },
              }, null, 2),
            },
          ],
        };
      } catch (error: any) {
        return {
          content: [
            {
              type: 'text',
              text: `Failed to analyze ESO Logs character: ${error.message}`,
            },
          ],
          isError: true,
        };
      }
    }

    case 'get_esologs_metadata': {
      const { reportCode } = args as { reportCode: string };

      try {
        const metadata = await fetchReportMetadata(reportCode);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(metadata, null, 2),
            },
          ],
        };
      } catch (error: any) {
        return {
          content: [
            {
              type: 'text',
              text: `Failed to fetch report metadata: ${error.message}`,
            },
          ],
          isError: true,
        };
      }
    }

    case 'get_target_dummy_info': {
      const { dummyId } = args as { dummyId: string };

      try {
        const dummy = await prisma.targetDummy.findUnique({
          where: { id: dummyId },
        });

        if (!dummy) {
          return {
            content: [
              {
                type: 'text',
                text: `Target dummy not found: ${dummyId}`,
              },
            ],
            isError: true,
          };
        }

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                ...dummy,
                buffsProvided: JSON.parse(dummy.buffsProvided),
                debuffsProvided: JSON.parse(dummy.debuffsProvided),
              }, null, 2),
            },
          ],
        };
      } catch (error: any) {
        return {
          content: [
            {
              type: 'text',
              text: `Failed to fetch target dummy info: ${error.message}`,
            },
          ],
          isError: true,
        };
      }
    }

    case 'list_target_dummies': {
      try {
        const dummies = await prisma.targetDummy.findMany({
          select: {
            id: true,
            name: true,
            health: true,
            description: true,
          },
        });

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(dummies, null, 2),
            },
          ],
        };
      } catch (error: any) {
        return {
          content: [
            {
              type: 'text',
              text: `Failed to list target dummies: ${error.message}`,
            },
          ],
          isError: true,
        };
      }
    }

    case 'validate_scribed_skill': {
      const { grimoire, focus, affix, signature, playerClass } = args as {
        grimoire: string;
        focus: string;
        affix: string;
        signature: string;
        playerClass?: string;
      };

      const validation = validateScribedSkill(grimoire, focus, affix, signature, playerClass);

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(validation, null, 2),
          },
        ],
      };
    }

    case 'list_scribing_options': {
      const { type } = args as { type: string };

      let result: any;
      switch (type) {
        case 'grimoires':
          result = GRIMOIRES;
          break;
        case 'focus':
          result = FOCUS_SCRIPTS;
          break;
        case 'affix':
          result = AFFIX_SCRIPTS;
          break;
        case 'signature':
          result = SIGNATURE_SCRIPTS;
          break;
        case 'all':
          result = {
            grimoires: GRIMOIRES,
            focus_scripts: FOCUS_SCRIPTS,
            affix_scripts: AFFIX_SCRIPTS,
            signature_scripts: SIGNATURE_SCRIPTS,
          };
          break;
        default:
          return {
            content: [
              {
                type: 'text',
                text: `Unknown type: ${type}. Must be one of: grimoires, focus, affix, signature, all`,
              },
            ],
            isError: true,
          };
      }

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    }

    case 'describe_scribed_skill': {
      const { grimoire, focus, affix, signature } = args as {
        grimoire: string;
        focus: string;
        affix: string;
        signature: string;
      };

      const description = describeScribedSkill(grimoire, focus, affix, signature);

      return {
        content: [
          {
            type: 'text',
            text: description,
          },
        ],
      };
    }

    case 'search_by_tag': {
      const { tag, category, itemType, limit = 20 } = args as {
        tag: string;
        category?: string;
        itemType?: string;
        limit?: number;
      };

      try {
        // Build the query for tag matching
        const tagWhere: any = {
          OR: [
            { name: { contains: tag.toLowerCase() } },
            { displayName: { contains: tag } },
          ],
        };

        if (category) {
          tagWhere.category = category;
        }

        // Find matching tags
        const matchingTags = await prisma.tag.findMany({
          where: tagWhere,
          include: {
            items: {
              where: itemType ? { itemType } : undefined,
              take: limit,
            },
          },
        });

        // Collect all item IDs grouped by type
        const itemsByType: Record<string, string[]> = {};
        for (const t of matchingTags) {
          for (const item of t.items) {
            if (!itemsByType[item.itemType]) {
              itemsByType[item.itemType] = [];
            }
            if (!itemsByType[item.itemType].includes(item.itemId)) {
              itemsByType[item.itemType].push(item.itemId);
            }
          }
        }

        // Fetch actual item details
        const results: any[] = [];

        if (itemsByType.buff) {
          const buffs = await prisma.buff.findMany({
            where: { id: { in: itemsByType.buff } },
          });
          results.push(...buffs.map((b) => ({ ...b, _type: 'buff' })));
        }

        if (itemsByType.debuff) {
          const debuffs = await prisma.debuff.findMany({
            where: { id: { in: itemsByType.debuff } },
          });
          results.push(...debuffs.map((d) => ({ ...d, _type: 'debuff' })));
        }

        if (itemsByType.set) {
          const sets = await prisma.set.findMany({
            where: { id: { in: itemsByType.set } },
            include: { bonuses: true },
          });
          results.push(...sets.map((s) => ({ ...s, _type: 'set' })));
        }

        if (itemsByType.skill) {
          const skills = await prisma.skill.findMany({
            where: { id: { in: itemsByType.skill } },
          });
          results.push(...skills.map((s) => ({ ...s, _type: 'skill' })));
        }

        if (itemsByType.mundus) {
          const mundusStones = await prisma.mundusStone.findMany({
            where: { id: { in: itemsByType.mundus } },
          });
          results.push(...mundusStones.map((m) => ({ ...m, _type: 'mundus' })));
        }

        if (itemsByType.racial_passive) {
          const passives = await prisma.racialPassive.findMany({
            where: { id: { in: itemsByType.racial_passive.map((id) => parseInt(id)) } },
          });
          results.push(...passives.map((p) => ({ ...p, _type: 'racial_passive' })));
        }

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  matchedTags: matchingTags.map((t) => ({
                    name: t.name,
                    displayName: t.displayName,
                    category: t.category,
                    itemCount: t.items.length,
                  })),
                  totalResults: results.length,
                  results: results.slice(0, limit),
                },
                null,
                2
              ),
            },
          ],
        };
      } catch (error: any) {
        return {
          content: [
            {
              type: 'text',
              text: `Failed to search by tag: ${error.message}`,
            },
          ],
          isError: true,
        };
      }
    }

    case 'list_tags': {
      const { category } = args as { category?: string };

      try {
        const where = category ? { category } : undefined;
        const tags = await prisma.tag.findMany({
          where,
          orderBy: [{ category: 'asc' }, { name: 'asc' }],
          include: {
            _count: {
              select: { items: true },
            },
          },
        });

        // Group by category
        const grouped: Record<string, any[]> = {};
        for (const tag of tags) {
          if (!grouped[tag.category]) {
            grouped[tag.category] = [];
          }
          grouped[tag.category].push({
            name: tag.name,
            displayName: tag.displayName,
            description: tag.description,
            itemCount: tag._count.items,
          });
        }

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  totalTags: tags.length,
                  byCategory: grouped,
                },
                null,
                2
              ),
            },
          ],
        };
      } catch (error: any) {
        return {
          content: [
            {
              type: 'text',
              text: `Failed to list tags: ${error.message}`,
            },
          ],
          isError: true,
        };
      }
    }

    case 'get_item_tags': {
      const { itemId, itemType } = args as { itemId: string; itemType: string };

      try {
        const itemTags = await prisma.itemTag.findMany({
          where: { itemId, itemType },
          include: { tag: true },
        });

        const tags = itemTags.map((it) => ({
          name: it.tag.name,
          displayName: it.tag.displayName,
          category: it.tag.category,
        }));

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  itemId,
                  itemType,
                  tagCount: tags.length,
                  tags,
                },
                null,
                2
              ),
            },
          ],
        };
      } catch (error: any) {
        return {
          content: [
            {
              type: 'text',
              text: `Failed to get item tags: ${error.message}`,
            },
          ],
          isError: true,
        };
      }
    }

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
});

// List available resources
server.setRequestHandler(ListResourcesRequestSchema, async () => {
  const skillLines = await prisma.skillLine.findMany({
    select: {
      id: true,
      name: true,
      category: true,
    },
  });

  const mundusStones = await prisma.mundusStone.findMany({
    select: {
      id: true,
      name: true,
    },
  });

  const races = await prisma.race.findMany({
    select: {
      id: true,
      name: true,
      alliance: true,
    },
  });

  const classes = await prisma.class.findMany({
    select: {
      id: true,
      name: true,
    },
  });

  const sets = await prisma.set.findMany({
    select: {
      id: true,
      name: true,
      type: true,
    },
  });

  const buffs = await prisma.buff.findMany({
    select: {
      id: true,
      name: true,
      type: true,
    },
  });

  const debuffs = await prisma.debuff.findMany({
    select: {
      id: true,
      name: true,
      type: true,
    },
  });

  const caps = await prisma.cap.findMany({
    select: {
      id: true,
      name: true,
      category: true,
      capType: true,
    },
  });

  const resources = [
    ...skillLines.map((line) => ({
      uri: `eso://skills/${line.category}/${line.id}`,
      name: `${line.name} Skills`,
      description: `All skills from the ${line.name} skill line`,
      mimeType: 'application/json',
    })),
    {
      uri: 'eso://mundus-stones/all',
      name: 'All Mundus Stones',
      description: 'All 13 Mundus Stones and their effects',
      mimeType: 'application/json',
    },
    ...mundusStones.map((stone) => ({
      uri: `eso://mundus-stones/${stone.id}`,
      name: stone.name,
      description: `Details about the ${stone.name} Mundus Stone`,
      mimeType: 'application/json',
    })),
    {
      uri: 'eso://races/all',
      name: 'All Races',
      description: 'All 10 playable races and their racial passives',
      mimeType: 'application/json',
    },
    ...races.map((race) => ({
      uri: `eso://races/${race.id}`,
      name: race.name,
      description: `Details about the ${race.name} race (${race.alliance || 'Any'})`,
      mimeType: 'application/json',
    })),
    {
      uri: 'eso://classes/all',
      name: 'All Classes',
      description: 'All 7 playable classes',
      mimeType: 'application/json',
    },
    ...classes.map((cls) => ({
      uri: `eso://classes/${cls.id}`,
      name: cls.name,
      description: `Details about the ${cls.name} class`,
      mimeType: 'application/json',
    })),
    {
      uri: 'eso://sets/all',
      name: 'All Sets',
      description: 'All 595 armor and weapon sets with bonuses',
      mimeType: 'application/json',
    },
    ...sets.map((set) => ({
      uri: `eso://sets/${set.id}`,
      name: set.name,
      description: `Details about the ${set.name} set (${set.type})`,
      mimeType: 'application/json',
    })),
    {
      uri: 'eso://buffs/all',
      name: 'All Buffs',
      description: 'All buffs (Major and Minor) and their sources',
      mimeType: 'application/json',
    },
    ...buffs.map((buff) => ({
      uri: `eso://buffs/${buff.id}`,
      name: buff.name,
      description: `Details about the ${buff.name} ${buff.type || ''} buff`,
      mimeType: 'application/json',
    })),
    {
      uri: 'eso://debuffs/all',
      name: 'All Debuffs',
      description: 'All debuffs (Major and Minor) and their sources',
      mimeType: 'application/json',
    },
    ...debuffs.map((debuff) => ({
      uri: `eso://debuffs/${debuff.id}`,
      name: debuff.name,
      description: `Details about the ${debuff.name} ${debuff.type || ''} debuff`,
      mimeType: 'application/json',
    })),
    {
      uri: 'eso://caps/all',
      name: 'All Combat Caps',
      description: 'All combat caps including offensive, defensive, resource, and movement caps',
      mimeType: 'application/json',
    },
    ...caps.map((cap) => ({
      uri: `eso://caps/${cap.id}`,
      name: cap.name,
      description: `${cap.capType} cap for ${cap.name} (${cap.category})`,
      mimeType: 'application/json',
    })),
  ];

  return { resources };
});

// Handle resource reads
server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const uri = request.params.uri;

  // Handle Mundus Stones resources
  if (uri === 'eso://mundus-stones/all') {
    const stones = await prisma.mundusStone.findMany({
      orderBy: { name: 'asc' },
    });

    return {
      contents: [
        {
          uri,
          mimeType: 'application/json',
          text: JSON.stringify(stones, null, 2),
        },
      ],
    };
  }

  const mundusMatch = uri.match(/^eso:\/\/mundus-stones\/([^\/]+)$/);
  if (mundusMatch) {
    const [, stoneId] = mundusMatch;
    const stone = await prisma.mundusStone.findUnique({
      where: { id: stoneId },
    });

    if (!stone) {
      throw new Error(`Mundus Stone not found: ${stoneId}`);
    }

    return {
      contents: [
        {
          uri,
          mimeType: 'application/json',
          text: JSON.stringify(stone, null, 2),
        },
      ],
    };
  }

  // Handle class resources
  if (uri === 'eso://classes/all') {
    const classes = await prisma.class.findMany({
      orderBy: { name: 'asc' },
    });

    return {
      contents: [
        {
          uri,
          mimeType: 'application/json',
          text: JSON.stringify(classes, null, 2),
        },
      ],
    };
  }

  const classMatch = uri.match(/^eso:\/\/classes\/([^\/]+)$/);
  if (classMatch) {
    const [, classId] = classMatch;
    const classData = await prisma.class.findUnique({
      where: { id: classId },
    });

    if (!classData) {
      throw new Error(`Class not found: ${classId}`);
    }

    return {
      contents: [
        {
          uri,
          mimeType: 'application/json',
          text: JSON.stringify(classData, null, 2),
        },
      ],
    };
  }

  // Handle race resources
  if (uri === 'eso://races/all') {
    const races = await prisma.race.findMany({
      include: {
        passives: {
          orderBy: [
            { name: 'asc' },
            { rank: 'asc' },
          ],
        },
      },
      orderBy: { name: 'asc' },
    });

    // Parse the effects JSON strings
    const racesWithParsedEffects = races.map(race => ({
      ...race,
      passives: race.passives.map(passive => ({
        ...passive,
        effects: JSON.parse(passive.effects),
      })),
    }));

    return {
      contents: [
        {
          uri,
          mimeType: 'application/json',
          text: JSON.stringify(racesWithParsedEffects, null, 2),
        },
      ],
    };
  }

  const raceMatch = uri.match(/^eso:\/\/races\/([^\/]+)$/);
  if (raceMatch) {
    const [, raceId] = raceMatch;
    const race = await prisma.race.findUnique({
      where: { id: raceId },
      include: {
        passives: {
          orderBy: [
            { name: 'asc' },
            { rank: 'asc' },
          ],
        },
      },
    });

    if (!race) {
      throw new Error(`Race not found: ${raceId}`);
    }

    // Parse the effects JSON strings
    const raceWithParsedEffects = {
      ...race,
      passives: race.passives.map(passive => ({
        ...passive,
        effects: JSON.parse(passive.effects),
      })),
    };

    return {
      contents: [
        {
          uri,
          mimeType: 'application/json',
          text: JSON.stringify(raceWithParsedEffects, null, 2),
        },
      ],
    };
  }

  // Handle skill resources
  const skillMatch = uri.match(/^eso:\/\/skills\/([^\/]+)\/([^\/]+)$/);
  if (skillMatch) {
    const [, category, skillLineId] = skillMatch;

    const skills = await prisma.skill.findMany({
      where: {
        skillLineId,
        category,
      },
      include: {
        effects: true,
        morphs: true,
        scaling: true,
        requirements: true,
      },
    });

    return {
      contents: [
        {
          uri,
          mimeType: 'application/json',
          text: JSON.stringify(skills, null, 2),
        },
      ],
    };
  }

  // Handle set resources
  if (uri === 'eso://sets/all') {
    const sets = await prisma.set.findMany({
      include: {
        bonuses: {
          orderBy: { pieces: 'asc' },
        },
      },
      orderBy: { name: 'asc' },
    });

    return {
      contents: [
        {
          uri,
          mimeType: 'application/json',
          text: JSON.stringify(sets, null, 2),
        },
      ],
    };
  }

  const setMatch = uri.match(/^eso:\/\/sets\/([^\/]+)$/);
  if (setMatch) {
    const [, setId] = setMatch;
    const set = await prisma.set.findUnique({
      where: { id: setId },
      include: {
        bonuses: {
          orderBy: { pieces: 'asc' },
        },
      },
    });

    if (!set) {
      throw new Error(`Set not found: ${setId}`);
    }

    return {
      contents: [
        {
          uri,
          mimeType: 'application/json',
          text: JSON.stringify(set, null, 2),
        },
      ],
    };
  }

  // Handle Buffs resources
  if (uri === 'eso://buffs/all') {
    const buffs = await prisma.buff.findMany();
    const buffsWithParsedSources = buffs.map((buff) => ({
      ...buff,
      sources: JSON.parse(buff.sources),
    }));

    return {
      contents: [
        {
          uri,
          mimeType: 'application/json',
          text: JSON.stringify(buffsWithParsedSources, null, 2),
        },
      ],
    };
  }

  const buffMatch = uri.match(/^eso:\/\/buffs\/([^\/]+)$/);
  if (buffMatch) {
    const [, buffId] = buffMatch;
    const buff = await prisma.buff.findUnique({
      where: { id: buffId },
    });

    if (!buff) {
      throw new Error(`Buff not found: ${buffId}`);
    }

    const buffWithParsedSources = {
      ...buff,
      sources: JSON.parse(buff.sources),
    };

    return {
      contents: [
        {
          uri,
          mimeType: 'application/json',
          text: JSON.stringify(buffWithParsedSources, null, 2),
        },
      ],
    };
  }

  // Handle Debuffs resources
  if (uri === 'eso://debuffs/all') {
    const debuffs = await prisma.debuff.findMany();
    const debuffsWithParsedSources = debuffs.map((debuff) => ({
      ...debuff,
      sources: JSON.parse(debuff.sources),
    }));

    return {
      contents: [
        {
          uri,
          mimeType: 'application/json',
          text: JSON.stringify(debuffsWithParsedSources, null, 2),
        },
      ],
    };
  }

  const debuffMatch = uri.match(/^eso:\/\/debuffs\/([^\/]+)$/);
  if (debuffMatch) {
    const [, debuffId] = debuffMatch;
    const debuff = await prisma.debuff.findUnique({
      where: { id: debuffId },
    });

    if (!debuff) {
      throw new Error(`Debuff not found: ${debuffId}`);
    }

    const debuffWithParsedSources = {
      ...debuff,
      sources: JSON.parse(debuff.sources),
    };

    return {
      contents: [
        {
          uri,
          mimeType: 'application/json',
          text: JSON.stringify(debuffWithParsedSources, null, 2),
        },
      ],
    };
  }

  // Handle Caps resources
  if (uri === 'eso://caps/all') {
    const caps = await prisma.cap.findMany({
      include: {
        affectedByStats: true,
      },
    });

    return {
      contents: [
        {
          uri,
          mimeType: 'application/json',
          text: JSON.stringify(caps, null, 2),
        },
      ],
    };
  }

  const capMatch = uri.match(/^eso:\/\/caps\/([^\/]+)$/);
  if (capMatch) {
    const [, capId] = capMatch;
    const cap = await prisma.cap.findUnique({
      where: { id: capId },
      include: {
        affectedByStats: true,
      },
    });

    if (!cap) {
      throw new Error(`Cap not found: ${capId}`);
    }

    return {
      contents: [
        {
          uri,
          mimeType: 'application/json',
          text: JSON.stringify(cap, null, 2),
        },
      ],
    };
  }

  throw new Error(`Invalid resource URI: ${uri}`);
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('ESO MCP Server running on stdio');
}

main().catch((error) => {
  console.error('Fatal error in main():', error);
  process.exit(1);
});
