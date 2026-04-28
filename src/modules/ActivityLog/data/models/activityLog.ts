import * as z from "zod";

export const ActivityLogActorSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string(),
});

export const UserActivityLogEntrySchema = z.object({
  id: z.number(),
  action: z.string(),
  subject_type: z.string().nullable(),
  subject_id: z.number().nullable(),
  summary: z.string(),
  meta: z.record(z.string(), z.unknown()).nullable().optional(),
  ip_address: z.string().nullable().optional(),
  user_agent: z.string().nullable().optional(),
  occurred_at: z.string().nullable(),
  created_at: z.string().nullable().optional(),
  actor: ActivityLogActorSchema.nullable().optional(),
});

export type UserActivityLogEntry = z.infer<typeof UserActivityLogEntrySchema>;
