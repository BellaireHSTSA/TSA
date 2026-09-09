import { build as viteBuild } from "vite";
import { cp, mkdir, readFile, rm, writeFile } from "fs/promises";
import path from "path";

const dataFiles = [
  "events.json", "champions.json", "officers.json", "faqs.json", "resources.json", "settings.json",
];

async function readSourceData(file: string) {
  const contents = await readFile(path.resolve("data", file), "utf8");
  return JSON.parse(contents);
}

function publicSettings(settings: Record<string, string>) {
  const { admin_password: _adminPassword, ...safe } = settings;
  return safe;
}

async function syncStaticData() {
  const clientDataDir = path.resolve("client/src/data");
  const publicDataDir = path.resolve("client/public/data");
  await mkdir(clientDataDir, { recursive: true });
  await mkdir(publicDataDir, { recursive: true });

  for (const file of dataFiles) {
    const data = await readSourceData(file);
    const output = file === "settings.json" ? publicSettings(data) : data;
    const contents = JSON.stringify(output, null, 2) + "\n";
    await writeFile(path.join(clientDataDir, file), contents, "utf8");
    await writeFile(path.join(publicDataDir, file), contents, "utf8");
  }
}

async function syncBuiltStaticData() {
  const distDataDir = path.resolve("dist/public/data");
  await mkdir(distDataDir, { recursive: true });
  for (const file of dataFiles) {
    const data = await readSourceData(file);
    const output = file === "settings.json" ? publicSettings(data) : data;
    await writeFile(path.join(distDataDir, file), JSON.stringify(output, null, 2) + "\n", "utf8");
  }
}

async function syncStaticMedia() {
  const sourceAssets = path.resolve("attached_assets");
  const outputMedia = path.resolve("dist/public/media");
  await mkdir(outputMedia, { recursive: true });
  const referenced = new Set<string>();

  for (const file of dataFiles) {
    const data = await readSourceData(file);
    const scan = (value: unknown) => {
      if (typeof value === "string" && value.startsWith("attached_assets/")) {
        referenced.add(value.slice("attached_assets/".length));
      } else if (Array.isArray(value)) {
        value.forEach(scan);
      } else if (value && typeof value === "object") {
        Object.values(value as Record<string, unknown>).forEach(scan);
      }
    };
    scan(data);
  }

  for (const relative of referenced) {
    const source = path.join(sourceAssets, relative);
    const destination = path.join(outputMedia, relative);
    await mkdir(path.dirname(destination), { recursive: true });
    await cp(source, destination);
  }
  console.log(`copied ${referenced.size} referenced media file(s)`);
}

async function buildAll() {
  await rm("dist", { recursive: true, force: true });

  console.log("syncing JSON data...");
  await syncStaticData();

  console.log("building client...");
  await viteBuild();

  // The client is fully static. The server is still built for the Admin API.
  await syncBuiltStaticData();
  await syncStaticMedia();

}

buildAll().catch((err) => {
  console.error(err);
  process.exit(1);
});
