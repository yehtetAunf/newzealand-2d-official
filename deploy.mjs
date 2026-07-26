import { spawnSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const CONFIG_FILE = resolve(ROOT, "wrangler.jsonc");
const SCHEMA_FILE = resolve(ROOT, "schema.sql");
const DATABASE_NAME = "newzealand-2d-live-bot-db";
const DATABASE_BINDING = "DB";
const NPX = process.platform === "win32" ? "npx.cmd" : "npx";

function fail(message, details = "") {
  console.error(`\n❌ ${message}`);
  if (details) console.error(details.trim());
  process.exit(1);
}

function runWrangler(args, { capture = false } = {}) {
  console.log(`\n$ npx wrangler ${args.join(" ")}`);
  const result = spawnSync(NPX, ["wrangler", ...args], {
    cwd: ROOT,
    env: process.env,
    encoding: "utf8",
    stdio: capture ? ["inherit", "pipe", "pipe"] : "inherit",
  });

  if (result.error) fail("Wrangler ကို စတင်မရပါ။ npm install အရင်လုပ်ပါ။", result.error.message);
  if (capture && result.stderr) process.stderr.write(result.stderr);
  if (result.status !== 0) {
    fail(`Wrangler command မအောင်မြင်ပါ (exit ${result.status ?? "unknown"})`, capture ? result.stdout : "");
  }
  return capture ? String(result.stdout || "") : "";
}

function parseJsonOutput(output) {
  const text = String(output || "").trim();
  const starts = [text.indexOf("["), text.indexOf("{")].filter((index) => index >= 0).sort((a, b) => a - b);
  for (const start of starts) {
    const closing = text[start] === "[" ? "]" : "}";
    const end = text.lastIndexOf(closing);
    if (end <= start) continue;
    try {
      return JSON.parse(text.slice(start, end + 1));
    } catch {
      // Try the next possible JSON start.
    }
  }
  fail("Wrangler JSON output ကို ဖတ်မရပါ။", text);
}

function listDatabases() {
  const parsed = parseJsonOutput(runWrangler(["d1", "list", "--json"], { capture: true }));
  if (Array.isArray(parsed)) return parsed;
  if (Array.isArray(parsed?.result)) return parsed.result;
  if (Array.isArray(parsed?.databases)) return parsed.databases;
  return [];
}

function databaseId(database) {
  return database?.uuid || database?.id || database?.database_id || null;
}

function databaseName(database) {
  return database?.name || database?.database_name || null;
}

function findDatabase() {
  return listDatabases().find((database) => databaseName(database) === DATABASE_NAME) || null;
}

function ensureDatabase() {
  let database = findDatabase();
  if (!database) {
    console.log(`\nℹ️ D1 database '${DATABASE_NAME}' မရှိသေးလို့ အသစ်ဖန်တီးနေပါတယ်…`);
    runWrangler(["d1", "create", DATABASE_NAME]);
    database = findDatabase();
  }

  const id = databaseId(database);
  if (!database || !id) fail(`D1 database '${DATABASE_NAME}' ရဲ့ ID ကို ရှာမတွေ့ပါ။`);
  console.log(`\n✅ D1 database အဆင်ပြေပါပြီ: ${DATABASE_NAME}`);
  return id;
}

function updateWranglerConfig(id) {
  let config;
  try {
    config = JSON.parse(readFileSync(CONFIG_FILE, "utf8"));
  } catch (error) {
    fail("wrangler.jsonc ကို ဖတ်မရပါ။ ဒီဖိုင်မှာ comment မထည့်ဘဲ JSON ပုံစံမှန်ထားပါ။", error.message);
  }

  config.name ||= "newzealand-2d-live-bot";
  config.main ||= "index.js";
  config.d1_databases = [
    {
      binding: DATABASE_BINDING,
      database_name: DATABASE_NAME,
      database_id: id,
    },
  ];
  config.triggers ||= {};
  config.triggers.crons = ["*/2 * * * *"];

  writeFileSync(CONFIG_FILE, `${JSON.stringify(config, null, 2)}\n`);
  console.log("✅ wrangler.jsonc ထဲ D1 database ID ဖြည့်ပြီးပါပြီ။");
}

function main() {
  console.log("\n🚀 NewZealand2DLiveBot deploy စတင်နေပါတယ်…");
  console.log("ℹ️ CLOUDFLARE_API_TOKEN ကို Code ထဲ မထည့်ပါနှင့်။ Codespaces Secret ထဲမှာပဲထားပါ။");

  const id = ensureDatabase();
  updateWranglerConfig(id);

  runWrangler([
    "d1",
    "execute",
    DATABASE_NAME,
    "--remote",
    `--file=${SCHEMA_FILE}`,
    "--yes",
    "--config",
    CONFIG_FILE,
  ]);
  console.log("✅ Remote D1 schema ထည့်ပြီးပါပြီ။");

  runWrangler(["deploy", "--config", CONFIG_FILE]);
  console.log("\n✅ Deploy အောင်မြင်ပါပြီ။ အပေါ်က workers.dev URL ကိုဖွင့်ပြီး /setup-webhook ကို ဆက်လုပ်ပါ။\n");
}

main();
