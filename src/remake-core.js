export function splitLines(value = "") {
  return String(value)
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function createEmptyAccountTemplate() {
  return {
    id: "",
    name: "",
    platform: "tiktok",
    accountHandle: "",
    profileUrl: "",
    contentPositioning: "",
    hookStyle: "",
    rhythm: "",
    structure: "",
    expressionDna: "",
    decisionHeuristics: "",
    antiPatterns: "",
    recentSignals: "",
    ctaStyle: "",
    rewriteRules: "",
    defaultDurationSeconds: 30,
    defaultVoiceLanguage: "英文",
    preferredModel: "veo-3-fast",
    sampleVideoUrls: []
  };
}

export function normalizeAccountTemplate(raw = {}) {
  const sampleVideoUrls = Array.isArray(raw.sampleVideoUrls)
    ? raw.sampleVideoUrls.map((item) => String(item).trim()).filter(Boolean)
    : splitLines(raw.sampleVideoUrls);
  const name = String(raw.name || raw.accountHandle || "未命名模板").trim();

  return {
    id: String(raw.id || safeSlug(name || `template-${Date.now()}`)).trim(),
    name,
    platform: normalizePlatform(raw.platform || raw.profilePlatform || "tiktok"),
    accountHandle: String(raw.accountHandle || "").trim(),
    profileUrl: String(raw.profileUrl || "").trim(),
    contentPositioning: String(raw.contentPositioning || "").trim(),
    hookStyle: String(raw.hookStyle || "强钩子").trim(),
    rhythm: String(raw.rhythm || "快节奏，前三秒必须抓人").trim(),
    structure: String(raw.structure || "钩子 -> 问题放大 -> 产品出场 -> 卖点证明 -> 收口转化").trim(),
    expressionDna: String(raw.expressionDna || "").trim(),
    decisionHeuristics: String(raw.decisionHeuristics || "").trim(),
    antiPatterns: String(raw.antiPatterns || "").trim(),
    recentSignals: String(raw.recentSignals || "").trim(),
    ctaStyle: String(raw.ctaStyle || "结尾轻转化，引导去评论区或主页").trim(),
    rewriteRules: String(raw.rewriteRules || "保留结构，不照抄人物、品牌、字幕和台词。").trim(),
    defaultDurationSeconds: Number(raw.defaultDurationSeconds || 30),
    defaultVoiceLanguage: String(raw.defaultVoiceLanguage || "英文").trim(),
    preferredModel: String(raw.preferredModel || "veo-3-fast").trim(),
    sampleVideoUrls
  };
}

function normalizeSellingPoints(value) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }
  return splitLines(value);
}

function buildShotDefinitions(input) {
  const productName = input.productName || "当前商品";
  const firstPoint = input.sellingPoints[0] || "核心卖点";
  const secondPoint = input.sellingPoints[1] || firstPoint;
  const thirdPoint = input.sellingPoints[2] || secondPoint;
  const cta = input.cta || "引导用户查看评论区或主页";
  const templateName = input.accountTemplate.name || "当前对标模板";

  return [
    {
      title: "钩子镜头",
      purpose: `按${templateName}的${input.hookStyle}风格抓住注意力`,
      action: "人物先出现异常反应或误会场面，立刻建立悬念。",
      productRole: "先不直接讲产品，先让观众留下来看。",
      lineIntent: "抛出让人想继续看的问题。"
    },
    {
      title: "问题放大",
      purpose: "把痛点讲清楚",
      action: "把场景中的真实问题拍具体，比如异味、脏污、尴尬或麻烦。",
      productRole: `铺垫${productName}为什么会出现。`,
      lineIntent: `放大与“${firstPoint}”相关的问题。`
    },
    {
      title: "解决方案出场",
      purpose: "自然带出产品",
      action: `人物拿出${productName}或让它进入画面中心。`,
      productRole: `明确产品名称，并首次解释“${firstPoint}”。`,
      lineIntent: "不要硬讲参数，先让观众明白它解决什么。"
    },
    {
      title: "卖点细化",
      purpose: "讲第二层理由",
      action: "给产品特写、使用动作或前后变化。",
      productRole: `解释“${secondPoint}”，让产品显得可信。`,
      lineIntent: "用生活化表达替代空泛夸张词。"
    },
    {
      title: "结果证明",
      purpose: "展示使用后的结果",
      action: "切到前后对比、人物反应、家庭或场景改善。",
      productRole: `补足“${thirdPoint}”或场景适配。`,
      lineIntent: "让结果替代长篇解释。"
    },
    {
      title: "收口与引导",
      purpose: "完成转化收口",
      action: "人物回到稳定状态，商品再次清晰露出。",
      productRole: `再次强调${productName}，完成记忆点。`,
      lineIntent: cta
    }
  ];
}

