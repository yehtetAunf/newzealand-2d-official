import assert from "node:assert/strict";
import worker from "../index.js";

const ctx = { waitUntil() {} };

async function request(path, env = {}) {
  return worker.fetch(new Request(`https://example.test${path}`), env, ctx);
}

const health = await request("/health");
assert.equal(health.status, 200);
const healthJson = await health.json();
assert.equal(healthJson.ok, true);
assert.equal(healthJson.service, "New Zealand 2D Live Bot");

const privacy = await request("/privacy");
assert.equal(privacy.status, 200);
assert.match(await privacy.text(), /Privacy Policy/i);

const image = await request("/welcome-image");
assert.equal(image.status, 200);
assert.equal(image.headers.get("content-type"), "image/jpeg");
assert.ok((await image.arrayBuffer()).byteLength > 10_000);

const missingSecrets = await request("/");
assert.equal(missingSecrets.status, 500);

console.log("✅ Smoke tests passed");
