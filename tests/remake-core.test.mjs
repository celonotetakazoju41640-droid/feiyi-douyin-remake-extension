import test from "node:test";
import assert from "node:assert/strict";

import {
  buildSafeClipcatPrompt,
  buildRemakePackage,
  buildProfileSelectionComparisonSummary,
  buildReferenceSummaryFromProfileScan,
  classifyTikTokProfilePageIssue,
  createEmptyAccountTemplate,
  distillAccountTemplateFromProfileScan,
  inferProductInsightsFromAsset,
  inferGenerationDefaultsFromAsset,
  mergeTikTokProfileVideoCandidates,
  normalizeAccountTemplate,
  normalizeTikTokDurationSeconds,
  parseTikTokProfileIdentityText,
  pickPreferredTikTokProfileVideo,
  parseTikTokProfileStatsText,
  parseTikTokVisibleStatsText,
  splitLines
} from "../src/remake-core.js";

test("splitLines removes blanks and trims whitespace", () => {
  assert.deepEqual(splitLines("  第一条 \n\n 第二条  \n"), ["第一条", "第二条"]);
});

test("inferProductInsightsFromAsset auto-suggests english selling points for TikTok cleaning products", () => {
  const result = inferProductInsightsFromAsset({
    fileName: "kitchen-cleaner-spray.png",
    template: {
      platform: "tiktok",
      contentPositioning: "家清去污，痛点冲突强"
    }
  });

  assert.match(result.suggestedProductName, /kitchen cleaner spray/i);
  assert.equal(result.sellingPoints.length, 4);
  assert.match(result.sellingPoints[0], /before-after|visible result|proof/i);
  assert.match(result.suggestedPrompt, /short|30 seconds|problem|proof/i);
});

test("inferProductInsightsFromAsset provides a safe fallback prompt when no category matches", () => {
  const result = inferProductInsightsFromAsset({
    fileName: "mystery-item.png",
    template: {
      platform: "tiktok"
    }
  });

  assert.equal(result.sellingPoints.length, 4);
  assert.match(result.suggestedPrompt, /Build a short lifestyle video around|clear problem|visual proof/i);
});

test("inferGenerationDefaultsFromAsset returns host and scene defaults for matched categories", () => {
  const result = inferGenerationDefaultsFromAsset({
    fileName: "kitchen-cleaner-spray.png",
    template: {
      platform: "tiktok",
      contentPositioning: "cleaning demo"
    }
  });

  assert.match(result.scenePlan.primaryLocation, /kitchen|bathroom/i);
  assert.match(result.scenePlan.environmentStyle, /daylight|before-after|lifestyle/i);
  assert.equal(result.cast.length, 1);
  assert.equal(result.cast[0].roleType, "host");
  assert.match(result.cast[0].behaviorRule, /Demonstrates|before-after/i);
});

test("normalizeAccountTemplate preserves profile url and sample urls", () => {
  const template = normalizeAccountTemplate({
    name: "厨房清洁模板",
    platform: "douyin",
    accountHandle: "@clean_demo",
    profileUrl: "https://www.tiktok.com/@clean_demo",
    sampleVideoUrls: "https://a\nhttps://b"
  });

  assert.equal(template.platform, "douyin");
  assert.equal(template.profileUrl, "https://www.tiktok.com/@clean_demo");
  assert.equal(template.sampleVideoUrls.length, 2);
});

test("normalizeAccountTemplate defaults TikTok templates to english prompts", () => {
  const template = normalizeAccountTemplate({
    name: "TikTok 模板",
    platform: "tiktok"
  });

  assert.equal(template.defaultVoiceLanguage, "英文");
});

test("normalizeAccountTemplate defaults douyin templates to chinese prompts", () => {
  const template = normalizeAccountTemplate({
    name: "抖音模板",
    platform: "douyin"
  });

  assert.equal(template.defaultVoiceLanguage, "中文");
});

test("buildSafeClipcatPrompt supports douyin wording", () => {
  const prompt = buildSafeClipcatPrompt({
    productName: "去污喷雾",
    productImageCount: 2,
    tiktokUrl: "https://www.douyin.com/video/123",
    referencePlatform: "douyin",
    durationSeconds: 20,
    voiceLanguage: "中文"
  });

  assert.match(prompt, /参考抖音链接/);
});

