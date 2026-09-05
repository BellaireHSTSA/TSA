import fs from "fs/promises";
import path from "path";
import {
  type Officer, type Event, type Champion, type Faq, type Resource,
  type InsertOfficer, type InsertEvent, type InsertChampion, type InsertFaq, type InsertResource,
} from "@shared/schema";

const DATA_DIR = path.resolve(process.cwd(), "data");

type JsonData = Record<string, unknown> | unknown[];

async function ensureDataDir() {
  await fs.mkdir(DATA_DIR, { recursive: true });
}

async function readJson<T>(file: string, fallback: T): Promise<T> {
  await ensureDataDir();
  try {
    const raw = await fs.readFile(path.join(DATA_DIR, file), "utf8");
    return JSON.parse(raw) as T;
  } catch (error: any) {
    if (error?.code !== "ENOENT") throw error;
    await writeJson(file, fallback);
    return fallback;
  }
}

async function writeJson(file: string, data: JsonData) {
  await ensureDataDir();
  const target = path.join(DATA_DIR, file);
  const temp = `${target}.tmp`;
  await fs.writeFile(temp, JSON.stringify(data, null, 2) + "\n", "utf8");
  await fs.rename(temp, target);
}

// Writes are chained so two admin requests cannot overwrite each other.
let writeQueue = Promise.resolve();
function updateJson<T>(file: string, fallback: T, updater: (data: T) => T): Promise<T> {
  const job = writeQueue.then(async () => {
    const current = await readJson(file, fallback);
    const updated = updater(current);
    await writeJson(file, updated as JsonData);
    return updated;
  });
  writeQueue = job.then(() => undefined, () => undefined);
  return job;
}

function nextId(items: { id: number }[]) {
  return items.reduce((max, item) => Math.max(max, item.id), 0) + 1;
}

export interface IStorage {
  getOfficers(): Promise<Officer[]>;
  createOfficer(officer: InsertOfficer): Promise<Officer>;
  updateOfficer(id: number, data: Partial<InsertOfficer>): Promise<Officer>;
  deleteOfficer(id: number): Promise<void>;

  getEvents(): Promise<Event[]>;
  createEvent(event: InsertEvent): Promise<Event>;
  updateEvent(id: number, data: Partial<InsertEvent>): Promise<Event>;
  deleteEvent(id: number): Promise<void>;

  getChampions(): Promise<Champion[]>;
  createChampion(champion: InsertChampion): Promise<Champion>;
  updateChampion(id: number, data: Partial<InsertChampion>): Promise<Champion>;
  deleteChampion(id: number): Promise<void>;

  getSettings(): Promise<Record<string, string>>;
  setSetting(key: string, value: string): Promise<void>;

  getFaqs(): Promise<Faq[]>;
  createFaq(faq: InsertFaq): Promise<Faq>;
  updateFaq(id: number, data: Partial<InsertFaq>): Promise<Faq>;
  deleteFaq(id: number): Promise<void>;

  getResources(): Promise<Resource[]>;
  createResource(resource: InsertResource): Promise<Resource>;
  updateResource(id: number, data: Partial<InsertResource>): Promise<Resource>;
  deleteResource(id: number): Promise<void>;
}

const emptyOfficers: Officer[] = [];
const emptyEvents: Event[] = [];
const emptyChampions: Champion[] = [];
const emptyFaqs: Faq[] = [];
const emptyResources: Resource[] = [];
const emptySettings: Record<string, string> = {};

export class JsonStorage implements IStorage {
  async getOfficers() {
    const rows = await readJson<Officer[]>("officers.json", emptyOfficers);
    return [...rows].sort((a, b) => a.position - b.position || a.id - b.id);
  }
  async createOfficer(data: InsertOfficer) {
    return updateJson<Officer[]>("officers.json", emptyOfficers, rows => {
      const item: Officer = { id: nextId(rows), ...data, position: data.position ?? rows.length,
        description: data.description ?? null, imageUrl: data.imageUrl ?? null, email: data.email ?? null };
      rows.push(item);
      return rows;
    }).then(rows => rows[rows.length - 1]);
  }
  async updateOfficer(id: number, data: Partial<InsertOfficer>) {
    return updateJson<Officer[]>("officers.json", emptyOfficers, rows => {
      const i = rows.findIndex(r => r.id === id);
      if (i < 0) throw new Error("Officer not found");
      rows[i] = { ...rows[i], ...data };
      return rows;
    }).then(rows => rows.find(r => r.id === id)!);
  }
  async deleteOfficer(id: number) {
    await updateJson<Officer[]>("officers.json", emptyOfficers, rows => rows.filter(r => r.id !== id));
  }