export function buildRemakePackage(rawInput) {
  const accountTemplate = normalizeAccountTemplate(rawInput.accountTemplate);
  const input = {
    projectName: String(rawInput.projectName || "未命名复刻项目").trim(),
    referenceSummary: String(rawInput.referenceSummary || "").trim(),
    productName: String(rawInput.productName || "").trim(),
    sellingPoints: normalizeSellingPoints(rawInput.sellingPoints),
    hookStyle: String(rawInput.hookStyle || accountTemplate.hookStyle || "强钩子").trim(),
    visualStyle: String(rawInput.visualStyle || "生活化短视频").trim(),
    cta: String(rawInput.cta || accountTemplate.ctaStyle || "引导用户看评论区或主页").trim(),
    durationSeconds: Number(rawInput.durationSeconds || accountTemplate.defaultDurationSeconds || 30),
    generationCount: Number(rawInput.generationCount || 3),
    voiceDialect: String(rawInput.voiceDialect || "普通话").trim(),
    clipcatConfig: normalizeClipcatConfig({
      tiktokUrl: rawInput.tiktokUrl,
      referencePlatform: rawInput.referencePlatform || accountTemplate.platform,
      voiceLanguage: rawInput.voiceLanguage || accountTemplate.defaultVoiceLanguage,
      extraRules: rawInput.extraRules || accountTemplate.rewriteRules,
      productImageCount: rawInput.productImageCount
    }),
    accountTemplate
  };

  const shots = buildShotDefinitions(input).map((shot, index) => ({
    shotNumber: index + 1,
    durationSeconds: Math.max(4, Math.round(input.durationSeconds / 6)),
    ...shot
  }));

  return finalizePackage({
    project: {
      projectName: input.projectName,
      referenceSummary: input.referenceSummary,
      productName: input.productName,
      sellingPoints: input.sellingPoints,
      hookStyle: input.hookStyle,
      visualStyle: input.visualStyle,
      cta: input.cta,
      durationSeconds: input.durationSeconds,
      generationCount: input.generationCount,
      voiceDialect: input.voiceDialect,
      accountTemplate,
      clipcatConfig: input.clipcatConfig
    },
    shots
  });
}

export function buildMarkdownFromPackage(pkg) {
  const lines = [
    `# ${pkg.project.projectName}`,
    "",
    "## 项目摘要",
    "",
    `- 参考摘要：${pkg.project.referenceSummary || "未填写"}`,
    `- 当前商品：${pkg.project.productName || "未填写"}`,
    `- 卖点：${pkg.project.sellingPoints.join(" / ") || "未填写"}`,
    `- 对标模板：${pkg.project.accountTemplate?.name || "未选择"}`,
    `- 对标平台：${getPlatformLabel(pkg.project.accountTemplate?.platform)}`,
    `- 模板账号：${pkg.project.accountTemplate?.accountHandle || "未填写"}`,
    `- 钩子风格：${pkg.project.hookStyle}`,
    `- 视觉风格：${pkg.project.visualStyle}`,
    `- 时长：${pkg.project.durationSeconds} 秒`,
    `- 口播语种：${pkg.project.clipcatConfig?.voiceLanguage || "未填写"}`,
    `- 参考平台：${getPlatformLabel(pkg.project.clipcatConfig?.referencePlatform)}`,
    `- Clipcat 参考链接：${pkg.project.clipcatConfig?.tiktokUrl || "未填写"}`,
    "",
    "## 蒸馏摘要",
    "",
    pkg.distilledFramework.summary,
    "",
    "## 镜头表",
    ""
  ];

  for (const shot of pkg.shots) {
    lines.push(`### 镜头 ${shot.shotNumber}：${shot.title}`);
    lines.push(`- 目标：${shot.purpose}`);
    lines.push(`- 动作：${shot.action}`);
    lines.push(`- 商品任务：${shot.productRole}`);
    lines.push(`- 口播意图：${shot.lineIntent}`);
    lines.push("");
  }

  lines.push("## 批量视频任务");
  lines.push("");
  pkg.batchVideoTasks.forEach((task) => {
    lines.push(`### ${task.taskTitle}`);
    lines.push(`- 任务编号：${task.taskId}`);
    lines.push(`- 风格：${task.variantTitle}`);
    lines.push(`- 模型：${task.model}`);
    lines.push(`- 时长：${task.durationSeconds} 秒`);
    lines.push(`- 状态：${task.status}`);
    lines.push(`- 指令：${task.prompt}`);
    lines.push("");
  });

  lines.push("## 审片清单");
  lines.push("");
  pkg.reviewChecklist.forEach((item) => {
    lines.push(`- ${item}`);
  });

  return lines.join("\n");
}

export function regeneratePrompts(pkg) {
  return finalizePackage({
    project: {
      ...pkg.project,
      accountTemplate: normalizeAccountTemplate(pkg.project?.accountTemplate),
      clipcatConfig: normalizeClipcatConfig(pkg.project?.clipcatConfig)
    },
    shots: pkg.shots.map((shot) => ({ ...shot }))
  });
}

export function updateShot(pkg, shotNumber, patch) {
  const shots = pkg.shots.map((shot) =>
    shot.shotNumber === shotNumber ? { ...shot, ...patch } : { ...shot }
  );
  return finalizePackage({
    project: {
      ...pkg.project,
      accountTemplate: normalizeAccountTemplate(pkg.project?.accountTemplate),
      clipcatConfig: normalizeClipcatConfig(pkg.project?.clipcatConfig)
    },
    shots
  });
}

export function buildSafeClipcatPrompt(input) {
  const productName = input.productName || "当前商品";
  const imageCount = Number(input.productImageCount || 1);
  const tiktokUrl = input.tiktokUrl || "请替换为参考短视频链接";
  const referencePlatform = normalizePlatform(input.referencePlatform || "tiktok");
  const durationSeconds = Number(input.durationSeconds || 15);
  const voiceLanguage = input.voiceLanguage || "英文";
  const extraRules = input.extraRules || "不要字幕，保留强钩子。";

  return [
    "请使用 Clipcat / 复刻工作流做结构复用型重制，不是机械照抄。",
    "目标：复用参考视频的节奏、钩子、镜头功能和转化结构，但不要直接照抄原台词、原人物、原品牌和原画面细节。",
    `当前商品：${productName}。我会提供 ${imageCount} 张产品图。`,
    `参考${getPlatformLabel(referencePlatform)}链接：${tiktokUrl}`,
    `生成视频时长控制在 ${durationSeconds} 秒内。`,
    `模型：seedance2.0。口播语言：${voiceLanguage}。`,
    "要求：只保留结构和爆点逻辑，把商品替换为我的商品；如果原视频口播与商品强相关，就按我的商品重写；如果没有必要，不要硬加口播。",
    "要求：不要直接照抄原台词，不要复刻原账号字幕样式，不要保留原品牌痕迹，不要出现购物车或平台按钮。",
    `附加规则：${extraRules}`
  ].join("\n");
}

