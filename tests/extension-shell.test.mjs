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
  assert.match(workspaceHtml, /生成项目/);
  assert.match(workspaceHtml, /只做两步：传图、选模板/);
  assert.match(workspaceHtml, /id="accountTemplateSelect"/);
  assert.match(workspaceHtml, /更多设置（可选）/);
  assert.match(workspaceHtml, /先把项目跑起来，其它内容都可以后面再补/);
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
  assert.match(workspaceHtml, /展开故事版与角色（可选）/);
  assert.match(workspaceHtml, /展开主页参考（可选）/);
});

test("workspace shell exposes separated deep-distill read and analysis progress", () => {
  assert.match(workspaceHtml, /读取文件夹/);
  assert.match(workspaceHtml, /自动结构拆解/);
  assert.match(workspaceHtml, /保存模板/);
  assert.match(workspaceHtml, /id="deepDistillActionFeedback"/);
  assert.match(workspaceHtml, /id="deepDistillReadProgress"/);
  assert.match(workspaceHtml, /id="deepDistillAnalyzeProgress"/);
  assert.match(workspaceHtml, /先选择本地视频/);
});

test("workspace shell keeps manage view compact and removes homepage-reference controls", () => {
  assert.doesNotMatch(workspaceHtml, /模型与主页参考/);
  assert.doesNotMatch(workspaceHtml, /提炼主页模型/);
  assert.doesNotMatch(workspaceHtml, /主页链接/);
  assert.doesNotMatch(workspaceHtml, /id="manageTemplateSnapshot"/);
  assert.doesNotMatch(workspaceHtml, /id="manageProfileUrl"/);
  assert.doesNotMatch(workspaceHtml, /id="manageScanSummary"/);
  assert.match(workspaceHtml, /id="manageTemplateSelect"/);
  assert.match(workspaceHtml, /新建空模型/);
  assert.match(workspaceHtml, /删除模型/);
  assert.match(workspaceHtml, /保存模型/);
});

test("workspace shell avoids mixing deep-distill counts into template snapshot logic", () => {
  assert.doesNotMatch(workspaceJs, /深蒸馏视频：/);
});

test("deep-distill restored-history state is tracked as re-read required, not as directly analyzable pending work", () => {
  assert.match(workspaceJs, /重新选择本地视频/);
  assert.match(workspaceJs, /开始 AI 拆解/);
  assert.match(workspaceJs, /正在 AI 拆解/);
  assert.match(workspaceJs, /正在读取本地视频/);
  assert.match(workspaceJs, /读完后按钮会自动变成“开始 AI 拆解”/);
  assert.match(workspaceJs, /先选择本地视频/);
  assert.match(workspaceJs, /const preservedDeepDistillFiles = new Map\(currentDeepDistillFiles\)/);
  assert.match(workspaceJs, /currentDeepDistillFiles = new Map\(/);
  assert.match(workspaceJs, /先点左边“读取本地视频文件夹”，读完后这里会直接变成“开始 AI 拆解”/);
  assert.match(workspaceJs, /当前这些是历史样本，还没重新读入本地文件，所以第 2 步不会开始/);
  assert.match(workspaceJs, /\["可开始拆解"/);
  assert.doesNotMatch(workspaceJs, /\["待分析", pendingCount/);
  assert.doesNotMatch(workspaceJs, /当前页面只恢复了历史样本/);
});

test("workspace shell translates local batch service fetch failures into actionable guidance", () => {
  assert.match(workspaceJs, /function isBatchServiceOfflineError/);
  assert.match(workspaceJs, /127\.0\.0\.1:4328/);
  assert.match(workspaceJs, /先启动 4328 服务/);
  assert.match(workspaceJs, /启动命令：\$\{batchServiceCommand\}/);
  assert.doesNotMatch(workspaceJs, /AI 拆解失败：Failed to fetch/);
});

test("workspace shell allows generation with only uploaded product images by using auto-filled fallbacks", () => {
  assert.match(workspaceJs, /const fallbackProductName = productName \|\| nodes\.productName\.value\.trim\(\) \|\| "当前商品"/);
  assert.match(workspaceJs, /const inferredFallback = inferProductInsightsFromAsset\(/);
  assert.match(workspaceJs, /const inferredGenerationDefaults = inferGenerationDefaultsFromAsset\(/);
  assert.match(workspaceJs, /const fallbackReferenceSummary = referenceSummary \|\| nodes\.referenceBrief\.value\.trim\(\) \|\| inferredFallback\.suggestedPrompt/);
  assert.match(workspaceJs, /nodes\.scenePrimaryLocation\.value = generationDefaults\.scenePlan\?\.primaryLocation \|\| ""/);
  assert.match(workspaceJs, /currentCastDraft = normalizeCastDraft\(generationDefaults\.cast\)/);
  assert.match(workspaceJs, /nodes\.remakeButton\.disabled = !\(hasTemplate && hasProductImage\)/);
  assert.match(workspaceJs, /setActionFeedback\("商品图已就绪，可以直接生成。"\)/);
  assert.match(workspaceJs, /setActionFeedback\("可以直接生成。"\)/);
  assert.doesNotMatch(workspaceJs, /请先填写当前商品名/);
  assert.doesNotMatch(workspaceJs, /请先填写你的创作提示词/);
});
