if (!globalThis.CommerceVideoTikTokViralScannerInstalled) {
  globalThis.CommerceVideoTikTokViralScannerInstalled = true;
  globalThis.CommerceVideoTikTokViralScanStopRequested = false;
  globalThis.CommerceVideoScanTikTokViralVideos = scanTikTokViralVideos;

  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message?.type === "STOP_TIKTOK_VIRAL_SCAN") {
      globalThis.CommerceVideoTikTokViralScanStopRequested = true;
      sendResponse({ ok: true, stopped: true });
      return true;
    }
    if (message?.type !== "SCAN_TIKTOK_VIRAL_VIDEOS") return false;
    scanTikTokViralVideos(message.options || {})
      .then((scan) => sendResponse({ ok: true, scan }))
      .catch((error) => sendResponse({ ok: false, error: error instanceof Error ? error.message : String(error) }));
    return true;
  });
}

globalThis.CommerceVideoTikTokViralScannerDebug = {
  collectVideosFromPageData,
  collectVisibleVideos,
  extractPageVideoData
};

async function scanTikTokViralVideos(options) {
  if (!location.hostname.includes("tiktok.com")) {
    throw new Error("请先打开 TikTok 推荐流页面");
  }

  const roundsRequested = clampInt(options.rounds ?? 12, 1, 200);
  const delayMs = clampInt(options.delayMs ?? 1200, 400, 5000);
  const recentDays = clampInt(options.recentDays ?? 7, 1, 30);
  const minViews = clampInt(options.minViews ?? 0, 0, 1_000_000_000);
  const minLikes = clampInt(options.minLikes ?? 0, 0, 1_000_000_000);
  const seen = new Map();
  const scannedKeys = new Set();
  const pageVideoData = extractPageVideoData();
  let roundsCompleted = 0;
  globalThis.CommerceVideoTikTokViralScanStopRequested = false;

  await waitForArticles();
  for (let round = 0; round < roundsRequested; round += 1) {
    if (globalThis.CommerceVideoTikTokViralScanStopRequested) break;
    for (const video of collectVisibleVideos()) {
      if (globalThis.CommerceVideoTikTokViralScanStopRequested) break;
      const key = video.videoId || video.videoUrl;
      if (!key) continue;
      scannedKeys.add(key);
      const enriched = mergeVideoData(video, pageVideoData.get(video.videoId));
      const scored = scoreViralVideo(enriched);
      if (Number.isFinite(scored.ageHours) && scored.ageHours > recentDays * 24) continue;
      if (!scored.viewsUnknown && (scored.stats?.views || 0) < minViews) continue;
      if ((scored.stats?.likes || 0) < minLikes) continue;
      if (scored.promotionStatus === "excluded") continue;
      const previous = seen.get(key);
      if (!previous || scored.score > previous.score) seen.set(key, scored);
    }
    roundsCompleted = round + 1;
    if (globalThis.CommerceVideoTikTokViralScanStopRequested) break;
    scrollFeedForward();
    await delay(delayMs);
  }

  const videos = [...seen.values()].sort((left, right) => right.score - left.score).slice(0, clampInt(options.limit ?? 80, 1, 300));
  return {
    sourceUrl: location.href,
    scannedAt: new Date().toISOString(),
    roundsRequested,
    roundsCompleted,
    recentDays,
    minViews,
    stopped: Boolean(globalThis.CommerceVideoTikTokViralScanStopRequested),
    stats: {
      scannedRounds: roundsCompleted,
      scannedVideos: scannedKeys.size,
      qualifiedVideos: videos.length,
      confirmedPromotions: videos.filter((video) => video.promotionStatus === "confirmed").length,
      likelyPromotions: videos.filter((video) => video.promotionStatus === "likely").length,
      dissectedVideos: 0
    },
    videos
  };
}

function collectVisibleVideos() {
  const articles = Array.from(document.querySelectorAll("main article, article"));
  const videos = articles.map(extractVideoFromArticle).filter(Boolean);
  const pageVideos = collectVideosFromPageData();
  const currentVideo = extractCurrentVisibleVideo();
  return dedupeVideos([
    ...(currentVideo ? [currentVideo] : []),
    ...videos,
    ...pageVideos
  ]);
}