export function distillAccountTemplateFromProfileScan(scan, overrides = {}) {
  const normalized = normalizeProfileScan(scan);
  const sampleVideos = normalized.videos.slice(0, 6);
  const hookStyle = inferHookStyleFromProfile(normalized);
  const positioning = inferContentPositioning(normalized);
  const rhythm = inferRhythm(normalized);
  const structure = inferStructure(normalized, hookStyle);
  const expressionDna = inferExpressionDna(normalized, hookStyle);
  const decisionHeuristics = inferDecisionHeuristics(normalized, hookStyle);
  const antiPatterns = inferAntiPatterns(normalized);
  const recentSignals = inferRecentSignals(normalized);
  const ctaStyle = inferCtaStyle(normalized);
  const name = String(
    overrides.name ||
      normalized.displayName ||
      normalized.accountHandle ||
      "主页蒸馏模板"
  ).trim();

  return normalizeAccountTemplate({
    id: overrides.id,
    name: name.includes("模板") ? name : `${name}模板`,
    platform: normalized.platform,
    accountHandle: normalized.accountHandle,
    profileUrl: normalized.profileUrl,
    contentPositioning: positioning,
    hookStyle,
    rhythm,
    structure,
    expressionDna,
    decisionHeuristics,
    antiPatterns,
    recentSignals,
    ctaStyle,
    rewriteRules:
      "只借主页里反复出现的钩子、节奏、镜头功能和转化结构；不要照抄原人物、品牌、字幕、台词、封面和账号痕迹。",
    defaultDurationSeconds: inferDefaultDuration(normalized),
    defaultVoiceLanguage: inferVoiceLanguage(normalized),
    preferredModel: "veo-3-fast",
    sampleVideoUrls: sampleVideos.map((item) => item.videoUrl)
  });
}

export function buildReferenceSummaryFromProfileScan(scan) {
  const normalized = normalizeProfileScan(scan);
  const topVideos = normalized.videos.slice(0, 3);
  const sampleText = topVideos.length
    ? topVideos
        .map(
          (video, index) =>
            `${index + 1}. ${video.caption || "无标题样本"}（${video.durationSeconds || 0} 秒，${video.stats.views || 0} 播放${
              video.stats.saves ? `，${video.stats.saves} 收藏` : ""
            }）`
        )
        .join("；")
    : "当前没有抓到可用样本视频。";

  return [
    "账号主页蒸馏摘要：",
    `账号：${normalized.accountHandle || "未识别"}${normalized.displayName ? `（${normalized.displayName}）` : ""}`,
    normalized.bio ? `主页简介：${normalized.bio}` : "主页简介：未抓到公开简介。",
    `样本视频：${normalized.videos.length} 条。`,
    `主打法：${inferContentPositioning(normalized)}。`,
    `常见钩子：${inferHookStyleFromProfile(normalized)}。`,
    `节奏判断：${inferRhythm(normalized)}。`,
    `推荐结构：${inferStructure(normalized, inferHookStyleFromProfile(normalized))}。`,
    `表达 DNA：${inferExpressionDna(normalized, inferHookStyleFromProfile(normalized))}。`,
    `决策启发式：${inferDecisionHeuristics(normalized, inferHookStyleFromProfile(normalized))}。`,
    `反模式：${inferAntiPatterns(normalized)}。`,
    `近期变化：${inferRecentSignals(normalized)}。`,
    `代表样本：${sampleText}`
  ].join("\n");
}

export function buildProfileSelectionComparisonSummary(fullScan, selectedScan) {
  const fullNormalized = normalizeProfileScan(fullScan);
  const selectedNormalized = normalizeProfileScan(selectedScan);
  if (!fullNormalized.videos.length || !selectedNormalized.videos.length) {
    return "样本对比：当前没有足够样本做对比。";
  }
  if (selectedNormalized.videos.length >= fullNormalized.videos.length) {
    return `样本对比：当前选中的 ${selectedNormalized.videos.length} 条样本基本覆盖整页公开样本，蒸馏结果接近整页平均值。`;
  }

  const fullAverageDuration = inferDefaultDuration(fullNormalized);
  const selectedAverageDuration = inferDefaultDuration(selectedNormalized);
  const fullAverageViews = getAverageViews(fullNormalized);
  const selectedAverageViews = getAverageViews(selectedNormalized);
  const fullHook = inferHookStyleFromProfile(fullNormalized);
  const selectedHook = inferHookStyleFromProfile(selectedNormalized);
  const fullExpression = inferExpressionDna(fullNormalized, fullHook);
  const selectedExpression = inferExpressionDna(selectedNormalized, selectedHook);

  const lines = [
    `样本对比：当前选中 ${selectedNormalized.videos.length} / ${fullNormalized.videos.length} 条样本。`
  ];

  if (selectedAverageDuration !== fullAverageDuration) {
    lines.push(
      selectedAverageDuration < fullAverageDuration
        ? `选中样本更短，平均约 ${selectedAverageDuration} 秒；整页平均约 ${fullAverageDuration} 秒。`
        : `选中样本更长，平均约 ${selectedAverageDuration} 秒；整页平均约 ${fullAverageDuration} 秒。`
    );
  } else {
    lines.push(`选中样本和整页平均时长接近，当前都在 ${selectedAverageDuration} 秒左右。`);
  }

  if (selectedAverageViews !== fullAverageViews) {
    lines.push(
      selectedAverageViews > fullAverageViews
        ? `选中样本平均播放更高，约 ${Math.round(selectedAverageViews)}；说明你筛出来的更偏强表现款。`
        : `选中样本平均播放更低，约 ${Math.round(selectedAverageViews)}；说明这批更偏细分打法或辅助样本。`
    );
  }

  lines.push(
    selectedHook === fullHook
      ? `钩子风格没有明显偏移，仍以“${selectedHook}”为主。`
      : `钩子风格发生偏移：整页更偏“${fullHook}”，你选中的样本更偏“${selectedHook}”。`
  );

  if (selectedExpression !== fullExpression) {
    lines.push(`表达风格也更集中在“${selectedExpression}”，不再是整页平均的“${fullExpression}”。`);
  }

  return lines.join("\n");
}

