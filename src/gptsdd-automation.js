const automationFlag = "CommerceVideoGptsddAutomationInstalled";

if (!globalThis[automationFlag]) {
  globalThis[automationFlag] = true;

  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message?.type !== "GPTSDD_RUN_IMAGE") return false;

    runGptsddImage(message)
      .then((result) => sendResponse({ ok: true, ...result }))
      .catch((error) => {
        sendResponse({
          ok: false,
          error: error instanceof Error ? error.message : String(error)
        });
      });
    return true;
  });
}

async function runGptsddImage({ prompt, productName = "" }) {
  if (!prompt || String(prompt).trim().length < 20) {
    throw new Error("提示词为空，先拆解复刻生成项目再自动跑 GPTSDD");
  }

  if (!location.href.includes("vip.gptsdd.com/user/")) {
    throw new Error("当前不是 GPTSDD 用户页");
  }

  if (!location.hash.includes("/image-video")) {
    location.hash = "/image-video";
    await delay(1200);
  }

  await waitForDomReady();
  await waitFor(
    () => findPromptInput() || classifyGptsddPageText(document.body?.innerText || "").error,
    45000,
    "GPTSDD 页面没有加载出提示词输入框"
  );

  const pageState = classifyGptsddPageText(document.body?.innerText || "");
  if (!pageState.ok) {
    throw new Error(pageState.error);
  }

  const input = findPromptInput();
  if (!input) {
    throw new Error("没有找到 GPTSDD 提示词输入框");
  }

  input.scrollIntoView({ block: "center", inline: "nearest" });
  input.focus();
  setNativeValue(input, prompt);
  await delay(200);

  clickButtonByText("9:16");
  await delay(200);

  const beforeSrcSet = new Set(collectResultImages().map((img) => img.src));
  const generateButton = findGenerateButton();
  if (!generateButton) {
    throw new Error("没有找到 GPTSDD 的“生成图片”按钮");
  }

  generateButton.scrollIntoView({ block: "center", inline: "nearest" });
  await delay(150);
  generateButton.click();

  const result = await waitForImageResult(beforeSrcSet, 8 * 60 * 1000);
  const filename = buildDownloadFilename(productName);
  const download = await requestDownload(result.src, filename);

  return {
    status: "completed",
    downloaded: download.downloaded,
    filename,
    imageSrcKind: result.kind,
    message: download.downloaded ? "GPTSDD 已生成，下载已开始" : "GPTSDD 已生成，但下载未自动开始"
  };
}

function findPromptInput() {
  const selectors = [
    "textarea.iv-prompt-input",
    ".iv-prompt-input textarea",
    "textarea[placeholder*='描述']",
    "textarea[placeholder*='提示']",
    "textarea[placeholder*='prompt' i]",
    "textarea"
  ];
  for (const selector of selectors) {
    const node = document.querySelector(selector);
    if (isVisible(node) && !node.disabled) return node;
  }
  return null;
}

function findGenerateButton() {
  const byClass = document.querySelector("button.iv-gen-btn");
  if (isClickableButton(byClass) && !buttonText(byClass).includes("视频")) return byClass;
  return findButtonByText("生成图片");
}

function findButtonByText(text) {
  const buttons = Array.from(document.querySelectorAll("button, [role='button']"));
  return buttons.find((button) => isClickableButton(button) && buttonText(button).includes(text)) || null;
}

function clickButtonByText(text) {
  const button = findButtonByText(text);
  if (!button) return false;
  button.click();
  return true;
}

function collectResultImages() {
  const scoped = Array.from(document.querySelectorAll(
    ".iv-canvas img, .iv-result img, .image-video img, .el-image img, img"
  ));
  return scoped
    .filter((img) => isVisible(img) && isLikelyResultImageSrc(img.currentSrc || img.src))
    .map((img) => ({
      element: img,
      src: img.currentSrc || img.src,
      area: (img.naturalWidth || img.width || 0) * (img.naturalHeight || img.height || 0)
    }))
    .sort((a, b) => b.area - a.area);
}

