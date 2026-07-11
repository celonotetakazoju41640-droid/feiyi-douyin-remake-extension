import {
  buildProfileSelectionComparisonSummary,
  buildReferenceSummaryFromProfileScan,
  classifyTikTokProfilePageIssue,
  mergeTikTokProfileVideoCandidates,
  normalizeTikTokDurationSeconds,
  parseTikTokProfileIdentityText,
  parseTikTokProfileStatsText,
  parseTikTokVisibleStatsText,
  pickPreferredTikTokProfileVideo,
  buildExportBundle,
  buildMarkdownFromPackage,
  buildRemakePackage,
  buildSafeClipcatPrompt,
  createEmptyAccountTemplate,
  distillAccountTemplateFromProfileScan,
  inferProductInsightsFromAsset,
  normalizeAccountTemplate,
  regeneratePrompts,
  splitLines,
  updateShot
} from "./remake-core.js";
import { batchServiceBaseUrl, batchServiceCommand } from "./extension-config.js";

const storageKey = "feiyi-douyin-fuke-projects";
const templateStorageKey = "feiyi-douyin-fuke-account-templates";
const profileSampleSortStorageKey = "feiyi-douyin-fuke-profile-sample-sort";
const profileSampleMinViewsStorageKey = "feiyi-douyin-fuke-profile-sample-min-views";
const onboardingSeenStorageKey = "feiyi-douyin-fuke-onboarding-seen";

const nodes = {
  serviceStatus: document.querySelector("#serviceStatus"),
  startServiceButton: document.querySelector("#startServiceButton"),
  refreshButton: document.querySelector("#refreshButton"),
  openOnboardingButton: document.querySelector("#openOnboardingButton"),
  serviceHelpPanel: document.querySelector("#serviceHelpPanel"),
  copyStartCommandButton: document.querySelector("#copyStartCommandButton"),
  retryHealthButton: document.querySelector("#retryHealthButton"),
  localReferenceVideo: document.querySelector("#localReferenceVideo"),
  thumbnailImage: document.querySelector("#thumbnailImage"),
  thumbnailFallback: document.querySelector("#thumbnailFallback"),
  videoHandle: document.querySelector("#videoHandle"),
  videoUrlText: document.querySelector("#videoUrlText"),
  modelImageFile: document.querySelector("#modelImageFile"),
  modelHeroImage: document.querySelector("#modelHeroImage"),
  modelUploadStatus: document.querySelector("#modelUploadStatus"),
  templateGuideCard: document.querySelector("#templateGuideCard"),
  templateGuideSummary: document.querySelector("#templateGuideSummary"),
  jumpToManageButton: document.querySelector("#jumpToManageButton"),
  dismissTemplateGuideButton: document.querySelector("#dismissTemplateGuideButton"),
  stepTemplateCard: document.querySelector("#stepTemplateCard"),
  stepAssetsCard: document.querySelector("#stepAssetsCard"),
  stepPromptCard: document.querySelector("#stepPromptCard"),
  stepGenerateCard: document.querySelector("#stepGenerateCard"),
  referenceBrief: document.querySelector("#referenceBrief"),
  referenceVideoFile: document.querySelector("#referenceVideoFile"),
  referenceVideoFileName: document.querySelector("#referenceVideoFileName"),
  referenceAnalysisStatus: document.querySelector("#referenceAnalysisStatus"),
  productImages: document.querySelector("#productImages"),
  productHeroImage: document.querySelector("#productHeroImage"),
  productUploadStatus: document.querySelector("#productUploadStatus"),
  sampleProduct: document.querySelector("#sampleProduct"),
  productHeroBadge: document.querySelector("#productHeroBadge"),
  productName: document.querySelector("#productName"),
  productNotes: document.querySelector("#productNotes"),
  targetDuration: document.querySelector("#targetDuration"),
  targetDurationControl: document.querySelector("#targetDurationControl"),
  targetDurationLabel: document.querySelector("#targetDurationLabel"),
  voiceDialect: document.querySelector("#voiceDialect"),
  generationCount: document.querySelector("#generationCount"),
  aspectRatioSelect: document.querySelector("#aspectRatioSelect"),
  hookStyle: document.querySelector("#hookStyle"),
  visualStyle: document.querySelector("#visualStyle"),
  ctaText: document.querySelector("#ctaText"),
  tiktokUrl: document.querySelector("#tiktokUrl"),
  clipcatReferencePlatform: document.querySelector("#clipcatReferencePlatform"),
  clipcatVoiceLanguage: document.querySelector("#clipcatVoiceLanguage"),
  clipcatExtraRules: document.querySelector("#clipcatExtraRules"),
  accountTemplateSelect: document.querySelector("#accountTemplateSelect"),
  templateName: document.querySelector("#templateName"),
  templatePlatform: document.querySelector("#templatePlatform"),
  templateAccountHandle: document.querySelector("#templateAccountHandle"),
  templateProfileUrl: document.querySelector("#templateProfileUrl"),
  profileSampleLimit: document.querySelector("#profileSampleLimit"),
  templateContentPositioning: document.querySelector("#templateContentPositioning"),
  templateRhythm: document.querySelector("#templateRhythm"),
  templatePreferredModel: document.querySelector("#templatePreferredModel"),
  templateStructure: document.querySelector("#templateStructure"),
  templateExpressionDna: document.querySelector("#templateExpressionDna"),
  templateDecisionHeuristics: document.querySelector("#templateDecisionHeuristics"),
  templateAntiPatterns: document.querySelector("#templateAntiPatterns"),
  templateRecentSignals: document.querySelector("#templateRecentSignals"),
  templateRewriteRules: document.querySelector("#templateRewriteRules"),
  templateSampleVideoUrls: document.querySelector("#templateSampleVideoUrls"),
  profileScanStatus: document.querySelector("#profileScanStatus"),
  scanProfileButton: document.querySelector("#scanProfileButton"),
  selectAllProfileSamplesButton: document.querySelector("#selectAllProfileSamplesButton"),
  clearProfileSamplesButton: document.querySelector("#clearProfileSamplesButton"),
  keepCoveredProfileSamplesButton: document.querySelector("#keepCoveredProfileSamplesButton"),
  keepTopProfileSamplesButton: document.querySelector("#keepTopProfileSamplesButton"),
  keepCoveredPopularProfileSamplesButton: document.querySelector("#keepCoveredPopularProfileSamplesButton"),
  exportProfileCandidatesButton: document.querySelector("#exportProfileCandidatesButton"),
  redistillProfileButton: document.querySelector("#redistillProfileButton"),
  applyProfileSummaryButton: document.querySelector("#applyProfileSummaryButton"),
  profileScanResult: document.querySelector("#profileScanResult"),
  profileSampleSort: document.querySelector("#profileSampleSort"),
  profileMinViewsFilter: document.querySelector("#profileMinViewsFilter"),
  profileSampleList: document.querySelector("#profileSampleList"),
  saveTemplateButton: document.querySelector("#saveTemplateButton"),
  deleteTemplateButton: document.querySelector("#deleteTemplateButton"),
  newTemplateButton: document.querySelector("#newTemplateButton"),
  batchServiceStatus: document.querySelector("#batchServiceStatus"),
  batchServiceCommand: document.querySelector("#batchServiceCommand"),
  copyBatchServiceCommandButton: document.querySelector("#copyBatchServiceCommandButton"),
  refreshBatchServiceButton: document.querySelector("#refreshBatchServiceButton"),
  copyClipcatPromptButton: document.querySelector("#copyClipcatPromptButton"),
  copyBatchTasksButton: document.querySelector("#copyBatchTasksButton"),
  sendBatchTasksButton: document.querySelector("#sendBatchTasksButton"),
  wizardPrevButton: document.querySelector("#wizardPrevButton"),
  wizardNextButton: document.querySelector("#wizardNextButton"),
  wizardStepTag: document.querySelector("#wizardStepTag"),
  wizardStepTitle: document.querySelector("#wizardStepTitle"),
  wizardStepDescription: document.querySelector("#wizardStepDescription"),
  currentTaskStatusBadge: document.querySelector("#currentTaskStatusBadge"),
  currentTaskUnitLabel: document.querySelector("#currentTaskUnitLabel"),
  currentTaskHint: document.querySelector("#currentTaskHint"),
  currentResultSummary: document.querySelector("#currentResultSummary"),
  actionFeedback: document.querySelector("#actionFeedback"),
  remakeButton: document.querySelector("#remakeButton"),
  reopenOnboardingDockButton: document.querySelector("#reopenOnboardingDockButton"),
  seriesCount: document.querySelector("#seriesCount"),
  seriesStats: document.querySelector("#seriesStats"),
  seriesList: document.querySelector("#seriesList"),
  projectDetailPanel: document.querySelector("#projectDetailPanel"),
  shotEditorPanel: document.querySelector("#shotEditorPanel"),
  importJsonInput: document.querySelector("#importJsonInput"),
  downloadBundleButton: document.querySelector("#downloadBundleButton"),
  downloadJsonButton: document.querySelector("#downloadJsonButton"),
  downloadMarkdownButton: document.querySelector("#downloadMarkdownButton"),
  clearProjectsButton: document.querySelector("#clearProjectsButton"),
  onboardingModal: document.querySelector("#onboardingModal"),
  onboardingBackdrop: document.querySelector("#onboardingBackdrop"),
  closeOnboardingButton: document.querySelector("#closeOnboardingButton"),
  dismissOnboardingButton: document.querySelector("#dismissOnboardingButton"),
  acknowledgeOnboardingButton: document.querySelector("#acknowledgeOnboardingButton")
};

let currentPackage = null;
let projects = loadProjects();
let accountTemplates = loadAccountTemplates();
let selectedTemplateId = accountTemplates[0]?.id || "";
let modelPreviewUrl = "";
let productPreviewUrl = "";
let referencePreviewUrl = "";
let activeDetailTab = "summary";
let currentProjectId = projects[0]?.id || null;
let currentProfileScan = null;
let selectedProfileVideoUrls = new Set();
let profileSampleSortMode = loadProfileSampleSortMode();
let profileMinViewsFilter = loadProfileSampleMinViewsFilter();
let pinnedProfileVideoUrls = [];
let excludedProfileVideoUrls = new Set();
let currentWizardStep = 1;
let onboardingVisible = false;
let currentView = "generate";

init();

function init() {
  nodes.serviceStatus.textContent = "本地可用";
  nodes.serviceStatus.classList.add("is-ok");
  nodes.serviceHelpPanel.hidden = true;
  nodes.startServiceButton.hidden = true;
  nodes.refreshButton.hidden = true;
  nodes.copyStartCommandButton.textContent = "复制使用说明";
  nodes.batchServiceCommand.textContent = batchServiceCommand;
  bindEvents();
  renderTemplateOptions();
  syncTemplateForm();
  applyTemplateToGenerationFields();
  renderProfileScanState();
  renderProjects();
  renderAssetStatus();
  renderTemplateGuide();
  updateGenerateButtonState();
  updateActionFeedback();
  refreshBatchServiceHealth();
  syncFlowStepState();
  renderWizardStep();
  renderCurrentView();
  maybeShowOnboarding();
}

function bindEvents() {
  nodes.modelImageFile?.addEventListener("change", handleModelImageChange);
  nodes.referenceVideoFile.addEventListener("change", handleReferenceVideoChange);
  nodes.productImages.addEventListener("change", handleProductImagesChange);
  nodes.targetDurationControl?.addEventListener("input", handleTargetDurationControlChange);
  nodes.remakeButton?.addEventListener("click", handleGenerate);
  nodes.productName?.addEventListener("input", () => {
    updateGenerateButtonState();
    updateActionFeedback();
  });
  nodes.referenceBrief?.addEventListener("input", () => {
    updateGenerateButtonState();
    updateActionFeedback();
  });
  nodes.downloadJsonButton.addEventListener("click", () => downloadCurrent("json"));
  nodes.downloadMarkdownButton.addEventListener("click", () => downloadCurrent("md"));
  nodes.clearProjectsButton.addEventListener("click", clearProjects);
  nodes.importJsonInput.addEventListener("change", importJsonProject);
  nodes.downloadBundleButton.addEventListener("click", downloadBundle);
  nodes.copyClipcatPromptButton.addEventListener("click", copyClipcatPrompt);
  nodes.copyBatchTasksButton.addEventListener("click", copyBatchTasks);
  nodes.sendBatchTasksButton.addEventListener("click", sendBatchTasksToService);
  nodes.wizardPrevButton?.addEventListener("click", handleWizardPrev);
  nodes.wizardNextButton?.addEventListener("click", handleWizardNext);
  nodes.openOnboardingButton?.addEventListener("click", openOnboarding);
  nodes.reopenOnboardingDockButton?.addEventListener("click", openOnboarding);
  nodes.jumpToManageButton?.addEventListener("click", () => setCurrentView("manage"));
  nodes.dismissTemplateGuideButton?.addEventListener("click", () => {
    nodes.templateGuideCard.hidden = true;
    setActionFeedback("你也可以先继续填写，再回头补模板。");
  });
  nodes.closeOnboardingButton?.addEventListener("click", () => closeOnboarding(true));
  nodes.dismissOnboardingButton?.addEventListener("click", () => closeOnboarding(true));
  nodes.acknowledgeOnboardingButton?.addEventListener("click", () => closeOnboarding(true));
  nodes.onboardingBackdrop?.addEventListener("click", () => closeOnboarding(true));
  document.addEventListener("keydown", handleDocumentKeydown);
  document.querySelectorAll("[data-step-nav]").forEach((button) => {
    button.addEventListener("click", () => setWizardStep(Number(button.dataset.stepNav)));
  });
  document.querySelectorAll("[data-view-nav]").forEach((button) => {
    button.addEventListener("click", () => setCurrentView(button.dataset.viewNav || "generate"));
  });
  nodes.accountTemplateSelect.addEventListener("change", handleTemplateSelectionChange);
  nodes.templatePlatform.addEventListener("change", handleTemplatePlatformChange);
  nodes.templateProfileUrl.addEventListener("input", syncFlowStepState);
  nodes.scanProfileButton.addEventListener("click", handleProfileScan);
  nodes.selectAllProfileSamplesButton.addEventListener("click", selectAllProfileSamples);
  nodes.clearProfileSamplesButton.addEventListener("click", clearProfileSamplesSelection);
  nodes.keepCoveredProfileSamplesButton.addEventListener("click", keepCoveredProfileSamples);
  nodes.keepTopProfileSamplesButton.addEventListener("click", keepTopProfileSamples);
  nodes.keepCoveredPopularProfileSamplesButton.addEventListener("click", keepCoveredPopularProfileSamples);
  nodes.exportProfileCandidatesButton.addEventListener("click", exportProfileCandidates);
  nodes.redistillProfileButton.addEventListener("click", redistillFromSelectedSamples);
  nodes.applyProfileSummaryButton.addEventListener("click", applyProfileSummaryToReference);
  nodes.profileSampleSort.addEventListener("change", () => {
    profileSampleSortMode = nodes.profileSampleSort.value;
    saveProfileSampleSortMode();
    renderProfileSampleList();
  });
  nodes.profileMinViewsFilter.addEventListener("change", () => {
    profileMinViewsFilter = Number(nodes.profileMinViewsFilter.value || 0);
    saveProfileSampleMinViewsFilter();
    renderProfileSampleList();
  });
  nodes.saveTemplateButton.addEventListener("click", saveCurrentTemplate);
  nodes.deleteTemplateButton.addEventListener("click", deleteCurrentTemplate);
  nodes.newTemplateButton.addEventListener("click", createNewTemplate);
  nodes.copyBatchServiceCommandButton.addEventListener("click", copyBatchServiceCommand);
  nodes.refreshBatchServiceButton.addEventListener("click", refreshBatchServiceHealth);
  nodes.copyStartCommandButton.addEventListener("click", async () => {
    const text = "这套工作台当前是本地静态版：上传产品图后会自动拆卖点，再补一句要求即可生成提示词和批量任务。";
    await navigator.clipboard.writeText(text);
    setActionFeedback("使用说明已复制。");
  });
  nodes.retryHealthButton.addEventListener("click", () => {
    setActionFeedback("这是本地静态工作台，不需要额外启动服务。");
  });
}

function handleModelImageChange() {
  const file = nodes.modelImageFile?.files?.[0];
  if (modelPreviewUrl) {
    URL.revokeObjectURL(modelPreviewUrl);
    modelPreviewUrl = "";
  }
  if (!file) {
    nodes.modelHeroImage.hidden = true;
    renderAssetStatus();
    updateGenerateButtonState();
    return;
  }

  modelPreviewUrl = URL.createObjectURL(file);
  nodes.modelHeroImage.src = modelPreviewUrl;
  nodes.modelHeroImage.hidden = false;
  renderAssetStatus();
  updateGenerateButtonState();
  updateActionFeedback();
}

