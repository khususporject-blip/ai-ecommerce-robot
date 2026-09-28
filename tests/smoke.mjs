import assert from "node:assert/strict";
import fs from "node:fs/promises";

const server = await fs.readFile(new URL("../server.mjs", import.meta.url), "utf8");
const pkg = JSON.parse(await fs.readFile(new URL("../package.json", import.meta.url), "utf8"));

assert.match(server, /v2\/auth\/authorize\//);
assert.match(server, /v2\/oauth\/token\//);
assert.match(server, /grant_type: "authorization_code"/);
assert.match(server, /grant_type: "refresh_token"/);
assert.match(server, /\/api\/tiktok\/creator-info/);
assert.match(server, /\/api\/tiktok\/publish-url/);
assert.match(server, /PULL_FROM_URL/);
assert.match(server, /video.publish/);
assert.match(server, /timingSafeEqual/);
assert.match(server, /HttpOnly/);
assert.match(server, /SameSite=Lax/);
assert.match(server, /escapeHtml/);
assert.doesNotMatch(server, /TIKTOK_CLIENT_SECRET\s*=\s*["'][^"']+["']/);
assert.equal(pkg.scripts.start, "node server.mjs");

console.log("Robot AI smoke checks passed.");
