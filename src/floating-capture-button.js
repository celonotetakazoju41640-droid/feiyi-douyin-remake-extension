function installFloatingCaptureButton({ document, capturePage, postCapture, saveCapture, scanViralVideos, postViralScan }) {
  const existing = document.getElementById("commerce-video-capture-host");
  if (existing?.commerceVideoCaptureUi) {
    return existing.commerceVideoCaptureUi;
  }

  const host = document.createElement("div");
  host.id = "commerce-video-capture-host";
  Object.assign(host.style, {
    position: "fixed",
    top: "auto",
    right: "88px",
    bottom: "148px",
    zIndex: "2147483647"
  });

  const shadow = host.attachShadow({ mode: "open" });
  const style = document.createElement("style");
  style.textContent = `
    .wrap {
      display: grid;
      gap: 8px;
      justify-items: end;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }
    .logo {
      display: grid;
      place-items: center;
      width: 54px;
      height: 54px;
      min-width: 54px;
      min-height: 54px;
      border: 0;
      border-radius: 999px;
      padding: 0;
      background: transparent !important;
      color: transparent;
      box-shadow: none !important;
      cursor: pointer;
      font-size: 0;
      font-weight: 0;
      letter-spacing: 0;
      overflow: hidden;
    }
    .logo:hover,
    .logo:focus,
    .logo:active {
      background: transparent !important;
      box-shadow: none !important;
      outline: 0;
    }
    .logo img {
      width: 100%;
      height: 100%;
      object-fit: contain;
      display: block;
    }
    .panel {
      display: none;
      gap: 6px;
      justify-items: end;
    }
    .panel.is-open {
      display: grid;
    }
    .remake {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 116px;
      min-height: 42px;
      border: 1px solid rgba(255, 11, 129, 0.35);
      border-radius: 12px;
      padding: 0 15px;
      background: linear-gradient(90deg, #ff0b81 0%, #c348ff 100%);
      color: #fff;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.42);
      cursor: pointer;
      font-size: 14px;
      font-weight: 900;
      letter-spacing: 0;
    }
    .remake:hover {
      transform: scale(1.02);
      box-shadow: 0 12px 28px rgba(195, 72, 255, 0.38);
    }
    button {
      min-width: 106px;
      min-height: 42px;
      border: 0;
      border-radius: 999px;
      padding: 0 14px;
      background: #1f6feb;
      color: white;
      box-shadow: 0 8px 24px rgba(15, 23, 42, 0.28);
      cursor: pointer;
      font-size: 14px;
      font-weight: 700;
      letter-spacing: 0;
    }
    button:hover { background: #175bcc; }
    button:disabled {
      background: #8b98aa;
      cursor: wait;
    }
    .status {
      max-width: 190px;
      border-radius: 8px;
      padding: 6px 8px;
      background: rgba(17, 24, 39, 0.92);
      color: #d1fae5;
      font-size: 12px;
      line-height: 1.35;
      text-align: right;
      opacity: 0;
      transform: translateY(-2px);
      transition: opacity 0.16s ease, transform 0.16s ease;
      pointer-events: none;
    }
    .status.is-visible {
      opacity: 1;
      transform: translateY(0);
    }
    .status.is-error { color: #fecaca; }
  `;

  const wrap = document.createElement("div");
  wrap.classList.add("wrap");
  const logo = document.createElement("button");
  logo.type = "button";
  logo.className = "logo";
  const logoImage = document.createElement("img");
  logoImage.alt = "飞蚁";
  logoImage.src = safeRuntimeUrl("images/feiyi-logo.png");
  logo.append(logoImage);
  const panel = document.createElement("div");
  panel.classList.add("panel");
  const remakeButton = document.createElement("button");
  remakeButton.type = "button";
  remakeButton.className = "remake";
  remakeButton.textContent = "飞蚁复刻";
  const status = document.createElement("div");
  status.classList.add("status");
  status.textContent = "打开当前参考视频的插件复刻工作台";
  panel.append(status);
  wrap.append(logo, remakeButton, panel);
  shadow.append(style, wrap);
  document.documentElement.append(host);

  logo.addEventListener("click", async () => {
    try {
      const response = await globalThis.chrome?.runtime?.sendMessage?.({ type: "OPEN_CAPTURE_UI" });
      if (response?.ok) {
        return;
      }
      throw new Error(response?.error || "打开采集界面失败");
    } catch (error) {
      panel.classList.add("is-open");
      showStatus(status, "请点浏览器右上角飞蚁图标打开采集界面", true);
    }
  });

  remakeButton.addEventListener("click", async () => {
    const capture = findCurrentTikTokVideoCapture(document, globalThis.location?.href || "");
    if (!capture.videoUrl) {
      panel.classList.add("is-open");
      showStatus(status, "没采集到当前参考视频", true);
      return;
    }
    const targetUrl = buildWorkspaceUrl(capture);
    try {
      const response = await globalThis.chrome?.runtime?.sendMessage?.({ type: "OPEN_REMAKE_WORKSPACE", url: targetUrl });
      if (!response?.ok) {
        throw new Error(response?.error || "打开复刻工作台失败");
      }
      showStatus(status, "已采集并打开插件复刻工作台");
    } catch (error) {
      panel.classList.add("is-open");
      showStatus(status, "插件上下文已失效，请在扩展管理页重新加载插件，然后刷新当前 TikTok 页面", true);
    }
  });

  const ui = { host, wrap, logo, panel, remakeButton, status, style };
  host.commerceVideoCaptureUi = ui;
  return ui;
}

function findCurrentTikTokVideoUrl(document, locationHref) {
  return findCurrentTikTokVideoCapture(document, locationHref).videoUrl;
}

