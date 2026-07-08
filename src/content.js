function detectPlatform(url) {
  try {
    const host = new URL(url).hostname.toLowerCase();
    if (host.includes("amazon.")) return "amazon";
    if (host.includes("tiktok.")) return "tiktok";
    if (host.includes("instagram.")) return "instagram";
    if (host.includes("facebook.") || host.includes("fb.watch")) return "facebook";
    return "unknown";
  } catch {
    return "unknown";
  }
}

function getMeta(name) {
  const selectors = [
    `meta[name="${name}"]`,
    `meta[property="${name}"]`,
    `meta[property="og:${name}"]`
  ];
  for (const selector of selectors) {
    const node = document.querySelector(selector);
    const value = node?.getAttribute("content");
    if (value) return value.trim();
  }
  return "";
}

function collectImages() {
  return Array.from(document.images)
    .map((img) => ({
      src: img.currentSrc || img.src,
      alt: img.alt || "",
      width: img.naturalWidth || img.width || 0,
      height: img.naturalHeight || img.height || 0
    }))
    .filter((img) => img.src && img.width >= 120 && img.height >= 120)
    .slice(0, 40);
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type !== "CAPTURE_PAGE") return false;

  sendResponse(capturePage());
  return true;
});

function capturePage() {
  return {
    platform: detectPlatform(location.href),
    url: location.href,
    title: document.title || getMeta("title"),
    description: getMeta("description"),
    textExcerpt: document.body?.innerText?.replace(/\s+/g, " ").trim().slice(0, 1200) || "",
    images: collectImages(),
    capturedAt: new Date().toISOString()
  };
}

async function postCapture(capturedPage) {
  const response = await chrome.runtime.sendMessage({
    type: "POST_CAPTURED_PAGE",
    capturedPage
  });
  if (!response?.ok) {
    throw new Error(response?.error || "后台采集请求失败");
  }
  return response.summary;
}

async function postViralScan(scan) {
  const response = await chrome.runtime.sendMessage({
    type: "POST_TIKTOK_VIRAL_SCAN",
    scan
  });
  if (!response?.ok) {
    throw new Error(response?.error || "后台爆款扫描保存失败");
  }
  return response.result;
}

globalThis.CommerceVideoFloatingCapture?.installFloatingCaptureButton({
  document,
  capturePage: async () => capturePage(),
  postCapture,
  scanViralVideos: globalThis.CommerceVideoScanTikTokViralVideos,
  postViralScan
});
