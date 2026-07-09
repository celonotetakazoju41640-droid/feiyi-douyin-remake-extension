import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const manifest = JSON.parse(fs.readFileSync(new URL("../manifest.json", import.meta.url), "utf8"));
const workspaceHtml = fs.readFileSync(new URL("../src/workspace.html", import.meta.url), "utf8");

test("manifest declares MV3 background service worker and required local permissions", () => {
  assert.equal(manifest.background?.service_worker, "src/background.js");
  assert.equal(manifest.background?.type, "module");
  assert.ok(manifest.permissions.includes("storage"));
  assert.ok(manifest.host_permissions.includes("http://127.0.0.1:4328/*"));
  assert.ok(manifest.host_permissions.includes("https://vip.gptsdd.com/*"));
});

test("workspace shell no longer exposes disconnected draft controls", () => {
  assert.doesNotMatch(workspaceHtml, /id="referenceReanalysisButton"/);
  assert.doesNotMatch(workspaceHtml, /id="videoLink"/);
  assert.doesNotMatch(workspaceHtml, /id="aspectRatio"/);
  assert.doesNotMatch(workspaceHtml, /id="copyLanguage"/);
});

test("workspace shell exposes a simplified consumer flow", () => {
  assert.match(workspaceHtml, /id="modelImageFile"/);
  assert.match(workspaceHtml, /上传素材，生成可投放视频提示词/);
  assert.match(workspaceHtml, /可选参考/);
  assert.match(workspaceHtml, /生成条数/);
  assert.match(workspaceHtml, /一键提交去跑视频/);
  assert.match(workspaceHtml, /官方高级后台/);
  assert.match(workspaceHtml, /系统会按平台自动切换中英文提示词/);
});