test("distillAccountTemplateFromProfileScan builds template from profile signals", () => {
  const template = distillAccountTemplateFromProfileScan({
    profileUrl: "https://www.tiktok.com/@kitchenlab",
    accountHandle: "@kitchenlab",
    displayName: "Kitchen Lab",
    bio: "Amazon finds and kitchen cleaning hacks. Link in bio.",
    stats: {
      followers: 126000,
      likes: 2400000
    },
    videos: [
      {
        videoUrl: "https://www.tiktok.com/@kitchenlab/video/1",
        caption: "Stop scrubbing like this. #cleaning #kitchen #amazonfinds",
        durationSeconds: 18,
        stats: { views: 240000, likes: 23000, comments: 800, shares: 1200 }
      },
      {
        videoUrl: "https://www.tiktok.com/@kitchenlab/video/2",
        caption: "Before and after stove degreaser demo #cleaningtiktok",
        durationSeconds: 22,
        stats: { views: 310000, likes: 28000, comments: 1100, shares: 1400 }
      },
      {
        videoUrl: "https://www.tiktok.com/@kitchenlab/video/3",
        caption: "Need this sink cleaner right now #musthave",
        durationSeconds: 16,
        stats: { views: 180000, likes: 17000, comments: 420, shares: 900 }
      }
    ]
  });

  assert.equal(template.accountHandle, "@kitchenlab");
  assert.equal(template.profileUrl, "https://www.tiktok.com/@kitchenlab");
  assert.equal(template.sampleVideoUrls.length, 3);
  assert.match(template.contentPositioning, /家清|厨房|清洁|Amazon/i);
  assert.match(template.structure, /钩子/);
  assert.match(template.rhythm, /秒/);
  assert.match(template.expressionDna, /钩子|短句|结果|命令式/i);
  assert.match(template.decisionHeuristics, /痛点|对比|开场/i);
  assert.match(template.antiPatterns, /不要/i);
  assert.match(template.recentSignals, /近期|样本/i);
});

test("distillAccountTemplateFromProfileScan supports douyin profile scan", () => {
  const template = distillAccountTemplateFromProfileScan({
    platform: "douyin",
    profileUrl: "https://www.douyin.com/user/MS4wLjABAAAA-demo",
    accountHandle: "dyotars4dokr",
    displayName: "KANSAI COLLECTION",
    bio: "日本TOP级时尚活动盛典",
    stats: {
      followers: 2627,
      likes: 16000
    },
    videos: [
      {
        videoUrl: "https://www.douyin.com/video/7659936456529448230",
        caption: "It’s time to Holiday 工作日也可以有 Holiday 的心情",
        durationSeconds: 24,
        stats: { views: 120000, likes: 3200, comments: 110, shares: 260 }
      },
      {
        videoUrl: "https://www.douyin.com/video/7618113393942351537",
        caption: "平井大日本巡演现场 LIVE 视频",
        durationSeconds: 27,
        stats: { views: 98000, likes: 2800, comments: 90, shares: 210 }
      }
    ]
  });

  assert.equal(template.platform, "douyin");
  assert.equal(template.profileUrl, "https://www.douyin.com/user/MS4wLjABAAAA-demo");
  assert.equal(template.accountHandle, "@dyotars4dokr");
  assert.equal(template.sampleVideoUrls.length, 2);
  assert.match(template.contentPositioning, /短视频|带货|场景|钩子|复用/i);
});

test("buildReferenceSummaryFromProfileScan outputs concise summary", () => {
  const summary = buildReferenceSummaryFromProfileScan({
    profileUrl: "https://www.tiktok.com/@storylab",
    accountHandle: "@storylab",
    displayName: "Story Lab",
    bio: "Emotional hooks and relationship reversals",
    videos: [
      {
        videoUrl: "https://www.tiktok.com/@storylab/video/1",
        caption: "Wait before you judge him. #story #reaction",
        durationSeconds: 28,
        stats: { views: 80000, likes: 7000, comments: 400, shares: 500, saves: 320 }
      },
      {
        videoUrl: "https://www.tiktok.com/@storylab/video/2",
        caption: "She looked guilty until the full story came out.",
        durationSeconds: 32,
        stats: { views: 102000, likes: 9200, comments: 620, shares: 810, saves: 560 }
      }
    ]
  });

  assert.match(summary, /账号主页蒸馏摘要/);
  assert.match(summary, /@storylab/);
  assert.match(summary, /样本视频/);
  assert.match(summary, /收藏/);
  assert.match(summary, /表达 DNA/);
  assert.match(summary, /决策启发式/);
  assert.match(summary, /反模式/);
});

