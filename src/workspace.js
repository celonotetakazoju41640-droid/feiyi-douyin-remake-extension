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
  scenePrimaryLocation: document.querySelector("#scenePrimaryLocation"),
  sceneEnvironmentStyle: document.querySelector("#sceneEnvironmentStyle"),
  sceneContinuityRule: document.querySelector("#sceneContinuityRule"),
  storyboardEnabled: document.querySelector("#storyboardEnabled"),
  castList: document.querySelector("#castList"),
  addSupportingCast: document.querySelector("#addSupportingCast"),
  hookStyle: document.querySelector("#hookStyle"),
  visualStyle: document.querySelector("#visualStyle"),
  ctaText: document.querySelector("#ctaText"),
  tiktokUrl: document.querySelector("#tiktokUrl"),
  clipcatReferencePlatform: document.querySelector("#clipcatReferencePlatform"),
  clipcatVoiceLanguage: document.querySelector("#clipcatVoiceLanguage"),
  clipcatExtraRules: document.querySelector("#clipcatExtraRules"),
  accountTemplateSelect: document.querySelector("#accountTemplateSelect"),
  manageTemplateSelect: document.querySelector("#manageTemplateSelect"),
  manageTemplateSnapshot: document.querySelector("#manageTemplateSnapshot"),
  templateDeepDistillSummary: document.querySelector("#templateDeepDistillSummary"),
  manageProfileUrl: document.querySelector("#manageProfileUrl"),
  manageProfileStatus: document.querySelector("#manageProfileStatus"),
  manageScanSummary: document.querySelector("#manageScanSummary"),
  manageScanSummaryTitle: document.querySelector("#manageScanSummaryTitle"),
  manageScanSummaryMeta: document.querySelector("#manageScanSummaryMeta"),
  manageScanProgress: document.querySelector("#manageScanProgress"),
  manageScanProgressFill: document.querySelector("#manageScanProgressFill"),
  manageScanProgressText: document.querySelector("#manageScanProgressText"),
  manageScanSteps: document.querySelector("#manageScanSteps"),
  manageScanSummaryBody: document.querySelector("#manageScanSummaryBody"),
  deepDistillFolderInput: document.querySelector("#deepDistillFolderInput"),
  analyzeDeepDistillVideosButton: document.querySelector("#analyzeDeepDistillVideosButton"),
  clearDeepDistillVideosButton: document.querySelector("#clearDeepDistillVideosButton"),
  deepDistillStatus: document.querySelector("#deepDistillStatus"),
  deepDistillReadProgress: document.querySelector("#deepDistillReadProgress"),
  deepDistillReadProgressFill: document.querySelector("#deepDistillReadProgressFill"),
  deepDistillReadProgressText: document.querySelector("#deepDistillReadProgressText"),
  deepDistillAnalyzeProgress: document.querySelector("#deepDistillAnalyzeProgress"),
  deepDistillAnalyzeProgressFill: document.querySelector("#deepDistillAnalyzeProgressFill"),
  deepDistillAnalyzeProgressText: document.querySelector("#deepDistillAnalyzeProgressText"),
  deepDistillAnalyzeHint: document.querySelector("#deepDistillAnalyzeHint"),
  deepDistillActionFeedback: document.querySelector("#deepDistillActionFeedback"),
  deepDistillRecoveryNotice: document.querySelector("#deepDistillRecoveryNotice"),
  deepDistillStatusSummary: document.querySelector("#deepDistillStatusSummary"),
  deepDistillVideoList: document.querySelector("#deepDistillVideoList"),
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
  profileSamplePanel: document.querySelector("#profileSamplePanel"),
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
let profileScanUiState = "idle";
let profileScanUiMessage = "";
let profileScanProgressValue = 0;
let profileScanProgressTimer = null;
let profileScanStageKey = "idle";
let currentDeepDistillVideos = [];
let currentDeepDistillFiles = new Map();
let deepDistillAnalysisRunning = false;
let deepDistillReadRunning = false;
let deepDistillReadProgressValue = 0;
let deepDistillAnalyzeProgressValue = 0;
let deepDistillAnalyzeCurrentIndex = 0;
let deepDistillAnalyzeTotalCount = 0;
let currentCastDraft = [createDefaultCastDraftMember("host")];

function setProfileScanStage(stageKey, progressValue = null) {
  profileScanStageKey = stageKey || "idle";
  if (typeof progressValue === "number") {
    updateProfileScanProgress(progressValue);
  }
}

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
  renderCastList();
  renderAssetStatus();
  renderTemplateGuide();
  renderManageScanSummary();
  updateGenerateButtonState();
  updateActionFeedback();
  refreshBatchServiceHealth();
  syncFlowStepState();
  renderWizardStep();
  renderCurrentView();
  maybeShowOnboarding();
}

function bindEvents() {
  nodes.referenceVideoFile.addEventListener("change", handleReferenceVideoChange);
  nodes.productImages.addEventListener("change", handleProductImagesChange);
  nodes.targetDurationControl?.addEventListener("input", handleTargetDurationControlChange);
  nodes.remakeButton?.addEventListener("click", handleGenerate);
  nodes.productName?.addEventListener("input", () => {
    updateGenerateButtonState();
    updateActionFeedback();
  });
  nodes.storyboardEnabled?.addEventListener("change", updateActionFeedback);
  nodes.addSupportingCast?.addEventListener("click", handleAddSupportingCast);
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
    setActionFeedback("你也可以先继续填写，再回头补模型。");
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
  nodes.manageTemplateSelect?.addEventListener("change", handleManageTemplateSelectionChange);
  nodes.templatePlatform.addEventListener("change", handleTemplatePlatformChange);
  nodes.templateProfileUrl.addEventListener("input", handleTemplateProfileUrlInput);
  nodes.manageProfileUrl?.addEventListener("input", handleManageProfileUrlInput);
  nodes.scanProfileButton.addEventListener("click", handleProfileScan);
  nodes.deepDistillFolderInput?.addEventListener("change", handleDeepDistillFolderChange);
  nodes.analyzeDeepDistillVideosButton?.addEventListener("click", analyzeDeepDistillVideos);
  nodes.clearDeepDistillVideosButton?.addEventListener("click", clearDeepDistillVideos);
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
    const text = "这套工作台当前是本地版：上传产品图后会自动拆卖点，再补一句要求就能生成提示词和批量任务。";
    await navigator.clipboard.writeText(text);
    setActionFeedback("使用说明已复制。");
  });
  nodes.retryHealthButton.addEventListener("click", () => {
    setActionFeedback("这是本地版工作台，不需要额外启动。");
  });
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

function createDefaultCastDraftMember(roleType = "supporting", index = 0) {
  const safeRoleType = roleType === "host" ? "host" : "supporting";
  const suffix = safeRoleType === "host" ? 1 : index + 1;
  return {
    id: safeRoleType === "host" ? "host-1" : `support-${suffix}`,
    roleType: safeRoleType,
    label: safeRoleType === "host" ? "主讲人" : `配角${suffix}`,
    presenceRule: safeRoleType === "host" ? "always" : "selective",
    appearanceLock: "",
    behaviorRule: safeRoleType === "host" ? "负责讲解和展示商品" : "负责反应和烘托",
    voiceRule: safeRoleType === "host" ? "primary" : "silent"
  };
}

function normalizeCastDraft(cast = []) {
  const normalized = Array.isArray(cast) ? cast.map((member = {}, index) => ({
    id: String(member.id || member.castId || (index === 0 ? "host-1" : `support-${index}`)).trim(),
    roleType: String(member.roleType || (index === 0 ? "host" : "supporting")).trim() === "support" ? "supporting" : String(member.roleType || (index === 0 ? "host" : "supporting")).trim(),
    label: String(member.label || member.name || (index === 0 ? "主讲人" : `配角${index}`)).trim(),
    presenceRule: String(member.presenceRule || (index === 0 ? "always" : "selective")).trim(),
    appearanceLock: String(member.appearanceLock || "").trim(),
    behaviorRule: String(member.behaviorRule || "").trim(),
    voiceRule: String(member.voiceRule || (index === 0 ? "primary" : "silent")).trim()
  })) : [];

  if (!normalized.length) {
    return [createDefaultCastDraftMember("host")];
  }

  const hostIndex = normalized.findIndex((member) => member.roleType === "host");
  if (hostIndex === -1) {
    normalized[0].roleType = "host";
    normalized[0].id = "host-1";
    normalized[0].label = normalized[0].label || "主讲人";
    normalized[0].presenceRule = normalized[0].presenceRule || "always";
    normalized[0].voiceRule = normalized[0].voiceRule || "primary";
  } else if (hostIndex > 0) {
    const [host] = normalized.splice(hostIndex, 1);
    normalized.unshift(host);
  }

  return normalized.map((member, index) => ({
    ...member,
    id: index === 0 ? "host-1" : member.id || `support-${index}`,
    roleType: index === 0 ? "host" : "supporting",
    label: member.label || (index === 0 ? "主讲人" : `配角${index}`),
    presenceRule: member.presenceRule || (index === 0 ? "always" : "selective"),
    voiceRule: member.voiceRule || (index === 0 ? "primary" : "silent")
  }));
}

