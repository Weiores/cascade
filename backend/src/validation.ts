import type { Response } from "express";
import { z } from "zod";

const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;
const dateTimeRegex = /^\d{4}-\d{2}-\d{2}T([01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/;

const stringArray = z.array(z.string().min(1));

export const dateSchema = z.string().regex(dateRegex, "Expected YYYY-MM-DD");
export const timeSchema = z.string().regex(timeRegex, "Expected HH:mm");
export const dateTimeSchema = z.string().regex(dateTimeRegex, "Expected YYYY-MM-DDTHH:mm[:ss]");
export const idParamSchema = z.object({ id: z.coerce.number().int().positive() }).strict();

export const requestStatusSchema = z.enum(["pending", "scheduled", "deferred", "in_conflict"]);
export const requestTypeSchema = z.enum(["planned", "routine", "manual", "predictive"]);

export const requestsQuerySchema = z.object({
  status: requestStatusSchema.optional(),
}).strict();

export const scheduleQuerySchema = z.object({
  date: dateSchema.optional(),
}).strict();

export const optimiseBodySchema = z.object({
  date: dateSchema.optional(),
}).strict();

export const newRequestSchema = z.object({
  title: z.string().min(1),
  type: requestTypeSchema,
  location: z.string().min(1),
  duration_minutes: z.number().int().positive(),
  deadline: dateTimeSchema,
  priority_score: z.number().int().min(0).max(100),
  required_skills: stringArray,
  required_equipment: stringArray,
  manpower_count: z.number().int().positive(),
  work_compatibility_tags: stringArray,
}).strict();

export const whatIfSchema = z.object({
  add_crews: z.number().int().min(0).default(0),
  add_equipment: stringArray.default([]),
  extra_window_minutes: z.number().int().min(0).max(240).default(0),
  date: dateSchema.default("2026-09-01"),
}).strict();

export const crewSchema = z.object({
  name: z.string().min(1),
  skills: stringArray,
  available_start: timeSchema,
  available_end: timeSchema,
  max_concurrent_jobs: z.number().int().positive().max(10),
}).strict().refine((crew) => crew.available_start < crew.available_end, {
  path: ["available_end"],
  message: "available_end must be after available_start",
});

export const crewPatchSchema = z.object({
  name: z.string().min(1).optional(),
  skills: stringArray.optional(),
  available_start: timeSchema.optional(),
  available_end: timeSchema.optional(),
  max_concurrent_jobs: z.number().int().positive().max(10).optional(),
}).strict();

export const equipmentSchema = z.object({
  name: z.string().min(1),
  type: z.string().min(1),
  available: z.boolean(),
}).strict();

export const equipmentPatchSchema = z.object({
  name: z.string().min(1).optional(),
  type: z.string().min(1).optional(),
  available: z.boolean().optional(),
}).strict();

export const sectorSchema = z.object({
  name: z.string().min(1),
  exclusion_zone: stringArray.default([]),
}).strict();

export const sectorPatchSchema = z.object({
  name: z.string().min(1).optional(),
  exclusion_zone: stringArray.optional(),
}).strict();

export const conflictSuggestionSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("change_time"), description: z.string().min(1), new_start: dateTimeSchema, new_end: dateTimeSchema }).strict(),
  z.object({ type: z.literal("change_crew"), description: z.string().min(1), new_crew_id: z.number().int().positive() }).strict(),
  z.object({ type: z.literal("bundle"), description: z.string().min(1), bundle_with_id: z.number().int().positive() }).strict(),
  z.object({ type: z.literal("defer"), description: z.string().min(1), defer_to_date: dateSchema }).strict(),
  z.object({ type: z.literal("split"), description: z.string().min(1) }).strict(),
]);

export function parseInput<T>(schema: z.ZodType<T>, value: unknown, res: Response): T | null {
  const parsed = schema.safeParse(value);
  if (parsed.success) return parsed.data;
  res.status(400).json({
    error: "Invalid request",
    issues: parsed.error.issues.map((issue) => ({ path: issue.path.join("."), message: issue.message })),
  });
  return null;
}