test("buildRemakePackage pushes DNA into prompt variants and batch tasks for douyin generation", () => {
  const pkg = buildRemakePackage({
    projectName: "厨房去污复刻",
    referenceSummary: "前后对比开场，快速证明，最后收口转化。",
    productName: "去污喷雾",
    sellingPoints: ["去油污快", "不刺鼻", "厨房台面可用"],
    hookStyle: "强冲突开场",
    visualStyle: "生活化对比演示",
    cta: "引导去主页看更多清洁对比",
    durationSeconds: 30,
    generationCount: 3,
    voiceDialect: "普通话",
    voiceLanguage: "中文",
    referencePlatform: "douyin",
    accountTemplate: {
      name: "快节奏家清模板",
      platform: "douyin",
      accountHandle: "@cleaning_fast_den",
      contentPositioning: "家清去污，痛点冲突强",
      hookStyle: "强冲突开场",
      rhythm: "3秒钩子，15到30秒完成证明",
      structure: "痛点开场 -> 前后对比 -> 收口转化",
      expressionDna: "短句先抛痛点，先结果再解释",
      decisionHeuristics: "先打痛点，再给前后对比证明，最后快速收口",
      antiPatterns: "不要一上来讲参数",
      recentSignals: "近期 20 到 30 秒对比内容表现最好",
      ctaStyle: "结尾引导去评论区或主页",
      rewriteRules: "只借结构，不照抄原账号痕迹",
      defaultVoiceLanguage: "中文",
      preferredModel: "veo-3-fast"
    }
  });

  assert.equal(pkg.promptVariants.length, 3);
  assert.match(pkg.promptVariants[0].summary, /表达|痛点|DNA/);
  assert.match(pkg.promptVariants[1].videoShots[0], /决策启发式|推进顺序|痛点/);
  assert.match(pkg.batchVideoTasks[0].prompt, /版本策略/);
  assert.match(pkg.batchVideoTasks[0].prompt, /表达 DNA/);
  assert.match(pkg.batchVideoTasks[0].prompt, /反模式/);
});

test("buildRemakePackage outputs english batch prompt for TikTok generation", () => {
  const pkg = buildRemakePackage({
    projectName: "odor-remover-remake",
    referenceSummary: "Open with a kitchen odor problem, prove the result fast, then end with a soft CTA.",
    productName: "odor remover box",
    sellingPoints: ["Fast visible result", "Easy to use", "Fits kitchen use cases"],
    hookStyle: "Strong conflict hook",
    visualStyle: "lifestyle product demo",
    cta: "Guide viewers to the profile for more results",
    durationSeconds: 30,
    generationCount: 1,
    voiceDialect: "English",
    voiceLanguage: "英文",
    accountTemplate: {
      name: "Fast cleaning template",
      platform: "tiktok",
      accountHandle: "@cleaning_fast_den",
      contentPositioning: "Cleaning demo with strong conflict and quick proof",
      hookStyle: "Strong conflict hook",
      rhythm: "3-second hook, then proof and payoff inside 30 seconds",
      structure: "Problem hook -> product entry -> proof -> CTA",
      expressionDna: "Short lines, result first, then explanation",
      decisionHeuristics: "Open on pain, prove fast, close cleanly",
      antiPatterns: "Do not explain specs before showing the result",
      recentSignals: "Fast before-after demos still perform best",
      ctaStyle: "Soft CTA to comments or profile",
      rewriteRules: "Reuse structure only, do not copy branding or captions",
      defaultVoiceLanguage: "英文",
      preferredModel: "veo-3-fast"
    }
  });

  assert.match(pkg.batchVideoTasks[0].prompt, /Create a short-form video/i);
  assert.match(pkg.batchVideoTasks[0].prompt, /Current product:/i);
  assert.match(pkg.batchVideoTasks[0].prompt, /Selling points:/i);
  assert.match(pkg.prompts.videoShots[0], /Animate from the supplied keyframe/i);
  assert.match(pkg.prompts.videoShots[0], /voiceover intent:/i);
});

