export function splitLines(value = "") {
  return String(value)
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function inferProductInsightsFromAsset({
  fileName = "",
  productName = "",
  template = {}
} = {}) {
  const normalizedFileName = String(fileName || "")
    .replace(/\.[a-z0-9]+$/i, "")
    .replace(/[_-]+/g, " ")
    .trim();
  const normalizedProductName = String(productName || "").trim();
  const platform = normalizePlatform(template.platform || "tiktok");
  const sourceText = `${normalizedFileName} ${normalizedProductName} ${template.contentPositioning || ""}`.toLowerCase();

  const categories = getAssetCategoryPresets();

  const matched = categories.find((item) => item.match.test(sourceText));
  const fallbackName = normalizedProductName || normalizedFileName || "当前商品";
  const cleanName = fallbackName
    .replace(/\s+/g, " ")
    .replace(/[^\p{L}\p{N}\s]/gu, "")
    .trim();
  const suggestedProductName = cleanName || "当前商品";

  if (!matched) {
    return {
      suggestedProductName,
      sellingPoints:
        platform === "douyin"
          ? ["使用场景要一眼看懂", "核心效果最好能直接证明", "人物反应和前后变化优先", "少讲参数，多讲结果"]
          : ["Make the usage scene obvious at a glance", "Show the core result in a way that can be proven visually", "Prioritize reaction shots and before-after change", "Talk less about specs and more about the result"],
      suggestedPrompt:
        platform === "douyin"
          ? `围绕${suggestedProductName}做一个生活化短视频，先抛出问题，再用产品解决，最后给出直观看得懂的结果。`
          : `Build a short lifestyle video around ${suggestedProductName}: open with a clear problem, show the product solving it, then land on a visual proof result.`
    };
  }

  return {
    suggestedProductName,
    sellingPoints: platform === "douyin" ? matched.sellingPointsZh : matched.sellingPointsEn,
    suggestedPrompt:
      platform === "douyin"
        ? `围绕${suggestedProductName}：${matched.promptZh}`
        : `${suggestedProductName}: ${matched.promptEn}`
  };
}

export function inferGenerationDefaultsFromAsset({
  fileName = "",
  productName = "",
  template = {}
} = {}) {
  const normalizedFileName = String(fileName || "")
    .replace(/\.[a-z0-9]+$/i, "")
    .replace(/[_-]+/g, " ")
    .trim();
  const normalizedProductName = String(productName || "").trim();
  const platform = normalizePlatform(template.platform || "tiktok");
  const sourceText = `${normalizedFileName} ${normalizedProductName} ${template.contentPositioning || ""}`.toLowerCase();
  const matched = getAssetCategoryPresets().find((item) => item.match.test(sourceText));
  const suggestedProductName = inferProductInsightsFromAsset({ fileName, productName, template }).suggestedProductName || "当前商品";

  if (!matched) {
    return {
      scenePlan: platform === "douyin"
        ? {
            primaryLocation: "真实生活场景",
            environmentStyle: "生活化自然光",
            continuityRule: "人物、商品和光线保持一致"
          }
        : {
            primaryLocation: "everyday lifestyle setting",
            environmentStyle: "clean natural daylight",
            continuityRule: "Keep the person, product, and lighting consistent."
          },
      cast: [
        {
          id: "host-1",
          roleType: "host",
          label: platform === "douyin" ? "主讲人" : "Host",
          presenceRule: "always",
          appearanceLock: platform === "douyin" ? "干净日常穿搭，和商品场景匹配" : "clean everyday outfit that fits the product scene",
          behaviorRule: platform === "douyin" ? `负责讲解并演示 ${suggestedProductName}` : `Explains and demonstrates ${suggestedProductName}`,
          voiceRule: "primary"
        }
      ]
    };
  }

  return {
    scenePlan: platform === "douyin"
      ? {
          primaryLocation: matched.sceneZh,
          environmentStyle: matched.environmentZh,
          continuityRule: "同一人物、同一商品、同一空间连续推进"
        }
      : {
          primaryLocation: matched.sceneEn,
          environmentStyle: matched.environmentEn,
          continuityRule: "Keep the same host, product, and lighting across the full sequence."
        },
    cast: [
      {
        id: "host-1",
        roleType: "host",
        label: platform === "douyin" ? "主讲人" : "Host",
        presenceRule: "always",
        appearanceLock: platform === "douyin" ? matched.appearanceZh : matched.appearanceEn,
        behaviorRule: platform === "douyin" ? matched.behaviorZh.replace("{product}", suggestedProductName) : matched.behaviorEn.replace("{product}", suggestedProductName),
        voiceRule: "primary"
      }
    ]
  };
}

function getAssetCategoryPresets() {
  return [
    {
      key: "cleaning",
      match: /(清洁|去污|除霉|除味|洗衣|油污|clean|cleaner|detergent|spray|degreaser|odor)/i,
      sellingPointsZh: ["见效快，前后对比明显", "使用动作简单，镜头好证明", "适合厨房/卫生间/家务场景", "结果型表达比讲参数更容易转化"],
      sellingPointsEn: ["Fast visible result with clear before-after proof", "Easy-to-show usage action that reads well on camera", "Fits kitchen, bathroom, and everyday home-cleaning scenes", "Result-led messaging converts better than feature dumping"],
      promptZh: "先用脏污或异味场景开场，再让人物拿出产品，30秒内完成前后对比证明。",
      promptEn: "Open on visible dirt or odor, bring in the product fast, and land the before-after proof within 30 seconds.",
      sceneZh: "厨房台面或卫生间清洁场景",
      sceneEn: "kitchen counter or bathroom cleaning setup",
      environmentZh: "明亮生活化、可直接做前后对比",
      environmentEn: "bright lifestyle daylight with clear before-after framing",
      appearanceZh: "日常家居穿搭，干净利落，适合做清洁演示",
      appearanceEn: "clean everyday home outfit, practical and camera-friendly",
      behaviorZh: "负责上手演示 {product}，先抛痛点再做前后对比证明",
      behaviorEn: "Demonstrates {product}, opens on the pain point, then proves the result with a before-after demo"
    },
    {
      key: "beauty",
      match: /(面膜|精华|口红|粉底|护肤|防晒|lip|serum|cream|beauty|skin|makeup)/i,
      sellingPointsZh: ["上脸前后差异要清楚", "突出肤感/妆感/自然度", "适合通勤、出门、约会等生活场景", "镜头重点放在使用前后变化和人物反应"],
      sellingPointsEn: ["Make the before-after change obvious on skin", "Highlight texture, finish, and natural-looking payoff", "Fits commute, get-ready, and date-night lifestyle scenes", "Focus the camera on the application change and the reaction shot"],
      promptZh: "先抛出人物出门前的困扰，再快速展示上脸过程和使用后状态，让结果比参数更先被看懂。",
      promptEn: "Start from a real get-ready problem, move quickly through application, and make the post-use result easier to understand than any specs.",
      sceneZh: "梳妆台、镜前或出门前准备场景",
      sceneEn: "vanity, mirror-side, or get-ready setting",
      environmentZh: "干净柔光、贴近真实护肤或上妆流程",
      environmentEn: "soft clean lighting that feels like a real beauty routine",
      appearanceZh: "妆容自然、人物状态精致，适合近景上脸展示",
      appearanceEn: "polished natural look suited for close-up application shots",
      behaviorZh: "负责演示 {product} 的上脸过程，重点展示使用前后变化和人物反应",
      behaviorEn: "Applies {product} on camera, focusing on the before-after change and reaction shot"
    },
    {
      key: "fashion",
      match: /(衣|裙|裤|鞋|包|穿搭|dress|shirt|shoe|bag|fashion|outfit)/i,
      sellingPointsZh: ["上身/上脚效果要直接", "突出显瘦显高或百搭", "适合通勤、约会、出街等场景", "材质和细节特写要配合人物动作"],
      sellingPointsEn: ["Show the on-body or on-foot effect immediately", "Highlight flattering shape, height, or easy styling", "Fits commute, date, and street-style scenes", "Pair material close-ups with natural movement"],
      promptZh: "先给换装前后的落差，再让人物自然走动或转身，用上身效果带出购买理由。",
      promptEn: "Show the before-after outfit gap first, then let the person move naturally so the fit itself sells the purchase reason.",
      sceneZh: "试衣镜前、走廊或街拍穿搭场景",
      sceneEn: "mirror-side fitting area, hallway, or casual street-style setting",
      environmentZh: "简洁时尚、适合展示上身和走动效果",
      environmentEn: "clean fashion-forward setup that highlights movement and fit",
      appearanceZh: "穿搭完整、镜头感强，适合做上身展示",
      appearanceEn: "put-together styling with strong on-camera presence",
      behaviorZh: "负责试穿并展示 {product} 的上身效果，用转身走动证明版型和质感",
      behaviorEn: "Wears and showcases {product}, using natural movement to prove fit and texture"
    },
    {
      key: "food",
      match: /(咖啡|零食|饮料|茶|食品|coffee|snack|drink|tea|food)/i,
      sellingPointsZh: ["第一口或冲泡瞬间有记忆点", "口感和方便性好表达", "适合居家/办公室/通勤场景", "人物即时反应容易带转化"],
      sellingPointsEn: ["Make the first sip or prep moment memorable", "Taste and convenience are easy to communicate", "Fits home, office, and commute situations", "Immediate human reaction helps conversion"],
      promptZh: "先用嘴馋、提神或加班场景开场，再展示冲泡/开袋/入口瞬间，让人物反应接住卖点。",
      promptEn: "Open on craving, low energy, or overtime, then show the prep or first-bite moment and let the reaction carry the value.",
      sceneZh: "餐桌、办公桌或厨房冲泡场景",
      sceneEn: "tabletop, office desk, or kitchen prep setting",
      environmentZh: "有食欲感、生活化，突出入口和冲泡瞬间",
      environmentEn: "appetizing lifestyle setup centered on prep and first-taste moments",
      appearanceZh: "人物亲和自然，适合做入口反应和真实种草",
      appearanceEn: "friendly everyday look that sells reaction-driven tasting moments",
      behaviorZh: "负责开箱、冲泡或试吃 {product}，用第一口反应接住卖点",
      behaviorEn: "Preps or tastes {product} on camera and lets the first reaction carry the value"
    },
    {
      key: "digital",
      match: /(手机|支架|灯|耳机|充电|数码|phone|tripod|light|earbud|charger|digital|tech)/i,
      sellingPointsZh: ["功能点可以直接演示", "上手门槛低，镜头好做对比", "适合桌面/通勤/拍摄场景", "强调效率提升比空讲配置更有效"],
      sellingPointsEn: ["The core function can be demonstrated directly", "Low learning curve makes comparison shots easy", "Fits desk, commute, and creator-use scenes", "Show the efficiency gain instead of listing specs"],
      promptZh: "先给出一个低效或麻烦的瞬间，再让产品出场解决问题，用操作过程直接证明价值。",
      promptEn: "Start with a frustrating or inefficient moment, let the product fix it, and prove value through the actual operation.",
      sceneZh: "桌面、通勤或拍摄工作流场景",
      sceneEn: "desk setup, commute situation, or creator workflow scene",
      environmentZh: "干净高效，突出操作过程和效率提升",
      environmentEn: "clean efficient setup focused on operation and workflow gain",
      appearanceZh: "偏创作者或通勤职场感，适合讲解操作逻辑",
      appearanceEn: "creator or productivity-focused look that fits a demo workflow",
      behaviorZh: "负责操作并讲解 {product}，用真实使用过程证明效率提升",
      behaviorEn: "Uses and explains {product} on camera, proving the efficiency gain through real operation"
    }
  ];
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
    sampleVideoUrls: [],
    deepDistillVideos: []
  };
}

