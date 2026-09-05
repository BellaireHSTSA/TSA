import { z } from "zod";

export type Officer = {
  id: number;
  name: string;
  role: string;
  description: string | null;
  imageUrl: string | null;
  email: string | null;
  position: number;
};

export type Event = {
  id: number;
  title: string;
  category: string;
  difficulty: "Demanding" | "Hard" | "Medium";
  description: string;
  guidelinesUrl: string | null;
  numTeamsMin: number | null;
  numTeamsMax: number | null;
  teamSizeMin: number | null;
  teamSizeMax: number | null;
  position: number;
};

export type Champion = {
  id: number;
  memberName: string;
  eventTitle: string;
  placement: string;
  level: string;
  year: string;
  notes: string | null;
  mediaUrl: string | null;
  position: number;
};

export type Faq = {
  id: number;
  question: string;
  answer: string;
  position: number;
};

export type Resource = {
  id: number;
  title: string;
  description: string | null;
  url: string;
  category: string | null;
  position: number;
};

export const insertOfficerSchema = z.object({
  name: z.string().min(1),
  role: z.string().min(1),
  description: z.string().nullable().optional(),
  imageUrl: z.string().nullable().optional(),
  email: z.string().nullable().optional(),
  position: z.number().int().optional().default(0),
});
export type InsertOfficer = z.infer<typeof insertOfficerSchema>;

export const insertEventSchema = z.object({
  title: z.string().min(1),
  category: z.string().min(1).default("UTE"),
  difficulty: z.enum(["Demanding", "Hard", "Medium"]).default("Medium"),
  description: z.string().min(1),
  guidelinesUrl: z.string().nullable().optional(),
  numTeamsMin: z.number().int().nullable().optional(),
  numTeamsMax: z.number().int().nullable().optional(),
  teamSizeMin: z.number().int().nullable().optional(),
  teamSizeMax: z.number().int().nullable().optional(),
  position: z.number().int().optional().default(0),
});
export type InsertEvent = z.infer<typeof insertEventSchema>;

export const insertChampionSchema = z.object({
  memberName: z.string().min(1),
  eventTitle: z.string().min(1),
  placement: z.string().min(1),
  level: z.string().min(1),
  year: z.string().min(1),
  notes: z.string().nullable().optional(),
  mediaUrl: z.string().nullable().optional(),
  position: z.number().int().optional().default(0),
});
export type InsertChampion = z.infer<typeof insertChampionSchema>;

export const insertResourceSchema = z.object({
  title: z.string().min(1),
  description: z.string().nullable().optional(),
  url: z.string().min(1),
  category: z.string().nullable().optional(),
  position: z.number().int().optional().default(0),
});
export type InsertResource = z.infer<typeof insertResourceSchema>;

export const insertFaqSchema = z.object({
  question: z.string().min(1),
  answer: z.string().min(1),
  position: z.number().int().optional().default(0),
});
export type InsertFaq = z.infer<typeof insertFaqSchema>;