test("buildRemakePackage uses more native english phrasing for TikTok prompts", () => {
  const pkg = buildRemakePackage({
    projectName: "odor-remover-remake",
    referenceSummary: "Open with a kitchen odor problem, prove the result fast, then end with a soft CTA.",
    productName: "odor remover box",
    sellingPoints: ["Fast visible result", "Easy to use", "Fits kitchen use cases"],
    hookStyle: "Strong conflict hook",
    visualStyle: "lifestyle product demo",
    cta: "Guide viewers to the profile for more results",
    durationSeconds: 30,
    generationCount: 1,
    voiceDialect: "English",
    voiceLanguage: "英文",
    accountTemplate: {
      name: "Fast cleaning template",
      platform: "tiktok",
      accountHandle: "@cleaning_fast_den",
      contentPositioning: "Cleaning demo with strong conflict and quick proof",
      hookStyle: "Strong conflict hook",
      rhythm: "3-second hook, then proof and payoff inside 30 seconds",
      structure: "Problem hook -> product entry -> proof -> CTA",
      expressionDna: "Short lines, result first, then explanation",
      decisionHeuristics: "Open on pain, prove fast, close cleanly",
      antiPatterns: "Do not explain specs before showing the result",
      recentSignals: "Fast before-after demos still perform best",
      ctaStyle: "Soft CTA to comments or profile",
      rewriteRules: "Reuse structure only, do not copy branding or captions",
      defaultVoiceLanguage: "英文",
      preferredModel: "veo-3-fast",
      deepDistillVideos: [
        {
          fileName: "sample-1.mp4",
          analysis: {
            isZeroFrameProductHook: "是",
            hookType: "Problem-first visual hook",
            emotionCurve: "Curious -> relieved",
            shotRhythm: "Quick hook, tight proof beats, clean CTA close",
            proofStyle: "Visible before-after proof",
            ctaStyle: "Soft profile CTA",
            sceneProgression: "Problem -> demo -> payoff",
            visualDna: "Bright kitchen, tight handheld demo"
          }
        }
      ]
    }
  });

  assert.match(pkg.batchVideoTasks[0].prompt, /Build a scroll-stopping TikTok/i);
  assert.match(pkg.batchVideoTasks[0].prompt, /Creative angle:/i);
  assert.match(pkg.batchVideoTasks[0].prompt, /What to avoid:/i);
  assert.match(pkg.batchVideoTasks[0].prompt, /Deep-distill read:/i);
  assert.match(pkg.prompts.videoShots[0], /Animate from the supplied keyframe/i);
  assert.match(pkg.promptVariants[0].summary, /Keep it grounded in creator-led proof/i);
});

test("buildRemakePackage keeps single-person projects compatible when storyboard is off", () => {
  const pkg = buildRemakePackage({
    projectName: "single-host-project",
    referenceSummary: "Open with a simple creator-led product demo.",
    productName: "demo product",
    sellingPoints: ["Fast result", "Easy to use"],
    storyboardEnabled: false,
    accountTemplate: {
      name: "Solo host template",
      platform: "tiktok",
      defaultVoiceLanguage: "英文"
    }
  });

  assert.equal(pkg.project.storyboardMode, "optional");
  assert.equal(pkg.project.cast.length, 1);
  assert.equal(pkg.project.cast[0].roleType, "host");
  assert.equal(pkg.project.cast[0].id, "host-1");
  assert.equal(pkg.project.cast[0].label, "主讲人");
  assert.equal(pkg.storyboardTasks.length, 0);
  assert.ok(pkg.batchVideoTasks.length > 0);
});