function handleReferenceVideoChange() {
  const file = nodes.referenceVideoFile.files?.[0];
  if (referencePreviewUrl) {
    URL.revokeObjectURL(referencePreviewUrl);
    referencePreviewUrl = "";
  }
  if (!file) {
    nodes.referenceVideoFileName.textContent = "请上传视频";
    nodes.referenceAnalysisStatus.textContent = "未选择参考视频";
    return;
  }

  referencePreviewUrl = URL.createObjectURL(file);
  nodes.localReferenceVideo.src = referencePreviewUrl;
  nodes.localReferenceVideo.hidden = false;
  nodes.thumbnailImage.hidden = true;
  nodes.thumbnailFallback.hidden = true;
  nodes.videoHandle.textContent = file.name;
  nodes.videoUrlText.textContent = "已加载本地参考视频";
  nodes.referenceVideoFileName.textContent = file.name;
  nodes.referenceAnalysisStatus.textContent = "已选择参考视频，可以开始拆结构。";
  updateActionFeedback();
}

function handleProductImagesChange() {
  const file = nodes.productImages.files?.[0];
  if (productPreviewUrl) {
    URL.revokeObjectURL(productPreviewUrl);
    productPreviewUrl = "";
  }
  if (!file) {
    nodes.productHeroImage.hidden = true;
    nodes.sampleProduct.hidden = false;
    nodes.productHeroBadge.hidden = true;
    renderAssetStatus();
    updateGenerateButtonState();
    return;
  }

  productPreviewUrl = URL.createObjectURL(file);
  nodes.productHeroImage.src = productPreviewUrl;
  nodes.productHeroImage.hidden = false;
  nodes.sampleProduct.hidden = true;
  nodes.productHeroBadge.hidden = true;
  autoFillProductInsightsFromImage(file);
  renderAssetStatus();
  updateGenerateButtonState();
  updateActionFeedback();
  syncFlowStepState();
}

async function handleGenerate() {
  const template = await prepareTemplateForGeneration();
  const productName = nodes.productName.value.trim();
  const referenceSummary = nodes.referenceBrief.value.trim();
  const sellingPoints = splitLines(nodes.productNotes.value);

  if (!template) {
    setActionFeedback("当前还没有可用模板，请补一个对标链接或稍后再试。", true);
    return;
  }
  if (!productName) {
    setActionFeedback("请先填写当前商品名。", true);
    return;
  }
  if (!referenceSummary) {
    setActionFeedback("请先填写你的创作提示词。", true);
    return;
  }

  currentPackage = buildRemakePackage({
    projectName: `${productName}-${template.name}-复刻包`,
    referenceSummary,
    productName,
    sellingPoints: sellingPoints.length ? sellingPoints : ["按当前商品图生成更适合直接投放的短视频提示词"],
    hookStyle: nodes.hookStyle.value,
    visualStyle: nodes.visualStyle.value,
    cta: nodes.ctaText.value,
    durationSeconds: Number(nodes.targetDuration.value || template.defaultDurationSeconds || 30),
    generationCount: Number(nodes.generationCount.value || 3),
    aspectRatio: nodes.aspectRatioSelect?.value || "9:16",
    voiceDialect: nodes.voiceDialect.value,
    tiktokUrl: nodes.tiktokUrl.value.trim(),
    referencePlatform: nodes.clipcatReferencePlatform.value,
    voiceLanguage: nodes.clipcatVoiceLanguage.value,
    extraRules: nodes.clipcatExtraRules.value.trim(),
    productImageCount: nodes.productImages.files?.length || 0,
    accountTemplate: template
  });

  const record = {
    id: `project-${Date.now()}`,
    createdAt: new Date().toISOString(),
    package: currentPackage
  };
  projects.unshift(record);
  currentProjectId = record.id;
  saveProjects();
  syncFormWithCurrentPackage();
  renderProjects();
  renderShotEditor();
  renderProjectDetail();
  updateResultButtons();
  setActionFeedback(`已生成 ${currentPackage.batchVideoTasks?.length || 0} 条可直接去跑的提示词任务。`);
  syncFlowStepState();
  setWizardStep(4);
  setCurrentView("history");
}

function renderProjects() {
  ensureCurrentProject();
  nodes.seriesCount.textContent = `${projects.length} 个项目`;
  nodes.seriesStats.innerHTML = `
    <div class="badge">最近沉淀 ${projects.length} 个结果</div>
    <div class="badge">可选蒸馏模型 ${accountTemplates.length} 个</div>
    <div class="badge">输出：提示词 / 提交入口 / 导出</div>
  `;

  if (projects.length === 0) {
    currentProjectId = null;
    currentPackage = null;
    nodes.currentTaskStatusBadge.textContent = "等待生成";
    nodes.currentTaskUnitLabel.textContent = "第 1 条";
    nodes.currentTaskHint.textContent = "先去生成页上传产品图并补一句要求，结果出来后会自动回到这里。";
    nodes.projectDetailPanel.innerHTML = `<div class="emptyStateCard"><strong>当前还没有生成结果</strong><p>先去生成页完成一次生成。完成后，这里会承接项目摘要、提示词、批量任务和镜头细节。</p></div>`;
    nodes.shotEditorPanel.innerHTML = "";
    nodes.seriesList.innerHTML = `<div class="emptyStateCard"><strong>还没有最近记录</strong><p>第一次生成完成后，这里会保留最近结果、第一条提示词预览和切换入口。</p></div>`;
    renderCurrentResultSummary();
    updateResultButtons();
    return;
  }

  nodes.currentTaskStatusBadge.textContent = "可提交";
  nodes.currentTaskUnitLabel.textContent = `第 1 条 / 共 ${currentPackage?.batchVideoTasks?.length || 1} 条`;
  nodes.currentTaskHint.textContent = currentPackage
    ? `当前项目：${currentPackage.project.projectName}。先检查摘要和提示词，再决定复制、提交或微调镜头。`
    : "当前任务已准备好，可以继续处理。";

  nodes.seriesList.innerHTML = projects
    .slice(0, 6)
    .map((item) => {
      const pkg = item.package;
      const firstPrompt = pkg.prompts.videoShots[0];
      const isActive = item.id === currentProjectId;
      return `
        <article class="panel projectListCard wizardQueueCard ${isActive ? "is-active" : ""}">
          <div class="panelHead wizardQueueHead">
            <div class="projectListMeta">
              <strong>${escapeHtml(pkg.project.projectName)}</strong>
              <div class="wizardQueueBadges">
                <span class="countBadge">${pkg.shots.length} 个镜头</span>
                <span class="countBadge">${pkg.batchVideoTasks?.length || 0} 条任务</span>
                <span class="countBadge">${escapeHtml(pkg.project.accountTemplate?.name || "未选模板")}</span>
              </div>
            </div>
            <div class="projectListActions">
              <button class="ghostButton projectListButton" type="button" data-project-select="${item.id}">${isActive ? "当前任务" : "切换到这里"}</button>
              <button class="ghostButton projectListDeleteButton" type="button" data-project-delete="${item.id}">删除</button>
            </div>
          </div>
          <div class="wizardQueueBody">
            <p>${escapeHtml(pkg.project.referenceSummary)}</p>
            <p><strong>商品：</strong>${escapeHtml(pkg.project.productName)}</p>
            <p><strong>当前重点：</strong>${escapeHtml(pkg.project.sellingPoints?.[0] || "按当前项目主卖点执行")}</p>
          </div>
          <details class="wizardQueuePrompt">
            <summary>查看第一条提示词</summary>
            <pre>${escapeHtml(pkg.batchVideoTasks?.[0]?.prompt || firstPrompt)}</pre>
          </details>
        </article>
      `;
    })
    .join("");

  bindProjectListEvents();
  renderCurrentResultSummary();
  renderProjectDetail();
  renderShotEditor();
  updateResultButtons();
}

function renderProjectDetail() {
  if (!currentPackage) {
    nodes.projectDetailPanel.innerHTML = `<div class="emptyStateCard"><strong>当前还没有任务详情</strong><p>生成后，这里会显示项目摘要、提示词、批量任务和镜头细节。</p></div>`;
    return;
  }

  const tabMap = {
    summary: buildSummaryText(currentPackage),
    distilled: [
      currentPackage.distilledFramework.summary,
      "",
      ...currentPackage.distilledFramework.breakdown.map((item) => `- ${item}`)
    ].join("\n"),
    shots: currentPackage.shots
      .map(
        (shot) =>
          `镜头 ${shot.shotNumber}：${shot.title}\n目标：${shot.purpose}\n动作：${shot.action}\n商品任务：${shot.productRole}\n口播意图：${shot.lineIntent}`
      )
      .join("\n\n"),
    prompts: currentPackage.prompts.videoShots
      .map((prompt, index) => `视频提示词 ${index + 1}\n${prompt}`)
      .join("\n\n"),
    variants: (currentPackage.promptVariants || [])
      .map(
        (variant) =>
          `${variant.title}\n${variant.summary}\n\n${variant.videoShots
            .map((line, index) => `${index + 1}. ${line}`)
            .join("\n")}`
      )
      .join("\n\n"),
    batch: (currentPackage.batchVideoTasks || [])
      .map(
        (task) =>
          `${task.taskTitle}\n任务编号：${task.taskId}\n模型：${task.model}\n时长：${task.durationSeconds} 秒\n状态：${task.status}\n模板：${task.accountTemplateName}\n\n${task.prompt}`
      )
      .join("\n\n"),
    review: currentPackage.reviewChecklist.map((item) => `- ${item}`).join("\n")
  };

  const metaTextMap = {
    distilled: "这里是按对标账户模板抽出来的框架，不是照抄原视频。",
    variants: "这里给你 3 套候选版本：稳妥、快节奏、强转化。",
    batch: "这里是一组准备发给本地视频服务的批量任务。"
  };

  nodes.projectDetailPanel.innerHTML = `
    <div class="detailTabs">
      ${[
        ["summary", "项目摘要"],
        ["distilled", "蒸馏摘要"],
        ["shots", "镜头详情"],
        ["prompts", "提示词"],
        ["variants", "候选版本"],
        ["batch", "批量任务"],
        ["review", "审片清单"]
      ]
        .map(
          ([key, label]) =>
            `<button class="detailTabButton ${activeDetailTab === key ? "is-active" : ""}" type="button" data-detail-tab="${key}">${label}</button>`
        )
        .join("")}
    </div>
    <div class="detailContent">${metaTextMap[activeDetailTab] ? `<div class="detailMeta">${escapeHtml(metaTextMap[activeDetailTab])}</div>` : ""}<pre>${escapeHtml(tabMap[activeDetailTab] || "")}</pre></div>
  `;

  nodes.projectDetailPanel.querySelectorAll("[data-detail-tab]").forEach((button) => {
    button.addEventListener("click", () => {
      activeDetailTab = button.dataset.detailTab;
      renderProjectDetail();
    });
  });
}

function renderShotEditor() {
  if (!currentPackage) {
    nodes.shotEditorPanel.innerHTML = "";
    return;
  }

  nodes.shotEditorPanel.innerHTML = currentPackage.shots
    .map(
      (shot) => `
        <article class="shotCard" data-shot-number="${shot.shotNumber}">
          <div class="shotCardHead">
            <strong>镜头 ${shot.shotNumber}：${escapeHtml(shot.title)}</strong>
            <button class="ghostButton shotSaveButton" type="button" data-shot-save="${shot.shotNumber}">保存这条镜头</button>
          </div>
          <div class="shotCardGrid">
            <label class="fieldBlock">
              镜头目标
              <textarea data-field="purpose" rows="3">${escapeHtml(shot.purpose)}</textarea>
            </label>
            <label class="fieldBlock">
              动作描述
              <textarea data-field="action" rows="3">${escapeHtml(shot.action)}</textarea>
            </label>
            <label class="fieldBlock">
              商品任务
              <textarea data-field="productRole" rows="3">${escapeHtml(shot.productRole)}</textarea>
            </label>
            <label class="fieldBlock">
              口播意图
              <textarea data-field="lineIntent" rows="3">${escapeHtml(shot.lineIntent)}</textarea>
            </label>
          </div>
          <div class="shotPromptPreview">${escapeHtml(currentPackage.prompts.videoShots[shot.shotNumber - 1])}</div>
        </article>
      `
    )
    .join("");

  nodes.shotEditorPanel.querySelectorAll(".shotSaveButton").forEach((button) => {
    button.addEventListener("click", () => saveShotEdit(Number(button.dataset.shotSave)));
  });
}

function saveShotEdit(shotNumber) {
  if (!currentPackage) return;
  const card = nodes.shotEditorPanel.querySelector(`[data-shot-number="${shotNumber}"]`);
  if (!card) return;
  const patch = {};
  card.querySelectorAll("[data-field]").forEach((field) => {
    patch[field.dataset.field] = field.value.trim();
  });
  currentPackage = updateShot(currentPackage, shotNumber, patch);
  replaceCurrentProject(currentPackage);
  renderProjects();
  setActionFeedback(`镜头 ${shotNumber} 已更新，相关提示词和批量任务已重生成。`);
}

function downloadCurrent(format) {
  if (!currentPackage) {
    setActionFeedback("当前没有可下载的复刻包。", true);
    return;
  }

  if (format === "json") {
    downloadBlob(
      `${currentPackage.project.projectName}.json`,
      JSON.stringify(currentPackage, null, 2),
      "application/json"
    );
    return;
  }

  downloadBlob(
    `${currentPackage.project.projectName}.md`,
    buildMarkdownFromPackage(currentPackage),
    "text/markdown"
  );
}

function clearProjects() {
  projects = [];
  currentPackage = null;
  currentProjectId = null;
  saveProjects();
  renderProjects();
  nodes.projectDetailPanel.innerHTML = "";
  nodes.shotEditorPanel.innerHTML = "";
  setActionFeedback("本地记录已清空。");
}

async function importJsonProject(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  try {
    const text = await file.text();
    const parsed = JSON.parse(text);
    currentPackage = regeneratePrompts(parsed);
    const record = {
      id: `project-${Date.now()}`,
      createdAt: new Date().toISOString(),
      package: currentPackage
    };
    projects.unshift(record);
    currentProjectId = record.id;
    saveProjects();
    syncFormWithCurrentPackage();
    renderProjects();
    setActionFeedback("JSON 项目已导入，可以继续改模板和镜头。");
  } catch {
    setActionFeedback("导入失败：请确认是本插件导出的 JSON。", true);
  } finally {
    event.target.value = "";
  }
}

function downloadBundle() {
  if (!currentPackage) {
    setActionFeedback("当前没有可批量导出的项目。", true);
    return;
  }
  const bundle = buildExportBundle(currentPackage);
  for (const file of bundle.files) {
    const [, ...parts] = file.path.split("/");
    const filename = parts.join("__");
    const type = filename.endsWith(".json") ? "application/json" : "text/plain";
    downloadBlob(filename, file.content, type);
  }
  setActionFeedback(`已按项目结构导出 ${bundle.files.length} 个文件。`);
}

async function copyClipcatPrompt() {
  const text = buildSafeClipcatPrompt({
    productName: nodes.productName.value.trim() || "当前商品",
    productImageCount: nodes.productImages.files?.length || 0,
    tiktokUrl: nodes.tiktokUrl.value.trim(),
    referencePlatform: nodes.clipcatReferencePlatform.value,
    durationSeconds: Number(nodes.targetDuration.value || 15),
    voiceLanguage: nodes.clipcatVoiceLanguage.value,
    extraRules: nodes.clipcatExtraRules.value.trim() || "不要字幕，保留强钩子。"
  });
  await navigator.clipboard.writeText(text);
  setActionFeedback("Clipcat 安全改写指令已复制。");
}

async function copyBatchTasks() {
  if (!currentPackage) {
    setActionFeedback("当前没有批量任务可复制。", true);
    return;
  }
  await navigator.clipboard.writeText(JSON.stringify(currentPackage.batchVideoTasks, null, 2));
  setActionFeedback("批量视频任务 JSON 已复制。");
}

async function sendBatchTasksToService() {
  if (!currentPackage) {
    setActionFeedback("当前没有批量任务可发送。", true);
    return;
  }

  try {
    const response = await fetch(`${batchServiceBaseUrl}/api/video-batches`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        projectName: currentPackage.project.projectName,
        accountTemplate: currentPackage.project.accountTemplate,
        tasks: currentPackage.batchVideoTasks,
        submitMode: "queue_only"
      })
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.message || `${response.status} ${response.statusText}`);
    }
    setActionFeedback(`已发送到本地服务，批次号：${data.batchId || "未返回"}`);
    refreshBatchServiceHealth();
  } catch (error) {
    setActionFeedback(`发送失败：${error instanceof Error ? error.message : String(error)}`, true);
  }
}

