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

test("buildRemakePackage pushes DNA into prompt variants and batch tasks", () => {
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
    accountTemplate: {
      name: "快节奏家清模板",
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
