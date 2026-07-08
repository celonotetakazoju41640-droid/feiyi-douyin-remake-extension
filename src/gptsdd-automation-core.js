import { gptsddImagePageUrl } from "./extension-config.js";

export { gptsddImagePageUrl };

export function classifyGptsddPageText(text) {
  const normalized = String(text || "").replace(/\s+/g, "");
  const blockedPhrases = [
    ["图像/视频生成功能未授权", "GPTSDD 当前账号没有图像/视频生成授权"],
    ["功能未授权", "GPTSDD 当前账号没有图像/视频生成授权"],
    ["请联系管理员购买授权", "GPTSDD 当前账号没有图像/视频生成授权"],
    ["未订阅", "GPTSDD 当前账号未订阅可用套餐"],
    ["暂无可用模型", "GPTSDD 当前页面没有可用模型"],
    ["用户登录", "GPTSDD 需要先登录"],
    ["账号登录", "GPTSDD 需要先登录"],
    ["登录注册", "GPTSDD 需要先登录"],
    ["请先登录", "GPTSDD 需要先登录"],
    ["验证码", "GPTSDD 出现验证码，需要人工处理"],
    ["人机验证", "GPTSDD 出现人机验证，需要人工处理"],
    ["风控", "GPTSDD 出现风控提示，需要人工处理"]
  ];

  for (const [phrase, error] of blockedPhrases) {
    if (normalized.includes(phrase)) {
      return { ok: false, error };
    }
  }
  return { ok: true };
}

export function isGptsddGenerationErrorText(text) {
  const normalized = String(text || "").replace(/\s+/g, "");
  return [
    "生成失败",
    "请求失败",
    "网络错误",
    "未授权",
    "暂无可用模型",
    "请选择模型",
    "请输入提示词",
    "余额不足",
    "次数不足",
    "额度不足",
    "验证码",
    "人机验证",
    "风控"
  ].some((phrase) => normalized.includes(phrase));
}

export function isLikelyResultImageSrc(src) {
  const value = String(src || "");
  if (!value) return false;
  if (value.startsWith("data:image/")) return true;
  if (!/^https?:\/\//i.test(value) && !value.startsWith("blob:")) return false;
  return ![
    "avatar",
    "logo",
    "icon",
    "favicon",
    "emoji",
    "placeholder",
    "default"
  ].some((part) => value.toLowerCase().includes(part));
}

export function buildGptsddDownloadFilename(productName = "") {
  const safeName = String(productName || "storyboard")
    .trim()
    .replace(/[\\/:*?"<>|#%&{}$!'@+`=]/g, "-")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80)
    .replace(/^-|-$/g, "") || "storyboard";
  return `commerce-video-storyboards/${safeName}-${Date.now()}.png`;
}
