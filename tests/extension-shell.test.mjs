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
  assert.match(workspaceHtml, /id="productImages"/);
  assert.match(workspaceHtml, /生成/);
  assert.match(workspaceHtml, /历史记录/);
  assert.match(workspaceHtml, /蒸馏管理/);
  assert.match(workspaceHtml, /蒸馏模型/);
  assert.match(workspaceHtml, /生成提示词/);
  assert.match(workspaceHtml, /data-view-nav="generate"/);
  assert.match(workspaceHtml, /data-view-panel="history"/);
  assert.match(workspaceHtml, /id="openOnboardingButton"/);
  assert.match(workspaceHtml, /开始前先看/);
  assert.match(workspaceHtml, /id="acknowledgeOnboardingButton"/);
});

test("workspace shell includes scene plan, cast editor, and storyboard toggle", () => {
  assert.match(workspaceHtml, /id="scenePrimaryLocation"/);
  assert.match(workspaceHtml, /id="storyboardEnabled"/);
  assert.match(workspaceHtml, /id="castList"/);
  assert.match(workspaceHtml, /id="addSupportingCast"/);
});