test("buildRemakePackage builds host and supporting cast beats into shots", () => {
  const pkg = buildRemakePackage({
    projectName: "two-person-project",
    referenceSummary: "Host leads, support reacts, then product proof lands.",
    productName: "demo product",
    sellingPoints: ["Fast result", "Easy to use"],
    storyboardEnabled: true,
    cast: [
      {
        id: "host-1",
        roleType: "host",
        label: "主讲人",
        presenceRule: "always",
        appearanceLock: "same host throughout",
        behaviorRule: "Lead the explanation and hold the product",
        voiceRule: "primary"
      },
      {
        id: "support-1",
        roleType: "supporting",
        label: "配角A",
        presenceRule: "selective",
        appearanceLock: "same friend throughout",
        behaviorRule: "React and witness the result",
        voiceRule: "silent"
      }
    ],
    scenePlan: {
      primaryLocation: "modern kitchen",
      environmentStyle: "bright lifestyle daylight",
      continuityRule: "same counter and same daylight direction",
      shots: [
        {
          scenePurpose: "Hook the viewer with a host-led reaction",
          primaryCastId: "host-1",
          supportingCastIds: ["support-1"],
          castBeats: [
            { castId: "host-1", beat: "Host spots the problem first" },
            { castId: "support-1", beat: "Support reacts to the tension" }
          ],
          storyboardFrameGoal: "Frame both cast members in the first beat"
        }
      ]
    },
    accountTemplate: {
      name: "Two-person template",
      platform: "tiktok",
      defaultVoiceLanguage: "英文"
    }
  });

  assert.equal(pkg.project.cast.length, 2);
  assert.equal(pkg.project.cast[1].roleType, "supporting");
  assert.equal(pkg.shots[0].primaryCastId, "host-1");
  assert.deepEqual(pkg.shots[0].supportingCastIds, ["support-1"]);
  assert.equal(pkg.shots[0].castBeats.length, 2);
  assert.ok(pkg.storyboardTasks.length > 0);
  assert.equal(pkg.storyboardTasks[0].unitId, "unit-01");
  assert.deepEqual(pkg.storyboardTasks[0].shotRange, [1, 6]);
  assert.equal(pkg.storyboardTasks[0].provider, "kie-gpt-image");
  assert.equal(pkg.storyboardTasks[0].status, "idle");
  assert.equal(pkg.storyboardTasks[0].imageUrl, "");
  assert.equal(pkg.storyboardTasks[0].errorMessage, "");
});

test("buildRemakePackage creates a storyboard prompt with cast, scene, and continuity instructions", () => {
  const pkg = buildRemakePackage({
    projectName: "storyboard-demo",
    referenceSummary: "host demonstrates, friend reacts",
    productName: "odor remover box",
    sellingPoints: ["Fast visible result", "Easy to use"],
    storyboardEnabled: true,
    scenePlan: {
      primaryLocation: "modern kitchen",
      environmentStyle: "bright lifestyle daylight",
      continuityRule: "same counter and same daylight direction"
    },
    cast: [
      { id: "host-1", roleType: "host", label: "主讲人", behaviorRule: "负责讲解和展示产品", voiceRule: "primary" },
      { id: "support-1", roleType: "supporting", label: "配角A", behaviorRule: "负责反应和见证结果", voiceRule: "silent" }
    ],
    accountTemplate: { name: "Demo template", platform: "tiktok", defaultVoiceLanguage: "英文" }
  });

  assert.match(pkg.storyboardTasks[0].prompt, /Product:/i);
  assert.match(pkg.storyboardTasks[0].prompt, /Scene:/i);
  assert.match(pkg.storyboardTasks[0].prompt, /Host:/i);
  assert.match(pkg.storyboardTasks[0].prompt, /Supporting cast:/i);
  assert.match(pkg.storyboardTasks[0].prompt, /Continuity:/i);
});

test("buildProfileSelectionComparisonSummary highlights selected sample drift", () => {
  const fullScan = {
    profileUrl: "https://www.tiktok.com/@lab",
    accountHandle: "@lab",
    displayName: "Lab",
    bio: "cleaning demos and before after",
    videos: [
      {
        videoUrl: "https://www.tiktok.com/@lab/video/1",
        caption: "Before and after sink demo",
        durationSeconds: 30,
        stats: { views: 90000, likes: 5000, comments: 100, shares: 100 }
      },
      {
        videoUrl: "https://www.tiktok.com/@lab/video/2",
        caption: "Stop doing this in your kitchen",
        durationSeconds: 18,
        stats: { views: 280000, likes: 22000, comments: 300, shares: 500 }
      },
      {
        videoUrl: "https://www.tiktok.com/@lab/video/3",
        caption: "Need this cleaner right now",
        durationSeconds: 16,
        stats: { views: 260000, likes: 18000, comments: 240, shares: 420 }
      }
    ]
  };
  const selectedScan = {
    ...fullScan,
    videos: [fullScan.videos[1], fullScan.videos[2]]
  };

  const comparison = buildProfileSelectionComparisonSummary(fullScan, selectedScan);

  assert.match(comparison, /样本对比/);
  assert.match(comparison, /2 \/ 3/);
  assert.match(comparison, /更短|更长|接近/);
  assert.match(comparison, /平均播放更高|平均播放更低/);
});