function classifyGptsddPageText(text) {
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

function isGptsddGenerationErrorText(text) {
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

function isLikelyResultImageSrc(src) {
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

async function waitForImageResult(beforeSrcSet, timeoutMs) {
  const startedAt = Date.now();
  let lastErrorText = "";

  while (Date.now() - startedAt < timeoutMs) {
    const bodyText = document.body?.innerText || "";
    const pageState = classifyGptsddPageText(bodyText);
    if (!pageState.ok) {
      throw new Error(pageState.error);
    }
    if (isGptsddGenerationErrorText(bodyText)) {
      lastErrorText = compactText(bodyText).slice(0, 180);
      if (!isGenerating()) {
        throw new Error(`GPTSDD 生成失败：${lastErrorText}`);
      }
    }

    const image = collectResultImages().find((candidate) => !beforeSrcSet.has(candidate.src));
    if (image?.src && image.area >= 120 * 120 && !isGenerating()) {
      return {
        src: image.src,
        kind: image.src.startsWith("data:image/") ? "data" : image.src.startsWith("blob:") ? "blob" : "url"
      };
    }

    await delay(1500);
  }

  throw new Error(lastErrorText ? `GPTSDD 等待超时：${lastErrorText}` : "GPTSDD 等待生成结果超时");
}

function isGenerating() {
  const text = compactText(document.body?.innerText || "");
  return text.includes("生成中") || text.includes("排队") || text.includes("任务进行") || text.includes("正在生成");
}

async function requestDownload(src, filename) {
  const response = await chrome.runtime.sendMessage({
    type: "GPTSDD_DOWNLOAD_IMAGE",
    src,
    filename
  });
  if (response?.ok) {
    return { downloaded: true };
  }

  try {
    const anchor = document.createElement("a");
    anchor.href = src;
    anchor.download = filename.split("/").pop() || "gptsdd-storyboard.png";
    anchor.rel = "noopener";
    document.body.append(anchor);
    anchor.click();
    anchor.remove();
    return { downloaded: true };
  } catch {
    return { downloaded: false };
  }
}

function setNativeValue(element, value) {
  const prototype = element instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
  const descriptor = Object.getOwnPropertyDescriptor(prototype, "value");
  descriptor?.set?.call(element, value);
  element.dispatchEvent(new Event("input", { bubbles: true }));
  element.dispatchEvent(new Event("change", { bubbles: true }));
}

function isClickableButton(node) {
  return isVisible(node) && !node.disabled && node.getAttribute("aria-disabled") !== "true";
}

function buttonText(node) {
  return node ? String(node.innerText || node.textContent || "").replace(/\s+/g, "") : "";
}

function isVisible(node) {
  if (!node) return false;
  const rect = node.getBoundingClientRect();
  const style = getComputedStyle(node);
  return rect.width > 0 && rect.height > 0 && style.visibility !== "hidden" && style.display !== "none";
}

function buildDownloadFilename(productName) {
  const safeName = String(productName || "storyboard")
    .trim()
    .replace(/[\\/:*?"<>|#%&{}$!'@+`=]/g, "-")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80)
    .replace(/^-|-$/g, "") || "storyboard";
  return `commerce-video-storyboards/${safeName}-${Date.now()}.png`;
}

function compactText(text) {
  return String(text || "").replace(/\s+/g, " ").trim();
}

function waitForDomReady() {
  if (document.readyState === "complete" || document.readyState === "interactive") {
    return Promise.resolve();
  }
  return new Promise((resolve) => document.addEventListener("DOMContentLoaded", resolve, { once: true }));
}

async function waitFor(check, timeoutMs, timeoutMessage) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    const result = check();
    if (result) return result;
    await delay(300);
  }
  throw new Error(timeoutMessage);
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