  async getEvents() {
    const rows = await readJson<Event[]>("events.json", emptyEvents);
    return [...rows].sort((a, b) => a.position - b.position || a.id - b.id);
  }
  async createEvent(data: InsertEvent) {
    return updateJson<Event[]>("events.json", emptyEvents, rows => {
      const item: Event = {
        id: nextId(rows), title: data.title, category: data.category ?? "UTE",
        difficulty: data.difficulty ?? "Medium", description: data.description,
        guidelinesUrl: data.guidelinesUrl ?? null, numTeamsMin: data.numTeamsMin ?? null,
        numTeamsMax: data.numTeamsMax ?? null, teamSizeMin: data.teamSizeMin ?? null,
        teamSizeMax: data.teamSizeMax ?? null, position: data.position ?? rows.length
      };
      rows.push(item);
      return rows;
    }).then(rows => rows[rows.length - 1]);
  }
  async updateEvent(id: number, data: Partial<InsertEvent>) {
    return updateJson<Event[]>("events.json", emptyEvents, rows => {
      const i = rows.findIndex(r => r.id === id);
      if (i < 0) throw new Error("Event not found");
      rows[i] = { ...rows[i], ...data };
      return rows;
    }).then(rows => rows.find(r => r.id === id)!);
  }
  async deleteEvent(id: number) {
    await updateJson<Event[]>("events.json", emptyEvents, rows => rows.filter(r => r.id !== id));
  }

  async getChampions() {
    const rows = await readJson<Champion[]>("champions.json", emptyChampions);
    return [...rows].sort((a, b) => a.position - b.position || b.id - a.id);
  }
  async createChampion(data: InsertChampion) {
    return updateJson<Champion[]>("champions.json", emptyChampions, rows => {
      const item: Champion = { id: nextId(rows), ...data, position: data.position ?? rows.length,
        notes: data.notes ?? null, mediaUrl: data.mediaUrl ?? null };
      rows.push(item);
      return rows;
    }).then(rows => rows[rows.length - 1]);
  }
  async updateChampion(id: number, data: Partial<InsertChampion>) {
    return updateJson<Champion[]>("champions.json", emptyChampions, rows => {
      const i = rows.findIndex(r => r.id === id);
      if (i < 0) throw new Error("Champion not found");
      rows[i] = { ...rows[i], ...data };
      return rows;
    }).then(rows => rows.find(r => r.id === id)!);
  }
  async deleteChampion(id: number) {
    await updateJson<Champion[]>("champions.json", emptyChampions, rows => rows.filter(r => r.id !== id));
  }

  async getSettings() {
    return readJson<Record<string, string>>("settings.json", emptySettings);
  }
  async setSetting(key: string, value: string) {
    await updateJson<Record<string, string>>("settings.json", emptySettings, data => ({ ...data, [key]: value }));
  }

  async getFaqs() {
    const rows = await readJson<Faq[]>("faqs.json", emptyFaqs);
    return [...rows].sort((a, b) => a.position - b.position || a.id - b.id);
  }
  async createFaq(data: InsertFaq) {
    return updateJson<Faq[]>("faqs.json", emptyFaqs, rows => {
      const item: Faq = { id: nextId(rows), question: data.question, answer: data.answer, position: data.position ?? rows.length };
      rows.push(item);
      return rows;
    }).then(rows => rows[rows.length - 1]);
  }
  async updateFaq(id: number, data: Partial<InsertFaq>) {
    return updateJson<Faq[]>("faqs.json", emptyFaqs, rows => {
      const i = rows.findIndex(r => r.id === id);
      if (i < 0) throw new Error("FAQ not found");
      rows[i] = { ...rows[i], ...data };
      return rows;
    }).then(rows => rows.find(r => r.id === id)!);
  }
  async deleteFaq(id: number) {
    await updateJson<Faq[]>("faqs.json", emptyFaqs, rows => rows.filter(r => r.id !== id));
  }

  async getResources() {
    const rows = await readJson<Resource[]>("resources.json", emptyResources);
    return [...rows].sort((a, b) => a.position - b.position || a.id - b.id);
  }
  async createResource(data: InsertResource) {
    return updateJson<Resource[]>("resources.json", emptyResources, rows => {
      const item: Resource = { id: nextId(rows), title: data.title, description: data.description ?? null,
        url: data.url, category: data.category ?? null, position: data.position ?? rows.length };
      rows.push(item);
      return rows;
    }).then(rows => rows[rows.length - 1]);
  }
  async updateResource(id: number, data: Partial<InsertResource>) {
    return updateJson<Resource[]>("resources.json", emptyResources, rows => {
      const i = rows.findIndex(r => r.id === id);
      if (i < 0) throw new Error("Resource not found");
      rows[i] = { ...rows[i], ...data };
      return rows;
    }).then(rows => rows.find(r => r.id === id)!);
  }
  async deleteResource(id: number) {
    await updateJson<Resource[]>("resources.json", emptyResources, rows => rows.filter(r => r.id !== id));
  }
}

export const storage = new JsonStorage();