async function refreshBatchServiceHealth() {
  try {
    const response = await fetch(`${batchServiceBaseUrl}/health`);
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
    nodes.batchServiceStatus.textContent = data.mode === "proxy_ready" ? "可转发" : "队列模式";
    nodes.batchServiceStatus.classList.add("is-ok");
    nodes.batchServiceStatus.classList.remove("is-error");
  } catch {
    nodes.batchServiceStatus.textContent = "未连接";
    nodes.batchServiceStatus.classList.add("is-error");
    nodes.batchServiceStatus.classList.remove("is-ok");
  }
}

async function copyBatchServiceCommand() {
  await navigator.clipboard.writeText(batchServiceCommand);
  setActionFeedback("本地视频任务服务启动命令已复制。");
}

function handleTemplateSelectionChange() {
  selectedTemplateId = nodes.accountTemplateSelect.value;
  currentProfileScan = null;
  selectedProfileVideoUrls = new Set();
  syncTemplateForm();
  applyTemplateToGenerationFields();
  renderTemplateGuide();
  renderProfileScanState();
  setActionFeedback("已切换对标账户模板。");
}

function handleTemplatePlatformChange() {
  updatePlatformDependentUi();
  renderProfileScanState();
  setActionFeedback(
    nodes.templatePlatform.value === "douyin"
      ? "已切到抖音模式。系统会默认用中文提示词，并优先匹配抖音模板。"
      : "已切到 TikTok 模式。系统会默认用英文提示词，并优先匹配 TikTok 模板。"
  );
  syncFlowStepState();
}

function saveCurrentTemplate() {
  const template = normalizeAccountTemplate({
    id: selectedTemplateId || undefined,
    name: nodes.templateName.value.trim(),
    platform: nodes.templatePlatform.value,
    accountHandle: nodes.templateAccountHandle.value.trim(),
    profileUrl: nodes.templateProfileUrl.value.trim(),
    contentPositioning: nodes.templateContentPositioning.value.trim(),
    hookStyle: nodes.hookStyle.value,
    rhythm: nodes.templateRhythm.value.trim(),
    structure: nodes.templateStructure.value.trim(),
    expressionDna: nodes.templateExpressionDna.value.trim(),
    decisionHeuristics: nodes.templateDecisionHeuristics.value.trim(),
    antiPatterns: nodes.templateAntiPatterns.value.trim(),
    recentSignals: nodes.templateRecentSignals.value.trim(),
    ctaStyle: nodes.ctaText.value.trim(),
    rewriteRules: nodes.templateRewriteRules.value.trim(),
    defaultDurationSeconds: Number(nodes.targetDuration.value || 30),
    defaultVoiceLanguage: nodes.clipcatVoiceLanguage.value,
    preferredModel: nodes.templatePreferredModel.value.trim() || "veo-3-fast",
    sampleVideoUrls: splitLines(nodes.templateSampleVideoUrls.value)
  });

  const index = accountTemplates.findIndex((item) => item.id === template.id);
  if (index === -1) {
    accountTemplates.unshift(template);
  } else {
    accountTemplates[index] = template;
  }
  selectedTemplateId = template.id;
  saveAccountTemplates();
  renderTemplateOptions();
  syncTemplateForm();
  renderTemplateGuide();
  renderProfileScanState();
  setActionFeedback(`模板已保存：${template.name}`);
}

function deleteCurrentTemplate() {
  if (!selectedTemplateId) {
    setActionFeedback("当前没有可删除的模板。", true);
    return;
  }
  const index = accountTemplates.findIndex((item) => item.id === selectedTemplateId);
  if (index === -1) return;
  const [removed] = accountTemplates.splice(index, 1);
  selectedTemplateId = accountTemplates[0]?.id || "";
  if (accountTemplates.length === 0) {
    accountTemplates = buildDefaultTemplates();
    selectedTemplateId = accountTemplates[0].id;
  }
  saveAccountTemplates();
  renderTemplateOptions();
  syncTemplateForm();
  applyTemplateToGenerationFields();
  renderTemplateGuide();
  currentProfileScan = null;
  selectedProfileVideoUrls = new Set();
  renderProfileScanState();
  setActionFeedback(`模板已删除：${removed.name}`);
}

function createNewTemplate() {
  const empty = normalizeAccountTemplate({
    ...createEmptyAccountTemplate(),
    id: `template-${Date.now()}`,
    name: "新模板"
  });
  accountTemplates.unshift(empty);
  selectedTemplateId = empty.id;
  currentProfileScan = null;
  selectedProfileVideoUrls = new Set();
  saveAccountTemplates();
  renderTemplateOptions();
  syncTemplateForm();
  renderTemplateGuide();
  renderProfileScanState();
  setActionFeedback("已新建空模板，你也可以直接提炼主页模板自动生成。");
}

function renderTemplateOptions() {
  if (!accountTemplates.length) {
    accountTemplates = buildDefaultTemplates();
    selectedTemplateId = accountTemplates[0].id;
    saveAccountTemplates();
  }

  nodes.accountTemplateSelect.innerHTML = accountTemplates
    .map(
      (template) =>
        `<option value="${escapeHtml(template.id)}" ${template.id === selectedTemplateId ? "selected" : ""}>${escapeHtml(template.name)}</option>`
    )
    .join("");
}

function isTemplateGuideNeeded(template) {
  if (!template) return false;
  const weakFields = [
    template.contentPositioning,
    template.rhythm,
    template.structure,
    template.expressionDna
  ].filter((item) => String(item || "").trim());
  const isNamedBlankTemplate = ["新模板", "未命名模板"].includes(String(template.name || "").trim());
  return isNamedBlankTemplate || weakFields.length < 2;
}

function renderTemplateGuide() {
  if (!nodes.templateGuideCard || !nodes.templateGuideSummary) return;
  const template = getSelectedTemplate();
  const shouldShow = isTemplateGuideNeeded(template);
  nodes.templateGuideCard.hidden = !shouldShow;
  if (!shouldShow || !template) {
    return;
  }
  const checks = [
    ["内容定位", Boolean(template.contentPositioning?.trim())],
    ["节奏", Boolean(template.rhythm?.trim())],
    ["结构拆解", Boolean(template.structure?.trim())],
    ["表达 DNA", Boolean(template.expressionDna?.trim())]
  ];
  nodes.templateGuideSummary.innerHTML = `
    <strong>当前模板：${escapeHtml(template.name || "未命名模板")}</strong>
    <div class="templateGuideChecklist">
      ${checks
        .map(
          ([label, ready]) =>
            `<span class="templateGuideChip ${ready ? "is-ready" : ""}">${escapeHtml(label)}：${ready ? "已补" : "待补"}</span>`
        )
        .join("")}
    </div>
    <p>如果你还没准备模板，最稳的做法是去蒸馏管理里先补 2 到 4 项基础信息，或者直接贴主页链接去提炼。</p>
  `;
}

function syncTemplateForm() {
  const template = getSelectedTemplate();
  if (!template) return;
  nodes.templateName.value = template.name || "";
  nodes.templatePlatform.value = template.platform || "tiktok";
  nodes.templateAccountHandle.value = template.accountHandle || "";
  nodes.templateProfileUrl.value = template.profileUrl || "";
  nodes.templateContentPositioning.value = template.contentPositioning || "";
  nodes.templateRhythm.value = template.rhythm || "";
  nodes.templatePreferredModel.value = template.preferredModel || "veo-3-fast";
  nodes.templateStructure.value = template.structure || "";
  nodes.templateExpressionDna.value = template.expressionDna || "";
  nodes.templateDecisionHeuristics.value = template.decisionHeuristics || "";
  nodes.templateAntiPatterns.value = template.antiPatterns || "";
  nodes.templateRecentSignals.value = template.recentSignals || "";
  nodes.templateRewriteRules.value = template.rewriteRules || "";
  nodes.templateSampleVideoUrls.value = (template.sampleVideoUrls || []).join("\n");
  updatePlatformDependentUi();
}

function applyTemplateToGenerationFields() {
  const template = getSelectedTemplate();
  if (!template) return;
  nodes.hookStyle.value = template.hookStyle || nodes.hookStyle.value;
  nodes.ctaText.value = template.ctaStyle || nodes.ctaText.value;
  syncTargetDurationControl(template.defaultDurationSeconds || 30);
  nodes.clipcatReferencePlatform.value = template.platform || "tiktok";
  nodes.clipcatVoiceLanguage.value = template.defaultVoiceLanguage || "英文";
  nodes.clipcatExtraRules.value = template.rewriteRules || "";
  updatePlatformDependentUi();
}

function handleTargetDurationControlChange() {
  syncTargetDurationControl(nodes.targetDurationControl?.value || nodes.targetDuration.value || 30);
}

function syncTargetDurationControl(value) {
  const nextDuration = Math.max(1, Math.min(60, Number(value || 30) || 30));
  nodes.targetDuration.value = String(nextDuration);
  if (nodes.targetDurationControl) {
    nodes.targetDurationControl.value = String(nextDuration);
  }
  if (nodes.targetDurationLabel) {
    nodes.targetDurationLabel.textContent = `${nextDuration} 秒`;
  }
}

async function prepareTemplateForGeneration() {
  const platform = nodes.templatePlatform.value || "tiktok";
  const profileUrl = nodes.templateProfileUrl.value.trim();
  const preferredTemplate = pickPreferredTemplateForPlatform(platform, profileUrl);

  if (preferredTemplate) {
    selectedTemplateId = preferredTemplate.id;
    renderTemplateOptions();
    syncTemplateForm();
    applyTemplateToGenerationFields();
  }

  if (!profileUrl) {
    return getSelectedTemplate();
  }

  if (!isProfileAutoScanSupported(platform) || !isSupportedProfileUrl(profileUrl, platform)) {
    setActionFeedback("已跳过主页智能参考，当前按平台默认模板继续生成。");
    return getSelectedTemplate();
  }

  const existingTemplate = accountTemplates.find((item) => item.profileUrl === profileUrl);
  if (existingTemplate) {
    selectedTemplateId = existingTemplate.id;
    renderTemplateOptions();
    syncTemplateForm();
    applyTemplateToGenerationFields();
    setActionFeedback("已直接使用这个主页对应的现成模板。");
    return getSelectedTemplate();
  }

  setActionFeedback("正在智能参考对标主页风格，完成后会继续生成。");
  try {
    const scan = await scanProfileByPlatform(profileUrl, Number(nodes.profileSampleLimit.value || 6), platform);
    currentProfileScan = scan;
    selectedProfileVideoUrls = new Set(scan.videos.map((item) => item.videoUrl));
    pinnedProfileVideoUrls = [];
    excludedProfileVideoUrls = new Set();
    applyDistilledTemplateToForm(scan);
    upsertTemplateFromScan(scan);
    renderProfileScanState();
    return getSelectedTemplate();
  } catch (error) {
    setActionFeedback(
      `对标主页暂时没参考成功，已自动退回平台默认模板继续生成。${error instanceof Error ? ` ${error.message}` : ""}`.trim()
    );
    return getSelectedTemplate();
  }
}

function pickPreferredTemplateForPlatform(platform, profileUrl = "") {
  if (profileUrl) {
    const exactTemplate = accountTemplates.find((item) => item.profileUrl === profileUrl);
    if (exactTemplate) return exactTemplate;
  }
  return accountTemplates.find((item) => item.platform === platform) || accountTemplates[0] || null;
}

function autoFillProductInsightsFromImage(file) {
  const template = getSelectedTemplate() || {};
  const result = inferProductInsightsFromAsset({
    fileName: file?.name || "",
    productName: nodes.productName.value.trim(),
    template
  });

  if (!nodes.productName.value.trim() && result.suggestedProductName && result.suggestedProductName !== "当前商品") {
    nodes.productName.value = result.suggestedProductName;
  }
  if (!splitLines(nodes.productNotes.value).length) {
    nodes.productNotes.value = result.sellingPoints.join("\n");
  }
  if (!nodes.referenceBrief.value.trim()) {
    nodes.referenceBrief.value = result.suggestedPrompt;
  }
  setActionFeedback("产品图已上传，已自动提炼一版商品名、卖点和提示词草稿。");
}

function renderProfileScanState() {
  const platform = nodes.templatePlatform.value || "tiktok";
  const canAutoScan = isProfileAutoScanSupported(platform);
  const hasSamePlatformScan = Boolean(currentProfileScan) && (currentProfileScan.platform || "tiktok") === platform;
  const canUseScanActions = hasSamePlatformScan && canAutoScan;

  nodes.applyProfileSummaryButton.disabled = !canUseScanActions;
  nodes.redistillProfileButton.disabled = !canUseScanActions;
  nodes.selectAllProfileSamplesButton.disabled = !canUseScanActions;
  nodes.clearProfileSamplesButton.disabled = !canUseScanActions;
  nodes.keepCoveredProfileSamplesButton.disabled = !canUseScanActions;
  nodes.keepTopProfileSamplesButton.disabled = !canUseScanActions;
  nodes.keepCoveredPopularProfileSamplesButton.disabled = !canUseScanActions;
  nodes.exportProfileCandidatesButton.disabled = !canUseScanActions;
  nodes.profileSampleSort.disabled = !canUseScanActions;
  nodes.profileMinViewsFilter.disabled = !canUseScanActions;

  if (!currentProfileScan) {
    if (canAutoScan) {
      nodes.profileScanStatus.textContent = "系统自动";
      nodes.profileScanStatus.classList.remove("is-ok", "is-error");
      nodes.profileScanResult.textContent = "普通用户默认不需要手动蒸馏。你贴对标主页后，系统会在生成时自动尽量参考该风格。";
    } else {
      nodes.profileScanStatus.textContent = "手动模式";
      nodes.profileScanStatus.classList.add("is-error");
      nodes.profileScanStatus.classList.remove("is-ok");
      nodes.profileScanResult.textContent = "抖音版当前先保留手动模板沉淀。可直接填写内容定位、节奏、结构、表达 DNA 和样本链接。";
    }
    nodes.profileSampleSort.value = "captured";
    nodes.profileMinViewsFilter.value = "0";
    nodes.profileSampleList.innerHTML = "";
    return;
  }

  if (!canAutoScan) {
    nodes.profileSampleSort.value = profileSampleSortMode;
    nodes.profileMinViewsFilter.value = String(profileMinViewsFilter);
    nodes.profileScanStatus.textContent = "手动模式";
    nodes.profileScanStatus.classList.add("is-error");
    nodes.profileScanStatus.classList.remove("is-ok");
    nodes.profileScanResult.textContent = `抖音版当前先保留手动模板沉淀。已保留上次 TikTok 蒸馏样本 ${currentProfileScan.videos.length} 条，仅供参考；切回 TikTok 模式后可继续筛片和重蒸馏。`;
    nodes.profileSampleList.innerHTML = `<p class="emptyState">已暂存 ${currentProfileScan.videos.length} 条 TikTok 公开样本。切回 TikTok 模式后可继续使用。</p>`;
    return;
  }

  if (!hasSamePlatformScan) {
    nodes.profileScanStatus.textContent = "待重扫";
    nodes.profileScanStatus.classList.remove("is-ok");
    nodes.profileScanStatus.classList.add("is-error");
    nodes.profileScanResult.textContent = `当前暂存的是${getPlatformLabel(currentProfileScan.platform || "tiktok")}样本，和已选模板平台不一致。请重新扫描${getPlatformLabel(platform)}主页。`;
    nodes.profileSampleList.innerHTML = `<p class="emptyState">已暂存 ${currentProfileScan.videos.length} 条${getPlatformLabel(currentProfileScan.platform || "tiktok")}样本。切回原平台或重新扫描当前平台后可继续使用。</p>`;
    return;
  }

  nodes.profileSampleSort.value = profileSampleSortMode;
  nodes.profileMinViewsFilter.value = String(profileMinViewsFilter);
  nodes.profileScanStatus.textContent = "已参考";
  nodes.profileScanStatus.classList.add("is-ok");
  nodes.profileScanStatus.classList.remove("is-error");
  nodes.profileScanResult.textContent = buildProfileScanResultText();
  renderProfileSampleList();
}

