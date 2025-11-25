import { z } from 'zod';
import { EffectSchema, MetadataSchema } from './common.js';

// Alliance enum
export const Alliance = z.enum([
  'Aldmeri Dominion',
  'Daggerfall Covenant',
  'Ebonheart Pact',
  'Any',
]);
export type Alliance = z.infer<typeof Alliance>;

// Racial passive schema
export const RacialPassiveSchema = z.object({
  name: z.string(),
  rank: z.number(),
  effects: z.array(EffectSchema),
  description: z.string(),
  unlockLevel: z.number(),
});

export type RacialPassive = z.infer<typeof RacialPassiveSchema>;

// Main Race schema
export const RaceSchema = z.object({
  name: z.string(),
  id: z.string(),
  description: z.string(),
  alliance: Alliance.optional(),
  passives: z.array(RacialPassiveSchema),
  baseStats: z.record(z.string(), z.number()).optional(),
}).merge(MetadataSchema);

export type Race = z.infer<typeof RaceSchema>;