function dedupeVideos(videos) {
  const map = new Map();
  for (const video of videos) {
    if (!video) continue;
    const key = video.videoId || video.videoUrl;
    if (!key) continue;
    const previous = map.get(key);
    if (!previous || videoCompletenessScore(video) > videoCompletenessScore(previous)) {
      map.set(key, video);
    }
  }
  return [...map.values()];
}

function videoCompletenessScore(video) {
  return [
    video.videoUrl,
    video.authorHandle,
    video.caption,
    video.stats?.likes,
    video.stats?.comments,
    video.stats?.shares,
    video.stats?.saves,
    video.stats?.views
  ].filter(Boolean).length;
}

function extractCurrentVisibleVideo() {
  if (!isTikTokVideoHref(location.href)) return null;
  const videoId = extractVideoId(location.href);
  const authorHandle = normalizeHandle(location.href.match(/\/@([^/]+)\/video\//)?.[1] || "");
  const text = document.body?.innerText || "";
  const caption = extractCaptionFromVisibleText(text, authorHandle);
  const stats = extractStatsFromVisibleText(text);
  return {
    videoId,
    videoUrl: location.href.split("?")[0],
    authorHandle,
    authorProfileUrl: authorHandle ? `https://www.tiktok.com/@${authorHandle}` : undefined,
    caption,
    hashtags: [...caption.matchAll(/#[\p{L}\p{N}_]+/gu)].map((match) => match[0].toLowerCase()),
    stats,
    viewsUnknown: !stats.views,
    createTime: undefined,
    ageHours: undefined,
    durationSeconds: extractDurationSecondsFromText(text),
    engagementRate: 0,
    velocityScore: 0,
    promotionStatus: "uncertain",
    promotionReasons: [],
    creatorSignals: {
      bio: "",
      outboundLinks: [],
      recentProductVideoCount: 0,
      evidence: ["来自当前视频页可见文案兜底采集"]
    },
    discoveredAt: new Date().toISOString(),
    score: 0,
    matchedKeywords: []
  };
}

function extractVideoFromArticle(article) {
  const links = Array.from(article.querySelectorAll("a[href]"));
  const videoLink = links.find((link) => isTikTokVideoHref(link.getAttribute("href") || ""));
  const profileLink = links.find((link) => /^\/@[^/?#]+$/i.test(link.getAttribute("href") || ""));
  const caption = normalizeText(
    article.querySelector('[data-e2e="video-desc"], [data-e2e="browse-video-desc"]')?.textContent ||
    article.querySelector('[class*="DivVideoDescription"], [class*="StyledVideoDesc"]')?.textContent ||
    ""
  ) || fallbackCaption(article, "");
  const videoUrl = resolveArticleVideoUrl(article, videoLink, caption);
  const videoId = extractVideoId(videoUrl) || extractVideoIdFromText(article.innerHTML || article.textContent || "");
  if (!videoUrl && !videoId) return null;

  const authorHandle = normalizeHandle(
    videoUrl.match(/\/@([^/]+)\/video\//)?.[1] ||
    profileLink?.getAttribute("href")?.replace("/@", "") ||
    extractAuthorFromText(article.innerHTML || article.textContent || "") ||
    ""
  );
  const hashtags = [...caption.matchAll(/#[\p{L}\p{N}_]+/gu)].map((match) => match[0].toLowerCase());
  const stats = extractStats(article);
  const createTime = extractCreateTime(article);
  const resolvedUrl = videoUrl || buildTikTokVideoUrl(authorHandle, videoId);

  return {
    videoId,
    videoUrl: resolvedUrl,
    authorHandle,
    authorProfileUrl: authorHandle ? `https://www.tiktok.com/@${authorHandle}` : undefined,
    caption,
    hashtags,
    stats,
    viewsUnknown: !stats.views,
    createTime,
    ageHours: createTime ? hoursSince(createTime) : undefined,
    durationSeconds: extractDurationSeconds(article),
    engagementRate: 0,
    velocityScore: 0,
    promotionStatus: "uncertain",
    promotionReasons: [],
    creatorSignals: extractCreatorSignals(article),
    discoveredAt: new Date().toISOString(),
    score: 0,
    matchedKeywords: []
  };
}

function extractPageVideoData() {
  const map = new Map();
  for (const script of document.querySelectorAll('script[id="__UNIVERSAL_DATA_FOR_REHYDRATION__"], script[id="SIGI_STATE"]')) {
    const text = script.textContent || "";
    if (!text.trim()) continue;
    try {
      const data = JSON.parse(text);
      for (const video of extractUpdatedItemsVideoData(data)) {
        map.set(video.videoId, video);
      }
      walkJson(data, (node) => {
        const video = normalizeJsonVideoNode(node, "来自 TikTok 页面 JSON 兜底提取");
        if (video && !map.has(video.videoId)) {
          map.set(video.videoId, video);
        }
      });
    } catch {}
  }
  return map;
}

function extractUpdatedItemsVideoData(data) {
  const scope = data?.__DEFAULT_SCOPE__ || {};
  const updatedItems = scope["webapp.updated-items"];
  const items = Array.isArray(updatedItems) ? updatedItems : Object.values(updatedItems || {});
  return items
    .map((item) => normalizeJsonVideoNode(item, "来自 TikTok updated-items 数据"))
    .filter(Boolean);
}

function normalizeJsonVideoNode(node, evidence) {
  if (!isLikelyTikTokVideoNode(node)) return null;
  const id = String(node?.id || node?.awemeId || node?.itemId || "");
  const video = node?.video || {};
  const stats = node?.stats || node?.statsV2 || {};
  const createTime = normalizeCreateTime(node.createTime);
  const authorHandle = extractAuthorHandleFromJsonNode(node);
  const url = normalizeTikTokVideoUrl(node?.shareUrl || node?.url || "", authorHandle, id);
  return {
    videoId: id,
    videoUrl: url,
    authorHandle,
    caption: node.desc || node.description || "",
    createTime,
    durationSeconds: normalizeTikTokDurationSeconds(video.duration || node.duration || 0),
    stats: {
      views: parseCompactNumber(stats.playCount || stats.play || stats.views),
      likes: parseCompactNumber(stats.diggCount || stats.likes),
      comments: parseCompactNumber(stats.commentCount || stats.comments),
      shares: parseCompactNumber(stats.shareCount || stats.shares),
      saves: parseCompactNumber(stats.collectCount || stats.saveCount || stats.saves)
    },
    creatorSignals: { bio: "", outboundLinks: [], recentProductVideoCount: 0, evidence: [evidence] }
  };
}

function isLikelyTikTokVideoNode(node) {
  if (!node || typeof node !== "object" || Array.isArray(node)) return false;
  const id = String(node.id || node.awemeId || node.itemId || "");
  if (!/^\d{12,}$/.test(id)) return false;
  const video = node.video || {};
  const stats = node.stats || node.statsV2 || {};
  const authorHandle = extractAuthorHandleFromJsonNode(node);
  const hasVideoShape = Boolean(video.duration || video.cover || video.playAddr || node.duration);
  const hasStats = ["playCount", "play", "views", "diggCount", "likes", "commentCount", "comments", "shareCount", "shares", "collectCount", "saves"]
    .some((key) => stats[key] !== undefined && stats[key] !== null && stats[key] !== "");
  const hasText = Boolean(node.desc || node.description);
  const hasVideoUrl = isTikTokVideoHref(String(node.shareUrl || node.url || ""));
  return Boolean((authorHandle || hasVideoUrl) && (hasVideoShape || hasStats || hasVideoUrl || hasText));
}

function collectVideosFromPageData() {
  return [...extractPageVideoData().values()]
    .filter((video) => (video.videoUrl || video.videoId) && (video.authorHandle || isTikTokVideoHref(video.videoUrl)))
    .map((video) => ({
      videoId: video.videoId || extractVideoId(video.videoUrl),
      videoUrl: video.videoUrl || buildTikTokVideoUrl(video.authorHandle, video.videoId),
      authorHandle: video.authorHandle || "",
      authorProfileUrl: video.authorHandle ? `https://www.tiktok.com/@${video.authorHandle}` : undefined,
      caption: video.caption || "",
      hashtags: [...String(video.caption || "").matchAll(/#[\p{L}\p{N}_]+/gu)].map((match) => match[0].toLowerCase()),
      stats: video.stats || { likes: 0, comments: 0, shares: 0, saves: 0, views: 0 },
      viewsUnknown: !video.stats?.views,
      createTime: video.createTime,
      ageHours: video.createTime ? hoursSince(video.createTime) : undefined,
      durationSeconds: video.durationSeconds || 0,
      engagementRate: 0,
      velocityScore: 0,
      promotionStatus: "uncertain",
      promotionReasons: [],
      creatorSignals: { bio: "", outboundLinks: [], recentProductVideoCount: 0, evidence: ["来自页面 JSON 兜底提取"] },
      discoveredAt: new Date().toISOString(),
      score: 0,
      matchedKeywords: []
    }));
}

function mergeVideoData(video, detail) {
  if (!detail) return video;
  const stats = {
    likes: Math.max(video.stats?.likes || 0, detail.stats?.likes || 0),
    comments: Math.max(video.stats?.comments || 0, detail.stats?.comments || 0),
    shares: Math.max(video.stats?.shares || 0, detail.stats?.shares || 0),
    saves: Math.max(video.stats?.saves || 0, detail.stats?.saves || 0),
    views: Math.max(video.stats?.views || 0, detail.stats?.views || 0)
  };
  return {
    ...video,
    caption: video.caption || detail.caption || "",
    stats,
    viewsUnknown: video.viewsUnknown && !stats.views,
    createTime: video.createTime || detail.createTime,
    ageHours: video.ageHours ?? (detail.createTime ? hoursSince(detail.createTime) : undefined),
    durationSeconds: video.durationSeconds || detail.durationSeconds || 0
  };
}

function extractStats(article) {
  const text = article.innerText || "";
  const buttons = Array.from(article.querySelectorAll("button, strong, span, div"))
    .map((node) => normalizeText(node.getAttribute("aria-label") || node.textContent || ""))
    .filter(Boolean);
  const combined = buttons.join("\n") || text;
  return {
    likes: pickMetric(combined, ["like", "likes", "赞", "喜欢"]),
    comments: pickMetric(combined, ["comment", "comments", "评论"]),
    shares: pickMetric(combined, ["share", "shares", "分享"]),
    saves: pickMetric(combined, ["save", "saves", "收藏"]),
    views: pickMetric(combined, ["view", "views", "播放", "观看"])
  };
}

function extractCreateTime(article) {
  const timeNode = article.querySelector("time[datetime]");
  const datetime = timeNode?.getAttribute("datetime");
  if (datetime) {
    const date = new Date(datetime);
    if (Number.isFinite(date.getTime())) return date.toISOString();
  }
  return undefined;
}

function extractDurationSeconds(article) {
  const text = article.innerText || "";
  const match = text.match(/\b(\d{1,2}):(\d{2})\b/);
  if (!match) return 0;
  return Number(match[1]) * 60 + Number(match[2]);
}

function extractDurationSecondsFromText(text) {
  const match = String(text || "").match(/\b(\d{1,2}):(\d{2})\s*\/\s*(\d{1,2}):(\d{2})\b/) ||
    String(text || "").match(/\b(\d{1,2}):(\d{2})\b/);
  if (!match) return 0;
  const minute = Number(match[3] || match[1]);
  const second = Number(match[4] || match[2]);
  return minute * 60 + second;
}

function extractCaptionFromVisibleText(text, authorHandle) {
  const lines = String(text || "").split(/\n+/).map((line) => normalizeText(line)).filter(Boolean);
  const authorIndex = lines.findIndex((line) => normalizeHandle(line) === authorHandle);
  const start = authorIndex >= 0 ? authorIndex + 1 : 0;
  const stopWords = /^(更多|包含 AI 生成的素材|赞|评论|收藏|分享|猜你喜欢|推荐|探索|已关注|好友|直播|消息|上传|主页|查看全部|©|搜索)$/i;
  const picked = [];
  for (const line of lines.slice(start, start + 40)) {
    if (stopWords.test(line)) {
      if (picked.length) break;
      continue;
    }
    if (/^\d{1,2}:\d{2}\s*\/\s*\d{1,2}:\d{2}$/.test(line)) break;
    if (line === authorHandle || line === `@${authorHandle}`) continue;
    if (/^·/.test(line) || /^\d+\s*(分钟|小时|天)前$/.test(line) || /^\d{1,2}-\d{1,2}$/.test(line)) continue;
    if (/^(0|[\\d,.]+[KMB]?)$/i.test(line)) continue;
    picked.push(line);
  }
  return normalizeText(picked.join(" ")).slice(0, 320);
}

function extractStatsFromVisibleText(text) {
  const lines = String(text || "").split(/\n+/).map((line) => normalizeText(line)).filter(Boolean);
  const durationIndex = lines.findIndex((line) => /\b\d{1,2}:\d{2}\s*\/\s*\d{1,2}:\d{2}\b/.test(line));
  const metricLines = durationIndex >= 0 ? lines.slice(durationIndex + 1, durationIndex + 8) : lines;
  const numbers = metricLines
    .filter((line) => /^(\d+(?:[.,]\d+)?\s*[KMB]?|0)$/i.test(line))
    .map(parseCompactNumber);
  return {
    likes: numbers[0] || 0,
    comments: numbers[1] || 0,
    saves: numbers[2] || 0,
    shares: numbers[3] || 0,
    views: 0
  };
}

function pickMetric(text, labels) {
  const lines = String(text || "").split(/\n+/).map((line) => line.trim()).filter(Boolean);
  for (const line of lines) {
    const lower = line.toLowerCase();
    if (labels.some((label) => lower.includes(label.toLowerCase()))) {
      const number = line.match(/(\d+(?:[.,]\d+)?\s*[KMB]?)/i)?.[1];
      if (number) return parseCompactNumber(number);
    }
  }
  return 0;
}

function scoreViralVideo(video) {
  const text = `${video.caption || ""} ${(video.hashtags || []).join(" ")}`.toLowerCase();
  const keywords = [
    "amazon", "tiktok shop", "shop now", "link in bio", "must have", "need this", "gadget", "product",
    "神器", "好物", "必备", "亚马逊", "带货", "测评", "开箱", "购买", "链接",
    "fishing", "outdoor", "camping", "water", "hydration", "hair oil", "hairoil", "hairmask", "hair care", "haircare", "hairtok", "hairspa", "wig", "grodom", "tiktokshopdeals",
    "钓鱼", "户外", "露营", "水", "补水", "护发", "发膜", "假发", "生发", "美发"
  ];
  const matchedKeywords = keywords.filter((keyword) => text.includes(keyword.toLowerCase()));
  const stats = video.stats || {};
  const engagement = stats.likes + stats.comments * 6 + stats.shares * 10 + stats.saves * 8;
  const views = stats.views || 0;
  const viewsUnknown = Boolean(video.viewsUnknown || !views);
  const engagementRate = views > 0 ? engagement / Math.max(views, 1) : 0;
  const ageHours = Number.isFinite(video.ageHours) ? Math.max(video.ageHours, 1) : 168;
  const velocityScore = views > 0 ? Math.log10(views / ageHours + 10) / 7 : 0.08;
  const heatScore = Math.log10(views + engagement + 10) / 8;
  const engagementScore = Math.min(0.25, engagementRate * 4);
  const recencyScore = Number.isFinite(video.ageHours) ? Math.max(0, Math.min(0.18, (168 - Math.min(ageHours, 168)) / 168 * 0.18)) : 0.03;
  const keywordBoost = Math.min(0.18, matchedKeywords.length * 0.035);
  const hookBoost = /must|need|stop|secret|hack|problem|solution|amazon|tiktok shop|hair|grodom|神器|必备|别再|痛点|解决|场景|户外|钓鱼|护发|发膜|假发/i.test(text) ? 0.12 : 0;
  const promotion = classifyPromotionSignals(video);
  return {
    ...video,
    ...promotion,
    viewsUnknown,
    engagementRate: Number(engagementRate.toFixed(6)),
    velocityScore: Number(velocityScore.toFixed(4)),
    matchedKeywords: [...new Set(matchedKeywords)],
    score: Number(Math.min(1, heatScore * 0.42 + velocityScore * 0.28 + engagementScore + recencyScore + keywordBoost + hookBoost).toFixed(4))
  };
}

function classifyPromotionSignals(video) {
  const creatorSignals = normalizeCreatorSignals(video.creatorSignals);
  const text = `${video.caption || ""} ${(video.hashtags || []).join(" ")} ${creatorSignals.bio} ${creatorSignals.outboundLinks.join(" ")} ${creatorSignals.evidence.join(" ")}`.toLowerCase();
  const reasons = [];
  const hasDirectShopSignal = /tiktok shop|tiktokshopdeals|shop now|buy now|link in bio|amazon|amazon finds|amazon storefront|where to buy|coupon|discount code|promo code|affiliate|storefront|shop my|购买|链接|下单|折扣|优惠码|小黄车|橱窗|店铺/.test(text);
  const hasProductLanguage = /product|gadget|must have|need this|review|unboxing|demo|before and after|problem|solution|saves|water bottle|fishing|outdoor|hair oil|hairoil|hairmask|hair care|haircare|hairtok|hairspa|damagedhair|hairtreatment|hairgrowth|shampoo|wig|grodom|beauty salon|over50|产品|好物|神器|测评|开箱|使用|痛点|解决|场景|户外|钓鱼|水杯|护发|发膜|假发|生发|美发|洗发/.test(text);
  const hasHookStructure = /stop scrolling|wait|watch this|this is why|before you|don't buy|do not buy|i found|secret|hack|problem|solution|simple fix|ruined|struggle|try this|别划走|等等|原来|难怪|别再|不要买|先别买|我发现|秘诀|诀窍|痛点|解决|试试|救星|翻车|踩坑/.test(text);
  const hasSceneRemakeFrame = /rain|underwater|water|world|stays calm|peaceful|special permission|filmed|aquarium|garden|kitchen|home|outdoor|camping|fishing|scene|use case|before rain|after rain|雨|水下|水里|水族|鱼缸|花园|厨房|家里|户外|露营|钓鱼|场景|实拍|许可|拍摄|使用场景/.test(text);
  const hasProfileCommerce = creatorSignals.outboundLinks.some((link) => /amazon|shopify|tiktok|linktr|beacons|stan\.store|shop|store|bio/i.test(link)) ||
    /amazon|storefront|affiliate|shop|discount|coupon|link in bio|店铺|橱窗|好物|带货|优惠码/i.test(creatorSignals.bio);
  const hasRepeatedProductPosts = (creatorSignals.recentProductVideoCount || 0) >= 2;

  if (hasDirectShopSignal) reasons.push("视频或主页含购买/店铺/链接信号");
  if (hasProductLanguage) reasons.push("视频文案围绕产品、测评、使用场景或痛点解决");
  if (hasHookStructure) reasons.push("短引结构明显，适合作为复刻框架候选");
  if (hasSceneRemakeFrame) reasons.push("场景画面或视觉框架明显，适合作为带货复刻参考");
  if (hasProfileCommerce) reasons.push("主页公开信息含店铺、联盟或购买入口");
  if (hasRepeatedProductPosts) reasons.push("主页近期多条内容疑似产品推广");

  let promotionStatus = "uncertain";
  if (hasDirectShopSignal && (hasProductLanguage || hasProfileCommerce || hasRepeatedProductPosts)) {
    promotionStatus = "confirmed";
  } else if (hasProductLanguage || hasProfileCommerce || hasRepeatedProductPosts || hasHookStructure || hasSceneRemakeFrame) {
    promotionStatus = "likely";
  } else if (/dance|funny|meme|prank|storytime|vlog|comedy|跳舞|搞笑|剧情|日常|街拍/.test(text)) {
    promotionStatus = "excluded";
    reasons.push("内容更像娱乐/日常，缺少产品推广结构");
  } else {
    reasons.push("没有明确带货信号");
  }

  return { promotionStatus, promotionReasons: reasons, creatorSignals };
}

function extractCreatorSignals(article) {
  const text = article.innerText || "";
  const links = Array.from(article.querySelectorAll("a[href]"))
    .map((link) => absolutize(link.getAttribute("href") || ""))
    .filter((href) => /amazon|shopify|linktr|beacons|stan\.store|shop|store/i.test(href))
    .slice(0, 5);
  const evidence = [];
  if (/link in bio|amazon|tiktok shop|shop now|buy now|discount|coupon|affiliate|storefront|购买|链接|下单|折扣|优惠码|小黄车|橱窗|店铺/i.test(text)) {
    evidence.push("当前视频卡片含购买或店铺相关词");
  }
  return {
    bio: "",
    outboundLinks: links,
    recentProductVideoCount: 0,
    evidence
  };
}

function normalizeCreatorSignals(value = {}) {
  return {
    bio: value.bio || "",
    outboundLinks: value.outboundLinks || [],
    followerCount: value.followerCount,
    recentProductVideoCount: value.recentProductVideoCount || 0,
    evidence: value.evidence || []
  };
}

function walkJson(value, visit, seen = new Set()) {
  if (!value || typeof value !== "object" || seen.has(value)) return;
  seen.add(value);
  visit(value);
  if (Array.isArray(value)) {
    value.forEach((item) => walkJson(item, visit, seen));
    return;
  }
  Object.values(value).forEach((item) => walkJson(item, visit, seen));
}

function normalizeCreateTime(value) {
  if (!value) return undefined;
  if (typeof value === "number") {
    const date = new Date(value > 10_000_000_000 ? value : value * 1000);
    return Number.isFinite(date.getTime()) ? date.toISOString() : undefined;
  }
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? date.toISOString() : undefined;
}

function hoursSince(iso) {
  const time = new Date(iso).getTime();
  if (!Number.isFinite(time)) return undefined;
  return Number(Math.max(0, (Date.now() - time) / 3_600_000).toFixed(2));
}

async function waitForArticles() {
  const deadline = Date.now() + 10000;
  while (Date.now() < deadline) {
    if (document.querySelector("main article, article")) return;
    await delay(300);
  }
  throw new Error("没有找到 TikTok 推荐流视频卡片");
}

function scrollFeedForward() {
  const articles = Array.from(document.querySelectorAll("main article, article"));
  const current = getMostVisibleArticle(articles);
  const target = current ? articles[articles.indexOf(current) + 1] : null;
  if (target) {
    target.scrollIntoView({ behavior: "smooth", block: "start" });
    return;
  }
  window.scrollBy({ top: Math.max(window.innerHeight * 0.92, 720), behavior: "smooth" });
}

function getMostVisibleArticle(articles) {
  let best = articles[0] || null;
  let bestRatio = -1;
  for (const article of articles) {
    const rect = article.getBoundingClientRect();
    const visible = Math.max(0, Math.min(window.innerHeight, rect.bottom) - Math.max(0, rect.top));
    const ratio = visible / Math.max(rect.height || 1, 1);
    if (ratio > bestRatio) {
      best = article;
      bestRatio = ratio;
    }
  }
  return best;
}

function fallbackCaption(article, authorHandle) {
  let text = normalizeText(article.innerText || article.textContent || "");
  if (authorHandle) text = text.replace(new RegExp(`@?${escapeRegExp(authorHandle)}`, "ig"), " ");
  return normalizeText(text).slice(0, 260);
}

function resolveArticleVideoUrl(article, videoLink, caption) {
  const candidates = [
    videoLink?.getAttribute("href") || "",
    article.getAttribute("href") || "",
    article.querySelector("a[href*='/video/']")?.getAttribute("href") || "",
    document.querySelector("link[rel='canonical']")?.getAttribute("href") || "",
    isTikTokVideoHref(location.href) ? location.href : ""
  ];
  const html = `${article.innerHTML || ""} ${caption || ""}`;
  const embedded = html.match(/https?:\\?\/\\?\/www\.tiktok\.com\\?\/@[^"'\\\s]+\\?\/video\\?\/\d+/i)?.[0] ||
    html.match(/\/@[^"'\\\s]+\/video\/\d+/i)?.[0] || "";
  if (embedded) candidates.push(embedded.replace(/\\\//g, "/"));
  for (const candidate of candidates) {
    const absolute = absolutize(candidate);
    if (isTikTokVideoHref(absolute)) return absolute;
  }
  return "";
}

function isTikTokVideoHref(href) {
  return /(?:^https?:\/\/(?:www\.)?tiktok\.com)?\/@[^/]+\/video\/\d+/i.test(String(href || ""));
}

function buildTikTokVideoUrl(authorHandle, videoId) {
  if (!videoId) return "";
  const author = normalizeHandle(authorHandle);
  return author ? `https://www.tiktok.com/@${author}/video/${videoId}` : `https://www.tiktok.com/video/${videoId}`;
}

function normalizeTikTokVideoUrl(candidate, authorHandle, videoId) {
  const absolute = absolutize(candidate);
  if (isTikTokVideoHref(absolute)) return absolute;
  return buildTikTokVideoUrl(authorHandle, videoId);
}

function extractVideoIdFromText(value) {
  const text = String(value || "");
  return text.match(/\/video\/(\d+)/)?.[1] ||
    text.match(/"id"\s*:\s*"(\d{8,})"/)?.[1] ||
    text.match(/"awemeId"\s*:\s*"(\d{8,})"/)?.[1] ||
    "";
}

function extractAuthorFromText(value) {
  const text = String(value || "");
  return normalizeHandle(text.match(/\/@([^/"'?\s]+)/)?.[1] || text.match(/"uniqueId"\s*:\s*"([^"]+)"/)?.[1] || "");
}

function extractAuthorHandleFromJsonNode(node) {
  return normalizeHandle(
    node?.author?.uniqueId ||
    node?.author?.uniqueID ||
    node?.author?.secUid && "" ||
    node?.authorStats?.uniqueId ||
    node?.authorStats?.uniqueID ||
    node?.authorInfo?.uniqueId ||
    node?.authorInfo?.uniqueID ||
    ""
  );
}

function parseCompactNumber(input) {
  if (typeof input === "number" && Number.isFinite(input)) return Math.max(0, Math.round(input));
  const value = String(input || "").trim().replace(/,/g, "").toUpperCase();
  const match = value.match(/(\d+(?:\.\d+)?)([KMB])?/);
  if (!match) return 0;
  const multiplier = { K: 1_000, M: 1_000_000, B: 1_000_000_000 }[match[2] || ""] || 1;
  return Math.round(Number(match[1]) * multiplier);
}

function normalizeTikTokDurationSeconds(value) {
  const number = Number(value || 0);
  if (!Number.isFinite(number) || number <= 0) return 0;
  if (number >= 10000) return Math.max(1, Math.round(number / 1000));
  if (number >= 1000 && number <= 10000) {
    if (number % 1000 === 0 && number / 1000 <= 60) {
      return Math.max(1, Math.round(number / 1000));
    }
    if (number % 500 === 0 && number % 60 !== 0 && number / 1000 <= 60) {
      return Math.max(1, Math.round(number / 1000));
    }
  }
  return Math.round(number);
}

function extractVideoId(url) {
  return String(url || "").match(/\/video\/(\d+)/)?.[1] || "";
}

function normalizeHandle(value) {
  return String(value || "").replace(/^@/, "").trim().toLowerCase();
}

function normalizeText(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function absolutize(href) {
  if (!href) return "";
  try {
    return new URL(href, location.origin).toString();
  } catch {
    return "";
  }
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function clampInt(value, min, max) {
  const number = Number(value);
  if (!Number.isFinite(number)) return min;
  return Math.max(min, Math.min(max, Math.round(number)));
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
