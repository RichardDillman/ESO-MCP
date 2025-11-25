import { z } from 'zod';

// Common effect schema
export const EffectSchema = z.object({
  type: z.string(),
  description: z.string(),
  value: z.union([z.number(), z.string()]).optional(),
  duration: z.number().optional(),
  target: z.enum(['self', 'enemy', 'ally', 'area']).optional(),
});

export type Effect = z.infer<typeof EffectSchema>;

// Resource types
export const ResourceType = z.enum(['magicka', 'stamina', 'health', 'ultimate']);
export type ResourceType = z.infer<typeof ResourceType>;

// Metadata schema for tracking updates
export const MetadataSchema = z.object({
  source: z.string().url(),
  lastUpdated: z.string().datetime(),
  patch: z.string().optional(),
});

export type Metadata = z.infer<typeof MetadataSchema>;
