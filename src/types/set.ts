import { z } from 'zod';
import { MetadataSchema } from './common.js';

// Set type enum
export const SetType = z.enum([
  'craftable',
  'overland',
  'dungeon',
  'trial',
  'arena',
  'mythic',
  'monster',
  'special',
]);
export type SetType = z.infer<typeof SetType>;

// Slot type
export const SlotType = z.enum(['light', 'medium', 'heavy', 'jewelry', 'weapon']);
export type SlotType = z.infer<typeof SlotType>;

// Effect type
export const EffectType = z.enum(['proc', 'passive', 'toggle']);
export type EffectType = z.infer<typeof EffectType>;

// Bind type
export const BindType = z.enum(['on pickup', 'on equip']);
export type BindType = z.infer<typeof BindType>;

// Set bonus schema
export const SetBonusSchema = z.object({
  pieces: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5)]),
  stats: z.record(z.string(), z.number()).optional(),
  effect: z.string().optional(),
  effectType: EffectType.optional(),
  cooldown: z.number().optional(),
});

export type SetBonus = z.infer<typeof SetBonusSchema>;

// Main Set schema
export const SetSchema = z.object({
  name: z.string(),
  id: z.string(),
  type: SetType,

  // Availability
  slots: z.array(SlotType),
  weaponTypes: z.array(z.string()).optional(),

  // Bonuses
  bonuses: z.array(SetBonusSchema),

  // Location & Acquisition
  location: z.string().optional(),
  dropSource: z.array(z.string()).optional(),
  craftingSites: z.array(z.string()).optional(),
  dlcRequired: z.string().optional(),

  // Trading
  tradeable: z.boolean(),
  bindType: BindType.optional(),

  // Metadata
  description: z.string().optional(),
}).merge(MetadataSchema);

export type Set = z.infer<typeof SetSchema>;