function getDefaultVoiceLanguageForPlatform(platform = "tiktok") {
  return normalizePlatform(platform) === "douyin" ? "中文" : "英文";
}

export function normalizeAccountTemplate(raw = {}) {
  const platform = normalizePlatform(raw.platform || raw.profilePlatform || "tiktok");
  const sampleVideoUrls = Array.isArray(raw.sampleVideoUrls)
    ? raw.sampleVideoUrls.map((item) => String(item).trim()).filter(Boolean)
    : splitLines(raw.sampleVideoUrls);
  const deepDistillVideos = Array.isArray(raw.deepDistillVideos)
    ? raw.deepDistillVideos.map(normalizeDeepDistillVideo).filter(Boolean)
    : [];
  const name = String(raw.name || raw.accountHandle || "未命名模板").trim();

  return {
    id: String(raw.id || safeSlug(name || `template-${Date.now()}`)).trim(),
    name,
    platform,
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
    defaultVoiceLanguage: String(raw.defaultVoiceLanguage || getDefaultVoiceLanguageForPlatform(platform)).trim(),
    preferredModel: String(raw.preferredModel || "veo-3-fast").trim(),
    sampleVideoUrls,
    deepDistillVideos
  };
}

function normalizeDeepDistillVideo(raw = {}) {
  const id = String(raw.id || "").trim();
  const fileName = String(raw.fileName || "").trim();
  if (!id && !fileName) return null;
  return {
    id: id || safeSlug(fileName || `deep-video-${Date.now()}`),
    fileName,
    relativePath: String(raw.relativePath || "").trim(),
    durationSeconds: Number(raw.durationSeconds || 0),
    sizeBytes: Number(raw.sizeBytes || 0),
    lastModified: Number(raw.lastModified || 0),
    analysis: {
      isZeroFrameProductHook: String(raw.analysis?.isZeroFrameProductHook || "待判断").trim(),
      firstStrongProductSecond: String(raw.analysis?.firstStrongProductSecond || "").trim(),
      hookType: String(raw.analysis?.hookType || "").trim(),
      emotionCurve: String(raw.analysis?.emotionCurve || "").trim(),
      shotRhythm: String(raw.analysis?.shotRhythm || "").trim(),
      proofStyle: String(raw.analysis?.proofStyle || "").trim(),
      ctaStyle: String(raw.analysis?.ctaStyle || "").trim(),
      sceneProgression: String(raw.analysis?.sceneProgression || "").trim(),
      visualDna: String(raw.analysis?.visualDna || "").trim(),
      summary: String(raw.analysis?.summary || "").trim()
    }
  };
}