async function handleProfileScan() {
  const profileUrl = nodes.templateProfileUrl.value.trim();
  const platform = nodes.templatePlatform.value || "tiktok";
  if (!profileUrl) {
    setActionFeedback("请先填对标主页链接。", true);
    nodes.profileScanStatus.textContent = "缺链接";
    nodes.profileScanStatus.classList.add("is-error");
    return;
  }
  if (!isProfileAutoScanSupported(platform)) {
    setActionFeedback("当前平台还没接入主页自动蒸馏，请先手动填写模板字段。", true);
    nodes.profileScanStatus.textContent = "手动模式";
    nodes.profileScanStatus.classList.add("is-error");
    nodes.profileScanStatus.classList.remove("is-ok");
    nodes.profileScanResult.textContent = "当前平台还没接入主页自动蒸馏，可直接填写内容定位、节奏、结构、表达 DNA 和样本链接。";
    return;
  }

  if (!isSupportedProfileUrl(profileUrl, platform)) {
    setActionFeedback(
      platform === "douyin"
        ? "主页链接格式不对，抖音主页应类似 https://www.douyin.com/user/xxxx 。"
        : "主页链接格式不对，TikTok 账号主页应类似 https://www.tiktok.com/@account_name 。",
      true
    );
    nodes.profileScanStatus.textContent = "链接错误";
    nodes.profileScanStatus.classList.add("is-error");
    return;
  }

  nodes.scanProfileButton.disabled = true;
  nodes.profileScanStatus.textContent = "扫描中";
  nodes.profileScanStatus.classList.remove("is-ok", "is-error");
  nodes.profileScanResult.textContent = `正在打开${getPlatformLabel(platform)}主页并抓公开样本，请等页面加载完成。`;
  setActionFeedback("正在抓取主页公开内容，完成后会自动生成模板并加入模板列表。");

  try {
    const scan = await scanProfileByPlatform(profileUrl, Number(nodes.profileSampleLimit.value || 6), platform);
    currentProfileScan = scan;
    selectedProfileVideoUrls = new Set(scan.videos.map((item) => item.videoUrl));
    pinnedProfileVideoUrls = [];
    excludedProfileVideoUrls = new Set();
    applyDistilledTemplateToForm(scan);
    upsertTemplateFromScan(scan);
    renderProfileScanState();
    const coveredCount = scan.videos.filter((item) => item.thumbnailUrl).length;
    const withViewsCount = scan.videos.filter((item) => Number(item.stats?.views || 0) > 0).length;
    const withDurationCount = scan.videos.filter((item) => Number(item.durationSeconds || 0) > 0).length;
    setActionFeedback(
      `模板已生成并加入列表，当前抓到 ${scan.videos.length} 条公开样本；其中 ${coveredCount} 条有封面，${withViewsCount} 条带播放数据，${withDurationCount} 条带时长。`
    );
  } catch (error) {
    currentProfileScan = null;
    selectedProfileVideoUrls = new Set();
    pinnedProfileVideoUrls = [];
    excludedProfileVideoUrls = new Set();
    nodes.profileScanStatus.textContent = "扫描失败";
    nodes.profileScanStatus.classList.add("is-error");
    nodes.profileScanStatus.classList.remove("is-ok");
    nodes.profileScanResult.textContent = error instanceof Error ? error.message : String(error);
    setActionFeedback(`主页扫描失败：${error instanceof Error ? error.message : String(error)}`, true);
  } finally {
    nodes.scanProfileButton.disabled = false;
  }
}

function upsertTemplateFromScan(scan) {
  const distilled = distillAccountTemplateFromProfileScan(scan, {
    name: nodes.templateName.value.trim() || undefined
  });
  const existing = accountTemplates.find(
    (item) =>
      item.profileUrl === distilled.profileUrl ||
      (item.platform === distilled.platform && item.accountHandle === distilled.accountHandle)
  );
  const template = normalizeAccountTemplate({
    ...distilled,
    id: existing?.id || `template-${Date.now()}`
  });
  const index = accountTemplates.findIndex((item) => item.id === template.id);
  if (index === -1) {
    accountTemplates.unshift(template);
  } else {
    accountTemplates[index] = template;
  }
  selectedTemplateId = template.id;
  saveAccountTemplates();
  renderTemplateOptions();
  syncTemplateForm();
  applyTemplateToGenerationFields();
}

function renderProfileSampleList() {
  if (!currentProfileScan?.videos?.length) {
    nodes.profileSampleList.innerHTML = "";
    return;
  }

  const selectedCount = getSelectedProfileVideos().length;
  const sortedVideos = getSortedProfileVideos();
  const visibleVideoUrls = new Set(getVisibleProfileVideos().map((video) => video.videoUrl));
  const visibleVideos = sortedVideos.filter((video) => visibleVideoUrls.has(video.videoUrl));
  const excludedVideos = currentProfileScan.videos.filter((video) => excludedProfileVideoUrls.has(video.videoUrl));
  nodes.profileSampleList.innerHTML = `
    <div class="profileSampleMeta">已选 ${selectedCount} / ${currentProfileScan.videos.length} 条样本。当前列表显示 ${visibleVideos.length} 条；可按播放阈值、置顶和排除快速筛。</div>
    ${visibleVideos
      .map((video, index) => {
        const checked = selectedProfileVideoUrls.has(video.videoUrl) ? "checked" : "";
        const hitReasons = getProfileSampleHitReasons(video);
        const isPinned = pinnedProfileVideoUrls.includes(video.videoUrl);
        const pinIndex = pinnedProfileVideoUrls.indexOf(video.videoUrl);
        const stateBadges = [];
        if (checked) stateBadges.push('<span class="profileSampleBadge is-selected">已选中</span>');
        if (isPinned) stateBadges.push(`<span class="profileSampleBadge is-pinned">置顶 #${pinIndex + 1}</span>`);
        if (!video.thumbnailUrl) stateBadges.push('<span class="profileSampleBadge is-muted">待补封面</span>');
        return `
          <label class="profileSampleCard">
            <div class="profileSampleThumb">
              ${video.thumbnailUrl ? `<img src="${escapeHtml(video.thumbnailUrl)}" alt="样本 ${index + 1} 封面" />` : `<span>无封面</span>`}
            </div>
            <div class="profileSampleBody">
              <div class="profileSampleHead">
                <input class="profileSampleCheckbox" type="checkbox" data-profile-video="${escapeHtml(video.videoUrl)}" ${checked} />
                <div>
                  <div class="profileSampleTitle">样本 ${index + 1}</div>
                  <div class="profileSampleMeta">${escapeHtml(video.caption || "无文案")}<\/div>
                </div>
              </div>
              ${stateBadges.length ? `<div class="profileSampleStateRow">${stateBadges.join("")}</div>` : ""}
              <div class="profileSampleStats">
                <span class="profileSampleBadge">播放 ${formatCompactNumber(video.stats?.views || 0)}</span>
                <span class="profileSampleBadge">点赞 ${formatCompactNumber(video.stats?.likes || 0)}</span>
                <span class="profileSampleBadge">收藏 ${formatCompactNumber(video.stats?.saves || video.detailMetrics?.collects || 0)}</span>
                <span class="profileSampleBadge">时长 ${Number(video.durationSeconds || 0)} 秒</span>
                <span class="profileSampleBadge ${video.thumbnailUrl ? "" : "is-coverless"}">${video.thumbnailUrl ? "有封面" : "无封面"}</span>
                ${hitReasons.map((reason) => `<span class="profileSampleBadge is-hit">${escapeHtml(reason)}</span>`).join("")}
              </div>
              <div class="profileSampleActions">
                <button type="button" data-keep-only-video="${escapeHtml(video.videoUrl)}">只保留这条</button>
                <button type="button" data-pin-video="${escapeHtml(video.videoUrl)}">${isPinned ? "取消置顶" : "置顶到最前"}</button>
                ${isPinned ? `<button type="button" data-pin-up-video="${escapeHtml(video.videoUrl)}" ${pinIndex <= 0 ? "disabled" : ""}>上移</button>` : ""}
                ${isPinned ? `<button type="button" data-pin-down-video="${escapeHtml(video.videoUrl)}" ${pinIndex === -1 || pinIndex >= pinnedProfileVideoUrls.length - 1 ? "disabled" : ""}>下移</button>` : ""}
                <button type="button" data-exclude-video="${escapeHtml(video.videoUrl)}">排除这条</button>
                <a href="${escapeHtml(video.videoUrl)}" target="_blank" rel="noreferrer">打开视频</a>
              </div>
              <a class="profileSampleLink" href="${escapeHtml(video.videoUrl)}" target="_blank" rel="noreferrer">${escapeHtml(video.videoUrl)}</a>
            </div>
          </label>
        `;
      })
      .join("")}
    ${excludedVideos.length ? `
      <div class="profileExcludedPanel">
        <div class="profileExcludedHead">
          <div class="profileSampleMeta">已排除 ${excludedVideos.length} 条样本，可按需恢复。</div>
          <div class="profileExcludedActions">
            <button type="button" data-restore-all-excluded>恢复全部</button>
            <button type="button" data-restore-all-select-excluded>恢复并选中</button>
          </div>
        </div>
        <div class="profileExcludedList">
          ${excludedVideos
            .map(
              (video, index) => `
                <span class="profileExcludedItem">
                  <span>排除 ${index + 1}</span>
                  <button type="button" data-restore-video="${escapeHtml(video.videoUrl)}">恢复</button>
                  <button type="button" data-restore-select-video="${escapeHtml(video.videoUrl)}">恢复并选中</button>
                </span>
              `
            )
            .join("")}
        </div>
      </div>
    ` : ""}
  `;

  nodes.profileSampleList.querySelectorAll("[data-profile-video]").forEach((input) => {
    input.addEventListener("change", () => {
      const videoUrl = input.dataset.profileVideo;
      if (!videoUrl) return;
      if (input.checked) {
        selectedProfileVideoUrls.add(videoUrl);
      } else {
        selectedProfileVideoUrls.delete(videoUrl);
      }
      renderProfileSampleList();
    });
  });

  nodes.profileSampleList.querySelectorAll("[data-keep-only-video]").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      const videoUrl = button.dataset.keepOnlyVideo;
      if (!videoUrl) return;
      keepOnlyProfileSample(videoUrl);
    });
  });

  nodes.profileSampleList.querySelectorAll("[data-pin-video]").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      const videoUrl = button.dataset.pinVideo;
      if (!videoUrl) return;
      togglePinProfileSample(videoUrl);
    });
  });

  nodes.profileSampleList.querySelectorAll("[data-pin-up-video]").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      const videoUrl = button.dataset.pinUpVideo;
      if (!videoUrl) return;
      movePinnedProfileSample(videoUrl, -1);
    });
  });

  nodes.profileSampleList.querySelectorAll("[data-pin-down-video]").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      const videoUrl = button.dataset.pinDownVideo;
      if (!videoUrl) return;
      movePinnedProfileSample(videoUrl, 1);
    });
  });

  nodes.profileSampleList.querySelectorAll("[data-exclude-video]").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      const videoUrl = button.dataset.excludeVideo;
      if (!videoUrl) return;
      excludeProfileSample(videoUrl);
    });
  });

  nodes.profileSampleList.querySelectorAll("[data-restore-video]").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      const videoUrl = button.dataset.restoreVideo;
      if (!videoUrl) return;
      restoreExcludedProfileSample(videoUrl, false);
    });
  });

  nodes.profileSampleList.querySelectorAll("[data-restore-select-video]").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      const videoUrl = button.dataset.restoreSelectVideo;
      if (!videoUrl) return;
      restoreExcludedProfileSample(videoUrl, true);
    });
  });

  nodes.profileSampleList.querySelector("[data-restore-all-excluded]")?.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    restoreAllExcludedProfileSamples(false);
  });

  nodes.profileSampleList.querySelector("[data-restore-all-select-excluded]")?.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    restoreAllExcludedProfileSamples(true);
  });
}

function getVisibleProfileVideos() {
  if (!currentProfileScan?.videos?.length) return [];
  return currentProfileScan.videos.filter(
    (video) => !excludedProfileVideoUrls.has(video.videoUrl) && Number(video.stats?.views || 0) >= profileMinViewsFilter
  );
}

function getProfileSortLabel() {
  const labels = {
    captured: "按抓取顺序",
    views_desc: "按播放从高到低",
    likes_desc: "按点赞从高到低",
    duration_desc: "按时长从长到短"
  };
  return labels[profileSampleSortMode] || labels.captured;
}

function getVideoDisplayLabel(video) {
  if (!currentProfileScan?.videos?.length) return "样本";
  const originalIndex = currentProfileScan.videos.findIndex((item) => item.videoUrl === video.videoUrl);
  return originalIndex === -1 ? "样本" : `样本 ${originalIndex + 1}`;
}

function getProfileVideoVisibilityLabel(video) {
  if (excludedProfileVideoUrls.has(video.videoUrl)) return "已排除";
  if (Number(video.stats?.views || 0) < profileMinViewsFilter) return "低于播放阈值";
  return "当前可见";
}

function getProfileVideoPinLabel(videoUrl) {
  const pinIndex = pinnedProfileVideoUrls.indexOf(videoUrl);
  return pinIndex === -1 ? "否" : `是 (#${pinIndex + 1})`;
}

function getSelectedProfileVideos() {
  if (!currentProfileScan?.videos?.length) return [];
  return currentProfileScan.videos.filter((video) => selectedProfileVideoUrls.has(video.videoUrl));
}

function getSortedProfileVideos() {
  if (!currentProfileScan?.videos?.length) return [];
  const videos = currentProfileScan.videos.map((video, index) => ({ ...video, _captureIndex: index }));
  const sorters = {
    captured: (left, right) => left._captureIndex - right._captureIndex,
    views_desc: (left, right) => Number(right.stats?.views || 0) - Number(left.stats?.views || 0),
    likes_desc: (left, right) => Number(right.stats?.likes || 0) - Number(left.stats?.likes || 0),
    duration_desc: (left, right) => Number(right.durationSeconds || 0) - Number(left.durationSeconds || 0)
  };
  const sorted = videos.sort(sorters[profileSampleSortMode] || sorters.captured);
  if (!pinnedProfileVideoUrls.length) return sorted;
  const pinOrder = new Map(pinnedProfileVideoUrls.map((url, index) => [url, index]));
  return sorted.sort((left, right) => {
    const leftPinned = pinOrder.has(left.videoUrl);
    const rightPinned = pinOrder.has(right.videoUrl);
    if (leftPinned && rightPinned) return pinOrder.get(left.videoUrl) - pinOrder.get(right.videoUrl);
    if (leftPinned) return -1;
    if (rightPinned) return 1;
    return 0;
  });
}

function getProfileScanForCurrentSelection() {
  if (!currentProfileScan) return null;
  const selectedVideos = getSelectedProfileVideos();
  return {
    ...currentProfileScan,
    videos: selectedVideos.length ? selectedVideos : currentProfileScan.videos
  };
}

function redistillFromSelectedSamples() {
  if (!currentProfileScan) {
    setActionFeedback("当前没有主页扫描结果可重蒸馏。", true);
    return;
  }
  const selectedVideos = getSelectedProfileVideos();
  if (selectedVideos.length === 0) {
    setActionFeedback("请至少勾选 1 条样本后再重蒸馏。", true);
    return;
  }
  const filteredScan = getProfileScanForCurrentSelection();
  applyDistilledTemplateToForm(filteredScan);
  nodes.profileScanResult.textContent = buildProfileScanResultText();
  setActionFeedback(`已按选中样本重蒸馏，当前使用 ${selectedVideos.length} 条样本。`);
}

function buildProfileScanResultText() {
  const selectedScan = getProfileScanForCurrentSelection();
  if (!selectedScan) return "还没有主页扫描结果。";
  const summary = buildReferenceSummaryFromProfileScan(selectedScan);
  if (!currentProfileScan) return summary;
  const comparison = buildProfileSelectionComparisonSummary(currentProfileScan, selectedScan);
  return `${summary}\n\n${comparison}`;
}

function selectAllProfileSamples() {
  if (!currentProfileScan?.videos?.length) return;
  selectedProfileVideoUrls = new Set(getVisibleProfileVideos().map((video) => video.videoUrl));
  renderProfileSampleList();
  setActionFeedback(`已全选当前可见样本 ${selectedProfileVideoUrls.size} 条。`);
}

function clearProfileSamplesSelection() {
  if (!currentProfileScan?.videos?.length) return;
  selectedProfileVideoUrls = new Set();
  renderProfileSampleList();
  setActionFeedback("已清空样本选择。");
}

function keepTopProfileSamples() {
  if (!currentProfileScan?.videos?.length) return;
  const topVideos = currentProfileScan.videos
    .slice()
    .sort((left, right) => Number(right.stats?.views || 0) - Number(left.stats?.views || 0))
    .slice(0, Math.min(3, currentProfileScan.videos.length));
  selectedProfileVideoUrls = new Set(topVideos.map((video) => video.videoUrl));
  renderProfileSampleList();
  setActionFeedback(`已只保留高播放前 ${topVideos.length} 条样本。`);
}

function keepCoveredProfileSamples() {
  if (!currentProfileScan?.videos?.length) return;
  const coveredVideos = currentProfileScan.videos.filter((video) => Boolean(video.thumbnailUrl));
  if (coveredVideos.length === 0) {
    setActionFeedback("当前样本里没有可用封面。", true);
    return;
  }
  selectedProfileVideoUrls = new Set(coveredVideos.map((video) => video.videoUrl));
  renderProfileSampleList();
  setActionFeedback(`已只保留有封面的 ${coveredVideos.length} 条样本。`);
}