function renderCastList() {
  if (!nodes.castList) return;
  currentCastDraft = normalizeCastDraft(currentCastDraft);
  nodes.castList.innerHTML = currentCastDraft
    .map((member, index) => `
      <section class="castRow" data-cast-index="${index}">
        <div class="castRowMeta">
          <div>
            <strong>${escapeHtml(member.roleType === "host" ? "主讲人" : `配角 ${index}`)}</strong>
            <span>${escapeHtml(member.id)}</span>
          </div>
          ${member.roleType === "host" ? '<span class="countBadge">固定主讲</span>' : `<button class="ghostButton" type="button" data-cast-remove="${index}">删除配角</button>`}
        </div>
        <label class="fieldBlock">
          角色名称
          <input type="text" data-cast-field="label" value="${escapeHtml(member.label)}" />
        </label>
        <label class="fieldBlock">
          在场规则
          <select data-cast-field="presenceRule">
            <option value="always" ${member.presenceRule === "always" ? "selected" : ""}>always</option>
            <option value="selective" ${member.presenceRule === "selective" ? "selected" : ""}>selective</option>
          </select>
        </label>
        <label class="fieldBlock castWideField">
          行为职责
          <input type="text" data-cast-field="behaviorRule" value="${escapeHtml(member.behaviorRule)}" />
        </label>
        <label class="fieldBlock castWideField">
          外观锁定
          <input type="text" data-cast-field="appearanceLock" value="${escapeHtml(member.appearanceLock)}" placeholder="例如：same friend throughout / 同一套居家服" />
        </label>
      </section>
    `)
    .join("");

  nodes.castList.querySelectorAll("[data-cast-field]").forEach((field) => {
    field.addEventListener("input", handleCastFieldChange);
    field.addEventListener("change", handleCastFieldChange);
  });
  nodes.castList.querySelectorAll("[data-cast-remove]").forEach((button) => {
    button.addEventListener("click", () => removeSupportingCast(Number(button.dataset.castRemove)));
  });
}

function handleCastFieldChange(event) {
  const row = event.target.closest("[data-cast-index]");
  if (!row) return;
  const index = Number(row.dataset.castIndex);
  const field = event.target.dataset.castField;
  if (Number.isNaN(index) || !field || !currentCastDraft[index]) return;
  currentCastDraft[index] = {
    ...currentCastDraft[index],
    [field]: String(event.target.value || "").trim()
  };
}

function handleAddSupportingCast() {
  const supportCount = currentCastDraft.filter((member) => member.roleType === "supporting").length;
  currentCastDraft = normalizeCastDraft([
    ...currentCastDraft,
    createDefaultCastDraftMember("supporting", supportCount)
  ]);
  renderCastList();
}

function removeSupportingCast(index) {
  if (index <= 0) return;
  currentCastDraft = currentCastDraft.filter((_, memberIndex) => memberIndex !== index);
  renderCastList();
}

