import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const manifest = JSON.parse(fs.readFileSync(new URL("../manifest.json", import.meta.url), "utf8"));
const workspaceHtml = fs.readFileSync(new URL("../src/workspace.html", import.meta.url), "utf8");
const workspaceJs = fs.readFileSync(new URL("../src/workspace.js", import.meta.url), "utf8");
const remakeCoreJs = fs.readFileSync(new URL("../src/remake-core.js", import.meta.url), "utf8");

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
  assert.match(workspaceHtml, /生成并一键带走结果/);
  assert.match(workspaceHtml, /只生成项目/);
  assert.match(workspaceHtml, /提交到本地服务/);
  assert.match(workspaceHtml, /只做两步：选模板、传图/);
  assert.match(workspaceHtml, /id="accountTemplateSelect"/);
  assert.match(workspaceHtml, /更多设置（可选）/);
  assert.match(workspaceHtml, /先把项目跑起来，其它内容都可以后面再补/);
  assert.match(workspaceHtml, /data-view-nav="generate"/);
  assert.match(workspaceHtml, /data-view-panel="history"/);
  assert.match(workspaceHtml, /id="openOnboardingButton"/);
  assert.match(workspaceHtml, /开始前先看/);
  assert.match(workspaceHtml, /id="acknowledgeOnboardingButton"/);
  assert.match(workspaceHtml, /class="panelSidebar panelSidebarCompact"/);
  assert.match(workspaceHtml, /id="generateFlowStatusSummary"/);
  assert.match(workspaceHtml, /id="generateFlowStatusList"/);
  assert.match(workspaceHtml, /主流程状态/);
});

test("workspace shell keeps the generate-page top flow in the same order as the system guidance", () => {
  assert.match(
    workspaceHtml,
    /<strong>1\. 选模板<\/strong>[\s\S]*?<strong>2\. 上传产品图<\/strong>/
  );
  assert.match(workspaceHtml, /先选模板/);
  assert.match(workspaceHtml, /id="templateSelectionSummary"/);
  assert.match(workspaceHtml, /传图后自动识别/);
  assert.match(workspaceHtml, /先选模板，再上传商品图，然后直接点生成并一键带走结果。/);
});

test("workspace shell shows template and default model before generation starts", () => {
  assert.match(workspaceJs, /function renderTemplateSelectionSummary\(\)/);
  assert.match(workspaceJs, /<strong>当前模板上下文<\/strong>/);
  assert.match(workspaceJs, /模板：\$\{escapeHtml\(template\.name \|\| "未命名模板"\)\}/);
  assert.match(workspaceJs, /默认模型：\$\{escapeHtml\(template\.preferredModel \|\| "veo-3-fast"\)\}/);
  assert.match(workspaceJs, /平台：\$\{escapeHtml\(getPlatformLabel\(template\.platform \|\| "tiktok"\)\)\}/);
});

