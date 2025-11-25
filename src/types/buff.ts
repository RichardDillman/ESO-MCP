import { z } from 'zod';
import { MetadataSchema } from './common.js';

// Buff/Debuff type
export const BuffType = z.enum(['major', 'minor', 'unique']);
export type BuffType = z.infer<typeof BuffType>;

// Buff schema
export const BuffSchema = z.object({
  name: z.string(),
  type: BuffType,
  effect: z.string(),
  value: z.number().optional(),
  duration: z.union([z.number(), z.literal('permanent')]).optional(),
});

export type Buff = z.infer<typeof BuffSchema>;

// Debuff schema (same structure as Buff)
export const DebuffSchema = BuffSchema;
export type Debuff = z.infer<typeof DebuffSchema>;

// Target Dummy schema
export const TargetDummySchema = z.object({
  name: z.string(),
  id: z.string(),
  health: z.number(),
  buffsProvided: z.array(BuffSchema),
  debuffsProvided: z.array(DebuffSchema),
  description: z.string(),
  usage: z.string(),
}).merge(MetadataSchema);

export type TargetDummy = z.infer<typeof TargetDummySchema>;
