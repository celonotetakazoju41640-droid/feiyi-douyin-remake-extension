export function parseCompactNumber(input) {
  if (typeof input === "number" && Number.isFinite(input)) return Math.max(0, Math.round(input));
  const value = String(input || "").trim().replace(/,/g, "").toUpperCase();
  if (!value) return 0;
  const match = value.match(/(\d+(?:\.\d+)?)([KMB])?/);
  if (!match) return 0;
  const multiplier = { K: 1_000, M: 1_000_000, B: 1_000_000_000 }[match[2] || ""] || 1;
  return Math.round(Number(match[1]) * multiplier);
}

export function normalizeHandle(value) {
  return String(value || "").replace(/^@/, "").trim().toLowerCase();
}

export function extractVideoId(url) {
  return String(url || "").match(/\/video\/(\d+)/)?.[1] || "";
}

export function scoreViralVideo(video, keywordGroups = defaultKeywordGroups) {
  const text = `${video.caption || ""} ${(video.hashtags || []).join(" ")}`.toLowerCase();
  const matchedKeywords = [];
  for (const keyword of keywordGroups.flat()) {
    if (text.includes(keyword.toLowerCase())) matchedKeywords.push(keyword);
  }

  const stats = video.stats || {};
  const engagement = stats.likes + stats.comments * 6 + stats.shares * 10 + stats.saves * 8 + stats.views * 0.02;
  const commerceBoost = matchedKeywords.length ? Math.min(0.35, matchedKeywords.length * 0.055) : 0;
  const hookBoost = /must|need|stop|secret|hack|problem|solution|amazon|tiktok shop|神器|必备|别再|痛点|解决|场景|户外|钓鱼/i.test(text) ? 0.12 : 0;
  const score = Math.log10(engagement + 10) / 7 + commerceBoost + hookBoost;
  const promotion = classifyPromotionSignals(video);
  return {
    ...video,
    ...promotion,
    matchedKeywords: [...new Set(matchedKeywords)],
    score: Number(Math.min(1, score).toFixed(4))
  };
}

export function classifyPromotionSignals(video) {
  const creatorSignals = normalizeCreatorSignals(video.creatorSignals);
  const text = `${video.caption || ""} ${(video.hashtags || []).join(" ")} ${creatorSignals.bio} ${creatorSignals.outboundLinks.join(" ")} ${creatorSignals.evidence.join(" ")}`.toLowerCase();
  const promotionReasons = [];
  const hasDirectShopSignal = /tiktok shop|shop now|buy now|link in bio|amazon|amazon finds|amazon storefront|where to buy|coupon|discount code|promo code|affiliate|storefront|shop my|购买|链接|下单|折扣|优惠码|小黄车|橱窗|店铺/.test(text);
  const hasProductLanguage = /product|gadget|must have|need this|review|unboxing|demo|before and after|problem|solution|saves|water bottle|fishing|outdoor|产品|好物|神器|测评|开箱|使用|痛点|解决|场景|户外|钓鱼|水杯/.test(text);
  const hasHookStructure = /stop scrolling|wait|watch this|this is why|before you|don't buy|do not buy|i found|secret|hack|problem|solution|simple fix|ruined|struggle|try this|别划走|等等|原来|难怪|别再|不要买|先别买|我发现|秘诀|诀窍|痛点|解决|试试|救星|翻车|踩坑/.test(text);
  const hasProfileCommerce = creatorSignals.outboundLinks.some((link) => /amazon|shopify|tiktok|linktr|beacons|stan\.store|shop|store|bio/i.test(link)) ||
    /amazon|storefront|affiliate|shop|discount|coupon|link in bio|店铺|橱窗|好物|带货|优惠码/i.test(creatorSignals.bio);
  const hasRepeatedProductPosts = (creatorSignals.recentProductVideoCount || 0) >= 2;

  if (hasDirectShopSignal) promotionReasons.push("视频或主页含购买/店铺/链接信号");
  if (hasProductLanguage) promotionReasons.push("视频文案围绕产品、测评、使用场景或痛点解决");
  if (hasHookStructure) promotionReasons.push("短引结构明显，适合作为复刻框架候选");
  if (hasProfileCommerce) promotionReasons.push("主页公开信息含店铺、联盟或购买入口");
  if (hasRepeatedProductPosts) promotionReasons.push("主页近期多条内容疑似产品推广");

  let promotionStatus = "uncertain";
  if (hasDirectShopSignal && (hasProductLanguage || hasProfileCommerce || hasRepeatedProductPosts)) {
    promotionStatus = "confirmed";
  } else if (hasProductLanguage || hasProfileCommerce || hasRepeatedProductPosts || hasHookStructure) {
    promotionStatus = "likely";
  } else if (/dance|funny|meme|prank|storytime|vlog|comedy|跳舞|搞笑|剧情|日常|街拍/.test(text)) {
    promotionStatus = "excluded";
    promotionReasons.push("内容更像娱乐/日常，缺少产品推广结构");
  } else {
    promotionReasons.push("没有明确带货信号");
  }

  return { promotionStatus, promotionReasons, creatorSignals };
}

export function filterQualifiedVideos(videos, options = {}) {
  const recentDays = options.recentDays ?? 7;
  const minViews = options.minViews ?? 0;
  const minLikes = options.minLikes ?? 0;
  return videos
    .map((video) => ({ ...video, ...classifyPromotionSignals(video) }))
    .filter((video) => {
      if ((video.stats?.views || 0) < minViews) return false;
      if ((video.stats?.likes || 0) < minLikes) return false;
      if (Number.isFinite(video.ageHours) && video.ageHours > recentDays * 24) return false;
      return video.promotionStatus !== "excluded";
    });
}

export const defaultKeywordGroups = [
  ["amazon", "tiktok shop", "shop now", "link in bio", "must have", "need this", "gadget", "product"],
  ["神器", "好物", "必备", "亚马逊", "带货", "测评", "开箱", "购买", "链接"],
  ["fishing", "outdoor", "camping", "water", "hydration", "钓鱼", "户外", "露营", "水", "补水"]
];

export function dedupeAndRankVideos(videos) {
  const map = new Map();
  for (const rawVideo of videos) {
    if (!rawVideo?.videoUrl) continue;
    const key = rawVideo.videoId || rawVideo.videoUrl;
    const video = scoreViralVideo(rawVideo);
    const previous = map.get(key);
    if (!previous || video.score > previous.score) {
      map.set(key, video);
    }
  }
  return [...map.values()].sort((left, right) => right.score - left.score);
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