function keepCoveredPopularProfileSamples() {
  if (!currentProfileScan?.videos?.length) return;
  const filtered = currentProfileScan.videos.filter(
    (video) => Boolean(video.thumbnailUrl) && Number(video.stats?.views || 0) >= 100000
  );
  if (filtered.length === 0) {
    setActionFeedback("当前样本里没有同时满足“有封面 + 10 万播放”的内容。", true);
    return;
  }
  selectedProfileVideoUrls = new Set(filtered.map((video) => video.videoUrl));
  renderProfileSampleList();
  setActionFeedback(`已只保留有封面且播放 10 万以上的 ${filtered.length} 条样本。`);
}

function keepOnlyProfileSample(videoUrl) {
  selectedProfileVideoUrls = new Set([videoUrl]);
  renderProfileSampleList();
  setActionFeedback("已只保留当前这条样本。");
}

function togglePinProfileSample(videoUrl) {
  if (pinnedProfileVideoUrls.includes(videoUrl)) {
    pinnedProfileVideoUrls = pinnedProfileVideoUrls.filter((item) => item !== videoUrl);
    setActionFeedback("已取消置顶这条样本。");
  } else {
    pinnedProfileVideoUrls = [videoUrl, ...pinnedProfileVideoUrls.filter((item) => item !== videoUrl)];
    setActionFeedback("已把这条样本置顶到最前。");
  }
  renderProfileSampleList();
}

function movePinnedProfileSample(videoUrl, direction) {
  const index = pinnedProfileVideoUrls.indexOf(videoUrl);
  if (index === -1) return;
  const targetIndex = index + direction;
  if (targetIndex < 0 || targetIndex >= pinnedProfileVideoUrls.length) return;
  const next = pinnedProfileVideoUrls.slice();
  const [item] = next.splice(index, 1);
  next.splice(targetIndex, 0, item);
  pinnedProfileVideoUrls = next;
  renderProfileSampleList();
  setActionFeedback(direction < 0 ? "已把置顶样本上移。" : "已把置顶样本下移。");
}

function excludeProfileSample(videoUrl) {
  excludedProfileVideoUrls.add(videoUrl);
  selectedProfileVideoUrls.delete(videoUrl);
  pinnedProfileVideoUrls = pinnedProfileVideoUrls.filter((item) => item !== videoUrl);
  renderProfileSampleList();
  setActionFeedback("已排除这条样本。");
}

function restoreExcludedProfileSample(videoUrl, shouldSelect) {
  excludedProfileVideoUrls.delete(videoUrl);
  if (shouldSelect) {
    selectedProfileVideoUrls.add(videoUrl);
  }
  renderProfileSampleList();
  setActionFeedback(shouldSelect ? "已恢复并选中这条被排除的样本。" : "已恢复这条被排除的样本。");
}

function restoreAllExcludedProfileSamples(shouldSelect) {
  if (!excludedProfileVideoUrls.size) return;
  const restoredUrls = Array.from(excludedProfileVideoUrls);
  excludedProfileVideoUrls = new Set();
  if (shouldSelect) {
    restoredUrls.forEach((url) => selectedProfileVideoUrls.add(url));
  }
  renderProfileSampleList();
  setActionFeedback(shouldSelect ? `已恢复并选中 ${restoredUrls.length} 条排除样本。` : `已恢复 ${restoredUrls.length} 条排除样本。`);
}

function exportProfileCandidates() {
  if (!currentProfileScan?.videos?.length) {
    setActionFeedback("当前没有候选样本可导出。", true);
    return;
  }
  const filtered = getVisibleProfileVideos();
  const visibleVideoUrls = new Set(filtered.map((video) => video.videoUrl));
  const lines = [
    `账号：${currentProfileScan.accountHandle || "未识别"}`,
    `排序：${getProfileSortLabel()}`,
    `最少播放：${profileMinViewsFilter}`,
    `可见样本数：${filtered.length}`,
    `置顶样本数：${pinnedProfileVideoUrls.length}`,
    `排除样本数：${excludedProfileVideoUrls.size}`,
    ""
  ];
  getSortedProfileVideos().forEach((video, index) => {
    lines.push(`## ${getVideoDisplayLabel(video)} / 当前排序位 ${index + 1}`);
    lines.push(`- 链接：${video.videoUrl}`);
    lines.push(`- 播放：${formatCompactNumber(video.stats?.views || 0)}`);
    lines.push(`- 点赞：${formatCompactNumber(video.stats?.likes || 0)}`);
    lines.push(`- 收藏：${formatCompactNumber(video.stats?.saves || video.detailMetrics?.collects || 0)}`);
    lines.push(`- 时长：${Number(video.durationSeconds || 0)} 秒`);
    lines.push(`- 是否选中：${selectedProfileVideoUrls.has(video.videoUrl) ? "是" : "否"}`);
    lines.push(`- 是否置顶：${getProfileVideoPinLabel(video.videoUrl)}`);
    lines.push(`- 是否排除：${excludedProfileVideoUrls.has(video.videoUrl) ? "是" : "否"}`);
    lines.push(`- 当前可见：${visibleVideoUrls.has(video.videoUrl) ? "是" : "否"}`);
    lines.push(`- 可见状态：${getProfileVideoVisibilityLabel(video)}`);
    lines.push(`- 命中原因：${getProfileSampleHitReasons(video).join(" / ") || "无"}`);
    lines.push(`- 文案：${video.caption || "无文案"}`);
    lines.push("");
  });
  downloadBlob(
    `profile-candidates-${Date.now()}.md`,
    lines.join("\n"),
    "text/markdown;charset=utf-8"
  );
  setActionFeedback(`已导出候选清单，共 ${filtered.length} 条当前可见样本，完整包含 ${currentProfileScan.videos.length} 条记录。`);
}

function getProfileSampleHitReasons(video) {
  const reasons = [];
  if (video.thumbnailUrl) reasons.push("有封面");
  const views = Number(video.stats?.views || 0);
  const likes = Number(video.stats?.likes || 0);
  if (views >= 300000) {
    reasons.push("高播放 30万+");
  } else if (views >= 100000) {
    reasons.push("高播放 10万+");
  }
  if (likes >= 10000) reasons.push("高点赞");
  if (Number(video.durationSeconds || 0) >= 20 && Number(video.durationSeconds || 0) <= 35) {
    reasons.push("时长适中");
  }
  return reasons;
}

function applyDistilledTemplateToForm(scan) {
  const distilled = distillAccountTemplateFromProfileScan(scan, {
    id: selectedTemplateId || undefined,
    name: nodes.templateName.value.trim() || undefined
  });
  nodes.templateName.value = distilled.name || "";
  nodes.templatePlatform.value = distilled.platform || "tiktok";
  nodes.templateAccountHandle.value = distilled.accountHandle || "";
  nodes.templateProfileUrl.value = distilled.profileUrl || "";
  nodes.templateContentPositioning.value = distilled.contentPositioning || "";
  nodes.hookStyle.value = distilled.hookStyle || nodes.hookStyle.value;
  nodes.templateRhythm.value = distilled.rhythm || "";
  syncTargetDurationControl(distilled.defaultDurationSeconds || 30);
  nodes.clipcatVoiceLanguage.value = distilled.defaultVoiceLanguage || "英文";
  nodes.templatePreferredModel.value = distilled.preferredModel || "veo-3-fast";
  nodes.templateStructure.value = distilled.structure || "";
  nodes.templateExpressionDna.value = distilled.expressionDna || "";
  nodes.templateDecisionHeuristics.value = distilled.decisionHeuristics || "";
  nodes.templateAntiPatterns.value = distilled.antiPatterns || "";
  nodes.templateRecentSignals.value = distilled.recentSignals || "";
  nodes.ctaText.value = distilled.ctaStyle || "";
  nodes.templateRewriteRules.value = distilled.rewriteRules || "";
  nodes.clipcatExtraRules.value = distilled.rewriteRules || "";
  nodes.clipcatReferencePlatform.value = distilled.platform || "tiktok";
  nodes.templateSampleVideoUrls.value = (distilled.sampleVideoUrls || []).join("\n");
  updatePlatformDependentUi();
}

function applyProfileSummaryToReference() {
  if (!currentProfileScan) {
    setActionFeedback("当前没有主页蒸馏摘要可写入。", true);
    return;
  }
  nodes.referenceBrief.value = buildProfileScanResultText();
  setActionFeedback("已把主页蒸馏摘要写入参考视频摘要区。");
}

function buildSummaryText(pkg) {
  return [
    `项目名：${pkg.project.projectName}`,
    `对标模板：${pkg.project.accountTemplate?.name || "未选择"}`,
    `模板账号：${pkg.project.accountTemplate?.accountHandle || "未填写"}`,
    `参考摘要：${pkg.project.referenceSummary || "未填写"}`,
    `当前商品：${pkg.project.productName || "未填写"}`,
    `卖点：${pkg.project.sellingPoints.join(" / ") || "未填写"}`,
    `钩子风格：${pkg.project.hookStyle}`,
    `视觉风格：${pkg.project.visualStyle}`,
    `收口引导：${pkg.project.cta}`,
    `时长：${pkg.project.durationSeconds} 秒`,
    `批量任务数：${pkg.batchVideoTasks?.length || 0}`,
    `Clipcat 参考链接：${pkg.project.clipcatConfig?.tiktokUrl || "未填写"}`,
    `Clipcat 口播语言：${pkg.project.clipcatConfig?.voiceLanguage || "未填写"}`
  ].join("\n");
}

function bindProjectListEvents() {
  nodes.seriesList.querySelectorAll("[data-project-select]").forEach((button) => {
    button.addEventListener("click", () => selectProject(button.dataset.projectSelect));
  });
  nodes.seriesList.querySelectorAll("[data-project-delete]").forEach((button) => {
    button.addEventListener("click", () => deleteProject(button.dataset.projectDelete));
  });
}

function selectProject(projectId) {
  currentProjectId = projectId;
  ensureCurrentProject();
  syncFormWithCurrentPackage();
  renderProjects();
  nodes.currentTaskHint.textContent = `当前已切换到：${currentPackage.project.projectName}。先检查摘要、提示词和批量任务，再决定是否提交。`;
  setActionFeedback(`已切换到：${currentPackage.project.projectName}`);
}

function deleteProject(projectId) {
  const index = projects.findIndex((item) => item.id === projectId);
  if (index === -1) return;
  const [removed] = projects.splice(index, 1);
  if (projectId === currentProjectId) {
    currentProjectId = projects[0]?.id || null;
  }
  ensureCurrentProject();
  saveProjects();
  renderProjects();
  if (currentPackage) {
    syncFormWithCurrentPackage();
  }
  setActionFeedback(`已删除项目：${removed.package.project.projectName}`);
}

function replaceCurrentProject(pkg) {
  const index = getCurrentProjectIndex();
  if (index === -1) {
    const record = {
      id: `project-${Date.now()}`,
      createdAt: new Date().toISOString(),
      package: pkg
    };
    projects.unshift(record);
    currentProjectId = record.id;
  } else {
    projects[index] = { ...projects[index], package: pkg };
  }
  saveProjects();
}

function syncFormWithCurrentPackage() {
  if (!currentPackage) return;
  nodes.productName.value = currentPackage.project.productName || "";
  nodes.referenceBrief.value = currentPackage.project.referenceSummary || "";
  nodes.productNotes.value = (currentPackage.project.sellingPoints || []).join("\n");
  nodes.hookStyle.value = currentPackage.project.hookStyle || nodes.hookStyle.value;
  nodes.visualStyle.value = currentPackage.project.visualStyle || "";
  nodes.ctaText.value = currentPackage.project.cta || "";
  syncTargetDurationControl(currentPackage.project.durationSeconds || 30);
  if (nodes.aspectRatioSelect) {
    nodes.aspectRatioSelect.value = currentPackage.project.aspectRatio || "9:16";
  }
  nodes.voiceDialect.value = currentPackage.project.voiceDialect || "普通话";
  nodes.generationCount.value = String(currentPackage.project.generationCount || 3);
  nodes.tiktokUrl.value = currentPackage.project.clipcatConfig?.tiktokUrl || "";
  nodes.clipcatReferencePlatform.value = currentPackage.project.clipcatConfig?.referencePlatform || "tiktok";
  nodes.clipcatVoiceLanguage.value = currentPackage.project.clipcatConfig?.voiceLanguage || "英文";
  nodes.clipcatExtraRules.value = currentPackage.project.clipcatConfig?.extraRules || "";

  const template = normalizeAccountTemplate(currentPackage.project.accountTemplate);
  const existingIndex = accountTemplates.findIndex((item) => item.id === template.id);
  if (existingIndex === -1) {
    accountTemplates.unshift(template);
  } else {
    accountTemplates[existingIndex] = template;
  }
  selectedTemplateId = template.id;
  saveAccountTemplates();
  renderTemplateOptions();
  syncTemplateForm();
  syncFlowStepState();
}

function ensureCurrentProject() {
  if (!projects.length) {
    currentPackage = null;
    return;
  }
  const record = projects.find((item) => item.id === currentProjectId) || projects[0];
  currentProjectId = record.id;
  currentPackage = record.package;
}

function getCurrentProjectIndex() {
  return projects.findIndex((item) => item.id === currentProjectId);
}

function getSelectedTemplate() {
  return accountTemplates.find((item) => item.id === selectedTemplateId) || accountTemplates[0] || null;
}

function updateResultButtons() {
  const disabled = !currentPackage;
  nodes.downloadBundleButton.disabled = disabled;
  nodes.downloadJsonButton.disabled = disabled;
  nodes.downloadMarkdownButton.disabled = disabled;
  nodes.copyBatchTasksButton.disabled = disabled;
  nodes.sendBatchTasksButton.disabled = disabled;
}

function updateActionFeedback() {
  const hasTemplate = Boolean(getSelectedTemplate());
  const hasModelImage = Boolean(nodes.modelImageFile?.files?.length);
  const hasImages = Boolean(nodes.productImages.files?.length);
  const hasPrompt = Boolean(nodes.referenceBrief.value.trim());
  if (!hasTemplate && !hasImages && !hasModelImage && !hasPrompt) {
    setActionFeedback("先选蒸馏模型，再上传产品图。主页链接不填也能直接生成。");
    return;
  }
  if (!hasImages && !hasModelImage && !hasPrompt) {
    setActionFeedback("先上传产品图；模特图和主页链接都只是可选参考。");
    return;
  }
  if (!hasImages) {
    setActionFeedback("你的要求已经有了，再补产品图就能生成。");
    return;
  }
  if (!hasPrompt) {
    setActionFeedback("产品图已经准备好，再补一句你想要的风格就能生成。");
    return;
  }
  setActionFeedback(
    hasModelImage
      ? "素材和要求都已准备，系统会自动处理模板和语言，可以直接生成。"
      : "产品图和要求都已准备，可以直接生成；需要的话也能一键提交去跑视频。"
  );
}

function renderAssetStatus() {
  if (nodes.productUploadStatus) {
    const productCount = nodes.productImages?.files?.length || 0;
    nodes.productUploadStatus.textContent = productCount ? `商品图：已上传 ${productCount} 张` : "商品图：未上传";
    nodes.productUploadStatus.classList.toggle("is-ready", productCount > 0);
    nodes.productUploadStatus.classList.toggle("is-optional", false);
  }
  if (nodes.modelUploadStatus) {
    const hasModel = Boolean(nodes.modelImageFile?.files?.length);
    nodes.modelUploadStatus.textContent = hasModel ? "模特图：已上传" : "模特图：可选";
    nodes.modelUploadStatus.classList.toggle("is-ready", hasModel);
    nodes.modelUploadStatus.classList.toggle("is-optional", !hasModel);
  }
}

function renderCurrentResultSummary() {
  if (!nodes.currentResultSummary) return;
  if (!currentPackage) {
    nodes.currentResultSummary.hidden = true;
    nodes.currentResultSummary.innerHTML = "";
    return;
  }
  const taskCount = currentPackage.batchVideoTasks?.length || 0;
  const shotCount = currentPackage.shots?.length || 0;
  const firstSellingPoint = currentPackage.project.sellingPoints?.[0] || "按当前项目主卖点执行";
  nodes.currentResultSummary.hidden = false;
  nodes.currentResultSummary.innerHTML = `
    <div class="currentResultSummaryHead">
      <strong>${escapeHtml(currentPackage.project.projectName)}</strong>
      <div class="currentResultSummaryMeta">
        <span class="countBadge">${shotCount} 个镜头</span>
        <span class="countBadge">${taskCount} 条任务</span>
        <span class="countBadge">${escapeHtml(currentPackage.project.aspectRatio || "9:16")}</span>
      </div>
    </div>
    <div class="currentResultSummaryNote">主卖点：${escapeHtml(firstSellingPoint)}</div>
    <div class="currentResultSummaryNote">当前摘要：${escapeHtml(currentPackage.project.referenceSummary || "还没有摘要")}</div>
  `;
}

function updateGenerateButtonState() {
  if (!nodes.remakeButton) return;
  const hasTemplate = Boolean(getSelectedTemplate());
  const hasProductImage = Boolean(nodes.productImages?.files?.length);
  const hasPrompt = Boolean(nodes.referenceBrief?.value.trim());
  const hasProductName = Boolean(nodes.productName?.value.trim());
  nodes.remakeButton.disabled = !(hasTemplate && hasProductImage && hasPrompt && hasProductName);
}