function normalizeSellingPoints(value) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }
  return splitLines(value);
}

function createDefaultCast(input = {}) {
  const rawCast = Array.isArray(input.cast) ? input.cast : [];
  const normalizedCast = rawCast
    .map((member, index) => {
      const roleType = String(
        member?.roleType || (index === 0 ? "host" : "supporting")
      ).trim() || (index === 0 ? "host" : "supporting");
      const id = String(member?.id || member?.castId || "").trim()
        || safeSlug(`${roleType}-${index + 1}`);
      const label = String(member?.label || member?.name || member?.displayName || "").trim();
      const normalizedRoleType = roleType === "support" ? "supporting" : roleType;

      return {
        id,
        roleType: normalizedRoleType,
        label: label || (normalizedRoleType === "host" ? "主讲人" : `配角${index}`),
        presenceRule: String(member?.presenceRule || (normalizedRoleType === "host" ? "always" : "selective")).trim(),
        appearanceLock: String(member?.appearanceLock || "").trim(),
        behaviorRule: String(member?.behaviorRule || "").trim(),
        voiceRule: String(member?.voiceRule || (normalizedRoleType === "host" ? "primary" : "silent")).trim()
      };
    })
    .filter((member) => member.id);

  if (normalizedCast.length) {
    const hasHost = normalizedCast.some((member) => member.roleType === "host");
    if (hasHost) {
      return normalizedCast;
    }
    return normalizedCast.map((member, index) => ({
      ...member,
      roleType: index === 0 ? "host" : member.roleType || "supporting"
    }));
  }

  return [
    {
      id: "host-1",
      roleType: "host",
      label: "主讲人",
      presenceRule: "always",
      appearanceLock: "",
      behaviorRule: "负责讲解、展示商品、推动主线",
      voiceRule: "primary"
    }
  ];
}

function normalizeScenePlan(raw = {}) {
  const primaryLocation = String(raw.primaryLocation || "").trim();
  const environmentStyle = String(raw.environmentStyle || "").trim();
  const continuityRule = String(raw.continuityRule || "").trim();
  const shots = Array.isArray(raw.shots)
    ? raw.shots.map((shot = {}) => ({
        scenePurpose: String(shot.scenePurpose || "").trim(),
        primaryCastId: String(shot.primaryCastId || "").trim(),
        supportingCastIds: Array.isArray(shot.supportingCastIds)
          ? shot.supportingCastIds.map((item) => String(item).trim()).filter(Boolean)
          : [],
        castBeats: Array.isArray(shot.castBeats)
          ? shot.castBeats
              .map((beat = {}) => ({
                castId: String(beat.castId || "").trim(),
                beat: String(beat.beat || beat.action || "").trim()
              }))
              .filter((beat) => beat.castId || beat.beat)
          : [],
        storyboardFrameGoal: String(shot.storyboardFrameGoal || "").trim(),
        storyboardPrompt: String(shot.storyboardPrompt || "").trim(),
        continuityNotes: String(shot.continuityNotes || "").trim()
      }))
    : [];

  return {
    primaryLocation,
    environmentStyle,
    continuityRule,
    shots
  };
}