export function buildExportBundle(pkg) {
  const slug = safeSlug(pkg.project.projectName || "复刻项目");
  const shotMarkdown = pkg.shots
    .map(
      (shot) => [
        `### 镜头 ${shot.shotNumber}：${shot.title}`,
        `- 目标：${shot.purpose}`,
        `- 动作：${shot.action}`,
        `- 商品任务：${shot.productRole}`,
        `- 口播意图：${shot.lineIntent}`,
        ""
      ].join("\n")
    )
    .join("\n");

  const promptMarkdown = pkg.prompts.videoShots
    .map((prompt, index) => `### 视频提示词 ${index + 1}\n${prompt}\n`)
    .join("\n");

  const keyframeMarkdown = pkg.prompts.keyframes
    .map((prompt, index) => `### 关键帧提示词 ${index + 1}\n${prompt}\n`)
    .join("\n");

  const reviewMarkdown = pkg.reviewChecklist.map((item) => `- ${item}`).join("\n");
  const variantsMarkdown = buildVariantMarkdown(pkg.promptVariants || []);
  const tasksMarkdown = pkg.batchVideoTasks
    .map(
      (task) => [
        `## ${task.taskTitle}`,
        `- 任务编号：${task.taskId}`,
        `- 模型：${task.model}`,
        `- 模板：${task.accountTemplateName}`,
        `- 时长：${task.durationSeconds} 秒`,
        `- 口播语言：${task.voiceLanguage}`,
        `- 批量指令：${task.prompt}`,
        ""
      ].join("\n")
    )
    .join("\n");

  return {
    slug,
    files: [
      {
        path: `${slug}/00-项目摘要.md`,
        content: [
          `# ${pkg.project.projectName}`,
          "",
          `- 参考摘要：${pkg.project.referenceSummary || "未填写"}`,
          `- 当前商品：${pkg.project.productName || "未填写"}`,
          `- 卖点：${pkg.project.sellingPoints.join(" / ") || "未填写"}`,
          `- 对标模板：${pkg.project.accountTemplate?.name || "未选择"}`,
          `- 对标平台：${getPlatformLabel(pkg.project.accountTemplate?.platform)}`,
          `- 模板账号：${pkg.project.accountTemplate?.accountHandle || "未填写"}`,
          `- 钩子风格：${pkg.project.hookStyle}`,
          `- 视觉风格：${pkg.project.visualStyle}`,
          `- 表达 DNA：${pkg.project.accountTemplate?.expressionDna || "未填写"}`,
          `- 决策启发式：${pkg.project.accountTemplate?.decisionHeuristics || "未填写"}`,
          `- 反模式：${pkg.project.accountTemplate?.antiPatterns || "未填写"}`,
          `- 近期变化：${pkg.project.accountTemplate?.recentSignals || "未填写"}`,
          `- 收口引导：${pkg.project.cta}`,
          `- 时长：${pkg.project.durationSeconds} 秒`,
          `- 参考平台：${getPlatformLabel(pkg.project.clipcatConfig?.referencePlatform)}`,
          `- Clipcat 参考链接：${pkg.project.clipcatConfig?.tiktokUrl || "未填写"}`,
          `- Clipcat 口播语言：${pkg.project.clipcatConfig?.voiceLanguage || "未填写"}`
        ].join("\n")
      },
      {
        path: `${slug}/01-蒸馏摘要.md`,
        content: `# 蒸馏摘要\n\n${pkg.distilledFramework.summary}\n\n${pkg.distilledFramework.breakdown.map((item) => `- ${item}`).join("\n")}`
      },
      {
        path: `${slug}/02-镜头表.md`,
        content: `# 镜头表\n\n${shotMarkdown}`
      },
      {
        path: `${slug}/03-Seedance-视频提示词.md`,
        content: `# Seedance 视频提示词\n\n${promptMarkdown}`
      },
      {
        path: `${slug}/04-关键帧提示词.md`,
        content: `# 关键帧提示词\n\n${keyframeMarkdown}`
      },
      {
        path: `${slug}/05-提示词候选版本.md`,
        content: `# 提示词候选版本\n\n${variantsMarkdown}`
      },
      {
        path: `${slug}/06-批量视频任务.md`,
        content: `# 批量视频任务\n\n${tasksMarkdown}`
      },
      {
        path: `${slug}/07-批量视频任务.json`,
        content: JSON.stringify(pkg.batchVideoTasks, null, 2)
      },
      {
        path: `${slug}/08-审片清单.md`,
        content: `# 审片清单\n\n${reviewMarkdown}`
      }
    ]
  };
}

function finalizePackage(base) {
  const distilledFramework = buildDistilledFramework(base.project);
  const keyframes = base.shots.map((shot) =>
    `竖屏短视频关键帧，9:16，${base.project.visualStyle}，镜头用途：${shot.title}，产品：${base.project.productName}，画面动作：${shot.action}，产品任务：${shot.productRole}，模板风格：${base.project.accountTemplate?.name || "当前模板"}，不要水印，不要字幕，不要平台按钮。`
  );

  const videoShots = base.shots.map((shot) =>
    `基于已给关键帧做 image-to-video，镜头 ${shot.shotNumber}，时长 ${shot.durationSeconds} 秒，目标：${shot.purpose}，动作：${shot.action}，口播意图：${shot.lineIntent}，商品露出：${shot.productRole}，节奏要求：${base.project.accountTemplate?.rhythm || "快节奏"}，保持人物和场景一致。`
  );

  const promptVariants = buildPromptVariants(base.project, base.shots);
  const batchVideoTasks = buildBatchVideoTasks(base.project, promptVariants, distilledFramework);

  return {
    project: base.project,
    shots: base.shots,
    distilledFramework,
    prompts: {
      keyframes,
      videoShots
    },
    promptVariants,
    batchVideoTasks,
    reviewChecklist: [
      "人物前后是否一致",
      "商品关键镜头是否清晰",
      "是否残留参考视频字幕、水印、品牌痕迹",
      "镜头顺序是否仍然成立",
      "收口镜头是否有明确引导",
      "是否符合当前对标账户模板的节奏和转化方式"
    ]
  };
}

