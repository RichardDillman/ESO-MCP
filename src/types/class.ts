import { z } from 'zod';
import { SkillLineSchema, MetadataSchema } from './index.js';

// Main Class schema
export const ClassSchema = z.object({
  name: z.string(),
  id: z.string(),
  description: z.string(),
  skillLines: z.array(SkillLineSchema),
}).merge(MetadataSchema);

export type Class = z.infer<typeof ClassSchema>;