function buildShotDefinitions(input) {
  const productName = input.productName || "当前商品";
  const firstPoint = input.sellingPoints[0] || "核心卖点";
  const secondPoint = input.sellingPoints[1] || firstPoint;
  const thirdPoint = input.sellingPoints[2] || secondPoint;
  const cta = input.cta || "引导用户查看评论区或主页";
  const templateName = input.accountTemplate.name || "当前对标模板";
  const isEnglish = normalizePlatform(input.accountTemplate.platform || input.clipcatConfig?.referencePlatform || "tiktok") !== "douyin";
  const cast = Array.isArray(input.cast) ? input.cast : createDefaultCast();
  const primaryCast = cast.find((member) => member.roleType === "host") || cast[0] || { id: "host-1" };
  const defaultSupportingCastIds = cast
    .filter((member) => member.id !== primaryCast.id)
    .map((member) => member.id);
  const normalizedScenePlan = normalizeScenePlan(input.scenePlan);

  const baseShots = isEnglish
    ? [
      {
        title: "Hook shot",
        purpose: `Grab attention in the ${input.hookStyle} style of ${templateName}`,
        action: "Open on an abnormal reaction, misunderstanding, or tension beat to create immediate curiosity.",
        productRole: "Do not explain the product yet. Earn the right to keep the viewer watching first.",
        lineIntent: "Throw out a question or emotional tension point that makes the viewer stay."
      },
      {
        title: "Problem escalation",
        purpose: "Make the pain point concrete",
        action: "Show the real problem in detail, such as odor, dirt, awkwardness, or inconvenience.",
        productRole: `Set up why ${productName} needs to enter the scene.`,
        lineIntent: `Amplify the problem that connects to "${firstPoint}".`
      },
      {
        title: "Product entry",
        purpose: "Introduce the solution naturally",
        action: `Bring ${productName} into the center of the frame through a believable action.`,
        productRole: `Name the product clearly and explain "${firstPoint}" first.`,
        lineIntent: "Do not dump specs. Make the viewer understand what problem it solves."
      },
      {
        title: "Selling-point proof",
        purpose: "Add the second layer of reasons",
        action: "Use close-ups, usage action, or before-after proof to make the product feel credible.",
        productRole: `Explain "${secondPoint}" in a way the camera can prove.`,
        lineIntent: "Prefer lifestyle phrasing over vague hype words."
      },
      {
        title: "Result proof",
        purpose: "Show the outcome after use",
        action: "Cut to the before-after, the human reaction, or the improved scene condition.",
        productRole: `Complete "${thirdPoint}" or reinforce where the product fits best.`,
        lineIntent: "Let the result do more work than extra explanation."
      },
      {
        title: "Close and CTA",
        purpose: "Land the conversion cleanly",
        action: "Return to a stable state and show the product clearly one more time.",
        productRole: `Repeat ${productName} and lock in the memory point.`,
        lineIntent: cta
      }
    ]
    : [
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

  return baseShots.map((shot, index) => {
    const sceneShot = normalizedScenePlan.shots[index] || {};
    return {
      ...shot,
      scenePurpose: sceneShot.scenePurpose || shot.purpose,
      primaryCastId: sceneShot.primaryCastId || primaryCast.id || "host-1",
      supportingCastIds: sceneShot.supportingCastIds?.length
        ? sceneShot.supportingCastIds
        : defaultSupportingCastIds,
      castBeats: sceneShot.castBeats?.length
        ? sceneShot.castBeats
        : [
            {
              castId: primaryCast.id || "host-1",
              beat: shot.action
            }
          ],
      storyboardFrameGoal: sceneShot.storyboardFrameGoal || "锁住这个镜头最关键的连续性信息",
      storyboardPrompt: sceneShot.storyboardPrompt || "",
      continuityNotes: sceneShot.continuityNotes || normalizedScenePlan.continuityRule || "人物外观、商品外观、主场景保持一致"
    };
  });
}

export function buildRemakePackage(rawInput) {
  const accountTemplate = normalizeAccountTemplate(rawInput.accountTemplate);
  const cast = createDefaultCast(rawInput);
  const scenePlan = normalizeScenePlan(rawInput.scenePlan);
  const mergedReferenceSummary = mergeReferenceSummaryWithDeepDistill(
    String(rawInput.referenceSummary || "").trim(),
    accountTemplate
  );
  const input = {
    projectName: String(rawInput.projectName || "未命名复刻项目").trim(),
    referenceSummary: mergedReferenceSummary,
    productName: String(rawInput.productName || "").trim(),
    sellingPoints: normalizeSellingPoints(rawInput.sellingPoints),
    hookStyle: String(rawInput.hookStyle || accountTemplate.hookStyle || "强钩子").trim(),
    visualStyle: String(rawInput.visualStyle || "生活化短视频").trim(),
    cta: String(rawInput.cta || accountTemplate.ctaStyle || "引导用户看评论区或主页").trim(),
    durationSeconds: Number(rawInput.durationSeconds || accountTemplate.defaultDurationSeconds || 30),
    generationCount: Number(rawInput.generationCount || 3),
    aspectRatio: String(rawInput.aspectRatio || "9:16").trim(),
    voiceDialect: String(rawInput.voiceDialect || "普通话").trim(),
    storyboardEnabled: Boolean(rawInput.storyboardEnabled),
    storyboardMode: "optional",
    cast,
    scenePlan,
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
      aspectRatio: input.aspectRatio,
      voiceDialect: input.voiceDialect,
      storyboardEnabled: input.storyboardEnabled,
      storyboardMode: input.storyboardMode,
      cast: input.cast,
      scenePlan: input.scenePlan,
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
    `- 比例：${pkg.project.aspectRatio || "9:16"}`,
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

  if (pkg.storyboardTasks?.length) {
    lines.push("## 故事版图结果");
    lines.push("");
    pkg.storyboardTasks.forEach((task) => {
      lines.push(`### ${task.taskTitle || task.unitId || "故事版任务"}`);
      lines.push(`- 任务单元：${task.unitId || "unit-01"}`);
      lines.push(`- 状态：${task.status || "idle"}`);
      lines.push(`- 任务 ID：${task.taskId || "未创建"}`);
      lines.push(`- Provider：${task.provider || "kie-gpt-image"}`);
      lines.push(`- 图片链接：${task.imageUrl || "暂无图片"}`);
      if (task.errorMessage) {
        lines.push(`- 失败原因：${task.errorMessage}`);
      }
      lines.push(`- 提示词：${task.prompt || "未生成"}`);
      lines.push("");
    });
  }

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
  const storyboardTasks = Array.isArray(pkg.storyboardTasks) ? pkg.storyboardTasks : [];
  const storyboardMarkdown = storyboardTasks.length
    ? storyboardTasks
        .map((task) =>
          [
            `## ${task.taskTitle || task.unitId || "故事版任务"}`,
            `- 任务单元：${task.unitId || "unit-01"}`,
            `- 状态：${task.status || "idle"}`,
            `- 任务 ID：${task.taskId || "未创建"}`,
            `- Provider：${task.provider || "kie-gpt-image"}`,
            `- 图片链接：${task.imageUrl || "暂无图片"}`,
            task.errorMessage ? `- 失败原因：${task.errorMessage}` : "",
            `- 提示词：${task.prompt || "未生成"}`,
            ""
          ]
            .filter(Boolean)
            .join("\n")
        )
        .join("\n")
    : "当前项目没有故事版图任务。";
  const storyboardLinksMarkdown = storyboardTasks.length
    ? storyboardTasks
        .map((task) => `- ${task.taskTitle || task.unitId || "故事版任务"}：${task.imageUrl || "暂无图片链接"}`)
        .join("\n")
    : "- 当前项目没有故事版图图片链接。";

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
      },
      {
        path: `${slug}/09-故事版图任务.md`,
        content: `# 故事版图任务\n\n${storyboardMarkdown}`
      },
      {
        path: `${slug}/10-故事版图任务.json`,
        content: JSON.stringify(storyboardTasks, null, 2)
      },
      {
        path: `${slug}/11-故事版图图片链接.md`,
        content: `# 故事版图图片链接\n\n${storyboardLinksMarkdown}`
      }
    ]
  };
}

export function buildDeliveryPackageText(pkg) {
  const storyboardTasks = Array.isArray(pkg?.storyboardTasks) ? pkg.storyboardTasks : [];
  const batchTasks = Array.isArray(pkg?.batchVideoTasks) ? pkg.batchVideoTasks : [];
  const summaryLines = [
    `项目：${pkg?.project?.projectName || "当前项目"}`,
    `商品：${pkg?.project?.productName || "未填写"}`,
    `模板：${pkg?.project?.accountTemplate?.name || "未选择"}`,
    `平台：${getPlatformLabel(pkg?.project?.accountTemplate?.platform)}`,
    `主卖点：${pkg?.project?.sellingPoints?.join(" / ") || "未填写"}`,
    `参考摘要：${pkg?.project?.referenceSummary || "未填写"}`,
    ""
  ];

  const batchTaskLines = batchTasks.length
    ? batchTasks.flatMap((task, index) => [
        `【视频任务 ${index + 1}】${task.taskTitle || `任务 ${index + 1}`}`,
        `模型：${task.model || "未填写"}`,
        `时长：${task.durationSeconds || 0} 秒`,
        `状态：${task.status || "draft"}`,
        `提示词：${task.prompt || "未生成"}`,
        ""
      ])
    : ["当前没有可复制的视频任务。", ""];

  const storyboardLines = storyboardTasks.length
    ? storyboardTasks.flatMap((task, index) => [
        `【故事版 ${index + 1}】${task.taskTitle || task.unitId || `故事版 ${index + 1}`}`,
        `状态：${task.status || "idle"}`,
        `任务 ID：${task.taskId || "未创建"}`,
        `图片链接：${task.imageUrl || "暂无图片"}`,
        task.errorMessage ? `失败原因：${task.errorMessage}` : "",
        `故事版提示词：${task.prompt || "未生成"}`,
        ""
      ].filter(Boolean))
    : ["当前项目没有故事版图结果。", ""];

  return [
    "# 复刻结果包",
    "",
    ...summaryLines,
    "## 视频任务",
    "",
    ...batchTaskLines,
    "## 故事版图",
    "",
    ...storyboardLines
  ].join("\n");
}