function findCurrentTikTokVideoCapture(document, locationHref) {
  const candidates = [
    locationHref,
    getElementUrl(document, 'link[rel="canonical"]', "href"),
    getElementUrl(document, 'meta[property="og:url"]', "content"),
    getElementUrl(document, 'meta[name="twitter:url"]', "content"),
    ...getAnchorVideoUrls(document)
  ];
  for (const candidate of candidates) {
    const videoUrl = normalizeTikTokVideoUrl(candidate);
    if (videoUrl) return { videoUrl, source: "link" };
  }
  return getVisibleFeedVideoCapture(document);
}

function normalizeTikTokVideoUrl(url) {
  const value = String(url || "").trim();
  const match = value.match(/https?:\/\/(?:www\.)?tiktok\.com\/@[^/?#]+\/video\/\d+/);
  if (!match?.[0]) return "";
  return match[0].replace(/^http:\/\//, "https://").replace("https://tiktok.com/", "https://www.tiktok.com/");
}

function getElementUrl(document, selector, attribute) {
  try {
    return document.querySelector?.(selector)?.getAttribute?.(attribute) || "";
  } catch {
    return "";
  }
}

function getAnchorVideoUrls(document) {
  try {
    const anchors = Array.from(document.querySelectorAll?.('a[href*="/video/"]') || []);
    return anchors.slice(0, 80).map((anchor) => anchor.getAttribute?.("href") || anchor.href || "");
  } catch {
    return [];
  }
}

function getVisibleFeedVideoCapture(document) {
  const card = findVisibleVideoCard(document);
  if (!card) return { videoUrl: "", source: "" };
  const author = findAuthorHandle(card);
  const videoId = findVideoId(card);
  if (!author || !videoId) return { videoUrl: "", source: "feed-card" };
  return {
    videoUrl: `https://www.tiktok.com/@${author}/video/${videoId}`,
    author,
    videoId,
    description: getVideoDescription(card),
    thumbnailUrl: getVideoThumbnail(card),
    durationSeconds: getVideoDurationSeconds(card),
    source: "feed-card"
  };
}

function findVisibleVideoCard(document) {
  try {
    const cards = Array.from(document.querySelectorAll?.('[data-e2e="recommend-list-item-container"], article') || [])
      .filter((card) => card.getAttribute?.("data-e2e") === "recommend-list-item-container" || card.querySelector?.('[data-e2e="feed-video"]'));
    return cards.find((card) => {
      const rect = card.getBoundingClientRect?.();
      if (!rect) return false;
      const centerY = rect.top + rect.height / 2;
      const viewportHeight = globalThis.innerHeight || document.documentElement?.clientHeight || 0;
      return rect.height > 80 && centerY >= 0 && centerY <= viewportHeight;
    }) || cards[0] || null;
  } catch {
    return null;
  }
}

function findAuthorHandle(card) {
  try {
    const authorLink = Array.from(card.querySelectorAll?.('a[href^="/@"], a[href*="tiktok.com/@"]') || [])
      .map((anchor) => anchor.getAttribute?.("href") || anchor.href || "")
      .find((href) => /\/@[^/?#]+/.test(href));
    const match = String(authorLink || "").match(/\/@([^/?#]+)/);
    return match?.[1] || "";
  } catch {
    return "";
  }
}

function findVideoId(card) {
  try {
    const idCarrier = Array.from(card.querySelectorAll?.('[id*="xgwrapper"], [id*="video"], [id*="media-card"]') || [])
      .map((node) => node.id || "")
      .find((id) => /\d{10,}/.test(id));
    return String(idCarrier || "").match(/(\d{10,})/)?.[1] || "";
  } catch {
    return "";
  }
}

function getVideoDescription(card) {
  try {
    return String(card.querySelector?.('[data-e2e="video-desc"], [data-e2e="browse-video-desc"]')?.textContent || "")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 500);
  } catch {
    return "";
  }
}

function getVideoThumbnail(card) {
  try {
    const videoPoster = card.querySelector?.("video")?.getAttribute?.("poster") || "";
    if (videoPoster) return videoPoster;
    const image = card.querySelector?.("img");
    return image?.currentSrc || image?.src || image?.getAttribute?.("src") || "";
  } catch {
    return "";
  }
}

function getVideoDurationSeconds(card) {
  try {
    const video = card.querySelector?.("video");
    const duration = Number(video?.duration || video?.getAttribute?.("duration") || 0);
    if (Number.isFinite(duration) && duration > 0) return Math.round(duration);
    const text = String(card.textContent || "");
    const match = text.match(/\b(\d{1,2}):(\d{2})\b/);
    if (!match) return 0;
    return Number(match[1]) * 60 + Number(match[2]);
  } catch {
    return 0;
  }
}

function buildWorkspaceUrl(capture) {
  const params = new URLSearchParams({ video: capture.videoUrl });
  if (capture.description) params.set("brief", capture.description);
  if (capture.author) params.set("author", capture.author);
  if (capture.thumbnailUrl) params.set("thumbnail", capture.thumbnailUrl);
  if (capture.durationSeconds) params.set("duration", String(capture.durationSeconds));
  const path = `src/workspace.html?${params.toString()}`;
  return safeRuntimeUrl(path);
}

function safeRuntimeUrl(path) {
  try {
    return globalThis.chrome?.runtime?.getURL ? chrome.runtime.getURL(path) : path;
  } catch {
    return path;
  }
}

function showStatus(status, message, isError = false) {
  status.textContent = message;
  status.classList.add("is-visible");
  if (isError) {
    status.classList.add("is-error");
  } else {
    status.classList.remove("is-error");
  }
}

globalThis.CommerceVideoFloatingCapture = {
  installFloatingCaptureButton,
  findCurrentTikTokVideoCapture,
  findCurrentTikTokVideoUrl,
  normalizeTikTokVideoUrl
};
