import { z } from 'zod';
import { EffectSchema, ResourceType, MetadataSchema } from './common.js';

// Skill type enum
export const SkillType = z.enum(['active', 'passive', 'ultimate']);
export type SkillType = z.infer<typeof SkillType>;

// Skill category enum
export const SkillCategory = z.enum([
  'class',
  'weapon',
  'armor',
  'guild',
  'world',
  'alliance',
  'crafting',
]);
export type SkillCategory = z.infer<typeof SkillCategory>;

// Cost schema
export const CostSchema = z.object({
  resource: ResourceType,
  amount: z.number(),
});

export type Cost = z.infer<typeof CostSchema>;

// Scaling schema
export const ScalingSchema = z.object({
  stat: z.string(),
  coefficient: z.number(),
  maxTargets: z.number().optional(),
});

export type Scaling = z.infer<typeof ScalingSchema>;

// Requirements schema
export const RequirementsSchema = z.object({
  level: z.number().optional(),
  skillLineRank: z.number().optional(),
  prerequisiteSkill: z.string().optional(),
});

export type Requirements = z.infer<typeof RequirementsSchema>;

// Morph schema
export const MorphSchema = z.object({
  name: z.string(),
  id: z.string(),
  description: z.string(),
  changes: z.array(z.string()),
});

export type Morph = z.infer<typeof MorphSchema>;

// Main Skill schema
export const SkillSchema = z.object({
  name: z.string(),
  id: z.string(),
  type: SkillType,
  skillLine: z.string(),
  category: SkillCategory,

  // Active skill properties
  cost: CostSchema.optional(),
  castTime: z.number().optional(),
  channelTime: z.number().optional(),
  duration: z.number().optional(),
  cooldown: z.number().optional(),
  range: z.number().optional(),
  radius: z.number().optional(),
  target: z.string().optional(),

  // Effects
  effects: z.array(EffectSchema),

  // Morphs
  morphs: z.array(MorphSchema).optional(),
  baseSkill: z.string().optional(),

  // Scaling
  scaling: ScalingSchema.optional(),

  // Requirements
  requirements: RequirementsSchema.optional(),

  // Metadata
  description: z.string(),
  unlockDescription: z.string().optional(),
}).merge(MetadataSchema);

export type Skill = z.infer<typeof SkillSchema>;

// Skill line schema
export const SkillLineSchema = z.object({
  name: z.string(),
  id: z.string(),
  category: SkillCategory,
  maxRank: z.number(),
  skills: z.array(SkillSchema),
});

export type SkillLine = z.infer<typeof SkillLineSchema>;