function syncFlowStepState() {
  const hasProfileUrl = Boolean(nodes.templateProfileUrl.value.trim());
  if (nodes.profileScanStatus) {
    nodes.profileScanStatus.textContent = hasProfileUrl ? "主页参考：已填写" : "主页参考：系统自动";
  }
  if (nodes.stepTemplateCard) {
    nodes.stepTemplateCard.open = hasProfileUrl;
  }
  updateGenerateButtonState();
}

function getWizardStepConfig(step) {
  return {
    1: {
      title: "基础信息",
      description: "先选平台。如果有对标主页，这一步顺手贴上即可。",
      nextLabel: "下一步"
    },
    2: {
      title: "上传素材",
      description: "先传产品图。模特图只是可选参考，不需要时可以跳过。",
      nextLabel: "下一步"
    },
    3: {
      title: "生成要求",
      description: "补一句创作要求，确认自动拆出的卖点，然后直接生成。",
      nextLabel: "生成提示词"
    },
    4: {
      title: "结果与提交",
      description: "任务已经生成完成。这里直接复制提示词或提交去跑视频。",
      nextLabel: "已完成"
    }
  }[step];
}

function renderWizardStep() {
  const config = getWizardStepConfig(currentWizardStep);
  if (!config) return;

  if (nodes.wizardStepTag) nodes.wizardStepTag.textContent = `步骤 ${currentWizardStep} / 4`;
  if (nodes.wizardStepTitle) nodes.wizardStepTitle.textContent = config.title;
  if (nodes.wizardStepDescription) nodes.wizardStepDescription.textContent = config.description;

  document.querySelectorAll("[data-step-panel]").forEach((panel) => {
    const step = Number(panel.dataset.stepPanel);
    const active = step === currentWizardStep;
    panel.hidden = !active;
    panel.classList.toggle("is-active", active);
  });

  document.querySelectorAll("[data-step-nav]").forEach((button) => {
    const step = Number(button.dataset.stepNav);
    button.classList.toggle("is-active", step === currentWizardStep);
    button.classList.toggle("is-complete", step < currentWizardStep);
  });

  if (nodes.wizardPrevButton) {
    nodes.wizardPrevButton.hidden = currentWizardStep === 1;
  }
  if (nodes.wizardNextButton) {
    nodes.wizardNextButton.textContent = config.nextLabel;
    nodes.wizardNextButton.disabled = currentWizardStep === 4;
  }
}

function setWizardStep(step) {
  const hasProductImage = Boolean(nodes.productImages.files?.length);
  if (step >= 3 && !hasProductImage) {
    setActionFeedback("还没上传产品图。你可以先看后面的结构，但正式生成前需要先补产品图。", true);
  }
  if (step === 4 && !currentPackage) {
    setActionFeedback("还没生成结果。第四步现在先给你看完成页结构，真正结果要在第三步点击生成提示词后出现。");
  }
  currentWizardStep = Math.min(4, Math.max(1, step));
  renderWizardStep();
}

function handleWizardPrev() {
  setWizardStep(currentWizardStep - 1);
}

async function handleWizardNext() {
  if (currentWizardStep === 2 && !nodes.productImages.files?.length) {
    setActionFeedback("第二步至少需要上传 1 张产品图。", true);
    return;
  }
  if (currentWizardStep === 3) {
    await handleGenerate();
    return;
  }
  setWizardStep(currentWizardStep + 1);
}

function setActionFeedback(message, isError = false) {
  nodes.actionFeedback.textContent = message;
  nodes.actionFeedback.style.color = isError ? "#b42318" : "#4b5b50";
}

function renderCurrentView() {
  document.querySelectorAll("[data-view-panel]").forEach((panel) => {
    const active = panel.dataset.viewPanel === currentView;
    panel.hidden = !active;
    panel.classList.toggle("is-active", active);
  });
  document.querySelectorAll("[data-view-nav]").forEach((button) => {
    const active = button.dataset.viewNav === currentView;
    button.classList.toggle("is-active", active);
  });
}

function setCurrentView(view) {
  currentView = view || "generate";
  renderCurrentView();
}

function handleDocumentKeydown(event) {
  if (event.key === "Escape" && onboardingVisible) {
    closeOnboarding(true);
  }
}

function maybeShowOnboarding() {
  if (loadOnboardingSeenState()) return;
  window.requestAnimationFrame(() => {
    openOnboarding();
  });
}

function openOnboarding() {
  if (!nodes.onboardingModal) return;
  onboardingVisible = true;
  nodes.onboardingModal.hidden = false;
  document.body.classList.add("modal-open");
}

function closeOnboarding(markSeen = true) {
  if (!nodes.onboardingModal) return;
  onboardingVisible = false;
  nodes.onboardingModal.hidden = true;
  document.body.classList.remove("modal-open");
  if (markSeen) {
    saveOnboardingSeenState(true);
  }
}

function buildDefaultTemplates() {
  return [
    normalizeAccountTemplate({
      id: "template-cleaning-fast",
      name: "快节奏家清模板",
      platform: "tiktok",
      accountHandle: "@cleaning_fast_demo",
      contentPositioning: "家清去污，痛点冲突强，结果证明快",
      hookStyle: "强冲突开场",
      rhythm: "3秒钩子，15到30秒完成问题、证明和收口",
      structure: "痛点开场 -> 脏污特写 -> 产品上场 -> 前后对比 -> 收口转化",
      expressionDna: "短句先抛痛点，命令式开场明显，先给结果再补解释。",
      decisionHeuristics: "先打痛点，再给前后对比证明，最后快速收口转化。",
      antiPatterns: "不要一上来讲参数；不要没有结果镜头就直接夸效果。",
      recentSignals: "近期家清内容仍然以 20 到 30 秒前后对比短视频为主。",
      ctaStyle: "结尾轻转化，引导去评论区或主页",
      rewriteRules: "只借结构，不借人物、字幕、品牌、台词和原账号痕迹。",
      defaultDurationSeconds: 30,
      defaultVoiceLanguage: "英文",
      preferredModel: "veo-3-fast"
    }),
    normalizeAccountTemplate({
      id: "template-emotion-story",
      name: "情绪短剧模板",
      platform: "douyin",
      accountHandle: "@story_hook_demo",
      contentPositioning: "误会、冲突、反转后植入商品",
      hookStyle: "误会反转",
      rhythm: "前5秒制造误会，中段反转，后段自然植入产品",
      structure: "误会钩子 -> 冲突拉高 -> 反转揭示 -> 商品出场 -> 结果证明 -> 收口",
      expressionDna: "先埋误判，文案偏情绪句和悬念句，中段再翻回真相。",
      decisionHeuristics: "先让观众误判，再在中段翻转，最后把产品接进解决方案。",
      antiPatterns: "不要太早剧透反转；不要把人物对白和原关系线原样照搬。",
      recentSignals: "近期仍适合 25 到 35 秒内完成反转和商品植入。",
      ctaStyle: "结尾用人物状态恢复来做转化收口",
      rewriteRules: "保留结构，不照抄人物关系、场景、对白和原品牌。",
      defaultDurationSeconds: 30,
      defaultVoiceLanguage: "中文",
      preferredModel: "veo-3-fast"
    })
  ];
}

function updatePlatformDependentUi() {
  const platform = nodes.templatePlatform.value || "tiktok";
  const defaultVoiceLanguage = platform === "douyin" ? "中文" : "英文";
  nodes.scanProfileButton.textContent = `提炼${getPlatformLabel(platform)}主页模板`;
  nodes.scanProfileButton.disabled = !isProfileAutoScanSupported(platform);
  nodes.templateProfileUrl.placeholder =
    platform === "douyin" ? "https://www.douyin.com/user/xxxx" : "https://www.tiktok.com/@account_name";
  nodes.clipcatReferencePlatform.value = platform;
  nodes.clipcatVoiceLanguage.value = defaultVoiceLanguage;
  nodes.clipcatVoiceLanguage.disabled = true;
  renderVoiceDialectOptions(platform);
  nodes.tiktokUrl.placeholder =
    nodes.clipcatReferencePlatform.value === "douyin"
      ? "抖音视频链接"
      : "https://www.tiktok.com/@xxx/video/xxxx 或抖音视频链接";
}

function renderVoiceDialectOptions(platform) {
  const isDouyin = platform === "douyin";
  const options = isDouyin
    ? [
        ["普通话", "普通话"],
        ["四川话", "四川话"],
        ["粤语", "粤语"],
        ["东北话", "东北话"]
      ]
    : [
        ["English", "English"],
        ["American English", "American English"],
        ["British English", "British English"]
      ];
  const currentValue = nodes.voiceDialect.value;
  nodes.voiceDialect.innerHTML = options
    .map(([value, label]) => `<option value="${escapeHtml(value)}">${escapeHtml(label)}</option>`)
    .join("");
  nodes.voiceDialect.value = options.some(([value]) => value === currentValue) ? currentValue : options[0][0];
}

function loadProjects() {
  try {
    return JSON.parse(localStorage.getItem(storageKey) || "[]");
  } catch {
    return [];
  }
}

function loadOnboardingSeenState() {
  try {
    return localStorage.getItem(onboardingSeenStorageKey) === "1";
  } catch {
    return false;
  }
}

function saveOnboardingSeenState(seen) {
  try {
    localStorage.setItem(onboardingSeenStorageKey, seen ? "1" : "0");
  } catch {
    // 忽略本地存储异常，避免影响主流程。
  }
}

function saveProjects() {
  localStorage.setItem(storageKey, JSON.stringify(projects));
}

function loadAccountTemplates() {
  try {
    const parsed = JSON.parse(localStorage.getItem(templateStorageKey) || "[]");
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed.map((item) => normalizeAccountTemplate(item));
    }
  } catch {}
  return buildDefaultTemplates();
}

function saveAccountTemplates() {
  localStorage.setItem(templateStorageKey, JSON.stringify(accountTemplates));
}

function loadProfileSampleSortMode() {
  try {
    const value = localStorage.getItem(profileSampleSortStorageKey);
    if (["captured", "views_desc", "likes_desc", "duration_desc"].includes(value)) {
      return value;
    }
  } catch {}
  return "captured";
}

function saveProfileSampleSortMode() {
  try {
    localStorage.setItem(profileSampleSortStorageKey, profileSampleSortMode);
  } catch {}
}

function loadProfileSampleMinViewsFilter() {
  try {
    const value = Number(localStorage.getItem(profileSampleMinViewsStorageKey) || 0);
    if ([0, 10000, 50000, 100000, 300000].includes(value)) {
      return value;
    }
  } catch {}
  return 0;
}

function saveProfileSampleMinViewsFilter() {
  try {
    localStorage.setItem(profileSampleMinViewsStorageKey, String(profileMinViewsFilter));
  } catch {}
}

async function scanTikTokProfile(profileUrl, sampleLimit) {
  return scanProfilePage(profileUrl, sampleLimit, "tiktok", scrapeTikTokProfilePage);
}

async function scanDouyinProfile(profileUrl, sampleLimit) {
  const scan = await scanProfilePage(profileUrl, sampleLimit, "douyin", scrapeDouyinProfilePage);
  return enrichDouyinProfileScan(scan);
}

async function scanProfileByPlatform(profileUrl, sampleLimit, platform) {
  if (platform === "douyin") {
    return scanDouyinProfile(profileUrl, sampleLimit);
  }
  return scanTikTokProfile(profileUrl, sampleLimit);
}

async function enrichDouyinProfileScan(scan) {
  if (!scan?.videos?.length) return scan;
  const candidates = scan.videos
    .filter(
      (video) =>
        !Number(video.durationSeconds || 0) ||
        !Number(video.stats?.comments || 0) ||
        !Number(video.stats?.shares || 0)
    )
    .sort((left, right) => getDouyinDetailEnrichmentPriority(right) - getDouyinDetailEnrichmentPriority(left))
    .slice(0, Math.min(3, scan.videos.length));
  if (!candidates.length) return scan;

  const detailMap = new Map();
  for (const video of candidates) {
    try {
      const detail = await scanDouyinVideoDetail(video.videoUrl);
      if (detail?.videoUrl) {
        detailMap.set(detail.videoUrl, mergeProfileVideoDetail(video, detail));
      }
    } catch {}
  }
  if (!detailMap.size) return scan;
  return {
    ...scan,
    videos: scan.videos.map((video) => detailMap.get(video.videoUrl) || video)
  };
}

function getDouyinDetailEnrichmentPriority(video) {
  let score = 0;
  if (!Number(video.durationSeconds || 0)) score += 4;
  if (!Number(video.stats?.comments || 0)) score += 3;
  if (!Number(video.stats?.shares || 0)) score += 3;
  if (!video.thumbnailUrl) score += 1;
  score += Math.min(Number(video.stats?.views || 0), 1_000_000) / 50_000;
  score += Math.min(Number(video.stats?.likes || 0), 100_000) / 10_000;
  return score;
}

function mergeProfileVideoDetail(base, detail) {
  return {
    ...base,
    ...detail,
    caption: detail.caption || base.caption || "",
    thumbnailUrl: detail.thumbnailUrl || base.thumbnailUrl || "",
    durationSeconds: Math.max(Number(base.durationSeconds || 0), Number(detail.durationSeconds || 0), 0),
    stats: {
      views: Math.max(Number(base.stats?.views || 0), Number(detail.stats?.views || 0), 0),
      likes: Math.max(Number(base.stats?.likes || 0), Number(detail.stats?.likes || 0), 0),
      comments: Math.max(Number(base.stats?.comments || 0), Number(detail.stats?.comments || 0), 0),
      shares: Math.max(Number(base.stats?.shares || 0), Number(detail.stats?.shares || 0), 0),
      saves: Math.max(
        Number(base.stats?.saves || base.detailMetrics?.collects || 0),
        Number(detail.stats?.saves || detail.detailMetrics?.collects || 0),
        0
      )
    }
  };
}

async function scanDouyinVideoDetail(videoUrl) {
  if (!globalThis.chrome?.tabs || !globalThis.chrome?.scripting) {
    throw new Error("当前不是 Chrome 扩展环境，不能执行抖音详情抓取。");
  }
  const createdTab = await chrome.tabs.create({ url: videoUrl, active: false });
  if (!createdTab.id) {
    throw new Error("抖音详情页签打开失败。");
  }
  try {
    let bestResult = null;
    for (let attempt = 0; attempt < 2; attempt += 1) {
      if (attempt > 0) {
        await chrome.tabs.reload(createdTab.id);
      }
      await waitForTabComplete(createdTab.id, "douyin");
      await delay(2400 + attempt * 600);
      const [injection] = await chrome.scripting.executeScript({
        target: { tabId: createdTab.id },
        func: scrapeDouyinVideoDetailPage
      });
      const nextResult = injection?.result || null;
      if (!bestResult || scoreDouyinVideoDetail(nextResult) > scoreDouyinVideoDetail(bestResult)) {
        bestResult = nextResult;
      }
      if (scoreDouyinVideoDetail(bestResult) >= 7) {
        break;
      }
    }
    return bestResult;
  } finally {
    await chrome.tabs.remove(createdTab.id).catch(() => {});
  }
}

function scoreDouyinVideoDetail(detail) {
  if (!detail) return 0;
  let score = 0;
  if (detail.caption) score += 2;
  if (detail.thumbnailUrl) score += 1;
  if (Number(detail.durationSeconds || 0) > 0) score += 2;
  if (Number(detail.stats?.likes || 0) > 0) score += 1;
  if (Number(detail.stats?.comments || 0) > 0) score += 2;
  if (Number(detail.stats?.shares || 0) > 0) score += 2;
  if (Number(detail.stats?.saves || detail.detailMetrics?.collects || 0) > 0) score += 1;
  return score;
}

async function scanProfilePage(profileUrl, sampleLimit, platform, scraper) {
  if (!globalThis.chrome?.tabs || !globalThis.chrome?.scripting) {
    throw new Error("当前不是 Chrome 扩展环境，不能执行主页抓取。");
  }

  const createdTab = await chrome.tabs.create({ url: profileUrl, active: false });
  if (!createdTab.id) {
    throw new Error("主页页签打开失败。");
  }

  try {
    await waitForTabComplete(createdTab.id, platform);
    await delay(platform === "douyin" ? 2800 : 2400);

    let result = null;
    const attempts = platform === "douyin" ? 3 : 1;
    for (let attempt = 0; attempt < attempts; attempt += 1) {
      if (attempt > 0) {
        if (platform === "douyin") {
          await chrome.tabs.reload(createdTab.id);
          await waitForTabComplete(createdTab.id, platform);
          await delay(2000 + attempt * 500);
        }
        await delay(1200 * attempt);
      }
      const [injection] = await chrome.scripting.executeScript({
        target: { tabId: createdTab.id },
        func: scraper,
        args: [sampleLimit]
      });
      const nextResult = injection?.result;
      if (!nextResult || !Array.isArray(nextResult.videos)) continue;
      if (!result || scoreProfileScanQuality(nextResult) > scoreProfileScanQuality(result)) {
        result = nextResult;
      }
      if (
        result.videos.length >= Math.min(Number(sampleLimit || 6), 3) &&
        scoreProfileScanQuality(result) >= 8 &&
        !result.serviceError
      ) {
        break;
      }
    }
    if (!result || !Array.isArray(result.videos)) {
      throw new Error("没有抓到主页样本，请确认账号主页能正常打开。");
    }
    if (result.videos.length === 0) {
      throw new Error(result.pageIssueMessage || "主页里没抓到公开视频卡片，请换一个主页或手动打开主页后再试。");
    }
    return {
      ...result,
      platform
    };
  } finally {
    await chrome.tabs.remove(createdTab.id).catch(() => {});
  }
}