function finalizePackage(base) {
  const distilledFramework = buildDistilledFramework(base.project);
  const promptLocale = getPromptLocale(base.project);
  const keyframes = base.shots.map((shot) =>
    promptLocale === "en"
      ? `Vertical 9:16 short-form video keyframe, ${base.project.visualStyle}, shot purpose: ${shot.title}, product: ${base.project.productName}, screen action: ${shot.action}, product role: ${shot.productRole}, template style: ${base.project.accountTemplate?.name || "Current template"}, no watermark, no subtitles, no platform UI.`
      : `竖屏短视频关键帧，9:16，${base.project.visualStyle}，镜头用途：${shot.title}，产品：${base.project.productName}，画面动作：${shot.action}，产品任务：${shot.productRole}，模板风格：${base.project.accountTemplate?.name || "当前模板"}，不要水印，不要字幕，不要平台按钮。`
  );

  const videoShots = base.shots.map((shot) =>
    promptLocale === "en"
      ? `Animate from the supplied keyframe into a creator-style product video. Shot ${shot.shotNumber} should run about ${shot.durationSeconds}s. Goal: ${shot.purpose}. On-screen move: ${shot.action}. Voiceover intent: ${shot.lineIntent}. Product job in frame: ${shot.productRole}. Keep the pacing ${base.project.accountTemplate?.rhythm || "fast-paced"} and hold character + scene continuity.`
      : `基于已给关键帧做 image-to-video，镜头 ${shot.shotNumber}，时长 ${shot.durationSeconds} 秒，目标：${shot.purpose}，动作：${shot.action}，口播意图：${shot.lineIntent}，商品露出：${shot.productRole}，节奏要求：${base.project.accountTemplate?.rhythm || "快节奏"}，保持人物和场景一致。`
  );

  const promptVariants = buildPromptVariants(base.project, base.shots);
  const batchVideoTasks = buildBatchVideoTasks(base.project, promptVariants, distilledFramework);
  const storyboardTasks = base.project.storyboardEnabled
    ? [
        {
          unitId: "unit-01",
          shotRange: [1, base.shots.length],
          provider: "kie-gpt-image",
          status: "idle",
          prompt: buildStoryboardPrompt(base.project, base.shots, promptLocale),
          taskId: "",
          imageUrl: "",
          errorMessage: "",
          createdAt: "",
          updatedAt: "",
          taskTitle: "Storyboard Unit 01",
        }
      ]
    : [];

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
    storyboardTasks,
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

function buildStoryboardPrompt(project, shots, locale = "zh") {
  const safeProject = project || {};
  const safeShots = Array.isArray(shots) ? shots : [];
  const cast = Array.isArray(safeProject.cast) ? safeProject.cast : [];
  const scenePlan = safeProject.scenePlan || {};

  if (locale === "en") {
    const castLines = cast.map((member) => {
      const prefix = member.roleType === "host" ? "Host" : "Supporting cast";
      return `${prefix}: ${member.label || member.id}; role: ${member.behaviorRule || "not provided"}; appearance lock: ${member.appearanceLock || "not provided"}; voice: ${member.voiceRule || "not provided"}.`;
    });
    const shotLines = safeShots.map((shot) => {
      const beatText = Array.isArray(shot.castBeats) && shot.castBeats.length
        ? shot.castBeats.map((beat) => `${beat.castId}: ${beat.beat}`).join(" | ")
        : "not provided";
      return `Shot ${shot.shotNumber}: purpose ${shot.scenePurpose || shot.purpose || "not provided"}; action ${shot.action || "not provided"}; frame goal ${shot.storyboardFrameGoal || "not provided"}; cast beats ${beatText}.`;
    });

    return [
      `Create a 9:16 storyboard board for ${safeProject.productName || "the product"}.`,
      `Product: ${safeProject.productName || "Not provided"}`,
      `Scene: ${scenePlan.primaryLocation || "Not provided"}`,
      `Environment style: ${scenePlan.environmentStyle || "Not provided"}`,
      `Continuity: ${scenePlan.continuityRule || "Keep the cast, product, and lighting consistent."}`,
      ...castLines,
      ...shotLines,
      "Negative constraints: no product distortion, no cast drift, no scene jumping, no unreadable labels."
    ].join("\n");
  }

  const castLines = cast.map((member) => {
    const prefix = member.roleType === "host" ? "主讲人" : "配角";
    return `${prefix}：${member.label || member.id}；职责：${member.behaviorRule || "未提供"}；外观锁定：${member.appearanceLock || "未提供"}；口播规则：${member.voiceRule || "未提供"}。`;
  });
  const shotLines = safeShots.map((shot) => {
    const beatText = Array.isArray(shot.castBeats) && shot.castBeats.length
      ? shot.castBeats.map((beat) => `${beat.castId}：${beat.beat}`).join(" | ")
      : "未提供";
    return `镜头 ${shot.shotNumber}：目标 ${shot.scenePurpose || shot.purpose || "未提供"}；动作 ${shot.action || "未提供"}；定格目标 ${shot.storyboardFrameGoal || "未提供"}；角色动作 ${beatText}。`;
  });

  return [
    `请为${safeProject.productName || "当前商品"}生成 9:16 竖版故事版叙事图。`,
    `商品：${safeProject.productName || "未提供"}`,
    `主场景：${scenePlan.primaryLocation || "未提供"}`,
    `环境风格：${scenePlan.environmentStyle || "未提供"}`,
    `连续性要求：${scenePlan.continuityRule || "保持人物、商品和光线一致。"}`,
    ...castLines,
    ...shotLines,
    "负面约束：不要商品变形，不要人物漂移，不要场景跳变，不要不可读文字。"
  ].join("\n");
}

function getPromptLocale(project = {}) {
  return normalizePlatform(project?.clipcatConfig?.referencePlatform || project?.accountTemplate?.platform || "tiktok") === "douyin"
    ? "zh"
    : "en";
}

function getVariantTitle(key, locale = "zh") {
  if (locale === "en") {
    return {
      safe: "Safe",
      fast: "Fast",
      conversion: "Conversion"
    }[key] || "Variant";
  }

  return {
    safe: "稳妥版",
    fast: "快节奏版",
    conversion: "强转化版"
  }[key] || "候选版";
}

function buildGenerationDistilledSummary(project, locale = "zh") {
  const template = normalizeAccountTemplate(project.accountTemplate);
  const deepDistillSummary = buildDeepDistillSummary(template);

  if (locale === "en") {
    return [
      `${template.name} playbook: `,
      `position it as "${template.contentPositioning || "not provided"}"; `,
      `open with "${template.hookStyle || "strong hook"}"; `,
      `keep the pace "${template.rhythm || "fast-paced"}"; `,
      `follow the structure "${template.structure || "Hook -> Problem -> Solution -> CTA"}"; `,
      `write in a voice that feels like "${template.expressionDna || "not provided"}"; `,
      `make decisions by "${template.decisionHeuristics || "not provided"}"; `,
      `stay away from "${template.antiPatterns || "not provided"}"; `,
      `keep recent momentum around "${template.recentSignals || "not provided"}"; `,
      `close with "${template.ctaStyle || "soft CTA"}".`,
      deepDistillSummary
        ? ` Deep-distill read: across ${deepDistillSummary.videoCount} samples, the opening bias leans "${deepDistillSummary.zeroFrameBiasEn}", common hook types are "${deepDistillSummary.hookTypes || "not provided"}", emotion curves trend "${deepDistillSummary.emotionCurves || "not provided"}", shot rhythm stays around "${deepDistillSummary.shotRhythms || "not provided"}", proof usually looks like "${deepDistillSummary.proofStyles || "not provided"}", CTAs land as "${deepDistillSummary.ctaStyles || "not provided"}", scene progression tends to be "${deepDistillSummary.sceneProgressions || "not provided"}", and the visual DNA reads "${deepDistillSummary.visualDna || "not provided"}".`
        : ""
    ].join("");
  }

  return buildDistilledFramework(project).summary;
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
  const deepDistillSummary = buildDeepDistillSummary(template);
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
    `收口方式偏向“${template.ctaStyle || "轻转化"}”。`,
    deepDistillSummary ? `视频深蒸馏补充：${deepDistillSummary.summary}` : ""
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
      `样本链接数：${template.sampleVideoUrls.length}`,
      ...(deepDistillSummary
        ? [
            `视频深蒸馏样本数：${deepDistillSummary.videoCount}`,
            `0 帧起手倾向：${deepDistillSummary.zeroFrameBias}`,
            `高频钩子：${deepDistillSummary.hookTypes || "未填写"}`,
            `高频情绪曲线：${deepDistillSummary.emotionCurves || "未填写"}`,
            `高频镜头节奏：${deepDistillSummary.shotRhythms || "未填写"}`,
            `高频证明方式：${deepDistillSummary.proofStyles || "未填写"}`,
            `高频收口方式：${deepDistillSummary.ctaStyles || "未填写"}`,
            `画面推进共性：${deepDistillSummary.sceneProgressions || "未填写"}`,
            `视觉 DNA 共性：${deepDistillSummary.visualDna || "未填写"}`
          ]
        : [])
    ]
  };
}

