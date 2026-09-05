import fs from "fs";
import path from "path";
import { parse } from "csv-parse/sync";

const dataDir = path.resolve(process.cwd(), "data");
fs.mkdirSync(dataDir, { recursive: true });

function importOfficers() {
  const raw = fs.readFileSync("attached_assets/officers_1779302781092.csv", "utf8");
  const rows = parse(raw, { columns: true, skip_empty_lines: true });

  const officers = rows.map((row: any, index: number) => ({
    id: row.id ? Number(row.id) : index + 1,
    name: row.name,
    role: row.role,
    imageUrl: row.image_url || null,
    description: row.description || null,
    email: null,
    position: index,
  }));

  fs.writeFileSync(path.join(dataDir, "officers.json"), JSON.stringify(officers, null, 2) + "\n");
  console.log(`Imported ${officers.length} officers to data/officers.json.`);
}

function importEvents() {
  const raw = fs.readFileSync("attached_assets/events_1779302786286.csv", "utf8");
  const rows = parse(raw, {
    columns: true,
    skip_empty_lines: true,
    relax_column_count: true,
  });

  const events = rows.map((row: any, index: number) => ({
    id: row.id ? Number(row.id) : index + 1,
    title: String(row.title ?? "").trim(),
    description: String(row.description ?? "").trim(),
    category: row.category || "NQE",
    difficulty: "Medium",
    guidelinesUrl: null,
    numTeamsMin: row.num_teams_min ? Number(row.num_teams_min) : null,
    numTeamsMax: row.num_teams_max ? Number(row.num_teams_max) : null,
    teamSizeMin: row.team_size_min ? Number(row.team_size_min) : null,
    teamSizeMax: row.team_size_max ? Number(row.team_size_max) : null,
    position: index,
  }));

  fs.writeFileSync(path.join(dataDir, "events.json"), JSON.stringify(events, null, 2) + "\n");
  console.log(`Imported ${events.length} events to data/events.json.`);
}

importOfficers();
importEvents();
console.log("JSON import complete.");