function waitForTabComplete(tabId, platform = "tiktok") {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      chrome.tabs.onUpdated.removeListener(handleUpdated);
      reject(new Error(`打开${getPlatformLabel(platform)}主页超时。`));
    }, 30000);

    function handleUpdated(updatedTabId, changeInfo, tab) {
      if (updatedTabId !== tabId) return;
      if (tab.url && !isSupportedProfileUrl(tab.url, platform)) return;
      if (changeInfo.status !== "complete") return;
      clearTimeout(timeout);
      chrome.tabs.onUpdated.removeListener(handleUpdated);
      resolve(tab);
    }

    chrome.tabs.onUpdated.addListener(handleUpdated);
  });
}

function scoreProfileScanQuality(scan) {
  if (!scan?.videos?.length) return 0;
  return scan.videos.reduce((score, video) => {
    let next = score + 1;
    if (video.caption && video.caption !== "抖音公开样本") next += 1;
    if (video.thumbnailUrl) next += 1;
    if (Number(video.durationSeconds || 0) > 0) next += 1;
    if (Number(video.stats?.views || 0) > 0) next += 1;
    if (Number(video.stats?.likes || 0) > 0) next += 1;
    return next;
  }, 0);
}

function scrapeDouyinVideoDetailPage() {
  const normalizeText = (value = "") => String(value || "").replace(/\s+/g, " ").trim();
  const normalizeUrl = (url = "") => {
    try {
      return new URL(url, location.origin).href.split("?")[0];
    } catch {
      return "";
    }
  };
  const toNumber = (value = "") => {
    const text = normalizeText(value).replace(/,/g, "").toUpperCase();
    const match = text.match(/(\d+(?:\.\d+)?)([万亿WKM])?/);
    if (!match) return 0;
    const unitMap = { "万": 10000, "亿": 100000000, W: 10000, K: 1000, M: 1000000 };
    return Math.round(Number(match[1]) * (unitMap[match[2] || ""] || 1));
  };
  const parseDuration = (value = "") => {
    const match = normalizeText(value).match(/(\d{1,2}):(\d{2})/);
    return match ? Number(match[1]) * 60 + Number(match[2]) : 0;
  };
  const unique = (items) => [...new Set(items.filter(Boolean))];
  const extractMetricBySelector = (selector) => {
    const text = normalizeText(document.querySelector(selector)?.textContent || "");
    return /^\d[\d.,万亿wWkKmM]*$/.test(text) ? toNumber(text) : 0;
  };
  const title = normalizeText(document.title.replace(/\s*-\s*抖音$/, ""));
  const durationSeconds = Math.max(
    parseDuration(document.querySelector(".time-duration")?.textContent || ""),
    parseDuration(normalizeText(document.body?.innerText || "").match(/\d{1,2}:\d{2}\s*\/\s*(\d{1,2}:\d{2})/)?.[1] || "")
  );
  const thumbnailUrl =
    normalizeUrl(document.querySelector('meta[property="og:image"]')?.getAttribute("content") || "") ||
    normalizeUrl(document.querySelector("video")?.getAttribute("poster") || "") ||
    normalizeUrl(document.querySelector("img")?.currentSrc || document.querySelector("img")?.getAttribute("src") || "");

  const actionNumbers = unique(
    Array.from(
      document.querySelectorAll(
        ".video-detail-container .o2tLobnl, .video-detail-container .bJX7d7PL, .video-detail-container [class*='action']"
      )
    )
      .map((node) => normalizeText(node.textContent || ""))
      .filter((text) => /^\d[\d.,万亿wWkKmM]*$/.test(text))
  ).slice(0, 4);

  const detailBody = normalizeText(document.body?.innerText || "");
  const inlineMetricMatch = detailBody.match(/(\d[\d.,万亿wWkKmM]*)\s+(\d[\d.,万亿wWkKmM]*)\s+(\d[\d.,万亿wWkKmM]*)\s+(\d[\d.,万亿wWkKmM]*)\s+举报\s+发布时间/);
  const fallbackNumbers = inlineMetricMatch ? inlineMetricMatch.slice(1, 5) : [];
  const metrics = actionNumbers.length >= 4 ? actionNumbers : fallbackNumbers;
  const likes = extractMetricBySelector("[data-e2e='video-player-digg'] [class*='Lr3l3ZEc']") || toNumber(metrics[0] || "");
  const comments = extractMetricBySelector("[data-e2e='feed-comment-icon'] [class*='x6d7guxH']") || toNumber(metrics[1] || "");
  const collects = extractMetricBySelector("[data-e2e='video-player-collect'] [class*='urITFwDq']");
  const shares =
    extractMetricBySelector("[data-e2e='video-player-share'] [class*='mvwEat0w']") ||
    extractMetricBySelector("[data-e2e='video-share-icon-container'] [class*='sB3y0d3B']") ||
    toNumber(metrics[3] || "");

  return {
    videoUrl: normalizeUrl(location.href),
    caption: title,
    thumbnailUrl,
    durationSeconds,
    stats: {
      views: 0,
      likes,
      comments,
      shares,
      saves: collects
    },
    detailMetrics: {
      collects
    }
  };
}