function buildPromptVariants(project, shots) {
  const template = normalizeAccountTemplate(project.accountTemplate);
  const dnaFocus = summarizeTemplateDna(template);
  const deepDistillSummary = buildDeepDistillSummary(template);
  const locale = getPromptLocale(project);

  if (locale === "en") {
    return [
      {
        key: "safe",
        title: getVariantTitle("safe", locale),
        summary: `Keep it grounded in creator-led proof, make the product easy to follow, and stay close to "${template.expressionDna || "stable lifestyle delivery"}" without over-forcing the edit.${
          deepDistillSummary ? ` Let the shot pacing stay near "${deepDistillSummary.shotRhythms || "the current template shot rhythm"}".` : ""
        }`,
        videoShots: shots.map(
          (shot) =>
            `Safe version, shot ${shot.shotNumber}: ${shot.purpose}. Play the action as ${shot.action}. Keep the delivery lifestyle-led, stable, and easy to track on product. Stay close to "${template.expressionDna || "clear short-line delivery"}" and avoid "${template.antiPatterns || "copying the original people or captions"}".${
              deepDistillSummary ? ` Favor a shot rhythm like "${deepDistillSummary.shotRhythms || "the current template rhythm"}" and proof beats closer to "${deepDistillSummary.proofStyles || "the current template proof style"}".` : ""
            }`
        )
      },
      {
        key: "fast",
        title: getVariantTitle("fast", locale),
        summary: `Push for a faster scroll-stopper, lead harder with the hook, and lean into "${template.recentSignals || "recent high-performing pacing"}".${
          deepDistillSummary ? ` Let the first 3 seconds borrow from "${deepDistillSummary.hookTypes || "the current template hook"}".` : ""
        }`,
        videoShots: shots.map(
          (shot) =>
            `Fast version, shot ${shot.shotNumber}: get to ${shot.purpose} faster. Play the action as ${shot.action}. Strip out any dead air and let "${template.decisionHeuristics || "pain first, proof second"}" drive the order of beats.${
              deepDistillSummary ? ` Early emotional movement should feel closer to "${deepDistillSummary.emotionCurves || "the current template emotion curve"}".` : ""
            }`
        )
      },
      {
        key: "conversion",
        title: getVariantTitle("conversion", locale),
        summary: `Turn up the sell, make the payoff clearer, and keep the structure anchored in "${dnaFocus}".${
          deepDistillSummary ? ` Let the proof and close echo "${deepDistillSummary.proofStyles || "the current template proof style"} / ${deepDistillSummary.ctaStyles || "the current template CTA style"}".` : ""
        }`,
        videoShots: shots.map(
          (shot) =>
            `Conversion version, shot ${shot.shotNumber}: make ${project.productName || "the current product"} earn its place in the frame. Play the action as ${shot.action}. Build the scene around "${template.decisionHeuristics || "pain -> proof -> close"}" and land the ending on "${template.ctaStyle || "a comments-or-profile CTA"}".${
              deepDistillSummary ? ` Keep the proof progression aligned with "${deepDistillSummary.sceneProgressions || "the current template scene progression"}".` : ""
            }`
        )
      }
    ];
  }

  return [
    {
      key: "safe",
      title: "稳妥版",
      summary: `优先保留结构清晰和商品可见，按“${template.expressionDna || "生活化稳定表达"}”收住画面，不追求过强变化。${
        deepDistillSummary ? ` 画面执行上参考“${deepDistillSummary.shotRhythms || "当前模板镜头节奏"}”。` : ""
      }`,
      videoShots: shots.map(
        (shot) =>
          `稳妥版：镜头 ${shot.shotNumber}，${shot.purpose}。动作：${shot.action}。保持生活化、人物稳定、商品清晰，表达上贴近“${template.expressionDna || "短句清楚说明"}”，同时避开“${template.antiPatterns || "照抄原人物和原字幕"}”。${
            deepDistillSummary ? ` 画面节奏优先参考“${deepDistillSummary.shotRhythms || "当前模板镜头节奏"}”，证明方式优先参考“${deepDistillSummary.proofStyles || "当前模板证明方式"}”。` : ""
          }`
      )
    },
    {
      key: "fast",
      title: "快节奏版",
      summary: `适合更强钩子和更短停留时间，优先放大“${template.recentSignals || "近期高表现节奏"}”。${
        deepDistillSummary ? ` 前 3 秒参考“${deepDistillSummary.hookTypes || "当前模板钩子"}”。` : ""
      }`,
      videoShots: shots.map(
        (shot) =>
          `快节奏版：镜头 ${shot.shotNumber}，节奏更快，直接推进 ${shot.purpose}。动作：${shot.action}。删掉多余停顿，优先复用“${template.decisionHeuristics || "先痛点后证明"}”这类推进顺序。${
            deepDistillSummary ? ` 前段情绪推进参考“${deepDistillSummary.emotionCurves || "当前模板情绪曲线"}”。` : ""
          }`
      )
    },
    {
      key: "conversion",
      title: "强转化版",
      summary: `强化${project.productName || "当前商品"}卖点解释和收口引导，让结构更贴近“${dnaFocus}”。${
        deepDistillSummary ? ` 卖点证明和收口参考“${deepDistillSummary.proofStyles || "当前模板证明方式"} / ${deepDistillSummary.ctaStyles || "当前模板收口方式"}”。` : ""
      }`,
      videoShots: shots.map(
        (shot) =>
          `强转化版：镜头 ${shot.shotNumber}，突出 ${project.productName || "当前商品"} 的作用。动作：${shot.action}。优先按“${template.decisionHeuristics || "先痛点、再证明、后收口"}”组织镜头，并把结尾收束到“${template.ctaStyle || "评论区或主页转化"}”。${
            deepDistillSummary ? ` 证明结构优先沿用“${deepDistillSummary.sceneProgressions || "当前模板画面推进"}”。` : ""
          }`
      )
    }
  ];
}