function safeSlug(value) {
  return String(value).trim().replace(/[\\/:*?"<>|]/g, "-") || "复刻项目";
}

function normalizeClipcatConfig(value = {}) {
  return {
    tiktokUrl: String(value.tiktokUrl || "").trim(),
    referencePlatform: normalizePlatform(value.referencePlatform || "tiktok"),
    voiceLanguage: String(value.voiceLanguage || "英文").trim(),
    extraRules: String(value.extraRules || "").trim(),
    productImageCount: Number(value.productImageCount || 0)
  };
}

function buildDistilledFramework(project) {
  const template = normalizeAccountTemplate(project.accountTemplate);
  const summary = [
    `${template.name} 的蒸馏框架：`,
    `内容定位是“${template.contentPositioning || "未填写"}”，`,
    `开头优先使用“${template.hookStyle || "强钩子"}”，`,
    `整体节奏是“${template.rhythm || "快节奏"}”，`,
    `核心结构遵循“${template.structure || "钩子 -> 问题 -> 解决方案 -> 收口"}”，`,
    `表达上更像“${template.expressionDna || "未填写"}”，`,
    `判断规则优先“${template.decisionHeuristics || "未填写"}”，`,
    `要避开“${template.antiPatterns || "未填写"}”，`,
    `近期主页信号是“${template.recentSignals || "未填写"}”，`,
    `收口方式偏向“${template.ctaStyle || "轻转化"}”。`
  ].join("");

  return {
    summary,
    breakdown: [
      `模板名称：${template.name}`,
      `平台：${getPlatformLabel(template.platform)}`,
      `账号句柄：${template.accountHandle || "未填写"}`,
      `内容定位：${template.contentPositioning || "未填写"}`,
      `钩子风格：${template.hookStyle || "未填写"}`,
      `节奏：${template.rhythm || "未填写"}`,
      `结构：${template.structure || "未填写"}`,
      `表达 DNA：${template.expressionDna || "未填写"}`,
      `决策启发式：${template.decisionHeuristics || "未填写"}`,
      `反模式：${template.antiPatterns || "未填写"}`,
      `近期变化：${template.recentSignals || "未填写"}`,
      `收口风格：${template.ctaStyle || "未填写"}`,
      `改写边界：${template.rewriteRules || "未填写"}`,
      `样本链接数：${template.sampleVideoUrls.length}`
    ]
  };
}

function buildPromptVariants(project, shots) {
  const template = normalizeAccountTemplate(project.accountTemplate);
  const dnaFocus = summarizeTemplateDna(template);
  return [
    {
      key: "safe",
      title: "稳妥版",
      summary: `优先保留结构清晰和商品可见，按“${template.expressionDna || "生活化稳定表达"}”收住画面，不追求过强变化。`,
      videoShots: shots.map(
        (shot) =>
          `稳妥版：镜头 ${shot.shotNumber}，${shot.purpose}。动作：${shot.action}。保持生活化、人物稳定、商品清晰，表达上贴近“${template.expressionDna || "短句清楚说明"}”，同时避开“${template.antiPatterns || "照抄原人物和原字幕"}”。`
      )
    },
    {
      key: "fast",
      title: "快节奏版",
      summary: `适合更强钩子和更短停留时间，优先放大“${template.recentSignals || "近期高表现节奏"}”。`,
      videoShots: shots.map(
        (shot) =>
          `快节奏版：镜头 ${shot.shotNumber}，节奏更快，直接推进 ${shot.purpose}。动作：${shot.action}。删掉多余停顿，优先复用“${template.decisionHeuristics || "先痛点后证明"}”这类推进顺序。`
      )
    },
    {
      key: "conversion",
      title: "强转化版",
      summary: `强化${project.productName || "当前商品"}卖点解释和收口引导，让结构更贴近“${dnaFocus}”。`,
      videoShots: shots.map(
        (shot) =>
          `强转化版：镜头 ${shot.shotNumber}，突出 ${project.productName || "当前商品"} 的作用。动作：${shot.action}。优先按“${template.decisionHeuristics || "先痛点、再证明、后收口"}”组织镜头，并把结尾收束到“${template.ctaStyle || "评论区或主页转化"}”。`
      )
    }
  ];
}

function buildBatchVideoTasks(project, promptVariants, distilledFramework) {
  const template = normalizeAccountTemplate(project.accountTemplate);
  const count = Math.max(1, Number(project.generationCount || promptVariants.length || 1));
  const tasks = [];

  for (let index = 0; index < count; index += 1) {
    const variant = promptVariants[index % promptVariants.length];
    tasks.push({
      taskId: `${safeSlug(project.projectName)}-task-${String(index + 1).padStart(2, "0")}`,
      taskTitle: `${template.name || "当前模板"}-${variant.title}-${index + 1}`,
      accountTemplateId: template.id,
      accountTemplateName: template.name,
      accountHandle: template.accountHandle,
      model: template.preferredModel || "veo-3-fast",
      durationSeconds: Number(project.durationSeconds || template.defaultDurationSeconds || 30),
      aspectRatio: "9:16",
      voiceLanguage: project.clipcatConfig?.voiceLanguage || template.defaultVoiceLanguage,
      variantKey: variant.key,
      variantTitle: variant.title,
      status: "待发送",
      prompt: [
        `请按对标账户模板 ${template.name || "当前模板"} 生成短视频。`,
        `对标平台：${getPlatformLabel(template.platform)}`,
        `内容定位：${template.contentPositioning || "未填写"}`,
        `节奏要求：${template.rhythm || "快节奏"}`,
        `结构要求：${template.structure || "钩子 -> 问题 -> 解决方案 -> 收口"}`,
        `表达 DNA：${template.expressionDna || "未填写"}`,
        `决策启发式：${template.decisionHeuristics || "未填写"}`,
        `反模式：${template.antiPatterns || "未填写"}`,
        `近期变化：${template.recentSignals || "未填写"}`,
        `当前商品：${project.productName || "未填写"}`,
        `商品卖点：${project.sellingPoints.join(" / ") || "未填写"}`,
        `批次风格：${variant.title}`,
        `版本策略：${variant.summary}`,
        `蒸馏摘要：${distilledFramework.summary}`,
        `改写边界：${template.rewriteRules || "保留结构，不直接照抄。"}`
      ].join("\n"),
      imagePrompt: `商品主图数量：${project.clipcatConfig?.productImageCount || 0}，保持商品外观稳定。`,
      sourceLinks: template.sampleVideoUrls,
      extraRules: template.rewriteRules || "",
      submitMode: "queue_only"
    });
  }

  return tasks;
}

function buildVariantMarkdown(variants) {
  return variants
    .map((variant) => {
      const content = variant.videoShots
        .map((line, index) => `- ${index + 1}. ${line}`)
        .join("\n");
      return `## ${variant.title}\n${variant.summary}\n\n${content}`;
    })
    .join("\n\n");
}

function summarizeTemplateDna(template) {
  return [
    template.expressionDna || "",
    template.decisionHeuristics || "",
    template.recentSignals || ""
  ]
    .filter(Boolean)
    .slice(0, 2)
    .join(" / ") || "当前模板节奏和表达 DNA";
}

function getAverageViews(scan) {
  if (!scan.videos.length) return 0;
  return scan.videos.reduce((sum, item) => sum + Number(item.stats?.views || 0), 0) / scan.videos.length;
}

function normalizeProfileScan(scan = {}) {
  const videos = Array.isArray(scan.videos)
    ? scan.videos
        .map((item) => ({
          videoUrl: String(item.videoUrl || "").trim(),
          caption: String(item.caption || "").trim(),
          thumbnailUrl: String(item.thumbnailUrl || "").trim(),
          durationSeconds: Number(item.durationSeconds || 0),
          stats: {
            views: Number(item.stats?.views || 0),
            likes: Number(item.stats?.likes || 0),
            comments: Number(item.stats?.comments || 0),
            shares: Number(item.stats?.shares || 0),
            saves: Number(item.stats?.saves || item.detailMetrics?.collects || 0)
          }
        }))
        .filter((item) => item.videoUrl)
    : [];

  return {
    platform: normalizePlatform(scan.platform || scan.profilePlatform || inferPlatformFromUrl(scan.profileUrl)),
    profileUrl: String(scan.profileUrl || "").trim(),
    accountHandle: normalizeHandle(scan.accountHandle || extractHandleFromUrl(scan.profileUrl)),
    displayName: String(scan.displayName || "").trim(),
    bio: String(scan.bio || "").trim(),
    stats: {
      followers: Number(scan.stats?.followers || 0),
      likes: Number(scan.stats?.likes || 0)
    },
    videos
  };
}

function inferContentPositioning(scan) {
  const corpus = `${scan.bio} ${scan.videos.map((item) => item.caption).join(" ")}`.toLowerCase();
  const tags = [];
  if (/(clean|kitchen|degreas|sink|stove|laundry|去污|清洁|厨房|油污|除味|家清)/i.test(corpus)) tags.push("家清/厨房清洁");
  if (/(story|relationship|judge|guilty|husband|wife|反转|误会|关系|情绪)/i.test(corpus)) tags.push("情绪反转/关系剧情");
  if (/(demo|before and after|review|must have|amazon finds|problem|solution|测评|前后对比|神器|痛点|解决)/i.test(corpus)) tags.push("对比证明/场景带货");
  if (/(outdoor|camping|fishing|car|travel|露营|户外|钓鱼|车载|出行)/i.test(corpus)) tags.push("场景需求/户外出行");
  if (tags.length === 0) tags.push("短视频强钩子带货");
  return `${tags.join("，")}，主页内容集中在可复用的短钩子、演示和转化收口。`;
}

function inferHookStyleFromProfile(scan) {
  const corpus = `${scan.bio} ${scan.videos.map((item) => item.caption).join(" ")}`.toLowerCase();
  if (/(before and after|前后对比|差别|对比)/i.test(corpus)) return "前后对比";
  if (/(judge|guilty|caught|误会|反转|真相|直到最后)/i.test(corpus)) return "误会反转";
  if (/(stop|wait|don't|problem|ruined|别再|等等|先别|翻车|痛点)/i.test(corpus)) return "强冲突开场";
  return "情绪带入";
}

function inferRhythm(scan) {
  const durations = scan.videos.map((item) => item.durationSeconds).filter((item) => item > 0);
  const averageDuration = durations.length
    ? Math.round(durations.reduce((sum, item) => sum + item, 0) / durations.length)
    : 30;
  if (averageDuration <= 18) return "3秒内给钩子，整体 15 到 18 秒内完成证明和收口。";
  if (averageDuration <= 30) return "前 3 秒强钩子，20 到 30 秒内完成问题、证明和收口。";
  return "前 5 秒建立冲突或悬念，中段快速推进证明，30 秒左右完成收口。";
}

function inferStructure(scan, hookStyle) {
  if (hookStyle === "误会反转") {
    return "误会钩子 -> 冲突拉高 -> 真相反转 -> 产品/解决方案出场 -> 结果证明 -> 收口转化";
  }
  if (hookStyle === "前后对比") {
    return "前后对比钩子开场 -> 问题特写 -> 产品出场 -> 使用动作 -> 结果对比 -> 收口转化";
  }
  if (hookStyle === "强冲突开场") {
    return "痛点钩子 -> 问题放大 -> 产品/方案上场 -> 快速证明 -> 结果特写 -> 收口转化";
  }
  return "情绪代入开场 -> 问题展示 -> 产品植入 -> 结果证明 -> 收口转化";
}

function inferExpressionDna(scan, hookStyle) {
  const captions = scan.videos.map((item) => item.caption).filter(Boolean);
  const corpus = `${scan.bio} ${captions.join(" ")}`.toLowerCase();
  const shortHooks = captions.filter((item) => item.length <= 90).length;
  const questionCount = captions.filter((item) => /[?？]/.test(item)).length;
  const commandCount = captions.filter((item) => /\b(stop|wait|look|need|don't)\b|别|先别|快看|必须/i.test(item)).length;
  const styleBits = [];

  styleBits.push(shortHooks >= Math.ceil(Math.max(captions.length, 1) / 2) ? "短句先抛钩子" : "先给场景再抛结果");
  if (questionCount > 0) styleBits.push("常用提问句或悬念句");
  if (commandCount > 0) styleBits.push("命令式开场明显");
  if (hookStyle === "前后对比") styleBits.push("偏好结果对比和证明感表达");
  if (hookStyle === "误会反转") styleBits.push("文案先埋误判再翻转");
  if (/(amazon|must have|link in bio|shop now|神器|必买)/i.test(corpus)) styleBits.push("高频带货词很直接");

  return styleBits.join("，") || "短钩子 + 生活化口语 + 快速进入证明。";
}

function inferDecisionHeuristics(scan, hookStyle) {
  const corpus = `${scan.bio} ${scan.videos.map((item) => item.caption).join(" ")}`.toLowerCase();
  const rules = [];

  rules.push("先拿最容易懂的痛点或结果做开场，再补解释");
  if (/(before and after|前后对比|demo|review|对比|测评)/i.test(corpus)) {
    rules.push("优先用前后对比或现场演示，而不是空讲卖点");
  }
  if (hookStyle === "误会反转") {
    rules.push("先让观众误判，再在中段翻回产品或真相");
  }
  if (/(amazon|link in bio|shop now|橱窗|链接)/i.test(corpus)) {
    rules.push("转化动作不拖到很后，证明后立刻给去主页或评论区的引导");
  }

  return rules.join("；");
}

function inferAntiPatterns(scan) {
  const corpus = `${scan.bio} ${scan.videos.map((item) => item.caption).join(" ")}`.toLowerCase();
  const antiPatterns = [
    "不要一上来长篇解释产品参数",
    "不要把参考账号的人物、字幕、品牌和封面样式原样照搬"
  ];

  if (/(before and after|对比)/i.test(corpus)) antiPatterns.push("不要没有证明镜头就直接喊效果");
  if (/(story|judge|guilty|误会|反转)/i.test(corpus)) antiPatterns.push("不要提前把反转真相说穿");
  if (/(amazon|shop now|橱窗|链接)/i.test(corpus)) antiPatterns.push("不要完全没有收口引导");

  return antiPatterns.join("；");
}

function inferRecentSignals(scan) {
  const topVideos = scan.videos
    .slice()
    .sort((left, right) => Number(right.stats?.views || 0) - Number(left.stats?.views || 0))
    .slice(0, 3);
  if (!topVideos.length) return "当前没有足够样本判断近期变化。";

  const averageDuration = inferDefaultDuration(scan);
  const coverRate = topVideos.filter((item) => item.thumbnailUrl).length;
  const phrases = [
    `近期高表现样本仍集中在 ${averageDuration} 秒左右的短视频`,
    topVideos.some((item) => /before|after|对比/i.test(item.caption)) ? "前后对比型内容还在继续有效" : "不是纯对比路子，更多靠情绪或痛点切入",
    coverRate >= 2 ? "代表样本多数有明确封面和标题感" : "代表样本更依赖文案钩子而不是强封面"
  ];
  return phrases.join("；");
}

function inferCtaStyle(scan) {
  const corpus = `${scan.bio} ${scan.videos.map((item) => item.caption).join(" ")}`.toLowerCase();
  if (/(link in bio|shop now|amazon|storefront|橱窗|链接|下单)/i.test(corpus)) {
    return "结尾明确引导用户去评论区、主页或商品入口。";
  }
  return "结尾轻转化，引导用户继续看评论区或主页。";
}

function inferDefaultDuration(scan) {
  const durations = scan.videos.map((item) => item.durationSeconds).filter((item) => item > 0);
  if (!durations.length) return 30;
  return Math.max(15, Math.min(45, Math.round(durations.reduce((sum, item) => sum + item, 0) / durations.length)));
}

function inferVoiceLanguage(scan) {
  const corpus = `${scan.displayName} ${scan.bio} ${scan.videos.map((item) => item.caption).join(" ")}`;
  return /[\u4e00-\u9fff]/.test(corpus) ? "中文" : "英文";
}

function normalizeHandle(value = "") {
  const normalized = String(value || "").trim();
  if (!normalized) return "";
  return normalized.startsWith("@") ? normalized : `@${normalized.replace(/^@/, "")}`;
}

function extractHandleFromUrl(url = "") {
  return String(url || "").match(/tiktok\.com\/@([^/?#]+)/i)?.[1] || "";
}

function inferPlatformFromUrl(url = "") {
  const value = String(url || "").toLowerCase();
  if (value.includes("douyin.com/")) return "douyin";
  if (value.includes("tiktok.com/")) return "tiktok";
  return "";
}

function normalizePlatform(value = "") {
  const normalized = String(value || "").trim().toLowerCase();
  if (["douyin", "抖音"].includes(normalized)) return "douyin";
  return "tiktok";
}

export function getPlatformLabel(value = "") {
  return normalizePlatform(value) === "douyin" ? "抖音" : "TikTok";
}

export function classifyTikTokProfilePageIssue({ title = "", bodyText = "", hasVideoLink = false } = {}) {
  const normalizedTitle = String(title || "").replace(/\s+/g, " ").trim();
  const normalizedBodyText = String(bodyText || "").replace(/\s+/g, " ").trim();
  const combined = `${normalizedTitle} ${normalizedBodyText}`;

  if (/找不到此账号|couldn't find this account|account not found|unable to find this account/i.test(combined)) {
    return {
      code: "not_found",
      message: "这个 TikTok 主页当前显示为“找不到此账号”，请先确认主页链接没填错，或该账号仍对公开访问可见。"
    };
  }

  if (
    !hasVideoLink &&
    /(?:^|\s)(log in|sign up)(?:\s|$)|登录|注册|扫码登录|continue with/i.test(normalizedBodyText) &&
    /推荐|探索|直播|主页|更多|tiktok/i.test(normalizedBodyText)
  ) {
    return {
      code: "login_wall",
      message: "这个 TikTok 主页当前被登录页或访问限制拦住了，公开样本没有正常露出来。请先手动确认该主页在当前环境能直接打开。"
    };
  }

  return null;
}

export function parseTikTokVisibleStatsText(text = "") {
  const normalized = String(text || "")
    .split(/\n+/)
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter(Boolean);
  const pickMetric = (labels) => {
    for (const line of normalized) {
      const lower = line.toLowerCase();
      if (labels.some((label) => lower.includes(label))) {
        const number = line.match(/(\d+(?:[.,]\d+)?\s*[KMB]?)/i)?.[1];
        if (number) return parseCompactSocialNumber(number);
      }
    }
    return 0;
  };
  const compactNumbers = normalized
    .filter((line) => /^(\d+(?:[.,]\d+)?\s*[KMB]?|0)$/i.test(line))
    .map(parseCompactSocialNumber);

  return {
    views: pickMetric(["view", "views", "播放", "观看"]) || compactNumbers[0] || 0,
    likes: pickMetric(["like", "likes", "赞", "喜欢"]),
    comments: pickMetric(["comment", "comments", "评论"]),
    shares: pickMetric(["share", "shares", "分享"]),
    saves: pickMetric(["save", "saves", "收藏"])
  };
}

export function parseTikTokProfileStatsText(text = "") {
  const normalized = String(text || "")
    .split(/\n+/)
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter(Boolean);
  const pickMetric = (labels) => {
    for (const line of normalized) {
      const lower = line.toLowerCase();
      if (labels.some((label) => lower.includes(label))) {
        const number = line.match(/(\d+(?:[.,]\d+)?\s*[KMB]?)/i)?.[1];
        if (number) return parseCompactSocialNumber(number);
      }
    }
    return 0;
  };
  return {
    followers: pickMetric(["follower", "followers", "粉丝"]),
    likes: pickMetric(["like", "likes", "获赞", "点赞"])
  };
}

export function parseTikTokProfileIdentityText(text = "") {
  const lines = String(text || "")
    .split(/\n+/)
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter(Boolean);
  const stopWords = /^(tiktok|搜索|推荐|探索|已关注|直播|上传|主页|更多|登录|注册|公司|计划|条款和政策|terms|privacy|log in|sign up)$/i;
  const filtered = lines.filter((line) => !stopWords.test(line));
  const handleIndex = filtered.findIndex((line) => /^@[\w.-]+$/i.test(line));
  if (handleIndex === -1) {
    return { displayName: "", bio: "" };
  }
  const displayName = handleIndex > 0 ? filtered[handleIndex - 1] : "";
  const bio = filtered
    .slice(handleIndex + 1)
    .find((line) => !/followers|likes|粉丝|获赞|点赞/i.test(line) && !/^(\d+(?:[.,]\d+)?\s*[KMB]?|0)$/i.test(line)) || "";
  return { displayName, bio };
}

export function pickPreferredTikTokProfileVideo(previous = {}, next = {}) {
  if (!previous?.videoUrl) return next;
  if (!next?.videoUrl) return previous;
  return scoreTikTokProfileVideoCandidate(next) > scoreTikTokProfileVideoCandidate(previous) ? next : previous;
}

function parseCompactSocialNumber(input) {
  if (typeof input === "number" && Number.isFinite(input)) return Math.max(0, Math.round(input));
  const value = String(input || "").trim().replace(/,/g, "").toUpperCase();
  const match = value.match(/(\d+(?:\.\d+)?)([KMB])?/);
  if (!match) return 0;
  const multiplier = { K: 1_000, M: 1_000_000, B: 1_000_000_000 }[match[2] || ""] || 1;
  return Math.round(Number(match[1]) * multiplier);
}

function scoreTikTokProfileVideoCandidate(video = {}) {
  let score = 0;
  if (video.caption) score += Math.min(String(video.caption).trim().length, 120) / 40;
  if (video.thumbnailUrl) score += 2;
  if (Number(video.durationSeconds || 0) > 0) score += 1;
  if (Number(video.stats?.views || 0) > 0) score += 1.5;
  if (Number(video.stats?.likes || 0) > 0) score += 2;
  if (Number(video.stats?.comments || 0) > 0) score += 1.5;
  if (Number(video.stats?.shares || 0) > 0) score += 1.5;
  if (Number(video.stats?.saves || 0) > 0) score += 1.5;
  return score;
}