async function handleGenerate() {
  const template = await prepareTemplateForGeneration();
  const productName = nodes.productName.value.trim();
  const referenceSummary = nodes.referenceBrief.value.trim();
  const sellingPoints = splitLines(nodes.productNotes.value);

  if (!template) {
    setActionFeedback("当前还没有可用模型，请补一个主页链接或稍后再试。", true);
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
    storyboardEnabled: Boolean(nodes.storyboardEnabled?.checked),
    scenePlan: {
      primaryLocation: nodes.scenePrimaryLocation?.value.trim() || "",
      environmentStyle: nodes.sceneEnvironmentStyle?.value.trim() || "",
      continuityRule: nodes.sceneContinuityRule?.value.trim() || ""
    },
    cast: normalizeCastDraft(currentCastDraft),
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
    <div class="badge">可用模型 ${accountTemplates.length} 个</div>
    <div class="badge">输出：提示词 / 提交入口 / 导出</div>
  `;

  if (projects.length === 0) {
    currentProjectId = null;
    currentPackage = null;
    nodes.currentTaskStatusBadge.textContent = "未生成";
    nodes.currentTaskUnitLabel.textContent = "第 1 条";
    nodes.currentTaskHint.textContent = "先去生成页上传产品图，再补一句要求。生成后会自动回到这里。";
    nodes.projectDetailPanel.innerHTML = `<div class="emptyStateCard"><strong>还没有生成结果</strong><p>先去生成页完成一次生成。完成后，这里会承接项目摘要、提示词、批量任务和镜头细节。</p></div>`;
    nodes.shotEditorPanel.innerHTML = "";
    nodes.seriesList.innerHTML = `<div class="emptyStateCard"><strong>还没有最近记录</strong><p>第一次生成后，这里会保留最近结果、第一条提示词预览和切换入口。</p></div>`;
    renderCurrentResultSummary();
    updateResultButtons();
    return;
  }

  nodes.currentTaskStatusBadge.textContent = "可继续";
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
    storyboards: (currentPackage.storyboardTasks || [])
      .map(
        (task) =>
          `${task.unitId || "unit-01"}\n状态：${task.status}\nProvider：${task.provider}\n${task.imageUrl ? `预览：${task.imageUrl}` : "暂无图片"}${task.errorMessage ? `\n失败原因：${task.errorMessage}` : ""}\n\n${task.prompt || "当前还没有故事版提示词。"}`
      )
      .join("\n\n"),
    review: currentPackage.reviewChecklist.map((item) => `- ${item}`).join("\n")
  };

  const metaTextMap = {
    distilled: "这里是按对标账户模板抽出来的框架，不是照抄原视频。",
    variants: "这里给你 3 套候选版本：稳妥、快节奏、强转化。",
    batch: "这里是一组准备发给本地视频服务的批量任务。",
    storyboards: "这里是故事版中间层，先看角色、场景和连续性是否合理。"
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
        ["storyboards", "故事版图"],
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

function isBatchServiceOfflineError(error) {
  const message = error instanceof Error ? error.message : String(error || "");
  return /failed to fetch|fetch failed|networkerror|load failed/i.test(message);
}

function getBatchServiceOfflineMessage(actionName = "当前操作") {
  return `${actionName}没连上本地分析服务（127.0.0.1:4328）。先启动 4328 服务。`;
}

function getFriendlyBatchServiceErrorMessage(error, actionName = "当前操作") {
  if (isBatchServiceOfflineError(error)) {
    return getBatchServiceOfflineMessage(actionName);
  }
  const message = error instanceof Error ? error.message : String(error || "");
  return message.trim() || `${actionName}失败，请稍后重试。`;
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
    const message = getFriendlyBatchServiceErrorMessage(error, "发送批量任务");
    const detail = isBatchServiceOfflineError(error) ? `${message} 启动命令：${batchServiceCommand}` : message;
    setActionFeedback(`发送失败：${detail}`, true);
  }
}

async function refreshBatchServiceHealth() {
  try {
    const response = await fetch(`${batchServiceBaseUrl}/health`);
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
    if (data.deepDistillSupported) {
      nodes.batchServiceStatus.textContent = data.mode === "proxy_ready" ? "可分析 / 可提交" : "可分析";
    } else {
      nodes.batchServiceStatus.textContent = data.mode === "proxy_ready" ? "可提交" : "仅本地";
    }
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
  setActionFeedback("已切换当前模型。");
}

function handleManageTemplateSelectionChange() {
  if (!nodes.manageTemplateSelect) return;
  selectedTemplateId = nodes.manageTemplateSelect.value;
  currentProfileScan = null;
  selectedProfileVideoUrls = new Set();
  renderTemplateOptions();
  syncTemplateForm();
  applyTemplateToGenerationFields();
  renderTemplateGuide();
  renderProfileScanState();
  setActionFeedback("已切换当前模型。");
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
  const preservedDeepDistillFiles = new Map(currentDeepDistillFiles);
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
    sampleVideoUrls: splitLines(nodes.templateSampleVideoUrls.value),
    deepDistillVideos: currentDeepDistillVideos
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
  currentDeepDistillVideos = cloneDeepDistillVideos(template.deepDistillVideos || []);
  currentDeepDistillFiles = new Map(
    currentDeepDistillVideos
      .filter((video) => preservedDeepDistillFiles.has(video.id))
      .map((video) => [video.id, preservedDeepDistillFiles.get(video.id)])
  );
  renderDeepDistillVideoList();
  renderManageTemplateSnapshot();
  renderTemplateDeepDistillSummary();
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
  if (nodes.manageTemplateSelect) {
    nodes.manageTemplateSelect.innerHTML = nodes.accountTemplateSelect.innerHTML;
  }
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

function renderManageTemplateSnapshot() {
  if (!nodes.manageTemplateSnapshot) return;
  const template = getSelectedTemplate();
  if (!template) {
    nodes.manageTemplateSnapshot.innerHTML = "";
    return;
  }
  const readyCount = [
    template.contentPositioning,
    template.rhythm,
    template.structure,
    template.expressionDna
  ].filter((item) => String(item || "").trim()).length;
  const sampleCount = Array.isArray(template.sampleVideoUrls) ? template.sampleVideoUrls.length : 0;
  const hasProfileUrl = Boolean(String(template.profileUrl || "").trim());
  nodes.manageTemplateSnapshot.innerHTML = `
    <span class="templateDeepDistillChip">主页：${hasProfileUrl ? "已绑定" : "未绑定"}</span>
    <span class="templateDeepDistillChip">基础字段：${readyCount}/4</span>
    <span class="templateDeepDistillChip">主页样本：${sampleCount} 条</span>
  `;
}

function renderTemplateDeepDistillSummary() {
  if (!nodes.templateDeepDistillSummary) return;
  const template = getSelectedTemplate();
  const deepSummary = buildTemplateDeepDistillSnapshot(template);
  if (!deepSummary) {
    nodes.templateDeepDistillSummary.hidden = true;
    nodes.templateDeepDistillSummary.innerHTML = "";
    return;
  }

  nodes.templateDeepDistillSummary.hidden = false;
  nodes.templateDeepDistillSummary.innerHTML = `
    <div class="templateDeepDistillSummaryHead">
      <strong>当前模板视频重点</strong>
      <span class="countBadge">${deepSummary.videoCount} 条样本</span>
    </div>
    <div class="templateDeepDistillSummaryGrid">
      <span class="templateDeepDistillChip">0 帧起手：${escapeHtml(deepSummary.zeroFrameBias)}</span>
      <span class="templateDeepDistillChip">钩子：${escapeHtml(deepSummary.hookTypes || "未提炼")}</span>
      <span class="templateDeepDistillChip">节奏：${escapeHtml(deepSummary.shotRhythms || "未提炼")}</span>
      <span class="templateDeepDistillChip">证明：${escapeHtml(deepSummary.proofStyles || "未提炼")}</span>
      <span class="templateDeepDistillChip">收口：${escapeHtml(deepSummary.ctaStyles || "未提炼")}</span>
      <span class="templateDeepDistillChip">情绪：${escapeHtml(deepSummary.emotionCurves || "未提炼")}</span>
    </div>
    <p class="templateDeepDistillSummaryText">${escapeHtml(deepSummary.summary)}</p>
  `;
}

function buildTemplateDeepDistillSnapshot(templateLike = {}) {
  const videos = Array.isArray(templateLike?.deepDistillVideos) ? templateLike.deepDistillVideos : [];
  if (!videos.length) return null;

  const zeroFrameYesCount = videos.filter((video) => video.analysis?.isZeroFrameProductHook === "是").length;
  const zeroFrameNoCount = videos.filter((video) => video.analysis?.isZeroFrameProductHook === "否").length;
  const zeroFrameBias =
    zeroFrameYesCount > zeroFrameNoCount
      ? `偏 0 帧起手`
      : zeroFrameNoCount > zeroFrameYesCount
        ? `偏非 0 帧起手`
        : "待继续观察";

  const hookTypes = pickTopTemplateDeepDistillValues(videos, "hookType");
  const emotionCurves = pickTopTemplateDeepDistillValues(videos, "emotionCurve");
  const shotRhythms = pickTopTemplateDeepDistillValues(videos, "shotRhythm");
  const proofStyles = pickTopTemplateDeepDistillValues(videos, "proofStyle");
  const ctaStyles = pickTopTemplateDeepDistillValues(videos, "ctaStyle");

  return {
    videoCount: videos.length,
    zeroFrameBias,
    hookTypes,
    emotionCurves,
    shotRhythms,
    proofStyles,
    ctaStyles,
    summary: [
      `${videos.length} 条视频样本里，${zeroFrameBias}`,
      hookTypes ? `前 3 秒更常见“${hookTypes}”` : "",
      shotRhythms ? `镜头节奏更偏“${shotRhythms}”` : "",
      proofStyles ? `卖点证明更偏“${proofStyles}”` : ""
    ]
      .filter(Boolean)
      .join("，")
  };
}

function pickTopTemplateDeepDistillValues(videos, field, limit = 2) {
  const counts = new Map();
  videos.forEach((video) => {
    const value = String(video.analysis?.[field] || "").trim();
    if (!value) return;
    counts.set(value, (counts.get(value) || 0) + 1);
  });
  return Array.from(counts.entries())
    .sort((left, right) => right[1] - left[1])
    .slice(0, limit)
    .map(([value]) => value)
    .join(" / ");
}

function syncTemplateForm() {
  const template = getSelectedTemplate();
  if (!template) return;
  nodes.templateName.value = template.name || "";
  nodes.templatePlatform.value = template.platform || "tiktok";
  nodes.templateAccountHandle.value = template.accountHandle || "";
  syncProfileUrlInputs(template.profileUrl || "");
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
  currentDeepDistillVideos = cloneDeepDistillVideos(template.deepDistillVideos || []);
  currentDeepDistillFiles = new Map();
  renderDeepDistillVideoList();
  renderManageTemplateSnapshot();
  renderTemplateDeepDistillSummary();
  updatePlatformDependentUi();
}

function syncProfileUrlInputs(value) {
  const nextValue = value || "";
  nodes.templateProfileUrl.value = nextValue;
  if (nodes.manageProfileUrl) {
    nodes.manageProfileUrl.value = nextValue;
  }
}

function handleTemplateProfileUrlInput() {
  if (nodes.manageProfileUrl && nodes.manageProfileUrl.value !== nodes.templateProfileUrl.value) {
    nodes.manageProfileUrl.value = nodes.templateProfileUrl.value;
  }
  syncFlowStepState();
}

function handleManageProfileUrlInput() {
  if (nodes.templateProfileUrl.value !== nodes.manageProfileUrl.value) {
    nodes.templateProfileUrl.value = nodes.manageProfileUrl.value;
  }
  syncFlowStepState();
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

function cloneDeepDistillVideos(videos = []) {
  return Array.isArray(videos)
    ? videos.map((video) => ({
        ...video,
        analysisState: String(video.analysisState || "").trim(),
        analysisErrorMessage: String(video.analysisErrorMessage || "").trim(),
        lastAnalyzedAt: String(video.lastAnalyzedAt || "").trim(),
        analysis: {
          isZeroFrameProductHook: video.analysis?.isZeroFrameProductHook || "待判断",
          firstStrongProductSecond: video.analysis?.firstStrongProductSecond || "",
          hookType: video.analysis?.hookType || "",
          emotionCurve: video.analysis?.emotionCurve || "",
          shotRhythm: video.analysis?.shotRhythm || "",
          proofStyle: video.analysis?.proofStyle || "",
          ctaStyle: video.analysis?.ctaStyle || "",
          sceneProgression: video.analysis?.sceneProgression || "",
          visualDna: video.analysis?.visualDna || "",
          summary: video.analysis?.summary || ""
        }
      }))
    : [];
}

async function handleDeepDistillFolderChange(event) {
  const files = Array.from(event.target.files || []).filter((file) => String(file.type || "").startsWith("video/"));
  if (!files.length) {
    currentDeepDistillFiles = new Map();
    deepDistillReadRunning = false;
    updateDeepDistillReadProgress(0, "0%", false);
    setDeepDistillStatus("没读到可用视频，请重新选择本地视频文件夹。", true);
    renderDeepDistillVideoList();
    return;
  }

  deepDistillReadRunning = true;
  updateDeepDistillActionState();
  setDeepDistillStatus(`正在读取 ${files.length} 条本地视频...`);
  setActionFeedback("正在读取本地视频元数据和基础信息，完成后会先保存样本，不会直接自动分析。");
  setDeepDistillActionFeedback(`正在读取本地视频 0 / ${files.length}。读完后按钮会自动变成“开始 AI 拆解”。`, "is-active");
  updateDeepDistillAnalyzeProgress(0, "0%", false);
  updateDeepDistillReadProgress(0, `0 / ${files.length}`, true);

  const nextVideos = [];
  const nextFiles = new Map();
  for (let index = 0; index < files.length; index += 1) {
    const file = files[index];
    setDeepDistillStatus(`正在读取 ${index + 1} / ${files.length}：${file.name}`);
    const nextVideo = await buildDeepDistillVideoFromFile(file);
    nextVideos.push(nextVideo);
    nextFiles.set(nextVideo.id, file);
    setDeepDistillActionFeedback(`正在读取本地视频 ${index + 1} / ${files.length}：${file.name}。读完后按钮会自动变成“开始 AI 拆解”。`, "is-active");
    updateDeepDistillReadProgress(
      ((index + 1) / files.length) * 100,
      `${index + 1} / ${files.length}`,
      true
    );
  }

  currentDeepDistillVideos = nextVideos;
  currentDeepDistillFiles = nextFiles;
  deepDistillReadRunning = false;
  renderDeepDistillVideoList();
  saveCurrentTemplate();
  setDeepDistillStatus(`已读取 ${nextVideos.length} 条本地视频，并保存到当前模型。`);
  updateDeepDistillReadProgress(100, `${nextVideos.length} / ${nextVideos.length}`, true);
  if (nodes.deepDistillFolderInput) {
    nodes.deepDistillFolderInput.value = "";
  }
}

async function buildDeepDistillVideoFromFile(file) {
  const durationSeconds = await readVideoDurationFromFile(file);
  const relativePath = String(file.webkitRelativePath || file.name || "").trim();
  const normalizedName = String(file.name || "未命名视频").trim();
  return {
    id: safeLocalSlug(relativePath || `${normalizedName}-${Date.now()}`),
    fileName: normalizedName,
    relativePath,
    durationSeconds,
    sizeBytes: Number(file.size || 0),
    lastModified: Number(file.lastModified || Date.now()),
    analysisState: "待分析",
    analysisErrorMessage: "",
    lastAnalyzedAt: "",
    analysis: {
      isZeroFrameProductHook: "待判断",
      firstStrongProductSecond: durationSeconds > 0 ? "0-1 秒待确认" : "",
      hookType: "",
      emotionCurve: "",
      shotRhythm: "",
      proofStyle: "",
      ctaStyle: "",
      sceneProgression: "",
      visualDna: "",
      summary: ""
    }
  };
}

function readVideoDurationFromFile(file) {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement("video");
    const finish = (value = 0) => {
      URL.revokeObjectURL(url);
      resolve(Math.max(0, Math.round(Number(value || 0))));
    };
    video.preload = "metadata";
    video.onloadedmetadata = () => finish(video.duration);
    video.onerror = () => finish(0);
    video.src = url;
  });
}

function clearDeepDistillVideos() {
  currentDeepDistillVideos = [];
  currentDeepDistillFiles = new Map();
  updateDeepDistillReadProgress(0, "0%", false);
  updateDeepDistillAnalyzeProgress(0, "0%", false);
  renderDeepDistillVideoList();
  saveCurrentTemplate();
  setDeepDistillStatus("已清空当前模型下的视频深蒸馏样本。");
}

function setDeepDistillStatus(message, isError = false) {
  if (!nodes.deepDistillStatus) return;
  nodes.deepDistillStatus.textContent = message;
  nodes.deepDistillStatus.classList.toggle("is-error", Boolean(isError));
  nodes.deepDistillStatus.classList.toggle("is-ok", !isError && /已|完成|保存/.test(message));
}

function updateDeepDistillReadProgress(value = 0, text = "0%", visible = false) {
  deepDistillReadProgressValue = Math.max(0, Math.min(100, Number(value || 0)));
  if (nodes.deepDistillReadProgress) {
    nodes.deepDistillReadProgress.hidden = !visible;
  }
  if (nodes.deepDistillReadProgressFill) {
    nodes.deepDistillReadProgressFill.style.width = `${deepDistillReadProgressValue}%`;
  }
  if (nodes.deepDistillReadProgressText) {
    nodes.deepDistillReadProgressText.textContent = text;
  }
}

function updateDeepDistillAnalyzeProgress(value = 0, text = "0%", visible = false) {
  deepDistillAnalyzeProgressValue = Math.max(0, Math.min(100, Number(value || 0)));
  if (nodes.deepDistillAnalyzeProgress) {
    nodes.deepDistillAnalyzeProgress.hidden = !visible;
  }
  if (nodes.deepDistillAnalyzeProgressFill) {
    nodes.deepDistillAnalyzeProgressFill.style.width = `${deepDistillAnalyzeProgressValue}%`;
  }
  if (nodes.deepDistillAnalyzeProgressText) {
    nodes.deepDistillAnalyzeProgressText.textContent = text;
  }
  renderDeepDistillAnalyzeHint();
}

function setDeepDistillActionFeedback(message, tone = "") {
  if (!nodes.deepDistillActionFeedback) return;
  nodes.deepDistillActionFeedback.textContent = message;
  nodes.deepDistillActionFeedback.classList.remove("is-active", "is-ok", "is-error");
  if (tone) {
    nodes.deepDistillActionFeedback.classList.add(tone);
  }
}

function renderDeepDistillVideoList() {
  if (!nodes.deepDistillVideoList) return;
  updateDeepDistillActionState();
  renderDeepDistillStatusSummary();
  renderDeepDistillRecoveryNotice();
  renderTemplateDeepDistillSummary();
  if (!currentDeepDistillVideos.length) {
    if (nodes.deepDistillStatusSummary) {
      nodes.deepDistillStatusSummary.hidden = true;
      nodes.deepDistillStatusSummary.innerHTML = "";
    }
    if (nodes.deepDistillRecoveryNotice) {
      nodes.deepDistillRecoveryNotice.hidden = true;
      nodes.deepDistillRecoveryNotice.textContent = "";
      nodes.deepDistillRecoveryNotice.classList.remove("is-ok");
    }
    nodes.deepDistillVideoList.innerHTML =
      '<p class="emptyState">先读取一个本地视频文件夹。读取完成后，这里会先保留样本；需要时再点自动分析。</p>';
    setDeepDistillStatus("还没有读取本地视频");
    setDeepDistillActionFeedback("先读取本地视频文件夹，然后这里会出现可点击的 AI 拆解动作。");
    return;
  }

  const hasLocalFiles = currentDeepDistillVideos.some((video) => currentDeepDistillFiles.has(video.id));
  nodes.deepDistillVideoList.innerHTML = currentDeepDistillVideos
    .map(
      (video, index) => `
        <details class="deepDistillVideoCard" data-deep-video-id="${escapeHtml(video.id)}">
          <summary class="deepDistillVideoSummary">
            <div class="deepDistillVideoMeta">
              <strong>${escapeHtml(video.fileName || `视频 ${index + 1}`)}</strong>
              <div class="deepDistillVideoPath">${escapeHtml(video.relativePath || "本地文件")}</div>
              <div class="deepDistillVideoSnapshot">${escapeHtml(buildDeepDistillVideoSnapshot(video))}</div>
              <div class="deepDistillVideoStateMeta">
                <span class="countBadge ${getDeepDistillStateBadgeClass(video)}">${escapeHtml(getDeepDistillAnalysisStateLabel(video))}</span>
                ${video.lastAnalyzedAt ? `<span class="countBadge">最近分析：${escapeHtml(formatDeepDistillTime(video.lastAnalyzedAt))}</span>` : ""}
                ${currentDeepDistillFiles.has(video.id) ? '<span class="countBadge">本地文件已就绪</span>' : '<span class="countBadge is-warn">需重新读取本地文件</span>'}
              </div>
            </div>
            <div class="deepDistillVideoBadges">
              <span class="countBadge">${Number(video.durationSeconds || 0)} 秒</span>
              <span class="countBadge">${formatFileSize(video.sizeBytes || 0)}</span>
              <button class="ghostButton" type="button" data-remove-deep-video="${escapeHtml(video.id)}">删除</button>
            </div>
          </summary>
          <div class="deepDistillVideoBody">
          ${video.analysisErrorMessage ? `<div class="detailMeta">${escapeHtml(video.analysisErrorMessage)}</div>` : ""}
          <div class="deepDistillVideoGrid">
            <label class="fieldBlock">
              0 帧起手
              <select data-deep-video-field="isZeroFrameProductHook">
                ${["待判断", "是", "否"]
                  .map((option) => `<option value="${option}" ${video.analysis?.isZeroFrameProductHook === option ? "selected" : ""}>${option}</option>`)
                  .join("")}
              </select>
            </label>
            <label class="fieldBlock">
              商品强露出秒点
              <input data-deep-video-field="firstStrongProductSecond" type="text" value="${escapeHtml(video.analysis?.firstStrongProductSecond || "")}" placeholder="比如：0 秒、3 秒、8 秒" />
            </label>
            <label class="fieldBlock">
              钩子类型
              <input data-deep-video-field="hookType" type="text" value="${escapeHtml(video.analysis?.hookType || "")}" placeholder="比如：0 帧商品、误会、冲突、问题开场" />
            </label>
            <label class="fieldBlock">
              情绪曲线
              <input data-deep-video-field="emotionCurve" type="text" value="${escapeHtml(video.analysis?.emotionCurve || "")}" placeholder="比如：紧张 -> 好奇 -> 结果释放" />
            </label>
            <label class="fieldBlock">
              镜头节奏
              <input data-deep-video-field="shotRhythm" type="text" value="${escapeHtml(video.analysis?.shotRhythm || "")}" placeholder="比如：0-3 秒快切，后半段放慢证明" />
            </label>
            <label class="fieldBlock">
              卖点证明
              <input data-deep-video-field="proofStyle" type="text" value="${escapeHtml(video.analysis?.proofStyle || "")}" placeholder="比如：前后对比、真人反应、实验结果" />
            </label>
            <label class="fieldBlock">
              收口方式
              <input data-deep-video-field="ctaStyle" type="text" value="${escapeHtml(video.analysis?.ctaStyle || "")}" placeholder="比如：商品定格、结果复述、轻 CTA" />
            </label>
            <label class="fieldBlock backstageWideField">
              场景推进
              <textarea data-deep-video-field="sceneProgression" rows="2" placeholder="按时间顺序写：开场冲突 -> 商品出场 -> 证明 -> 收口">${escapeHtml(video.analysis?.sceneProgression || "")}</textarea>
            </label>
            <label class="fieldBlock backstageWideField">
              视觉 DNA
              <textarea data-deep-video-field="visualDna" rows="2" placeholder="比如：近景压迫、手持跟拍、字幕节奏、暖冷色倾向">${escapeHtml(video.analysis?.visualDna || "")}</textarea>
            </label>
            <label class="fieldBlock backstageWideField">
              一句话总结
              <textarea data-deep-video-field="summary" rows="2" placeholder="一句话写清这条视频最该学的框架">${escapeHtml(video.analysis?.summary || "")}</textarea>
            </label>
          </div>
          </div>
        </details>
      `
    )
    .join("");

  const counts = getDeepDistillCounts();
  const statusSummary = `已分析 ${counts.analyzedCount} 条，可开始拆解 ${counts.readyToAnalyzeCount} 条，失败 ${counts.failedCount} 条。`;
  if (hasLocalFiles) {
    setDeepDistillStatus(`当前模型已载入 ${currentDeepDistillVideos.length} 条本地视频样本。${statusSummary}可继续自动分析。`);
    if (counts.readyToAnalyzeCount > 0) {
      const estimateSecondsMin = counts.readyToAnalyzeCount * 8;
      const estimateSecondsMax = counts.readyToAnalyzeCount * 18;
      setDeepDistillActionFeedback(
        `已读取 ${counts.readyToAnalyzeCount} 条可处理视频。现在点“开始 AI 拆解”就会开始跑，预计约 ${estimateSecondsMin}-${estimateSecondsMax} 秒。`,
        "is-ok"
      );
    } else if (counts.analyzedCount > 0 && counts.failedCount === 0) {
      setDeepDistillActionFeedback("这批视频已经拆完；如果你想重跑，点“重新 AI 拆解当前视频”。", "is-ok");
    }
  } else {
    setDeepDistillStatus(`当前模型里有 ${currentDeepDistillVideos.length} 条历史记录，但还没重新选本地视频，所以现在不能开始拆解。`);
    setDeepDistillActionFeedback("先点左边“读取本地视频文件夹”，读完后这里会直接变成“开始 AI 拆解”。");
  }

  nodes.deepDistillVideoList.querySelectorAll("[data-deep-video-id]").forEach((card) => {
    const videoId = card.dataset.deepVideoId;
    card.querySelectorAll("[data-deep-video-field]").forEach((input) => {
      input.addEventListener("input", () => updateDeepDistillVideoField(videoId, input.dataset.deepVideoField, input.value));
      input.addEventListener("change", () => updateDeepDistillVideoField(videoId, input.dataset.deepVideoField, input.value));
    });
  });

  nodes.deepDistillVideoList.querySelectorAll("[data-remove-deep-video]").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      removeDeepDistillVideo(button.dataset.removeDeepVideo);
    });
  });
}

function updateDeepDistillActionState() {
  if (nodes.analyzeDeepDistillVideosButton) {
    const hasAnalyzableVideos = currentDeepDistillVideos.some((video) => currentDeepDistillFiles.has(video.id));
    const resumableVideos = currentDeepDistillVideos.filter((video) =>
      currentDeepDistillFiles.has(video.id) && getDeepDistillAnalysisStateLabel(video) !== "已分析"
    );
    nodes.analyzeDeepDistillVideosButton.disabled = deepDistillReadRunning || deepDistillAnalysisRunning || !hasAnalyzableVideos;
    nodes.analyzeDeepDistillVideosButton.textContent = deepDistillReadRunning
      ? "正在读取本地视频..."
      : deepDistillAnalysisRunning
      ? "正在 AI 拆解..."
      : hasAnalyzableVideos
        ? resumableVideos.length > 0
          ? `开始 AI 拆解（${resumableVideos.length} 条待处理）`
          : "重新 AI 拆解当前视频"
        : "先选择本地视频";
  }
  if (nodes.clearDeepDistillVideosButton) {
    nodes.clearDeepDistillVideosButton.disabled = deepDistillAnalysisRunning || currentDeepDistillVideos.length === 0;
  }
  renderDeepDistillAnalyzeHint();
  renderDeepDistillRecoveryNotice();
}

function updateDeepDistillVideoField(videoId, field, value) {
  if (!videoId || !field) return;
  currentDeepDistillVideos = currentDeepDistillVideos.map((video) =>
    video.id === videoId
      ? {
          ...video,
          analysis: {
            ...video.analysis,
            [field]: String(value || "").trim()
          }
        }
      : video
  );
}

function removeDeepDistillVideo(videoId) {
  if (!videoId) return;
  currentDeepDistillVideos = currentDeepDistillVideos.filter((video) => video.id !== videoId);
  currentDeepDistillFiles.delete(videoId);
  renderDeepDistillVideoList();
  saveCurrentTemplate();
  setDeepDistillStatus(
    currentDeepDistillVideos.length ? `已删除 1 条视频，当前还剩 ${currentDeepDistillVideos.length} 条。` : "当前模型下已没有视频深蒸馏样本。"
  );
}

async function analyzeDeepDistillVideos() {
  const analyzableVideos = currentDeepDistillVideos.filter((video) => currentDeepDistillFiles.has(video.id));
  if (!analyzableVideos.length) {
    setActionFeedback("当前没有可自动分析的视频。请先重新选择本地视频文件夹。", true);
    setDeepDistillStatus("当前没有可自动分析的视频，请先重新选择本地视频文件夹。", true);
    return;
  }

  deepDistillAnalysisRunning = true;
  deepDistillAnalyzeCurrentIndex = 0;
  deepDistillAnalyzeTotalCount = analyzableVideos.length;
  updateDeepDistillActionState();
  setDeepDistillActionFeedback(`正在 AI 拆解 0 / ${analyzableVideos.length}，马上开始逐条处理。`, "is-active");
  setActionFeedback("正在做视频深蒸馏自动分析，会按视频顺序逐条回填。");
  updateDeepDistillAnalyzeProgress(0, `0 / ${analyzableVideos.length}`, true);

  try {
    for (let index = 0; index < analyzableVideos.length; index += 1) {
      const video = analyzableVideos[index];
      const file = currentDeepDistillFiles.get(video.id);
      if (!file) continue;

      deepDistillAnalyzeCurrentIndex = index + 1;
      renderDeepDistillAnalyzeHint(video.fileName);
      setDeepDistillStatus(`正在抽帧并分析 ${index + 1} / ${analyzableVideos.length}：${video.fileName}`);
      setDeepDistillActionFeedback(`正在 AI 拆解 ${index + 1} / ${analyzableVideos.length}：${video.fileName}`, "is-active");
      const frames = await extractDeepDistillFramesFromFile(file, Number(video.durationSeconds || 0));
      const response = await fetch(`${batchServiceBaseUrl}/api/deep-distill/analyze`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          videos: [
            {
              id: video.id,
              fileName: video.fileName,
              relativePath: video.relativePath,
              durationSeconds: video.durationSeconds,
              sizeBytes: video.sizeBytes,
              frames
            }
          ]
        })
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.message || `${response.status} ${response.statusText}`);
      }
      const result = Array.isArray(data.results) ? data.results[0] : null;
      if (!result?.id || !result?.analysis) {
        throw new Error("自动分析接口返回为空，暂时没有拿到可回填结果。");
      }
      currentDeepDistillVideos = currentDeepDistillVideos.map((item) =>
        item.id === result.id
          ? {
              ...item,
              analysisState: "已分析",
              analysisErrorMessage: "",
              lastAnalyzedAt: new Date().toISOString(),
              analysis: {
                ...item.analysis,
                ...result.analysis
              }
            }
          : item
      );
      renderDeepDistillVideoList();
      updateDeepDistillAnalyzeProgress(
        ((index + 1) / analyzableVideos.length) * 100,
        `${index + 1} / ${analyzableVideos.length}`,
        true
      );
    }

    saveCurrentTemplate();
    setDeepDistillStatus(`自动分析完成，已回填 ${analyzableVideos.length} 条视频。`);
    setDeepDistillActionFeedback(`AI 拆解完成，已回填 ${analyzableVideos.length} 条视频。`, "is-ok");
    setActionFeedback(`视频深蒸馏已完成，当前共回填 ${analyzableVideos.length} 条视频。`);
  } catch (error) {
    const message = getFriendlyBatchServiceErrorMessage(error, "AI 拆解");
    const detail = isBatchServiceOfflineError(error) ? `${message} 启动命令：${batchServiceCommand}` : message;
    currentDeepDistillVideos = currentDeepDistillVideos.map((item) => ({
      ...item,
      analysisState: currentDeepDistillFiles.has(item.id) ? "分析失败" : item.analysisState,
      analysisErrorMessage: currentDeepDistillFiles.has(item.id) ? message : item.analysisErrorMessage
    }));
    renderDeepDistillVideoList();
    saveCurrentTemplate();
    setDeepDistillStatus(`自动分析失败：${message}`, true);
    setDeepDistillActionFeedback(`AI 拆解失败：${message}`, "is-error");
    setActionFeedback(`视频深蒸馏自动分析失败：${detail}`, true);
  } finally {
    deepDistillAnalysisRunning = false;
    deepDistillAnalyzeCurrentIndex = 0;
    deepDistillAnalyzeTotalCount = 0;
    updateDeepDistillActionState();
  }
}

function renderDeepDistillAnalyzeHint(currentFileName = "") {
  if (!nodes.deepDistillAnalyzeHint) return;
  const analyzableVideos = currentDeepDistillVideos.filter((video) => currentDeepDistillFiles.has(video.id));
  const pendingVideos = analyzableVideos.filter((video) => getDeepDistillAnalysisStateLabel(video) !== "已分析");

  if (!analyzableVideos.length) {
    nodes.deepDistillAnalyzeHint.textContent = currentDeepDistillVideos.length
      ? "当前这些是历史样本，还没重新读入本地文件，所以第 2 步不会开始。先点左边“读取本地视频文件夹”。"
      : "先读取视频后，系统会在这里显示预计耗时和当前拆解进度。";
    return;
  }

  const estimateSecondsMin = pendingVideos.length * 8;
  const estimateSecondsMax = pendingVideos.length * 18;

  if (deepDistillAnalysisRunning && deepDistillAnalyzeTotalCount > 0) {
    const remaining = Math.max(deepDistillAnalyzeTotalCount - deepDistillAnalyzeCurrentIndex, 0);
    const remainingMin = remaining * 8;
    const remainingMax = remaining * 18;
    nodes.deepDistillAnalyzeHint.textContent =
      `正在拆解第 ${deepDistillAnalyzeCurrentIndex} / ${deepDistillAnalyzeTotalCount} 条${currentFileName ? `：${currentFileName}` : ""}。预计总耗时约 ${deepDistillAnalyzeTotalCount * 8}-${deepDistillAnalyzeTotalCount * 18} 秒，剩余约 ${remainingMin}-${remainingMax} 秒，结果会逐条回填。`;
    return;
  }

  if (!pendingVideos.length) {
    nodes.deepDistillAnalyzeHint.textContent = "当前处于“本地文件已就绪、拆解已完成”状态。你可以重新分析，或继续读取一批新视频。";
    return;
  }

  nodes.deepDistillAnalyzeHint.textContent =
    `当前处于“已读取、未开始 AI 拆解”状态，还有 ${pendingVideos.length} 条待处理。按现在这批量，预计约 ${estimateSecondsMin}-${estimateSecondsMax} 秒跑完。`;
}

function getDeepDistillCounts() {
  const analyzedCount = currentDeepDistillVideos.filter((video) => getDeepDistillAnalysisStateLabel(video) === "已分析").length;
  const failedCount = currentDeepDistillVideos.filter((video) => getDeepDistillAnalysisStateLabel(video) === "分析失败").length;
  const readyToAnalyzeCount = currentDeepDistillVideos.filter((video) =>
    currentDeepDistillFiles.has(video.id) && getDeepDistillAnalysisStateLabel(video) === "待分析"
  ).length;
  const needsReloadCount = currentDeepDistillVideos.filter((video) => !currentDeepDistillFiles.has(video.id)).length;
  return {
    analyzedCount,
    failedCount,
    readyToAnalyzeCount,
    needsReloadCount
  };
}

function renderDeepDistillRecoveryNotice() {
  if (!nodes.deepDistillRecoveryNotice) return;
  if (!currentDeepDistillVideos.length) {
    nodes.deepDistillRecoveryNotice.hidden = true;
    nodes.deepDistillRecoveryNotice.textContent = "";
    nodes.deepDistillRecoveryNotice.classList.remove("is-ok");
    return;
  }

  const hasLocalFiles = currentDeepDistillVideos.some((video) => currentDeepDistillFiles.has(video.id));
  const counts = getDeepDistillCounts();

  nodes.deepDistillRecoveryNotice.hidden = false;
  if (!hasLocalFiles) {
    nodes.deepDistillRecoveryNotice.classList.remove("is-ok");
    nodes.deepDistillRecoveryNotice.textContent =
      `当前有 ${counts.needsReloadCount} 条历史视频记录，但这次还没重新选本地视频，所以现在不能开始拆解。先点“读取本地视频文件夹”。`;
    return;
  }

  if (deepDistillAnalysisRunning) {
    nodes.deepDistillRecoveryNotice.classList.add("is-ok");
    nodes.deepDistillRecoveryNotice.textContent = "AI 正在逐条拆解当前已读入的视频，进度条和卡片状态会同步刷新。";
    return;
  }

  if (counts.readyToAnalyzeCount > 0) {
    nodes.deepDistillRecoveryNotice.classList.add("is-ok");
    nodes.deepDistillRecoveryNotice.textContent = `本地文件已读入，当前有 ${counts.readyToAnalyzeCount} 条可以直接开始 AI 拆解。`;
    return;
  }

  nodes.deepDistillRecoveryNotice.classList.add("is-ok");
  nodes.deepDistillRecoveryNotice.textContent = "这一批视频已经拆解完成；如果换了新视频，回到第 1 步重新读取即可。";
}

function buildDeepDistillVideoSnapshot(video = {}) {
  const analysis = video.analysis || {};
  if (video.analysisState === "分析失败" && video.analysisErrorMessage) {
    return `失败：${video.analysisErrorMessage}`;
  }
  if (analysis.summary) {
    return analysis.summary;
  }
  const parts = [
    analysis.hookType ? `钩子：${analysis.hookType}` : "",
    analysis.proofStyle ? `证明：${analysis.proofStyle}` : "",
    analysis.ctaStyle ? `收口：${analysis.ctaStyle}` : ""
  ].filter(Boolean);
  return parts.length ? parts.join(" / ") : "当前只完成本地读取，还没做自动分析。";
}

function getDeepDistillAnalysisStateLabel(video = {}) {
  if (video.analysisState) {
    return video.analysisState;
  }
  const analysis = video.analysis || {};
  const hasAnalysis = Boolean(
    analysis.summary
      || analysis.hookType
      || analysis.emotionCurve
      || analysis.shotRhythm
      || analysis.proofStyle
      || analysis.ctaStyle
      || analysis.sceneProgression
      || analysis.visualDna
  );
  return hasAnalysis ? "已分析" : "待分析";
}

function renderDeepDistillStatusSummary() {
  if (!nodes.deepDistillStatusSummary) return;
  if (!currentDeepDistillVideos.length) {
    nodes.deepDistillStatusSummary.hidden = true;
    nodes.deepDistillStatusSummary.innerHTML = "";
    return;
  }

  const counts = getDeepDistillCounts();

  nodes.deepDistillStatusSummary.hidden = false;
  nodes.deepDistillStatusSummary.innerHTML = [
    ["总视频", currentDeepDistillVideos.length, ""],
    ["已分析", counts.analyzedCount, "is-ok"],
    ["可开始拆解", counts.readyToAnalyzeCount, "is-ok"],
    ["分析失败", counts.failedCount, "is-error"],
    ["历史样本待重读", counts.needsReloadCount, "is-warn"]
  ]
    .map(
      ([label, value, tone]) => `
        <div class="deepDistillStatusCard ${tone}">
          <span class="deepDistillStatusLabel">${escapeHtml(String(label))}</span>
          <strong class="deepDistillStatusValue">${escapeHtml(String(value))}</strong>
        </div>
      `
    )
    .join("");
}

function getDeepDistillStateBadgeClass(video = {}) {
  const state = getDeepDistillAnalysisStateLabel(video);
  if (state === "已分析") return "is-ok";
  if (state === "分析失败") return "is-error";
  if (state === "待分析") return "is-warn";
  return "";
}

function formatDeepDistillTime(value = "") {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "未知";
  return date.toLocaleString("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });
}

async function extractDeepDistillFramesFromFile(file, knownDurationSeconds = 0) {
  const url = URL.createObjectURL(file);
  const video = document.createElement("video");
  video.preload = "auto";
  video.muted = true;
  video.playsInline = true;
  video.src = url;

  try {
    await waitForVideoMetadata(video);
    const duration = Math.max(Number(knownDurationSeconds || 0), Number(video.duration || 0), 0);
    const timestamps = buildDeepDistillTimestamps(duration);
    const canvas = document.createElement("canvas");
    const { width, height } = pickDeepDistillFrameSize(video.videoWidth || 720, video.videoHeight || 1280);
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d", { alpha: false });
    if (!context) {
      throw new Error("当前浏览器拿不到视频抽帧画布。");
    }

    const frames = [];
    for (const shot of timestamps) {
      await seekVideoToSecond(video, shot.second);
      context.drawImage(video, 0, 0, width, height);
      const dataUrl = canvas.toDataURL("image/jpeg", 0.82);
      frames.push({
        label: shot.label,
        second: shot.second,
        mimeType: "image/jpeg",
        data: dataUrl.split(",")[1] || ""
      });
    }
    return frames;
  } finally {
    URL.revokeObjectURL(url);
  }
}

function waitForVideoMetadata(video) {
  return new Promise((resolve, reject) => {
    if (video.readyState >= 1) {
      resolve();
      return;
    }
    const cleanup = () => {
      video.onloadedmetadata = null;
      video.onerror = null;
    };
    video.onloadedmetadata = () => {
      cleanup();
      resolve();
    };
    video.onerror = () => {
      cleanup();
      reject(new Error("本地视频元数据读取失败。"));
    };
  });
}

function buildDeepDistillTimestamps(durationSeconds = 0) {
  const duration = Math.max(Number(durationSeconds || 0), 1);
  const raw = [
    { label: "开场首帧", second: 0 },
    { label: "首秒钩子", second: Math.min(duration * 0.03, 0.8) },
    { label: "前段冲突", second: duration * 0.1 },
    { label: "前段推进", second: duration * 0.2 },
    { label: "商品首次强露出", second: duration * 0.33 },
    { label: "中段结构", second: duration * 0.5 },
    { label: "卖点证明", second: duration * 0.68 },
    { label: "后段收口", second: duration * 0.84 },
    { label: "结尾状态", second: Math.max(duration - 0.25, 0) }
  ];
  const seen = new Set();
  return raw
    .map((item) => ({
      ...item,
      second: Number(Math.min(Math.max(item.second, 0), Math.max(duration - 0.05, 0)).toFixed(2))
    }))
    .filter((item) => {
      const key = `${item.second}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

function pickDeepDistillFrameSize(width, height) {
  const sourceWidth = Math.max(Number(width || 0), 1);
  const sourceHeight = Math.max(Number(height || 0), 1);
  const maxEdge = 768;
  const scale = Math.min(1, maxEdge / Math.max(sourceWidth, sourceHeight));
  return {
    width: Math.max(1, Math.round(sourceWidth * scale)),
    height: Math.max(1, Math.round(sourceHeight * scale))
  };
}

function seekVideoToSecond(video, second) {
  return new Promise((resolve, reject) => {
    const targetSecond = Math.max(0, Number(second || 0));
    const cleanup = () => {
      video.onseeked = null;
      video.onerror = null;
    };
    video.onseeked = () => {
      cleanup();
      resolve();
    };
    video.onerror = () => {
      cleanup();
      reject(new Error("视频抽帧时跳转时间点失败。"));
    };
    video.currentTime = targetSecond;
  });
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
    renderManageScanSummary();
    if (canAutoScan) {
      nodes.profileScanStatus.textContent = "自动判断";
      nodes.profileScanStatus.classList.remove("is-ok", "is-error");
      nodes.profileScanResult.textContent = "普通用户默认不需要手动蒸馏。你贴对标主页后，系统会在生成时自动尽量参考该风格。";
    } else {
      nodes.profileScanStatus.textContent = "手动填写";
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
    renderManageScanSummary();
    nodes.profileSampleSort.value = profileSampleSortMode;
    nodes.profileMinViewsFilter.value = String(profileMinViewsFilter);
    nodes.profileScanStatus.textContent = "手动填写";
    nodes.profileScanStatus.classList.add("is-error");
    nodes.profileScanStatus.classList.remove("is-ok");
    nodes.profileScanResult.textContent = `抖音版当前先保留手动模板沉淀。已保留上次 TikTok 蒸馏样本 ${currentProfileScan.videos.length} 条，仅供参考；切回 TikTok 模式后可继续筛片和重蒸馏。`;
    nodes.profileSampleList.innerHTML = `<p class="emptyState">已暂存 ${currentProfileScan.videos.length} 条 TikTok 公开样本。切回 TikTok 模式后可继续使用。</p>`;
    return;
  }

  if (!hasSamePlatformScan) {
    renderManageScanSummary();
    nodes.profileScanStatus.textContent = "需要重扫";
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
  renderManageScanSummary();
  renderProfileSampleList();
}

async function handleProfileScan() {
  const profileUrl = nodes.templateProfileUrl.value.trim();
  const platform = nodes.templatePlatform.value || "tiktok";
  if (!profileUrl) {
    setActionFeedback("请先填对标主页链接。", true);
    nodes.profileScanStatus.textContent = "缺主页链接";
    nodes.profileScanStatus.classList.add("is-error");
    return;
  }
  if (!isProfileAutoScanSupported(platform)) {
    setActionFeedback("当前平台还没接入主页自动蒸馏，请先手动填写模板字段。", true);
    nodes.profileScanStatus.textContent = "手动填写";
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
    nodes.profileScanStatus.textContent = "链接格式不对";
    nodes.profileScanStatus.classList.add("is-error");
    return;
  }

  nodes.scanProfileButton.disabled = true;
  nodes.scanProfileButton.textContent = "抓取中...";
  startProfileScanProgress();
  setProfileScanStage("open", 10);
  nodes.profileScanStatus.textContent = "提炼中";
  nodes.profileScanStatus.classList.remove("is-ok", "is-error");
  nodes.profileScanResult.textContent = `正在打开${getPlatformLabel(platform)}主页并抓公开样本，请等页面加载完成。`;
  profileScanUiState = "scanning";
  profileScanUiMessage = `正在打开${getPlatformLabel(platform)}主页抓公开样本。这个过程中页面可能会短暂打开后自动关闭，属于正常流程。`;
  renderManageScanSummary();
  if (nodes.profileSamplePanel) {
    nodes.profileSamplePanel.open = true;
  }
  setActionFeedback("正在抓取主页公开内容，完成后会自动生成模板并加入模板列表。");

  try {
    const scan = await scanProfileByPlatform(profileUrl, Number(nodes.profileSampleLimit.value || 6), platform);
    currentProfileScan = scan;
    profileScanUiState = "success";
    profileScanUiMessage = "";
    stopProfileScanProgress();
    setProfileScanStage("apply", 100);
    selectedProfileVideoUrls = new Set(scan.videos.map((item) => item.videoUrl));
    pinnedProfileVideoUrls = [];
    excludedProfileVideoUrls = new Set();
    applyDistilledTemplateToForm(scan);
    upsertTemplateFromScan(scan);
    renderProfileScanState();
    if (nodes.profileSamplePanel) {
      nodes.profileSamplePanel.open = true;
    }
    const coveredCount = scan.videos.filter((item) => item.thumbnailUrl).length;
    const withViewsCount = scan.videos.filter((item) => Number(item.stats?.views || 0) > 0).length;
    const withDurationCount = scan.videos.filter((item) => Number(item.durationSeconds || 0) > 0).length;
    setActionFeedback(
      `模板已生成并加入列表，当前抓到 ${scan.videos.length} 条公开样本；其中 ${coveredCount} 条有封面，${withViewsCount} 条带播放数据，${withDurationCount} 条带时长。`
    );
  } catch (error) {
    currentProfileScan = null;
    profileScanUiState = "error";
    const normalizedError = normalizeProfileScanError(error, platform);
    profileScanUiMessage = normalizedError.message;
    setProfileScanStage(normalizedError.stageKey, getProfileScanStageProgress(normalizedError.stageKey));
    stopProfileScanProgress();
    selectedProfileVideoUrls = new Set();
    pinnedProfileVideoUrls = [];
    excludedProfileVideoUrls = new Set();
    nodes.profileScanStatus.textContent = "提炼失败";
    nodes.profileScanStatus.classList.add("is-error");
    nodes.profileScanStatus.classList.remove("is-ok");
    nodes.profileScanResult.textContent = normalizedError.message;
    renderManageScanSummary();
    if (nodes.profileSamplePanel) {
      nodes.profileSamplePanel.open = true;
    }
    setActionFeedback(`主页扫描失败：${normalizedError.message}`, true);
  } finally {
    nodes.scanProfileButton.disabled = false;
    nodes.scanProfileButton.textContent = `提炼${getPlatformLabel(nodes.templatePlatform.value || "tiktok")}主页模板`;
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
    id: existing?.id || `template-${Date.now()}`,
    deepDistillVideos: existing?.deepDistillVideos || []
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

function renderManageScanSummary() {
  if (
    !nodes.manageScanSummary ||
    !nodes.manageScanSummaryTitle ||
    !nodes.manageScanSummaryMeta ||
    !nodes.manageScanProgress ||
    !nodes.manageScanProgressFill ||
    !nodes.manageScanProgressText ||
    !nodes.manageScanSteps ||
    !nodes.manageScanSummaryBody
  ) {
    return;
  }

  if (profileScanUiState === "scanning") {
    nodes.manageScanSummary.hidden = false;
    nodes.manageScanProgress.hidden = false;
    nodes.manageScanSteps.hidden = false;
    nodes.manageScanSummaryTitle.textContent = "正在抓取主页样本";
    nodes.manageScanSummaryMeta.innerHTML = `
      <span class="countBadge">${getPlatformLabel(nodes.templatePlatform.value || "tiktok")}</span>
      <span class="countBadge">通常 5-15 秒</span>
      <span class="countBadge">抓完会自动关闭页面</span>
    `;
    renderManageScanSteps();
    nodes.manageScanSummaryBody.textContent =
      profileScanUiMessage || "系统会临时打开主页抓公开样本，抓完后自动关闭，这是正常现象。请先不要重复点击。";
    return;
  }

  if (profileScanUiState === "error" && profileScanUiMessage) {
    nodes.manageScanSummary.hidden = false;
    nodes.manageScanProgress.hidden = false;
    nodes.manageScanSteps.hidden = false;
    nodes.manageScanSummaryTitle.textContent = "这次提炼没有成功";
    nodes.manageScanSummaryMeta.innerHTML = `<span class="countBadge">请检查链接或主页可见性</span>`;
    renderManageScanSteps();
    nodes.manageScanSummaryBody.textContent = profileScanUiMessage;
    return;
  }

  if (!currentProfileScan?.videos?.length) {
    nodes.manageScanSummary.hidden = true;
    nodes.manageScanSummaryMeta.innerHTML = "";
    nodes.manageScanProgress.hidden = true;
    nodes.manageScanSteps.hidden = true;
    return;
  }

  const sampleCount = currentProfileScan.videos.length;
  const coveredCount = currentProfileScan.videos.filter((item) => item.thumbnailUrl).length;
  const withViewsCount = currentProfileScan.videos.filter((item) => Number(item.stats?.views || 0) > 0).length;
  const templateName = nodes.templateName.value.trim() || currentProfileScan.accountHandle || "新模板";
  nodes.manageScanSummary.hidden = false;
  nodes.manageScanProgress.hidden = false;
  nodes.manageScanSteps.hidden = false;
  profileScanUiState = "success";
  profileScanUiMessage = "";
  nodes.manageScanSummaryTitle.textContent = `已提炼：${templateName}`;
  nodes.manageScanSummaryMeta.innerHTML = `
    <span class="countBadge">${getPlatformLabel(currentProfileScan.platform || "tiktok")}</span>
    <span class="countBadge">${sampleCount} 条样本</span>
    <span class="countBadge">${coveredCount} 条有封面</span>
    <span class="countBadge">${withViewsCount} 条带播放</span>
  `;
  renderManageScanSteps();
  nodes.manageScanSummaryBody.textContent = buildProfileScanResultText();
}

function renderManageScanSteps() {
  if (!nodes.manageScanSteps) return;
  const steps = [
    { key: "open", title: "打开主页", desc: "临时打开对标主页并等待页面加载。" },
    { key: "collect", title: "抓取样本", desc: "收集公开视频卡片、文案、封面和播放数据。" },
    { key: "distill", title: "生成模板", desc: "根据样本节奏和结构整理蒸馏模型。" },
    { key: "apply", title: "回填结果", desc: "把结果写回前台并准备展开样本区。" }
  ];
  nodes.manageScanSteps.innerHTML = steps
    .map((step, index) => {
      const state = getManageScanStepState(step.key, index);
      const icon = state === "done" ? "✓" : state === "active" ? "•" : state === "error" ? "!" : String(index + 1);
      return `
        <div class="manageScanStep ${state ? `is-${state}` : ""}">
          <div class="manageScanStepIcon">${icon}</div>
          <div>
            <div class="manageScanStepTitle">${step.title}</div>
            <div class="manageScanStepDesc">${step.desc}</div>
          </div>
        </div>
      `;
    })
    .join("");
}

function getManageScanStepState(stepKey, index) {
  const order = ["open", "collect", "distill", "apply"];
  const currentIndex = order.indexOf(profileScanStageKey);
  const stepIndex = order.indexOf(stepKey);
  if (profileScanUiState === "success") {
    return "done";
  }
  if (profileScanUiState === "error") {
    if (stepIndex < currentIndex) return "done";
    if (stepIndex === currentIndex) return "error";
    return "";
  }
  if (profileScanUiState === "scanning") {
    if (stepIndex < currentIndex) return "done";
    if (stepIndex === currentIndex) return "active";
    return "";
  }
  return index === 0 ? "" : "";
}

function updateProfileScanProgress(value) {
  profileScanProgressValue = Math.max(0, Math.min(100, Math.round(value)));
  if (nodes.manageScanProgressFill) {
    nodes.manageScanProgressFill.style.width = `${profileScanProgressValue}%`;
  }
  if (nodes.manageScanProgressText) {
    nodes.manageScanProgressText.textContent = `${profileScanProgressValue}%`;
  }
}

function getProfileScanStageProgress(stageKey) {
  const progressMap = {
    open: 12,
    collect: 38,
    distill: 74,
    apply: 100
  };
  return progressMap[stageKey] || 18;
}

function stopProfileScanProgress() {
  if (profileScanProgressTimer) {
    clearInterval(profileScanProgressTimer);
    profileScanProgressTimer = null;
  }
}

function startProfileScanProgress() {
  stopProfileScanProgress();
  updateProfileScanProgress(8);
  profileScanProgressTimer = setInterval(() => {
    if (profileScanProgressValue >= 90) {
      stopProfileScanProgress();
      return;
    }
    const step = profileScanProgressValue < 40 ? 9 : profileScanProgressValue < 70 ? 5 : 2;
    updateProfileScanProgress(profileScanProgressValue + step);
  }, 700);
}

function normalizeProfileScanError(error, platform = "tiktok") {
  const rawMessage = error instanceof Error ? error.message : String(error || "");
  const normalized = String(rawMessage || "").trim();

  if (/打开(?:TikTok|抖音)?主页超时/.test(normalized)) {
    return {
      stageKey: "open",
      message: `主页打开超时了。通常是当前网络慢、主页加载卡住，或页面一直没进入可抓取状态。请先手动打开这个${getPlatformLabel(platform)}主页确认能正常显示。`
    };
  }

  if (/找不到此账号|找不到此主页|account not found|not found/i.test(normalized)) {
    return {
      stageKey: "open",
      message: "主页链接本身可能不对，或这个账号当前已经不可公开访问。请先确认链接、账号状态和地区可见性。"
    };
  }

  if (/登录页|登录墙|访问限制|login/i.test(normalized)) {
    return {
      stageKey: "open",
      message: "主页被登录页或访问限制拦住了，公开内容没有真正露出来。请先手动确认当前环境能直接打开这个主页。"
    };
  }

  if (/没抓到公开视频卡片/i.test(normalized)) {
    return {
      stageKey: "collect",
      message: "主页已经打开，但没有抓到可用的视频卡片。常见原因是首屏没有公开视频，或当前环境没有把卡片正常渲染出来。"
    };
  }

  if (/没有抓到主页样本/i.test(normalized)) {
    return {
      stageKey: "collect",
      message: "主页已经打开，但这次没有拿到任何可用样本。更像是页面数据没返回，或首屏没有能直接识别的公开视频。"
    };
  }

  return {
    stageKey: profileScanStageKey === "idle" ? "collect" : profileScanStageKey,
    message: normalized || `这次${getPlatformLabel(platform)}主页蒸馏失败了，请重新试一次。`
  };
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
  syncProfileUrlInputs(distilled.profileUrl || "");
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
  if (nodes.scenePrimaryLocation) {
    nodes.scenePrimaryLocation.value = currentPackage.project.scenePlan?.primaryLocation || "";
  }
  if (nodes.sceneEnvironmentStyle) {
    nodes.sceneEnvironmentStyle.value = currentPackage.project.scenePlan?.environmentStyle || "";
  }
  if (nodes.sceneContinuityRule) {
    nodes.sceneContinuityRule.value = currentPackage.project.scenePlan?.continuityRule || "";
  }
  if (nodes.storyboardEnabled) {
    nodes.storyboardEnabled.checked = Boolean(currentPackage.project.storyboardEnabled);
  }
  currentCastDraft = normalizeCastDraft(currentPackage.project.cast || []);
  renderCastList();

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
  const hasImages = Boolean(nodes.productImages.files?.length);
  const hasPrompt = Boolean(nodes.referenceBrief.value.trim());
  if (!hasTemplate && !hasImages && !hasPrompt) {
    setActionFeedback("先选模型，再上传产品图。主页链接不填也能直接生成。");
    return;
  }
  if (!hasImages && !hasPrompt) {
    setActionFeedback("先上传产品图；主页链接只是补充参考，不填也能生成。");
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
  setActionFeedback("产品图和要求都已准备，系统会自动处理模型和语言，可以直接生成。");
}

function renderAssetStatus() {
  if (nodes.productUploadStatus) {
    const productCount = nodes.productImages?.files?.length || 0;
    nodes.productUploadStatus.textContent = productCount ? `商品图：已上传 ${productCount} 张` : "商品图：未上传";
    nodes.productUploadStatus.classList.toggle("is-ready", productCount > 0);
    nodes.productUploadStatus.classList.toggle("is-optional", false);
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
  const storyboardCount = currentPackage.storyboardTasks?.length || 0;
  const firstSellingPoint = currentPackage.project.sellingPoints?.[0] || "按当前项目主卖点执行";
  const resultSnapshot = buildCurrentResultSnapshot(currentPackage);
  nodes.currentResultSummary.hidden = false;
  nodes.currentResultSummary.innerHTML = `
    <div class="currentResultSummaryHead">
      <strong>${escapeHtml(currentPackage.project.projectName)}</strong>
      <div class="currentResultSummaryMeta">
        <span class="countBadge">${shotCount} 个镜头</span>
        <span class="countBadge">${taskCount} 条任务</span>
        <span class="countBadge">${storyboardCount} 张故事版</span>
        <span class="countBadge">${escapeHtml(currentPackage.project.aspectRatio || "9:16")}</span>
      </div>
    </div>
    <div class="currentResultSummaryGrid">
      <span class="currentResultChip">模板：${escapeHtml(resultSnapshot.templateName)}</span>
      <span class="currentResultChip">节奏：${escapeHtml(resultSnapshot.rhythm)}</span>
      <span class="currentResultChip">钩子：${escapeHtml(resultSnapshot.hook)}</span>
      <span class="currentResultChip">证明：${escapeHtml(resultSnapshot.proof)}</span>
      <span class="currentResultChip">收口：${escapeHtml(resultSnapshot.cta)}</span>
    </div>
    <div class="currentResultSummaryNote">主卖点：${escapeHtml(firstSellingPoint)}</div>
    <div class="currentResultSummaryNote">${escapeHtml(resultSnapshot.overview)}</div>
  `;
}

function buildCurrentResultSnapshot(pkg) {
  const template = pkg?.project?.accountTemplate || {};
  const breakdown = Array.isArray(pkg?.distilledFramework?.breakdown) ? pkg.distilledFramework.breakdown : [];
  const proof = pickBreakdownValue(breakdown, "高频证明方式") || pickBreakdownValue(breakdown, "高频卖点证明") || "按模板证明结构";
  const cta = pickBreakdownValue(breakdown, "高频收口方式") || template.ctaStyle || pkg?.project?.cta || "轻转化收口";
  const rhythm = pickBreakdownValue(breakdown, "高频镜头节奏") || template.rhythm || "快节奏";
  const hook = pickBreakdownValue(breakdown, "高频钩子") || template.hookStyle || pkg?.project?.hookStyle || "强钩子";
  const templateName = template.name || "未选模板";
  const visualDna = pickBreakdownValue(breakdown, "视觉 DNA 共性") || pickBreakdownValue(breakdown, "表达 DNA") || "当前模板视觉风格";
  return {
    templateName,
    rhythm,
    hook,
    proof,
    cta,
    overview: `当前这次结果按“${templateName}”在出，前段更偏“${hook}”，中段用“${proof}”做卖点证明，整体节奏偏“${rhythm}”，结尾按“${cta}”收口，视觉执行更贴近“${visualDna}”。`
  };
}

function pickBreakdownValue(lines, label) {
  const target = Array.isArray(lines)
    ? lines.find((line) => String(line || "").startsWith(`${label}：`))
    : "";
  return target ? String(target).slice(`${label}：`.length).trim() : "";
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
    nodes.profileScanStatus.textContent = hasProfileUrl ? "主页参考：已填写" : "主页参考：自动判断";
  }
  if (nodes.manageProfileStatus) {
    nodes.manageProfileStatus.textContent = hasProfileUrl ? "主页链接：已填写，可直接提炼" : "自动判断平台";
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
      description: "先传产品图，系统会自动拆一版商品卖点和使用场景。",
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
      contentPositioning: "Cleaning demo with strong conflict and quick visual proof",
      hookStyle: "Strong conflict hook",
      rhythm: "3-second hook, then problem, proof, and payoff inside 30 seconds",
      structure: "Problem hook -> dirty detail -> product entry -> before-after proof -> CTA close",
      expressionDna: "Short lines, command-style opening, result first, explanation second.",
      decisionHeuristics: "Open on pain, prove with before-after evidence, then close quickly for conversion.",
      antiPatterns: "Do not lead with specs. Do not claim results before showing proof on screen.",
      recentSignals: "Fast 20-to-30-second before-after cleaning demos still perform best.",
      ctaStyle: "Soft CTA that points viewers to comments or profile",
      rewriteRules: "Reuse structure only. Do not copy people, subtitles, branding, dialogue, or account fingerprints.",
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
  if (nodes.manageProfileUrl) {
    nodes.manageProfileUrl.placeholder = nodes.templateProfileUrl.placeholder;
  }
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
    setProfileScanStage("open", 12);
    await waitForTabComplete(createdTab.id, platform);
    await delay(platform === "douyin" ? 2800 : 2400);
    setProfileScanStage("collect", 38);

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
      if (result?.videos?.length) {
        setProfileScanStage("distill", 72);
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
    setProfileScanStage("distill", 84);
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

function formatFileSize(value) {
  const size = Number(value || 0);
  if (!Number.isFinite(size) || size <= 0) return "0 B";
  if (size >= 1024 * 1024 * 1024) return `${(size / (1024 * 1024 * 1024)).toFixed(1).replace(/\.0$/, "")} GB`;
  if (size >= 1024 * 1024) return `${(size / (1024 * 1024)).toFixed(1).replace(/\.0$/, "")} MB`;
  if (size >= 1024) return `${Math.round(size / 1024)} KB`;
  return `${Math.round(size)} B`;
}

function safeLocalSlug(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "") || `local-${Date.now()}`;
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
