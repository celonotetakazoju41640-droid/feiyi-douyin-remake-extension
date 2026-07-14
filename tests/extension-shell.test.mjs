import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const manifest = JSON.parse(fs.readFileSync(new URL("../manifest.json", import.meta.url), "utf8"));
const workspaceHtml = fs.readFileSync(new URL("../src/workspace.html", import.meta.url), "utf8");
const workspaceJs = fs.readFileSync(new URL("../src/workspace.js", import.meta.url), "utf8");

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
  assert.match(workspaceHtml, /class="panelSidebar panelSidebarCompact"/);
});

test("workspace shell includes scene plan, cast editor, and storyboard toggle", () => {
  assert.match(workspaceHtml, /id="scenePrimaryLocation"/);
  assert.match(workspaceHtml, /id="storyboardEnabled"/);
  assert.match(workspaceHtml, /id="castList"/);
  assert.match(workspaceHtml, /id="addSupportingCast"/);
});

test("workspace shell exposes separated deep-distill read and analysis progress", () => {
  assert.match(workspaceHtml, /读取本地视频文件夹/);
  assert.match(workspaceHtml, /自动结构拆解/);
  assert.match(workspaceHtml, /查看结果/);
  assert.match(workspaceHtml, /id="deepDistillAnalyzeHint"/);
  assert.match(workspaceHtml, /id="deepDistillActionFeedback"/);
  assert.match(workspaceHtml, /id="deepDistillReadProgress"/);
  assert.match(workspaceHtml, /id="deepDistillAnalyzeProgress"/);
  assert.match(workspaceHtml, /id="deepDistillStatusSummary"/);
  assert.match(workspaceHtml, /先选择本地视频/);
});

test("workspace shell makes deep-distill read vs analyze states explicit", () => {
  assert.match(workspaceHtml, /只读取本机视频、时长和抽帧基础信息/);
  assert.match(workspaceHtml, /读取完成不等于已经开始 AI 拆解/);
  assert.match(workspaceHtml, /10 条视频通常约 1-3 分钟/);
  assert.match(workspaceHtml, /id="deepDistillRecoveryNotice"/);
});

test("workspace shell avoids mixing deep-distill counts into the left template snapshot", () => {
  assert.match(workspaceHtml, /id="manageTemplateSnapshot"/);
  assert.doesNotMatch(workspaceJs, /深蒸馏视频：/);
});

test("deep-distill restored-history state is tracked as re-read required, not as directly analyzable pending work", () => {
  assert.match(workspaceJs, /重新选择本地视频/);
  assert.match(workspaceJs, /开始 AI 拆解/);
  assert.match(workspaceJs, /正在 AI 拆解/);
  assert.match(workspaceJs, /正在读取本地视频/);
  assert.match(workspaceJs, /读完后按钮会自动变成“开始 AI 拆解”/);
  assert.match(workspaceJs, /先选择本地视频/);
  assert.match(workspaceJs, /\["可开始拆解"/);
  assert.doesNotMatch(workspaceJs, /\["待分析", pendingCount/);
  assert.doesNotMatch(workspaceJs, /当前页面只恢复了历史样本/);
});