test("createEmptyAccountTemplate returns editable blank shape", () => {
  const template = createEmptyAccountTemplate();
  assert.equal(template.name, "");
  assert.equal(template.profileUrl, "");
  assert.equal(template.expressionDna, "");
  assert.equal(template.decisionHeuristics, "");
  assert.equal(template.antiPatterns, "");
  assert.equal(template.recentSignals, "");
  assert.equal(template.sampleVideoUrls.length, 0);
});

test("classifyTikTokProfilePageIssue identifies not found pages", () => {
  const issue = classifyTikTokProfilePageIssue({
    title: "无法找到此账号，请访问 TikTok 以发现更多热门创作者、话题标签和音乐。",
    bodyText: "TikTok 找不到此账号 寻找视频？试试浏览我们的热门创作者 登录",
    hasVideoLink: false
  });

  assert.equal(issue?.code, "not_found");
  assert.match(issue?.message || "", /找不到此账号/);
});

test("classifyTikTokProfilePageIssue identifies login wall pages", () => {
  const issue = classifyTikTokProfilePageIssue({
    title: "TikTok - Make Your Day",
    bodyText: "TikTok 搜索 推荐 探索 已关注 直播 上传 主页 更多 登录 公司 条款和政策 登录",
    hasVideoLink: false
  });

  assert.equal(issue?.code, "login_wall");
  assert.match(issue?.message || "", /登录页|访问限制|公开样本/);
});

test("classifyTikTokProfilePageIssue ignores normal public profile pages", () => {
  const issue = classifyTikTokProfilePageIssue({
    title: "Kitchen Lab (@kitchenlab) | TikTok",
    bodyText: "Kitchen Lab 1.2M followers 24.5M likes Stop scrubbing like this Before and after stove degreaser demo",
    hasVideoLink: true
  });

  assert.equal(issue, null);
});

test("parseTikTokVisibleStatsText reads labeled TikTok metrics", () => {
  const stats = parseTikTokVisibleStatsText(`
    1.2M likes
    3.4K comments
    880 shares
    540 saves
    56.7K views
  `);

  assert.deepEqual(stats, {
    views: 56700,
    likes: 1200000,
    comments: 3400,
    shares: 880,
    saves: 540
  });
});

test("parseTikTokVisibleStatsText keeps first compact number as view fallback", () => {
  const stats = parseTikTokVisibleStatsText(`
    18
    245K
  `);

  assert.equal(stats.views, 18);
  assert.equal(stats.likes, 0);
  assert.equal(stats.comments, 0);
  assert.equal(stats.shares, 0);
  assert.equal(stats.saves, 0);
});

test("parseTikTokProfileStatsText reads english follower and like counts", () => {
  const stats = parseTikTokProfileStatsText(`
    Kitchen Lab
    1.2M followers
    24.5M likes
  `);

  assert.deepEqual(stats, {
    followers: 1200000,
    likes: 24500000
  });
});

test("parseTikTokProfileStatsText tolerates mixed locale profile text", () => {
  const stats = parseTikTokProfileStatsText(`
    TikTok 搜索 推荐 探索
    @kitchenlab
    875.4K followers
    12.3M likes
    登录
  `);

  assert.equal(stats.followers, 875400);
  assert.equal(stats.likes, 12300000);
});

test("parseTikTokProfileStatsText supports split-line follower and like labels", () => {
  const stats = parseTikTokProfileStatsText(`
    NBA
    nba
    27.1M
    粉丝
    1.1B
    赞
  `);

  assert.equal(stats.followers, 27100000);
  assert.equal(stats.likes, 1100000000);
});

test("pickPreferredTikTokProfileVideo keeps richer interaction stats", () => {
  const previous = {
    videoUrl: "https://www.tiktok.com/@lab/video/1",
    caption: "Longer caption but weak stats",
    thumbnailUrl: "",
    durationSeconds: 0,
    stats: { views: 1200, likes: 0, comments: 0, shares: 0, saves: 0 }
  };
  const next = {
    videoUrl: "https://www.tiktok.com/@lab/video/1",
    caption: "Short caption",
    thumbnailUrl: "https://img.example.com/1.jpg",
    durationSeconds: 18,
    stats: { views: 1100, likes: 240, comments: 31, shares: 12, saves: 9 }
  };

  const picked = pickPreferredTikTokProfileVideo(previous, next);

  assert.equal(picked.thumbnailUrl, "https://img.example.com/1.jpg");
  assert.equal(picked.durationSeconds, 18);
  assert.equal(picked.stats.likes, 240);
  assert.equal(picked.stats.comments, 31);
  assert.equal(picked.stats.shares, 12);
  assert.equal(picked.stats.saves, 9);
});