function buildBatchVideoTasks(project, promptVariants, distilledFramework) {
  const template = normalizeAccountTemplate(project.accountTemplate);
  const deepDistillSummary = buildDeepDistillSummary(template);
  const count = Math.max(1, Number(project.generationCount || promptVariants.length || 1));
  const locale = getPromptLocale(project);
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
      aspectRatio: project.aspectRatio || "9:16",
      voiceLanguage: project.clipcatConfig?.voiceLanguage || template.defaultVoiceLanguage,
      variantKey: variant.key,
      variantTitle: variant.title,
      status: "待发送",
      prompt:
        locale === "en"
          ? [
              `Create a short-form video following the benchmark template ${template.name || "Current template"}.`,
              `Build a scroll-stopping TikTok that still feels like a native creator ad, not a stiff prompt dump.`,
              `Benchmark platform: ${getPlatformLabel(template.platform)}`,
              `Positioning: ${template.contentPositioning || "Not provided"}`,
              `Pacing: ${template.rhythm || "Fast-paced"}`,
              `Structure: ${template.structure || "Hook -> Problem -> Solution -> CTA"}`,
              `Expression DNA: ${template.expressionDna || "Not provided"}`,
              `Creative angle: ${template.decisionHeuristics || "Not provided"}`,
              `What to avoid: ${template.antiPatterns || "Not provided"}`,
              `Recent signals: ${template.recentSignals || "Not provided"}`,
              `Current product: ${project.productName || "Not provided"}`,
              `Selling points: ${project.sellingPoints.join(" / ") || "Not provided"}`,
              `Aspect ratio: ${project.aspectRatio || "9:16"}`,
              `Variant: ${variant.title}`,
              `Variant strategy: ${variant.summary}`,
              `Distilled summary: ${buildGenerationDistilledSummary(project, locale)}`,
              ...(deepDistillSummary
                ? [
                    `Deep-distill read: ${deepDistillSummary.videoCount} sample videos suggest "${deepDistillSummary.zeroFrameBiasEn}". Hooks often look like "${deepDistillSummary.hookTypes || "Not provided"}". Emotion usually moves through "${deepDistillSummary.emotionCurves || "Not provided"}". Shot rhythm tends to be "${deepDistillSummary.shotRhythms || "Not provided"}". Proof usually lands through "${deepDistillSummary.proofStyles || "Not provided"}", and the close tends to use "${deepDistillSummary.ctaStyles || "Not provided"}".`,
                    `Scene progression pattern: ${deepDistillSummary.sceneProgressions || "Not provided"}`,
                    `Visual DNA pattern: ${deepDistillSummary.visualDna || "Not provided"}`,
                    `Execution note: If the product fits, use these deep-distill patterns to shape the first 3 seconds, the product reveal, the proof beats, and the final close.`
                  ]
                : []),
              `Rewrite boundary: ${template.rewriteRules || "Keep the structure and do not copy the original directly."}`
            ].join("\n")
          : [
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
              `画幅比例：${project.aspectRatio || "9:16"}`,
              `批次风格：${variant.title}`,
              `版本策略：${variant.summary}`,
              `蒸馏摘要：${distilledFramework.summary}`,
              ...(deepDistillSummary
                ? [
                    `视频深蒸馏样本数：${deepDistillSummary.videoCount}`,
                    `0 帧起手倾向：${deepDistillSummary.zeroFrameBias}`,
                    `高频钩子类型：${deepDistillSummary.hookTypes || "未填写"}`,
                    `高频情绪曲线：${deepDistillSummary.emotionCurves || "未填写"}`,
                    `高频镜头节奏：${deepDistillSummary.shotRhythms || "未填写"}`,
                    `高频卖点证明：${deepDistillSummary.proofStyles || "未填写"}`,
                    `高频收口方式：${deepDistillSummary.ctaStyles || "未填写"}`,
                    `画面推进共性：${deepDistillSummary.sceneProgressions || "未填写"}`,
                    `视觉 DNA 共性：${deepDistillSummary.visualDna || "未填写"}`,
                    `执行要求：如果当前商品适合，优先参考这些视频深蒸馏共性去组织前 3 秒钩子、商品强露出位置、证明节奏和结尾收口。`
                  ]
                : []),
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

function mergeReferenceSummaryWithDeepDistill(referenceSummary, template) {
  const base = String(referenceSummary || "").trim();
  const deepDistillSummary = buildDeepDistillSummary(template);
  if (!deepDistillSummary) {
    return base;
  }
  const deepSection = [
    "视频深蒸馏补充：",
    `- 样本数：${deepDistillSummary.videoCount}`,
    `- 0 帧起手倾向：${deepDistillSummary.zeroFrameBias}`,
    `- 高频钩子：${deepDistillSummary.hookTypes || "未填写"}`,
    `- 高频情绪曲线：${deepDistillSummary.emotionCurves || "未填写"}`,
    `- 高频镜头节奏：${deepDistillSummary.shotRhythms || "未填写"}`,
    `- 高频证明方式：${deepDistillSummary.proofStyles || "未填写"}`,
    `- 高频收口方式：${deepDistillSummary.ctaStyles || "未填写"}`,
    `- 画面推进共性：${deepDistillSummary.sceneProgressions || "未填写"}`,
    `- 视觉 DNA：${deepDistillSummary.visualDna || "未填写"}`
  ].join("\n");
  return [base, deepSection].filter(Boolean).join("\n\n");
}

function buildDeepDistillSummary(templateLike = {}) {
  const template = normalizeAccountTemplate(templateLike);
  const videos = Array.isArray(template.deepDistillVideos) ? template.deepDistillVideos : [];
  if (!videos.length) return null;

  const zeroFrameYesCount = videos.filter((video) => video.analysis?.isZeroFrameProductHook === "是").length;
  const zeroFrameNoCount = videos.filter((video) => video.analysis?.isZeroFrameProductHook === "否").length;
  const zeroFrameBias =
    zeroFrameYesCount > zeroFrameNoCount
      ? `偏 0 帧商品起手（${zeroFrameYesCount}/${videos.length}）`
      : zeroFrameNoCount > zeroFrameYesCount
        ? `偏非 0 帧商品起手（${zeroFrameNoCount}/${videos.length}）`
        : "待继续观察";
  const zeroFrameBiasEn =
    zeroFrameYesCount > zeroFrameNoCount
      ? `leans toward opening with the product already in frame (${zeroFrameYesCount}/${videos.length})`
      : zeroFrameNoCount > zeroFrameYesCount
        ? `leans toward earning the product reveal after the opening beat (${zeroFrameNoCount}/${videos.length})`
        : "does not show a clear opening bias yet";

  const hookTypes = pickTopDeepDistillValues(videos, "hookType");
  const emotionCurves = pickTopDeepDistillValues(videos, "emotionCurve");
  const shotRhythms = pickTopDeepDistillValues(videos, "shotRhythm");
  const proofStyles = pickTopDeepDistillValues(videos, "proofStyle");
  const ctaStyles = pickTopDeepDistillValues(videos, "ctaStyle");
  const sceneProgressions = pickTopDeepDistillValues(videos, "sceneProgression", 2);
  const visualDna = pickTopDeepDistillValues(videos, "visualDna", 2);

  return {
    videoCount: videos.length,
    zeroFrameBias,
    zeroFrameBiasEn,
    hookTypes,
    emotionCurves,
    shotRhythms,
    proofStyles,
    ctaStyles,
    sceneProgressions,
    visualDna,
    summary: [
      `${videos.length} 条视频样本里，${zeroFrameBias}`,
      hookTypes ? `钩子更常见“${hookTypes}”` : "",
      emotionCurves ? `情绪推进更常见“${emotionCurves}”` : "",
      shotRhythms ? `镜头节奏更常见“${shotRhythms}”` : "",
      proofStyles ? `证明方式更常见“${proofStyles}”` : "",
      ctaStyles ? `收口方式更常见“${ctaStyles}”` : ""
    ]
      .filter(Boolean)
      .join("，")
  };
}

function pickTopDeepDistillValues(videos, field, limit = 3) {
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
  const compactNumberPattern = /^(\d+(?:[.,]\d+)?\s*[KMB]?|0)$/i;
  const pickMetric = (labels) => {
    for (let index = 0; index < normalized.length; index += 1) {
      const line = normalized[index];
      const lower = line.toLowerCase();
      if (labels.some((label) => lower.includes(label))) {
        const number = line.match(/(\d+(?:[.,]\d+)?\s*[KMB]?)/i)?.[1];
        if (number) return parseCompactSocialNumber(number);
        const previousLine = normalized[index - 1] || "";
        if (compactNumberPattern.test(previousLine)) {
          return parseCompactSocialNumber(previousLine);
        }
        const nextLine = normalized[index + 1] || "";
        if (compactNumberPattern.test(nextLine)) {
          return parseCompactSocialNumber(nextLine);
        }
      }
    }
    return 0;
  };
  return {
    followers: pickMetric(["follower", "followers", "粉丝"]),
    likes: pickMetric(["like", "likes", "获赞", "点赞", "赞"])
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

export function normalizeTikTokDurationSeconds(value = 0) {
  const number = Number(value || 0);
  if (!Number.isFinite(number) || number <= 0) return 0;
  if (number >= 10_000) return Math.max(1, Math.round(number / 1000));
  if (number >= 1_000 && number <= 10_000) {
    if (number % 1_000 === 0 && number / 1_000 <= 60) {
      return Math.max(1, Math.round(number / 1000));
    }
    if (number % 500 === 0 && number % 60 !== 0 && number / 1_000 <= 60) {
      return Math.max(1, Math.round(number / 1000));
    }
  }
  return Math.round(number);
}

export function pickPreferredTikTokProfileVideo(previous = {}, next = {}) {
  if (!previous?.videoUrl) return next;
  if (!next?.videoUrl) return previous;
  return scoreTikTokProfileVideoCandidate(next) > scoreTikTokProfileVideoCandidate(previous) ? next : previous;
}

export function mergeTikTokProfileVideoCandidates(left = {}, right = {}) {
  const preferred = pickPreferredTikTokProfileVideo(left, right);
  const fallback = preferred === left ? right : left;
  return {
    ...fallback,
    ...preferred,
    videoUrl: preferred.videoUrl || fallback.videoUrl || "",
    caption:
      (String(preferred.caption || "").trim().length >= String(fallback.caption || "").trim().length
        ? preferred.caption
        : fallback.caption) || "",
    thumbnailUrl: preferred.thumbnailUrl || fallback.thumbnailUrl || "",
    durationSeconds: Math.max(Number(left.durationSeconds || 0), Number(right.durationSeconds || 0), 0),
    stats: {
      views: Math.max(Number(left.stats?.views || 0), Number(right.stats?.views || 0), 0),
      likes: Math.max(Number(left.stats?.likes || 0), Number(right.stats?.likes || 0), 0),
      comments: Math.max(Number(left.stats?.comments || 0), Number(right.stats?.comments || 0), 0),
      shares: Math.max(Number(left.stats?.shares || 0), Number(right.stats?.shares || 0), 0),
      saves: Math.max(Number(left.stats?.saves || 0), Number(right.stats?.saves || 0), 0)
    }
  };
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