function downloadBlob(filename, content, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function formatCompactNumber(value) {
  const number = Number(value || 0);
  if (!Number.isFinite(number)) return "0";
  if (number >= 1_000_000) return `${(number / 1_000_000).toFixed(number >= 10_000_000 ? 0 : 1).replace(/\.0$/, "")}M`;
  if (number >= 1_000) return `${(number / 1_000).toFixed(number >= 10_000 ? 0 : 1).replace(/\.0$/, "")}K`;
  return String(Math.round(number));
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function scrapeTikTokProfilePage(sampleLimit) {
  const limit = Math.max(1, Math.min(Number(sampleLimit || 6), 12));
  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  const normalizeText = (value = "") => String(value || "").replace(/\s+/g, " ").trim();
  const toNumber = (value = "") => {
    const text = normalizeText(value).replace(/,/g, "").toUpperCase();
    const match = text.match(/(\d+(?:\.\d+)?)([KMB])?/);
    if (!match) return 0;
    const unit = { K: 1_000, M: 1_000_000, B: 1_000_000_000 }[match[2] || ""] || 1;
    return Math.round(Number(match[1]) * unit);
  };
  const unique = (items) => [...new Set(items.filter(Boolean))];
  const extractHandle = (url = location.href) => url.match(/tiktok\.com\/@([^/?#]+)/i)?.[1] || "";
  const extractVideoId = (url = "") => url.match(/\/video\/(\d+)/)?.[1] || "";
  const normalizeUrl = (url = "") => {
    try {
      return new URL(url, location.origin).href.split("?")[0];
    } catch {
      return "";
    }
  };
  const getPageIssue = () => {
    return classifyTikTokProfilePageIssue({
      title: normalizeText(document.title || ""),
      bodyText: normalizeText(document.body?.innerText || ""),
      hasVideoLink: /tiktok\.com\/@[^/]+\/video\/\d+/i.test(document.body?.innerHTML || "")
    });
  };

  const getStats = () => {
    const focusedText = Array.from(
      document.querySelectorAll('strong, h3, [data-e2e="followers-count"], [data-e2e="likes-count"], [aria-label*="followers"], [aria-label*="likes"]')
    )
      .map((node) => normalizeText(node.getAttribute("aria-label") || node.textContent || ""))
      .filter(Boolean)
      .join("\n");
    const bodyText = normalizeText(document.body?.innerText || "");
    const parsed = parseTikTokProfileStatsText(`${focusedText}\n${bodyText}`);
    return {
      followers: parsed.followers || 0,
      likes: parsed.likes || 0
    };
  };

  const getBio = () => {
    const bioNode = document.querySelector('[data-e2e="user-bio"], h2[data-e2e="user-subtitle"], [class*="DivShareDesc"], [class*="StyledUserBio"]');
    return normalizeText(bioNode?.textContent || "") || parseTikTokProfileIdentityText(document.body?.innerText || "").bio;
  };

  const getDisplayName = () => {
    const node = document.querySelector('h1[data-e2e="user-title"], h1, [data-e2e="browse-user-title"]');
    return normalizeText(node?.textContent || "") || parseTikTokProfileIdentityText(document.body?.innerText || "").displayName;
  };

  const collectVideoCandidates = () => {
    const anchors = Array.from(document.querySelectorAll('a[href*="/video/"]'));
    return unique(
      anchors
        .map((anchor) => normalizeUrl(anchor.getAttribute("href") || ""))
        .filter((url) => /tiktok\.com\/@[^/]+\/video\/\d+/i.test(url))
    )
      .slice(0, limit)
      .map((videoUrl) => {
        const anchor = anchors.find((item) => normalizeUrl(item.getAttribute("href") || "") === videoUrl);
        const card = anchor?.closest("div") || anchor?.parentElement || document.body;
        const text = normalizeText(card?.innerText || anchor?.innerText || "");
        const interactionText = Array.from(card?.querySelectorAll("button, strong, span, div") || [])
          .map((node) => normalizeText(node.getAttribute("aria-label") || node.textContent || ""))
          .filter(Boolean)
          .join("\n");
        const lines = text.split(/\n+/).map((item) => normalizeText(item)).filter(Boolean);
        const caption = lines.find((line) => line.length > 12 && !/^\d+([.,]\d+)?[KMB]?$/.test(line)) || text;
        const durationMatch = text.match(/(\d{1,2}):(\d{2})/);
        const thumbnailUrl = normalizeUrl(
          card?.querySelector("img")?.getAttribute("src") ||
          anchor?.querySelector("img")?.getAttribute("src") ||
          ""
        );
        const parsedStats = parseTikTokVisibleStatsText(`${interactionText}\n${text}`);
        return {
          videoId: extractVideoId(videoUrl),
          videoUrl,
          caption,
          thumbnailUrl,
          durationSeconds: durationMatch ? Number(durationMatch[1]) * 60 + Number(durationMatch[2]) : 0,
          stats: {
            views: parsedStats.views || 0,
            likes: parsedStats.likes || 0,
            comments: parsedStats.comments || 0,
            shares: parsedStats.shares || 0,
            saves: parsedStats.saves || 0
          }
        };
      });
  };

  const collectJsonVideoCandidates = () => {
    const videos = [];
    for (const script of document.querySelectorAll('script[id="__UNIVERSAL_DATA_FOR_REHYDRATION__"], script[id="SIGI_STATE"]')) {
      const text = script.textContent || "";
      if (!text.trim()) continue;
      try {
        const data = JSON.parse(text);
        walk(data, (node) => {
          const id = String(node?.id || node?.awemeId || node?.itemId || "");
          const author = String(node?.author?.uniqueId || node?.author?.nickname || node?.authorId || "");
          const shareUrl = normalizeUrl(node?.shareUrl || node?.url || "");
          if (!/^\d{12,}$/.test(id)) return;
          const videoUrl = shareUrl || (author ? `https://www.tiktok.com/@${author}/video/${id}` : "");
          if (!/tiktok\.com\/@[^/]+\/video\/\d+/i.test(videoUrl)) return;
          videos.push({
            videoId: id,
            videoUrl,
            caption: normalizeText(node?.desc || node?.description || ""),
            thumbnailUrl: normalizeUrl(
              node?.video?.dynamicCover ||
              node?.video?.originCover ||
              node?.video?.cover ||
              node?.video?.coverUrl ||
              node?.video?.cover?.url_list?.[0] ||
              ""
            ),
            durationSeconds: normalizeTikTokDurationSeconds(node?.video?.duration || node?.duration || 0),
            stats: {
              views: toNumber(node?.stats?.playCount || node?.statsV2?.playCount || 0),
              likes: toNumber(node?.stats?.diggCount || node?.statsV2?.diggCount || 0),
              comments: toNumber(node?.stats?.commentCount || node?.statsV2?.commentCount || 0),
              shares: toNumber(node?.stats?.shareCount || node?.statsV2?.shareCount || 0),
              saves: toNumber(
                node?.stats?.collectCount ||
                node?.statsV2?.collectCount ||
                node?.stats?.saveCount ||
                node?.statsV2?.saveCount ||
                node?.stats?.saves ||
                node?.statsV2?.saves ||
                0
              )
            }
          });
        });
      } catch {}
    }
    return unique(videos.map((item) => item.videoUrl))
      .map((url) => videos.find((item) => item.videoUrl === url))
      .filter(Boolean)
      .slice(0, limit);
  };

  const walk = (node, visitor) => {
    if (!node || typeof node !== "object") return;
    visitor(node);
    if (Array.isArray(node)) {
      node.forEach((item) => walk(item, visitor));
      return;
    }
    Object.values(node).forEach((item) => walk(item, visitor));
  };

  return (async () => {
    for (let step = 0; step < 4; step += 1) {
      window.scrollTo(0, document.body.scrollHeight);
      await wait(900);
    }
    window.scrollTo(0, 0);
    await wait(400);

    const videos = [];
    const byUrl = new Map();
    [...collectVideoCandidates(), ...collectJsonVideoCandidates()].forEach((item) => {
      if (!item?.videoUrl) return;
      const previous = byUrl.get(item.videoUrl);
      if (!previous) {
        byUrl.set(item.videoUrl, item);
        return;
      }
      byUrl.set(item.videoUrl, mergeTikTokProfileVideoCandidates(previous, item));
    });
    videos.push(...byUrl.values());
    const pageIssue = videos.length === 0 ? getPageIssue() : null;

    return {
      profileUrl: location.href.split("?")[0],
      accountHandle: `@${extractHandle()}`,
      displayName: getDisplayName(),
      bio: getBio(),
      stats: getStats(),
      pageIssueCode: pageIssue?.code || "",
      pageIssueMessage: pageIssue?.message || "",
      videos: videos.slice(0, limit)
    };
  })();
}

function scrapeDouyinProfilePage(sampleLimit) {
  const limit = Math.max(1, Math.min(Number(sampleLimit || 6), 12));
  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const normalizeText = (value = "") => String(value || "").replace(/\s+/g, " ").trim();
  const normalizeCaption = (value = "") => normalizeText(String(value || "").replace(/打开看看|进入主页|合集·?.*$/g, ""));
  const normalizeUrl = (url = "") => {
    try {
      return new URL(url, location.origin).href.split("?")[0];
    } catch {
      return "";
    }
  };
  const unique = (items) => [...new Set(items.filter(Boolean))];
  const decodePercentText = (value = "") => {
    const text = String(value || "").trim();
    if (!text || !/%[0-9A-Fa-f]{2}/.test(text)) return text;
    try {
      return new URLSearchParams(`x=${text}`).get("x") || text;
    } catch {
      return text;
    }
  };
  const toNumber = (value = "") => {
    const text = normalizeText(value).replace(/,/g, "").toUpperCase();
    const match = text.match(/(\d+(?:\.\d+)?)([万亿WKM])?/);
    if (!match) return 0;
    const unitMap = { "万": 10000, "亿": 100000000, W: 10000, K: 1000, M: 1000000 };
    return Math.round(Number(match[1]) * (unitMap[match[2] || ""] || 1));
  };
  const normalizeDuration = (value = 0) => {
    const number = Number(value || 0);
    if (!Number.isFinite(number) || number <= 0) return 0;
    if (number > 1000) return Math.round(number / 1000);
    return Math.round(number);
  };
  const pickFirstText = (...values) => values.map((item) => normalizeText(item)).find(Boolean) || "";
  const pickFirstUrl = (...values) => values.map((item) => normalizeUrl(item)).find(Boolean) || "";
  const dedupeRepeatedCaption = (value = "") => {
    const text = normalizeCaption(value);
    if (!text) return "";
    const half = Math.floor(text.length / 2);
    if (half >= 8) {
      const left = text.slice(0, half).trim();
      const right = text.slice(half).trim();
      if (left && right && (left === right || left.startsWith(right) || right.startsWith(left))) {
        return left.length >= right.length ? left : right;
      }
    }
    return text;
  };
  const cleanDisplayPrefix = (value = "", displayName = "") => {
    const text = normalizeCaption(value);
    if (!text) return "";
    if (!displayName) return text;
    return normalizeCaption(text.replace(new RegExp(`^${escapeRegExp(displayName)}[:：]\\s*`), ""));
  };
  const walk = (root, visitor) => {
    const stack = [root];
    while (stack.length) {
      const node = stack.pop();
      if (!node || typeof node !== "object") continue;
      visitor(node);
      if (Array.isArray(node)) {
        for (const item of node) stack.push(item);
        continue;
      }
      for (const value of Object.values(node)) {
        if (value && typeof value === "object") {
          stack.push(value);
        }
      }
    }
  };
  const scoreVideo = (video) => {
    let score = 0;
    if (video.caption && video.caption !== "抖音公开样本") score += 2;
    if (video.thumbnailUrl) score += 2;
    if (Number(video.durationSeconds || 0) > 0) score += 1;
    if (Number(video.stats?.views || 0) > 0) score += 2;
    if (Number(video.stats?.likes || 0) > 0) score += 1;
    if (Number(video.stats?.comments || 0) > 0) score += 1;
    if (Number(video.stats?.shares || 0) > 0) score += 1;
    if (Number(video.stats?.saves || video.detailMetrics?.collects || 0) > 0) score += 1;
    return score;
  };
  const mergeVideo = (previous = {}, next = {}) => {
    const merged = {
      ...previous,
      ...next,
      videoId: next.videoId || previous.videoId || "",
      videoUrl: next.videoUrl || previous.videoUrl || "",
      caption:
        normalizeCaption((next.caption || "").length >= (previous.caption || "").length ? next.caption : previous.caption) ||
        previous.caption ||
        next.caption ||
        "抖音公开样本",
      thumbnailUrl: next.thumbnailUrl || previous.thumbnailUrl || "",
      durationSeconds: Math.max(Number(previous.durationSeconds || 0), Number(next.durationSeconds || 0), 0),
      stats: {
        views: Math.max(Number(previous.stats?.views || 0), Number(next.stats?.views || 0), 0),
        likes: Math.max(Number(previous.stats?.likes || 0), Number(next.stats?.likes || 0), 0),
        comments: Math.max(Number(previous.stats?.comments || 0), Number(next.stats?.comments || 0), 0),
        shares: Math.max(Number(previous.stats?.shares || 0), Number(next.stats?.shares || 0), 0),
        saves: Math.max(
          Number(previous.stats?.saves || previous.detailMetrics?.collects || 0),
          Number(next.stats?.saves || next.detailMetrics?.collects || 0),
          0
        )
      }
    };
    return scoreVideo(next) >= scoreVideo(previous) ? merged : { ...merged, ...previous };
  };

  const bodyText = () => normalizeText(document.body?.innerText || "");
  const getDisplayName = () =>
    pickFirstText(
      document.querySelector('img[alt$="头像"]')?.getAttribute("alt")?.replace(/头像$/, "") ||
      document.querySelector("title")?.textContent?.replace(/的抖音.*$/, "") ||
      ""
    );
  const getHandle = () => {
    const match = bodyText().match(/抖音号[:：]\s*([A-Za-z0-9_-]+)/i);
    return match ? `@${match[1]}` : "";
  };
  const getBio = () => {
    const text = bodyText();
    const parts = text.split(/分享主页|私信|关注|作品|合集/);
    const head = parts[0] || "";
    const lines = head.split(/(?=抖音号[:：])|(?=\d+岁)/).map((item) => normalizeText(item)).filter(Boolean);
    const bioLine = lines.reverse().find((line) => line && !/^抖音号[:：]/.test(line) && !/^\d+岁$/.test(line) && line !== getDisplayName());
    return bioLine || "";
  };
  const getStats = () => {
    const text = bodyText();
    return {
      followers: toNumber(text.match(/粉丝\s*([\d.万wWkKmM]+)/)?.[1] || ""),
      likes: toNumber(text.match(/获赞\s*([\d.万wWkKmM]+)/)?.[1] || "")
    };
  };
  const parseDuration = (text = "") => {
    const match = normalizeText(text).match(/(\d{1,2}):(\d{2})/);
    return match ? Number(match[1]) * 60 + Number(match[2]) : 0;
  };
  const extractTaggedMetric = (card, pattern) => {
    const candidates = [
      card?.querySelector('[class*="author-card-user-video-like"]'),
      card?.querySelector(".BP1CQkLg"),
      card?.querySelector('[class*="like"]'),
      card?.querySelector('[class*="comment-count"], [class*="commentCount"]'),
      card?.querySelector('[class*="comment"]'),
      card?.querySelector('[class*="share-count"], [class*="shareCount"]'),
      card?.querySelector('[class*="share"]')
    ].filter(Boolean);
    for (const node of candidates) {
      const text = normalizeText(node?.innerText || node?.textContent || "");
      const match = text.match(pattern);
      if (match?.[1]) {
        return toNumber(match[1]);
      }
      if (/^\d/.test(text)) {
        return toNumber(text);
      }
    }
    return 0;
  };
  const parseStatsFromText = (text = "") => ({
    views: toNumber(text.match(/(?:播放|次播放|播放量)[:：]?\s*([\d.万亿wWkKmM]+)/)?.[1] || ""),
    likes: toNumber(text.match(/(?:点赞|赞)[:：]?\s*([\d.万亿wWkKmM]+)/)?.[1] || ""),
    comments: toNumber(text.match(/(?:评论)[:：]?\s*([\d.万亿wWkKmM]+)/)?.[1] || ""),
    shares: toNumber(text.match(/(?:分享|转发)[:：]?\s*([\d.万亿wWkKmM]+)/)?.[1] || "")
  });
  const parseDomStats = (card, cardText = "") => {
    const textStats = parseStatsFromText(cardText);
    const stats = {
      views: textStats.views,
      likes: textStats.likes,
      comments: textStats.comments,
      shares: textStats.shares
    };
    if (!stats.likes) {
      stats.likes = extractTaggedMetric(card, /(\d[\d.,万亿wWkKmM]*)/);
    }
    return stats;
  };
  const extractBackgroundImageUrl = (node) => {
    if (!node?.getAttribute) return "";
    const style = node.getAttribute("style") || "";
    const match = style.match(/background(?:-image)?\s*:\s*url\((['"]?)(.*?)\1\)/i);
    return match?.[2] ? normalizeUrl(match[2]) : "";
  };
  const parseJsonBlob = (rawText = "") => {
    const text = String(rawText || "").trim();
    if (!text) return null;
    const candidates = [text];
    if (/%7B|%5B|%22/i.test(text)) {
      candidates.push(decodePercentText(text));
    }
    if ((text.startsWith("\"") && text.endsWith("\"")) || (text.startsWith("'") && text.endsWith("'"))) {
      try {
        const decoded = JSON.parse(text);
        if (typeof decoded === "string") {
          candidates.push(decoded);
        }
      } catch {}
    }
    for (const candidate of candidates) {
      const trimmed = String(candidate || "").trim();
      if (!trimmed) continue;
      const normalizedCandidate = trimmed.replace(/^window\.__[^=]+=\s*/, "").replace(/;$/, "");
      try {
        return JSON.parse(normalizedCandidate);
      } catch {}
    }
    return null;
  };
  const hasServiceError = () => /服务异常，重新刷新拉取数据/.test(bodyText());
  const extractCardCaption = (anchor, card, image, displayName = "") => {
    const cardText = normalizeText(card?.innerText || "");
    const anchorText = normalizeText(anchor?.textContent || "");
    const imageAlt = normalizeText(image?.getAttribute("alt") || "");
    const titleNodeText = normalizeText(
      card?.querySelector(
        "p[class], [class*='title'], [class*='desc'], [class*='caption'], [data-e2e*='desc']"
      )?.textContent || ""
    );
    const lines = cardText
      .split(/\n+/)
      .map((item) => normalizeText(item))
      .filter(Boolean)
      .filter((item) => !/^置顶$/.test(item))
      .filter((item) => !/^\d[\d.,万亿wWkKmM]*$/.test(item));
    const merged = dedupeRepeatedCaption(
      pickFirstText(
        cleanDisplayPrefix(titleNodeText, displayName),
        cleanDisplayPrefix(imageAlt, displayName),
        cleanDisplayPrefix(anchorText, displayName),
        cleanDisplayPrefix(lines.join(" "), displayName)
      )
    );
    return merged || "抖音公开样本";
  };
  const escapeRegExp = (value = "") => String(value || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  const collectJsonCandidates = () => {
    const videosByUrl = new Map();
    const profile = {
      displayName: "",
      accountHandle: "",
      bio: "",
      followers: 0,
      likes: 0
    };
    const scriptTexts = Array.from(document.scripts)
      .map((script) => script.textContent || "")
      .filter((text) => /RENDER_DATA|aweme|video|play_count|follower_count|share_info/i.test(text))
      .slice(0, 30);

    for (const text of scriptTexts) {
      const data = parseJsonBlob(text);
      if (!data) continue;
      walk(data, (node) => {
        const id = String(node?.aweme_id || node?.awemeId || node?.item_id || node?.itemId || node?.group_id || "");
        const videoUrl = pickFirstUrl(
          node?.share_url,
          node?.shareUrl,
          node?.share_info?.share_url,
          node?.seo_info?.canonical_url,
          id ? `https://www.douyin.com/video/${id}` : ""
        );
        if (/^https:\/\/www\.douyin\.com\/video\/\d+/i.test(videoUrl)) {
          const video = {
            videoId: String(videoUrl.match(/\/video\/(\d+)/)?.[1] || id || ""),
            videoUrl,
            caption: normalizeCaption(
              pickFirstText(
                node?.desc,
                node?.description,
                node?.share_info?.share_desc,
                node?.share_info?.share_title,
                node?.seo_info?.seo_title,
                node?.preview_title
              )
            ) || "抖音公开样本",
            thumbnailUrl: pickFirstUrl(
              node?.video?.dynamic_cover?.url_list?.[0],
              node?.video?.origin_cover?.url_list?.[0],
              node?.video?.cover?.url_list?.[0],
              node?.video?.cover?.urlList?.[0],
              node?.images?.[0]?.url_list?.[0],
              node?.images?.[0]?.urlList?.[0]
            ),
            durationSeconds: normalizeDuration(node?.video?.duration || node?.duration || node?.video_duration),
            stats: {
              views: Number(
                node?.statistics?.play_count ||
                node?.stats?.play_count ||
                node?.stats?.playCount ||
                0
              ),
              likes: Number(
                node?.statistics?.digg_count ||
                node?.stats?.digg_count ||
                node?.stats?.diggCount ||
                0
              ),
              comments: Number(
                node?.statistics?.comment_count ||
                node?.stats?.comment_count ||
                node?.stats?.commentCount ||
                0
              ),
              shares: Number(
                node?.statistics?.share_count ||
                node?.stats?.share_count ||
                node?.stats?.shareCount ||
                0
              )
            }
          };
          videosByUrl.set(video.videoUrl, mergeVideo(videosByUrl.get(video.videoUrl), video));
        }

        if (!profile.displayName || !profile.accountHandle || !profile.bio) {
          const nickname = pickFirstText(node?.nickname, node?.author?.nickname, node?.user?.nickname);
          const handle = pickFirstText(node?.unique_id, node?.short_id, node?.author?.unique_id, node?.author?.short_id);
          const signature = pickFirstText(node?.signature, node?.author?.signature, node?.user?.signature);
          const followers = Number(
            node?.follower_count ||
            node?.author?.follower_count ||
            node?.user?.follower_count ||
            0
          );
          const likes = Number(
            node?.total_favorited ||
            node?.favoriting_count ||
            node?.author?.total_favorited ||
            node?.user?.total_favorited ||
            0
          );
          if (nickname) profile.displayName = profile.displayName || nickname;
          if (handle) profile.accountHandle = profile.accountHandle || `@${handle.replace(/^@/, "")}`;
          if (signature) profile.bio = profile.bio || signature;
          if (followers > 0) profile.followers = Math.max(profile.followers, followers);
          if (likes > 0) profile.likes = Math.max(profile.likes, likes);
        }
      });
    }

    return {
      profile,
      videos: Array.from(videosByUrl.values())
    };
  };

  const getVideoLinks = () =>
    unique(
      Array.from(document.querySelectorAll('a[href*="/video/"]'))
        .map((anchor) => normalizeUrl(anchor.getAttribute("href") || ""))
        .filter((url) => /^https:\/\/www\.douyin\.com\/video\/\d+/i.test(url))
    ).slice(0, limit);
  const collectDomCandidates = () =>
    Array.from(document.querySelectorAll('a[href*="/video/"]'))
      .map((anchor) => {
        const videoUrl = normalizeUrl(anchor.getAttribute("href") || "");
        if (!/^https:\/\/www\.douyin\.com\/video\/\d+/i.test(videoUrl)) return null;
        const card =
          anchor.closest("li, article, [data-index], [class*='feed'], [class*='post'], [class*='video']") ||
          anchor.parentElement ||
          anchor;
        const cardText = normalizeText(card?.innerText || anchor.textContent || "");
        const image = card?.querySelector("img") || anchor.querySelector("img");
        const caption = extractCardCaption(anchor, card, image, getDisplayName());
        const backgroundCoverNode = card?.querySelector("[style*='background'], [class*='cover'], [class*='poster'], [class*='thumb']");
        return {
          videoUrl,
          videoId: String(videoUrl.match(/\/video\/(\d+)/)?.[1] || ""),
          caption: caption || "抖音公开样本",
          thumbnailUrl: pickFirstUrl(
            image?.currentSrc,
            image?.getAttribute("src"),
            image?.getAttribute("data-src"),
            extractBackgroundImageUrl(backgroundCoverNode)
          ),
          durationSeconds: parseDuration(cardText),
          stats: parseDomStats(card, cardText)
        };
      })
      .filter(Boolean);

  return (async () => {
    let bestSnapshot = null;

    for (let step = 0; step < 5; step += 1) {
      window.scrollTo(0, document.body.scrollHeight);
      await wait(950);
      const jsonCandidates = collectJsonCandidates();
      const videosByUrl = new Map();
      [...jsonCandidates.videos, ...collectDomCandidates()].forEach((video) => {
        if (!video?.videoUrl) return;
        videosByUrl.set(video.videoUrl, mergeVideo(videosByUrl.get(video.videoUrl), video));
      });

      const videos = Array.from(videosByUrl.values())
        .sort((left, right) => {
          const viewDelta = Number(right.stats?.views || 0) - Number(left.stats?.views || 0);
          if (viewDelta !== 0) return viewDelta;
          return scoreVideo(right) - scoreVideo(left);
        })
        .slice(0, limit);
      const snapshot = {
        profileUrl: location.href.split("?")[0],
        accountHandle: getHandle() || jsonCandidates.profile.accountHandle,
        displayName: getDisplayName() || jsonCandidates.profile.displayName,
        bio: getBio() || jsonCandidates.profile.bio,
        stats: {
          followers: Math.max(getStats().followers, jsonCandidates.profile.followers || 0),
          likes: Math.max(getStats().likes, jsonCandidates.profile.likes || 0)
        },
        serviceError: hasServiceError(),
        videos
      };
      if (!bestSnapshot || scoreProfileScanQuality(snapshot) > scoreProfileScanQuality(bestSnapshot)) {
        bestSnapshot = snapshot;
      }
      if (videos.length >= Math.min(limit, 3) && scoreProfileScanQuality(snapshot) >= 10 && !hasServiceError()) {
        break;
      }
    }
    window.scrollTo(0, 0);
    await wait(400);
    if (bestSnapshot?.videos?.length) {
      return bestSnapshot;
    }

    const fallbackVideos = getVideoLinks().map((videoUrl) => ({
      videoUrl,
      videoId: String(videoUrl.match(/\/video\/(\d+)/)?.[1] || ""),
      caption: "抖音公开样本",
      thumbnailUrl: "",
      durationSeconds: 0,
      stats: {
        views: 0,
        likes: 0,
        comments: 0,
        shares: 0
      }
    }));

    return {
      profileUrl: location.href.split("?")[0],
      accountHandle: getHandle(),
      displayName: getDisplayName(),
      bio: getBio(),
      stats: getStats(),
      videos: fallbackVideos
    };
  })();
}

function isProfileAutoScanSupported(platform = "") {
  return ["tiktok", "douyin"].includes(String(platform || "").toLowerCase());
}

function isSupportedProfileUrl(url = "", platform = "tiktok") {
  const value = String(url || "").trim();
  if (platform === "douyin") {
    return /^https:\/\/www\.douyin\.com\/user\/[^/?#]+/i.test(value);
  }
  return /^https:\/\/www\.tiktok\.com\/@[^/?#]+/i.test(value);
}

function getPlatformLabel(platform = "") {
  return String(platform || "").toLowerCase() === "douyin" ? "抖音" : "TikTok";
}