test("pickPreferredTikTokProfileVideo keeps stronger caption when quality is otherwise close", () => {
  const previous = {
    videoUrl: "https://www.tiktok.com/@lab/video/2",
    caption: "Before and after stove degreaser demo with clear hook",
    thumbnailUrl: "https://img.example.com/2.jpg",
    durationSeconds: 20,
    stats: { views: 2200, likes: 80, comments: 10, shares: 4, saves: 2 }
  };
  const next = {
    videoUrl: "https://www.tiktok.com/@lab/video/2",
    caption: "Short",
    thumbnailUrl: "https://img.example.com/2.jpg",
    durationSeconds: 20,
    stats: { views: 2200, likes: 80, comments: 10, shares: 4, saves: 2 }
  };

  const picked = pickPreferredTikTokProfileVideo(previous, next);

  assert.equal(picked.caption, "Before and after stove degreaser demo with clear hook");
});

test("mergeTikTokProfileVideoCandidates combines richer stats and better media fields", () => {
  const left = {
    videoUrl: "https://www.tiktok.com/@lab/video/3",
    caption: "Short",
    thumbnailUrl: "",
    durationSeconds: 0,
    stats: { views: 1200, likes: 0, comments: 0, shares: 0, saves: 0 }
  };
  const right = {
    videoUrl: "https://www.tiktok.com/@lab/video/3",
    caption: "Before and after degreaser demo with clearer hook",
    thumbnailUrl: "https://img.example.com/3.jpg",
    durationSeconds: 18,
    stats: { views: 1100, likes: 240, comments: 31, shares: 12, saves: 9 }
  };

  const merged = mergeTikTokProfileVideoCandidates(left, right);

  assert.equal(merged.caption, "Before and after degreaser demo with clearer hook");
  assert.equal(merged.thumbnailUrl, "https://img.example.com/3.jpg");
  assert.equal(merged.durationSeconds, 18);
  assert.deepEqual(merged.stats, {
    views: 1200,
    likes: 240,
    comments: 31,
    shares: 12,
    saves: 9
  });
});

test("parseTikTokProfileIdentityText extracts display name and bio from visible text", () => {
  const identity = parseTikTokProfileIdentityText(`
    TikTok
    搜索
    Kitchen Lab
    @kitchenlab
    Amazon finds and kitchen cleaning hacks. Link in bio.
    1.2M followers
    24.5M likes
  `);

  assert.equal(identity.displayName, "Kitchen Lab");
  assert.equal(identity.bio, "Amazon finds and kitchen cleaning hacks. Link in bio.");
});

test("parseTikTokProfileIdentityText ignores login-wall navigation text", () => {
  const identity = parseTikTokProfileIdentityText(`
    TikTok
    搜索
    推荐
    探索
    已关注
    直播
    上传
    主页
    更多
    登录
    公司
    条款和政策
  `);

  assert.equal(identity.displayName, "");
  assert.equal(identity.bio, "");
});

test("normalizeTikTokDurationSeconds keeps normal second values", () => {
  assert.equal(normalizeTikTokDurationSeconds(18), 18);
  assert.equal(normalizeTikTokDurationSeconds("32"), 32);
});

test("normalizeTikTokDurationSeconds converts millisecond-like values", () => {
  assert.equal(normalizeTikTokDurationSeconds(18000), 18);
  assert.equal(normalizeTikTokDurationSeconds("32500"), 33);
});

test("normalizeTikTokDurationSeconds keeps long second values instead of misreading them as milliseconds", () => {
  assert.equal(normalizeTikTokDurationSeconds(1800), 1800);
  assert.equal(normalizeTikTokDurationSeconds("3600"), 3600);
});

test("normalizeTikTokDurationSeconds still converts short millisecond values", () => {
  assert.equal(normalizeTikTokDurationSeconds(9500), 10);
  assert.equal(normalizeTikTokDurationSeconds("3000"), 3);
});
