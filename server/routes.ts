import type { Express } from "express";
import type { Server } from "http";
import path from "path";
import multer from "multer";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { insertChampionSchema, insertOfficerSchema, insertEventSchema, insertFaqSchema, insertResourceSchema } from "@shared/schema";

const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, "attached_assets"),
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname);
      const base = path.basename(file.originalname, ext).replace(/\s+/g, "-");
      cb(null, `${base}-${Date.now()}${ext}`);
    },
  }),
  limits: { fileSize: 20 * 1024 * 1024 },
});

// Helper to check admin password from header
async function requireAdmin(req: any, res: any): Promise<string | null> {
  const pw = req.headers["x-admin-password"] as string;
  if (!pw) { res.status(401).json({ message: "Unauthorized" }); return null; }
  const all = await storage.getSettings();
  if (pw !== all.admin_password) { res.status(401).json({ message: "Unauthorized" }); return null; }
  return pw;
}

export async function registerRoutes(httpServer: Server, app: Express): Promise<Server> {

  // ── Auth ──────────────────────────────────────────────────────────────────
  app.post("/api/admin/verify", async (req, res) => {
    const { password } = req.body;
    const all = await storage.getSettings();
    res.json({ valid: password === all.admin_password });
  });

  app.post("/api/admin/change-password", async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    if (!newPassword || newPassword.length < 4) return res.status(400).json({ message: "Password too short" });
    const all = await storage.getSettings();
    if (currentPassword !== all.admin_password) return res.status(401).json({ message: "Incorrect current password" });
    await storage.setSetting("admin_password", newPassword);
    res.json({ success: true });
  });

  // ── Settings ──────────────────────────────────────────────────────────────
  app.get("/api/settings", async (_req, res) => {
    const all = await storage.getSettings();
    const { admin_password: _pw, ...safe } = all;
    res.json(safe);
  });

  app.put("/api/settings/:key", async (req, res) => {
    if (!(await requireAdmin(req, res))) return;
    await storage.setSetting(req.params.key, req.body.value ?? "");
    res.json({ success: true });
  });

  // ── File upload ───────────────────────────────────────────────────────────
  app.post("/api/upload", upload.single("file"), (req, res) => {
    if (!req.file) return res.status(400).json({ message: "No file provided" });
    res.json({ path: `attached_assets/${req.file.filename}` });
  });

  // ── Officers ──────────────────────────────────────────────────────────────
  app.get(api.officers.list.path, async (_req, res) => {
    res.json(await storage.getOfficers());
  });
  app.post("/api/officers", async (req, res) => {
    const parsed = insertOfficerSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Invalid data" });
    res.status(201).json(await storage.createOfficer(parsed.data));
  });
  app.patch("/api/officers/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: "Invalid id" });
    const parsed = insertOfficerSchema.partial().safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Invalid data" });
    res.json(await storage.updateOfficer(id, parsed.data));
  });
  app.delete("/api/officers/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: "Invalid id" });
    await storage.deleteOfficer(id);
    res.json({ success: true });
  });

  // ── Events ────────────────────────────────────────────────────────────────
  app.get(api.events.list.path, async (_req, res) => {
    res.json(await storage.getEvents());
  });
  app.post("/api/events", async (req, res) => {
    const parsed = insertEventSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Invalid data" });
    res.status(201).json(await storage.createEvent(parsed.data));
  });
  app.patch("/api/events/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: "Invalid id" });
    const parsed = insertEventSchema.partial().safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Invalid data" });
    res.json(await storage.updateEvent(id, parsed.data));
  });
  app.delete("/api/events/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: "Invalid id" });
    await storage.deleteEvent(id);
    res.json({ success: true });
  });

  // ── Champions ─────────────────────────────────────────────────────────────
  app.get(api.champions.list.path, async (_req, res) => {
    res.json(await storage.getChampions());
  });
  app.post(api.champions.create.path, async (req, res) => {
    const parsed = insertChampionSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Invalid data" });
    res.status(201).json(await storage.createChampion(parsed.data));
  });
  app.patch("/api/champions/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: "Invalid id" });
    const parsed = insertChampionSchema.partial().safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Invalid data" });
    res.json(await storage.updateChampion(id, parsed.data));
  });
  app.delete("/api/champions/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: "Invalid id" });
    await storage.deleteChampion(id);
    res.json({ success: true });
  });

  // ── FAQs ──────────────────────────────────────────────────────────────────
  app.get("/api/faqs", async (_req, res) => {
    res.json(await storage.getFaqs());
  });
  app.post("/api/faqs", async (req, res) => {
    const parsed = insertFaqSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Invalid data" });
    res.status(201).json(await storage.createFaq(parsed.data));
  });
  app.patch("/api/faqs/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: "Invalid id" });
    const parsed = insertFaqSchema.partial().safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Invalid data" });
    res.json(await storage.updateFaq(id, parsed.data));
  });
  app.delete("/api/faqs/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: "Invalid id" });
    await storage.deleteFaq(id);
    res.json({ success: true });
  });

  // ── Resources ─────────────────────────────────────────────────────────────
  app.get("/api/resources", async (_req, res) => {
    res.json(await storage.getResources());
  });
  app.post("/api/resources", async (req, res) => {
    const parsed = insertResourceSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Invalid data" });
    res.status(201).json(await storage.createResource(parsed.data));
  });
  app.patch("/api/resources/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: "Invalid id" });
    const parsed = insertResourceSchema.partial().safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Invalid data" });
    res.json(await storage.updateResource(id, parsed.data));
  });
  app.delete("/api/resources/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: "Invalid id" });
    await storage.deleteResource(id);
    res.json({ success: true });
  });

  // ── Seed ──────────────────────────────────────────────────────────────────
  (async () => {
    try {
      const existingOfficers = await storage.getOfficers();
      if (existingOfficers.length === 0) {
        for (const o of [
          { name: "Liba Sigel", role: "President", description: "Leads the chapter with vision and dedication, setting goals and guiding the team toward success." },
          { name: "Bella Shabelansky", role: "Vice President", description: "Supports the president and coordinates between officers to keep the chapter running smoothly." },
          { name: "Emil Mammadov", role: "Secretary", description: "Keeps detailed records of meetings, manages communications, and ensures nothing falls through the cracks." },
          { name: "Dev Thosani", role: "Sergeant at Arms", description: "Maintains order at meetings and events, and helps enforce chapter rules and procedures." },
          { name: "Avi Sigel", role: "Treasurer", description: "Manages the chapter's finances, tracks dues and expenses, and ensures responsible budgeting." },
          { name: "Ashwin Perumal", role: "Reporter", description: "Documents chapter activities, writes updates, and promotes TSA events to the school community." },
        ]) await storage.createOfficer(o);
      }

      const existingSettings = await storage.getSettings();
      if (!existingSettings.admin_password) {
        const defaults: Record<string, string> = {
          admin_password: "TSA2025",
          members_status_title: "Registration is Currently Closed",
          members_status_desc: "We are not accepting new members at this time for the 2026-2027 season. However, you can still access public resources and prepare for next year.",
          members_registration_open: "false",
          members_competitions_text: "Compete in over 30 STEM events ranging from coding and engineering to photography and debate at regional, state, and national levels.",
          members_leadership_text: "Develop soft skills through leadership workshops, officer positions, and team management experiences that colleges value.",
          members_resources_text: "Access exclusive study materials, past projects, and mentorship from alumni to help you succeed in your chosen events.",
          meetings_general_desc: "Our general meetings are held bi-weekly to discuss chapter business, upcoming events, and competition preparation. Attendance is highly encouraged for all members.",
          meetings_general_schedule: "Every other Tuesday, second half of lunch",
          meetings_general_location: "Room 2607 (Dr. Pichot's Room)",
          meetings_officer_desc: "Leadership meetings focus on strategic planning, event logistics, and chapter management. Open to elected officers and committee heads.",
          meetings_officer_schedule: "Mondays, 7:30 AM - 8:15 AM",
          meetings_officer_location: "Library Conference Room",
          meetings_agenda: JSON.stringify([
            { date: "Aug 20, 2026", topic: "Interest Meeting", type: "General" },
            { date: "Sep 1, 2026", topic: "Events Meeting", type: "General" },
            { date: "Feb 12, 2027", topic: "Regional Conference", type: "Conference" },
          ]),
        };
        for (const [key, value] of Object.entries(defaults)) {
          await storage.setSetting(key, value);
        }
      }
    } catch (e) {
      console.error("Failed to seed JSON data", e);
    }
  })();

  return httpServer;
}