test("workspace shell turns history into a project library plus detail workspace", () => {
  assert.match(workspaceHtml, /项目库/);
  assert.match(workspaceHtml, /先选项目/);
  assert.match(workspaceHtml, /当前项目/);
  assert.match(workspaceHtml, /项目详情/);
  assert.match(workspaceHtml, /id="historyWorkspaceSection"/);
  assert.match(workspaceHtml, /id="seriesList"/);
  assert.match(workspaceHtml, /id="projectDetailPanel"/);
  assert.match(workspaceJs, /historyWorkspaceSection/);
  assert.match(workspaceJs, /historyProjectCard/);
  assert.match(workspaceJs, /compactSummary/);
  assert.match(workspaceJs, /thumbnailDataUrl/);
  assert.match(workspaceJs, /formatHistoryProjectTime/);
  assert.match(workspaceJs, /getHistoryProjectStatus/);
  assert.match(workspaceJs, /function getCurrentNextActionSuggestion\(/);
  assert.match(workspaceJs, /下一步建议：/);
  assert.match(workspaceJs, /模板：\$\{escapeHtml\(templateName\)\}/);
  assert.match(workspaceJs, /模型：\$\{escapeHtml\(preferredModel\)\}/);
  assert.match(workspaceJs, /nodes\.currentTaskStatusBadge\.textContent = currentProjectStatus/);
  assert.match(workspaceJs, /function selectProject\(projectId\) \{[\s\S]*activeDetailTab = "summary";/);
});

test("workspace shell keeps template and remake model visible in the result summary", () => {
  assert.match(workspaceJs, /function getPackagePreferredModel\(pkg\)/);
  assert.match(workspaceJs, /currentResultChip">模板：\$\{escapeHtml\(resultSnapshot\.templateName\)\}/);
  assert.match(workspaceJs, /currentResultChip">模型：\$\{escapeHtml\(resultSnapshot\.modelName\)\}/);
  assert.match(workspaceJs, /`复刻模型：\$\{getPackagePreferredModel\(pkg\)\}`/);
  assert.match(workspaceJs, /当前这次结果按“\$\{templateName\} \/ \$\{modelName\}”在出/);
});

test("workspace shell puts next action and current stage first in the current project summary", () => {
  assert.match(workspaceJs, /const primaryStageSummary =/);
  assert.match(workspaceJs, /workflowStatus\.deliveryStatusSummary \|\|/);
  assert.match(workspaceJs, /workflowStatus\.storyboardStatusSummary \|\|/);
  assert.match(workspaceJs, /submittedStageHint \|\|/);
  assert.match(
    workspaceJs,
    /<div class="currentResultSummaryNote">下一步建议：\$\{escapeHtml\(nextActionSuggestion\)\}<\/div>\s*\$\{primaryStageSummary \? `<div class="currentResultSummaryNote">当前阶段：\$\{escapeHtml\(primaryStageSummary\)\}<\/div>` : ""\}\s*\$\{currentBatchId \? `<div class="currentResultSummaryNote">当前批次号：\$\{escapeHtml\(currentBatchId\)\}<\/div>` : ""\}/s
  );
  assert.doesNotMatch(workspaceJs, /当前故事版进度：/);
  assert.doesNotMatch(workspaceJs, /当前带走结果：/);
});

test("workspace shell turns storyboard generation into a one-click auto-wait flow", () => {
  assert.match(workspaceJs, /data-storyboard-run/);
  assert.match(workspaceJs, /\/api\/storyboards/);
  assert.match(workspaceJs, /runStoryboardFlow/);
  assert.match(workspaceJs, /pollStoryboardTasksToTerminal/);
  assert.match(workspaceJs, /storyboardStatusSummary/);
  assert.match(workspaceJs, /renderStoryboardStatusSummary/);
  assert.match(workspaceJs, /点击一次后会自动提交并等待结果/);
  assert.match(workspaceJs, /稍后再点一次按钮，会继续帮你查询结果/);
  assert.match(workspaceJs, /formatStoryboardStatus/);
  assert.doesNotMatch(workspaceJs, /data-storyboard-refresh/);
});

test("workspace shell lets users download storyboard image files through the local proxy", () => {
  assert.match(workspaceJs, /data-storyboard-download-all/);
  assert.match(workspaceJs, /data-storyboard-download=/);
  assert.match(workspaceJs, /\/api\/storyboards\/\$\{encodeURIComponent\(normalizedTaskId\)\}\/image/);
  assert.match(workspaceJs, /下载全部故事版图片/);
  assert.match(workspaceJs, /故事版图片已开始下载/);
});

test("workspace shell exposes a main storyboard shortcut in the result area", () => {
  assert.match(workspaceHtml, /id="storyboardShortcutButton"/);
  assert.match(workspaceJs, /handleStoryboardShortcut/);
  assert.match(workspaceJs, /getStoryboardShortcutConfig/);
  assert.match(workspaceJs, /下载故事版图片/);
  assert.match(workspaceJs, /继续等待故事版/);
  assert.match(workspaceJs, /补齐故事版图片/);
});

test("workspace shell keeps storyboard enabled by default for the main one-chain flow", () => {
  assert.match(workspaceHtml, /id="storyboardEnabled" type="checkbox" checked/);
  assert.match(workspaceHtml, /生成故事版叙事图任务（默认开启）/);
  assert.match(workspaceJs, /function resetStoryboardDefaultToggle/);
  assert.match(workspaceJs, /resetStoryboardDefaultToggle\(\);/);
});

test("workspace shell sends uploaded product images through the local vision service before final fallback", () => {
  assert.match(workspaceJs, /productImageAnalysisRunning/);
  assert.match(workspaceJs, /const template = syncPreferredTemplateForCurrentPlatform\(\) \|\| getSelectedTemplate\(\) \|\| \{\}/);
  assert.match(workspaceJs, /const analysisImages = await createProductAnalysisImageDataUrls\(Array\.from\(nodes\.productImages\.files \|\| \[\]\)\)/);
  assert.match(workspaceJs, /imageDataUrls: analysisImages/);
  assert.match(workspaceJs, /\/api\/product-image-insights/);
  assert.match(workspaceJs, /analyzeProductImageViaService/);
  assert.match(workspaceJs, /正在分析商品图内容/);
  assert.match(workspaceJs, /const disabled = !\(hasTemplate && hasFreshProductImage\) \|\| productImageAnalysisRunning/);
  assert.match(workspaceJs, /nodes\.remakeButton\.disabled = disabled/);
});

test("workspace shell syncs the preferred platform template before upload analysis and final generation", () => {
  assert.match(workspaceJs, /function syncPreferredTemplateForCurrentPlatform\(\)/);
  assert.match(workspaceJs, /const preferredTemplate = pickPreferredTemplateForPlatform\(platform, profileUrl\)/);
  assert.match(workspaceJs, /selectedTemplateId = preferredTemplate\.id/);
  assert.match(workspaceJs, /const template = syncPreferredTemplateForCurrentPlatform\(\) \|\| getSelectedTemplate\(\);/);
});

test("workspace shell keeps product-image feedback truthful when visual analysis falls back", () => {
  assert.match(workspaceJs, /let usedVisionAnalysis = false/);
  assert.match(workspaceJs, /usedVisionAnalysis = true/);
  assert.match(workspaceJs, /商品图视觉分析暂时没成功，已先按文件名和模板自动提炼一版/);
  assert.match(workspaceJs, /usedVisionAnalysis\s*\?\s*"产品图已上传，已根据商品图内容自动提炼一版商品名、卖点、场景和提示词草稿。"\s*:\s*"产品图已上传，已先按文件名和模板自动提炼一版商品名、卖点、场景和提示词草稿。"/);
});

test("workspace shell keeps product-image analysis completion visible in the main flow state", () => {
  assert.match(workspaceJs, /let lastProductImageInsightStatus = ""/);
  assert.match(workspaceJs, /lastProductImageInsightStatus = usedVisionAnalysis\s*\?\s*"已识别完成"\s*:\s*"已按文件名兜底提炼"/);
  assert.match(workspaceJs, /lastProductImageInsightStatus = ""/);
  assert.match(workspaceJs, /const productImageInsightStatus = currentStatus\.productImageInsightStatusSummary \|\| lastProductImageInsightStatus/);
  assert.match(workspaceJs, /status: hasProductImage \? `已上传 \$\{knownProductImageCount\} 张\$\{productImageInsightStatus \? `，\$\{productImageInsightStatus\}` : ""\}` : "待上传"/);
  assert.match(workspaceJs, /if \(productImageInsightStatus\) return `商品图已就绪，\$\{productImageInsightStatus\}，可以直接生成。`;/);
});

test("workspace shell shows a concise product-image recognition summary before generation", () => {
  assert.match(workspaceHtml, /id="productInsightSummary"/);
  assert.match(workspaceJs, /function renderProductInsightSummary\(\)/);
  assert.match(workspaceJs, /<strong>商品图识别摘要<\/strong>/);
  assert.match(workspaceJs, /识别：\$\{escapeHtml\(insightStatus \|\| \(productCount \? "已上传待识别" : "未开始"\)\)\}/);
  assert.match(workspaceJs, /商品：\$\{escapeHtml\(productName \|\| "待识别"\)\}/);
  assert.match(workspaceJs, /主卖点：\$\{escapeHtml\(firstSellingPoint \|\| "待识别"\)\}/);
  assert.match(workspaceJs, /主场景：\$\{escapeHtml\(primaryScene \|\| "待识别"\)\}/);
  assert.match(workspaceJs, /角色结构：\$\{escapeHtml\(castSummary \|\| "待识别"\)\}/);
});

test("workspace shell shows expected outputs before generation starts", () => {
  assert.match(workspaceHtml, /id="generationExpectationSummary"/);
  assert.match(workspaceJs, /function renderGenerationExpectationSummary\(\)/);
  assert.match(workspaceJs, /<strong>生成后会得到什么<\/strong>/);
  assert.match(workspaceJs, /任务数：预计 \$\{expectedCount\} 条/);
  assert.match(workspaceJs, /比例：\$\{escapeHtml\(aspectRatio\)\}/);
  assert.match(workspaceJs, /故事版：\$\{storyboardEnabled \? "会一起生成" : "这轮不生成"\}/);
  assert.match(workspaceJs, /主按钮会：先生成项目，再自动接故事版，并继续一键带走结果。/);
  assert.match(workspaceJs, /主按钮会：先生成项目，再直接一键带走结果。/);
});

test("workspace shell does not immediately overwrite completed product-image insight feedback after upload", () => {
  assert.match(
    workspaceJs,
    /await autoFillProductInsightsFromImage\(file\);\s*renderAssetStatus\(\);\s*updateGenerateButtonState\(\);\s*syncFlowStepState\(\);/
  );
  assert.doesNotMatch(
    workspaceJs,
    /await autoFillProductInsightsFromImage\(file\);\s*renderAssetStatus\(\);\s*updateGenerateButtonState\(\);\s*updateActionFeedback\(\);/
  );
});

test("workspace shell refreshes previous auto-filled product insights when users upload a new product image set", () => {
  assert.match(workspaceJs, /let lastAutoFilledInsights = createEmptyAutoFilledInsightsState\(\);/);
  assert.match(workspaceJs, /function shouldReplaceAutoFilledField\(currentValue, lastAutoFilledValue\)/);
  assert.match(workspaceJs, /if \(shouldReplaceAutoFilledField\(nodes\.productName\.value, lastAutoFilledInsights\.productName\)/);
  assert.match(workspaceJs, /if \(shouldReplaceAutoFilledField\(nodes\.productNotes\.value, lastAutoFilledInsights\.productNotes\)/);
  assert.match(workspaceJs, /if \(shouldReplaceAutoFilledField\(nodes\.referenceBrief\.value, lastAutoFilledInsights\.referenceBrief\)/);
  assert.match(workspaceJs, /const canReplaceCastDraft = hasOnlyDefaultHost \|\| isCurrentCastDraftAutoFilled\(\)/);
  assert.match(workspaceJs, /lastAutoFilledInsights = \{/);
});

test("workspace shell batch export also downloads storyboard image files through the local proxy", () => {
  assert.match(workspaceJs, /downloadStoryboardImagesForBundle/);
  assert.match(workspaceJs, /已按项目结构导出/);
  assert.match(workspaceJs, /故事版图片/);
  assert.match(workspaceJs, /\/api\/storyboards\/\$\{encodeURIComponent\(normalizedTaskId\)\}\/image/);
});

test("workspace shell exposes a true one-click delivery action in the result area", () => {
  assert.match(workspaceHtml, /id="deliveryShortcutButton"/);
  assert.match(workspaceJs, /handleDeliveryShortcut/);
  assert.match(workspaceJs, /runDeliveryShortcut/);
  assert.match(workspaceJs, /getDeliveryShortcutConfig/);
  assert.match(workspaceJs, /deliveryStatusSummary/);
  assert.match(workspaceJs, /先生成故事版再带走/);
  assert.match(workspaceJs, /一键带走全部结果/);
  assert.match(workspaceJs, /正在整理结果，会自动复制结果包并下载导出文件/);
  assert.match(workspaceJs, /故事版已就绪，继续自动整理结果/);
  assert.match(workspaceJs, /自动带走先暂停：故事版还在处理中，稍后再点一次“一键带走全部结果”，系统会继续后面的复制和导出。/);
  assert.match(workspaceJs, /一键带走待继续：故事版还在处理中，请稍后继续等待或再点一次“一键带走全部结果”。/);
  assert.match(workspaceJs, /一键带走完成：结果包已复制/);
  assert.match(workspaceJs, /一键带走失败：/);
  assert.match(workspaceJs, /结果整理失败：/);
  assert.match(workspaceJs, /copyBatchTasks\(\{ silent: true \}\)\.catch/);
  assert.match(workspaceJs, /downloadBundle\(\{ silent: true \}\)\.catch/);
  assert.match(workspaceJs, /复制结果包失败，但导出已继续完成/);
});

test("workspace shell keeps only one highlighted primary action in history based on the next best step", () => {
  assert.match(workspaceJs, /function applyActionButtonTone\(button, tone\)/);
  assert.match(workspaceJs, /function updateHistoryPrimaryActionHierarchy\(\)/);
  assert.match(workspaceJs, /const deliveryPrimary = deliveryVisible;/);
  assert.match(workspaceJs, /const storyboardPrimary = !deliveryPrimary && storyboardVisible;/);
  assert.match(workspaceJs, /const submitPrimary = !deliveryPrimary && !storyboardPrimary && !submitDisabled;/);
  assert.match(workspaceJs, /applyActionButtonTone\(nodes\.deliveryShortcutButton, deliveryPrimary \? "primary" : "ghost"\);/);
  assert.match(workspaceJs, /applyActionButtonTone\(nodes\.storyboardShortcutButton, storyboardPrimary \? "primary" : "ghost"\);/);
  assert.match(workspaceJs, /applyActionButtonTone\(nodes\.sendBatchTasksButton, submitPrimary \? "primary" : "ghost"\);/);
});

test("workspace shell marks submitted projects as submitted after send-to-service succeeds", () => {
  assert.match(workspaceJs, /task\.status = data\.status \|\| "queued"/);
  assert.match(workspaceJs, /task\.batchId = data\.batchId \|\| task\.batchId \|\| ""/);
  assert.match(workspaceJs, /replaceCurrentProject\(currentPackage\);/);
  assert.match(workspaceJs, /renderProjects\(\);/);
  assert.match(workspaceJs, /setActionFeedback\(`已发送到本地服务，批次号：\$\{data\.batchId \|\| "未返回"\}`\)/);
  assert.match(workspaceJs, /const submitted = currentProjectRecord \? hasSubmittedBatchTasks\(currentProjectRecord\) : false/);
  assert.match(workspaceJs, /nodes\.sendBatchTasksButton\.textContent = submitted \? "已提交到本地服务" : "提交到本地服务"/);
  assert.match(workspaceJs, /nodes\.sendBatchTasksButton\.disabled = disabled \|\| submitted/);
  assert.match(workspaceJs, /const currentBatchId = currentPackage\.batchVideoTasks\?\.find\(\(task\) => task\.batchId\)\?\.batchId \|\| ""/);
  assert.match(workspaceJs, /当前批次号：/);
  assert.match(workspaceJs, /本地服务阶段：视频任务已经交给本地服务继续跑；按当前批次号去本地服务或外部视频工具继续追踪，文案和图片仍可继续一键带走。/);
  assert.match(workspaceJs, /function hasSubmittedBatchTasks\(record\)/);
  assert.match(workspaceJs, /if \(tasks\.some\(\(task\) => task\?\.batchId\)\) return true/);
  assert.match(workspaceJs, /if \(tasks\.some\(\(task\) => submittedStatuses\.has\(String\(task\?\.status \|\| ""\)\.toLowerCase\(\)\)\)\) return true/);
  assert.match(workspaceJs, /if \(hasSubmittedBatchTasks\(record\)\) return "已提交"/);
  assert.match(workspaceJs, /视频任务已经提交到本地服务；按当前批次号去本地服务或外部视频工具继续追踪，如果还要整理文案和图片，点“一键带走全部结果”。/);
  assert.match(workspaceJs, /视频任务已经进入本地服务阶段；按当前批次号去本地服务或外部视频工具继续追踪，文案和图片也已带走完成。/);
});

test("workspace shell persists storyboard and delivery summaries with each project record", () => {
  assert.match(workspaceJs, /record\.package\.workflowStatus = \{/);
  assert.match(workspaceJs, /productImageInsightStatusSummary: nextStatus\.productImageInsightStatusSummary \|\| ""/);
  assert.match(workspaceJs, /storyboardStatusSummary: nextStatus\.storyboardStatusSummary \|\| ""/);
  assert.match(workspaceJs, /deliveryStatusSummary: nextStatus\.deliveryStatusSummary \|\| ""/);
  assert.match(workspaceJs, /const packageWorkflowStatus = projectRecord\?\.package\?\.workflowStatus \|\| \{\}/);
  assert.match(workspaceJs, /productImageInsightStatusSummary: packageWorkflowStatus\.productImageInsightStatusSummary \|\| ""/);
  assert.match(workspaceJs, /storyboardStatusSummary: packageWorkflowStatus\.storyboardStatusSummary \|\| ""/);
  assert.match(workspaceJs, /deliveryStatusSummary: packageWorkflowStatus\.deliveryStatusSummary \|\| ""/);
});

test("workspace shell history status reflects downstream storyboard and delivery stages, not only submit state", () => {
  assert.match(workspaceJs, /if \(/);
  assert.match(workspaceJs, /deliveryStatusSummary/);
  assert.match(workspaceJs, /return "已带走"/);
  assert.match(workspaceJs, /return "部分带走"/);
  assert.match(workspaceJs, /return "待带走"/);
  assert.match(workspaceJs, /return "故事版中"/);
  assert.match(workspaceJs, /return "待故事版"/);
  assert.match(workspaceJs, /return "已提交"/);
  assert.match(workspaceJs, /return "可提交"/);
});

test("workspace shell gives dedicated next-step guidance for partially delivered results", () => {
  assert.match(workspaceJs, /if \(\/\^一键带走部分完成\/\.test\(deliverySummary\)\) \{/);
  assert.match(workspaceJs, /文案和文件只带走了一部分；重新点“一键带走全部结果”补复制或补下载。/);
  assert.match(
    workspaceJs,
    /文案和文件只带走了一部分；重新点“一键带走全部结果”补复制或补下载，同时继续按当前批次号追踪视频任务。/
  );
});

test("workspace shell preserves imported batch and storyboard progress when restoring a JSON project", () => {
  assert.match(workspaceJs, /currentPackage = restoreImportedProjectState\(regeneratePrompts\(parsed\), parsed\);/);
  assert.match(workspaceJs, /function restoreImportedProjectState\(nextPkg, importedPkg\)/);
  assert.match(workspaceJs, /batchId: matchedTask\.batchId \|\| task\.batchId \|\| ""/);
  assert.match(workspaceJs, /imageUrl: matchedTask\.imageUrl \|\| task\.imageUrl \|\| ""/);
  assert.match(workspaceJs, /workflowStatus: \{/);
  assert.match(workspaceJs, /productImageInsightStatusSummary: importedPkg\?\.workflowStatus\?\.productImageInsightStatusSummary \|\| ""/);
});

test("workspace shell lets generate-page primary action run straight into delivery", () => {
  assert.match(workspaceHtml, /id="remakeAndDeliverButton"/);
  assert.match(workspaceJs, /handleGenerate\(\{ autoDeliver: true \}\)/);
  assert.match(workspaceJs, /已生成项目，并跳到历史记录。当前有 \$\{currentPackage\.batchVideoTasks\?\.length \|\| 0\} 条可提交到本地服务的视频任务。/);
  assert.match(workspaceJs, /activeDetailTab = "summary";/);
  assert.match(workspaceJs, /项目已生成，正在继续整理故事版和交付结果/);
  assert.match(workspaceJs, /await handleDeliveryShortcut\(\);/);
});

test("workspace shell lets users copy a complete delivery pack instead of raw task json only", () => {
  assert.match(workspaceHtml, /id="copyBatchTasksButton"/);
  assert.match(workspaceHtml, /复制结果包/);
  assert.match(workspaceJs, /buildDeliveryPackageText/);
  assert.match(workspaceJs, /完整结果包已复制/);
  assert.match(remakeCoreJs, /## 视频提示词/);
  assert.match(remakeCoreJs, /## 关键帧提示词/);
  assert.match(remakeCoreJs, /## 候选版本/);
  assert.doesNotMatch(workspaceJs, /批量视频任务 JSON 已复制/);
});

test("workspace shell prompt detail keeps both video prompts and keyframe prompts visible", () => {
  assert.match(
    workspaceJs,
    /prompts:\s*\[\s*"## 视频提示词",[\s\S]*currentPackage\.prompts\.videoShots[\s\S]*"## 关键帧提示词",[\s\S]*currentPackage\.prompts\.keyframes/
  );
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
  assert.match(workspaceJs, /const nextScenePrimaryLocation = generationDefaults\.scenePlan\?\.primaryLocation \|\| ""/);
  assert.match(workspaceJs, /const nextCastDraft = normalizeCastDraft\(generationDefaults\.cast \|\| \[\]\)/);
  assert.match(workspaceJs, /const disabled = !\(hasTemplate && hasFreshProductImage\) \|\| productImageAnalysisRunning/);
  assert.match(workspaceJs, /nodes\.remakeButton\.disabled = disabled/);
  assert.match(workspaceJs, /setActionFeedback\("商品图已就绪，可以直接生成。"\)/);
  assert.match(workspaceJs, /setActionFeedback\("可以直接生成。"\)/);
  assert.doesNotMatch(workspaceJs, /请先填写当前商品名/);
  assert.doesNotMatch(workspaceJs, /请先填写你的创作提示词/);
});

test("workspace shell keeps primary-action feedback aligned with disabled-state rules", () => {
  assert.match(workspaceJs, /setActionFeedback\("先选蒸馏模型。"\)/);
  assert.match(workspaceJs, /setActionFeedback\("先选蒸馏模型，再上传商品图。"\)/);
  assert.match(workspaceJs, /setActionFeedback\("再上传商品图就能生成。"\)/);
  assert.match(workspaceJs, /const knownProductImageCount = getKnownProductImageCount\(\)/);
  assert.match(workspaceJs, /const hasProductImage = knownProductImageCount > 0/);
  assert.doesNotMatch(workspaceJs, /if \(!hasImages && !hasPrompt\) {\s*setActionFeedback\("先上传商品图。"\)/);
  assert.match(workspaceJs, /const hasFreshProductImage = Boolean\(nodes\.productImages\?\.files\?\.length\)/);
  assert.match(workspaceJs, /const disabled = !\(hasTemplate && hasFreshProductImage\) \|\| productImageAnalysisRunning/);
  assert.match(workspaceJs, /nodes\.wizardNextButton\.disabled = currentWizardStep === 4 \|\| \(currentWizardStep === 3 && !canGenerateFromCurrentInputs\)/);
  assert.match(workspaceJs, /renderGenerateFlowStatus\(\);/);
});

test("workspace shell does not tell restored projects they can regenerate before a fresh product-image upload", () => {
  assert.match(workspaceJs, /const hasFreshProductImage = Boolean\(nodes\.productImages\?\.files\?\.length\)/);
  assert.match(workspaceJs, /if \(currentPackage && !hasFreshProductImage\) \{/);
  assert.match(workspaceJs, /setActionFeedback\("当前项目已记录商品图；若要重新生成，请先重新上传这轮要用的商品图。"\)/);
  assert.match(workspaceJs, /if \(currentPackage && !hasFreshProductImage\) return "当前项目已记录商品图；若要重新生成，请先重新上传这轮要用的商品图。";/);
});

test("workspace shell keeps known uploaded-image status after project restore even when the file input is empty", () => {
  assert.match(workspaceJs, /function getKnownProductImageCount\(\)/);
  assert.match(workspaceJs, /currentPackage\?\.project\?\.clipcatConfig\?\.productImageCount/);
  assert.match(workspaceJs, /nodes\.productUploadStatus\.textContent = productCount \? `商品图：已上传 \$\{productCount\} 张` : "商品图：未上传"/);
  assert.match(workspaceJs, /status: hasProductImage \? `已上传 \$\{knownProductImageCount\} 张\$\{productImageInsightStatus \? `，\$\{productImageInsightStatus\}` : ""\}` : "待上传"/);
  assert.match(workspaceJs, /renderAssetStatus\(\);/);
  assert.match(workspaceJs, /if \(currentPackage\) return "项目已生成，可继续故事版、提交到本地服务或一键带走结果。"/);
});

test("workspace shell keeps generated-project status ahead of reusable image-insight wording", () => {
  assert.match(
    workspaceJs,
    /if \(currentPackage && !hasFreshProductImage\) return "当前项目已记录商品图；若要重新生成，请先重新上传这轮要用的商品图。";\s*if \(currentPackage\) return "项目已生成，可继续故事版、提交到本地服务或一键带走结果。";\s*if \(productImageInsightStatus\) return `商品图已就绪，\$\{productImageInsightStatus\}，可以直接生成。`;/s
  );
});

test("workspace shell replaces abstract follow-up wording with concrete next-step guidance", () => {
  assert.match(workspaceJs, /故事版已排进主链路，生成后可直接点“生成故事版图”开始。/);
  assert.match(workspaceJs, /当前项目已准备好，先看摘要，再按建议继续下一步。/);
  assert.match(workspaceJs, /先看右侧详情，再按当前建议继续下一步。/);
  assert.match(workspaceJs, /项目已经生成完成。这里可以直接复制结果包、导出文件，或提交到本地服务继续跑视频任务。/);
  assert.doesNotMatch(workspaceJs, /可直接去跑的任务/);
  assert.doesNotMatch(workspaceJs, /提交去跑视频/);
  assert.doesNotMatch(workspaceJs, /可以继续处理/);
});

test("workspace shell clears stale local product uploads when switching to another restored project", () => {
  assert.match(workspaceJs, /function clearLocalProductUploadState\(\)/);
  assert.match(workspaceJs, /nodes\.productImages\.value = ""/);
  assert.match(workspaceJs, /nodes\.productHeroImage\.hidden = true/);
  assert.match(workspaceJs, /nodes\.sampleProduct\.hidden = false/);
  assert.match(workspaceJs, /clearLocalProductUploadState\(\);/);
  assert.match(workspaceJs, /const disabled = !\(hasTemplate && hasFreshProductImage\) \|\| productImageAnalysisRunning/);
});

test("workspace shell does not let the wizard bypass the same fresh-upload generation gate", () => {
  assert.match(workspaceJs, /const canGenerateFromCurrentInputs = Boolean\(getSelectedTemplate\(\)\) && Boolean\(nodes\.productImages\.files\?\.length\) && !productImageAnalysisRunning/);
  assert.match(workspaceJs, /if \(currentWizardStep === 3\) \{/);
  assert.match(workspaceJs, /if \(!canGenerateFromCurrentInputs\) \{/);
  assert.match(workspaceJs, /setActionFeedback\("请先重新上传当前项目要用的商品图，再开始新一轮生成。", true\)/);
});

test("workspace shell does not warn about missing product images when navigating restored projects that already have known image counts", () => {
  assert.match(workspaceJs, /const hasKnownProductImage = getKnownProductImageCount\(\) > 0/);
  assert.match(workspaceJs, /if \(step >= 3 && !hasKnownProductImage\) \{/);
  assert.match(workspaceJs, /setActionFeedback\("还没上传商品图。你可以先看后面的结构，但正式生成前需要先补商品图。", true\)/);
});

test("workspace shell lets restored projects move past wizard step 2 without forcing a fresh upload just to view later steps", () => {
  assert.match(workspaceJs, /const hasKnownProductImage = getKnownProductImageCount\(\) > 0/);
  assert.match(workspaceJs, /if \(currentWizardStep === 2 && !hasKnownProductImage\) \{/);
  assert.match(workspaceJs, /setActionFeedback\("第二步至少需要上传 1 张商品图。", true\)/);
});
