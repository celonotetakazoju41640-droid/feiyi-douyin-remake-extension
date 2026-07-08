const defaultServiceBaseUrl = "http://127.0.0.1:4318";
const gptsddImagePageUrl = "https://vip.gptsdd.com/user/#/image-video";

export async function postCapturedPage({ capturedPage, fetchImpl = fetch, storage = chrome.storage.local, serviceBaseUrl = defaultServiceBaseUrl }) {
  const response = await fetchImpl(`${serviceBaseUrl}/api/capture`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(capturedPage)
  });
  if (!response.ok) {
    throw new Error(`${response.status} ${await response.text()}`);
  }

  const summary = await response.json();
  await storage.set({ lastCapturedPage: capturedPage });
  return summary;
}

export async function postTikTokViralScan({ scan, fetchImpl = fetch, storage = chrome.storage.local, serviceBaseUrl = defaultServiceBaseUrl }) {
  const response = await fetchImpl(`${serviceBaseUrl}/api/tiktok/viral-scans`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ scan })
  });
  if (!response.ok) {
    throw new Error(`${response.status} ${await response.text()}`);
  }

  const exported = await response.json();
  await storage.set({ lastTikTokViralScan: exported.scan });
  return exported;
}

export function registerBackgroundHandlers({ chromeApi = chrome, fetchImpl = fetch, serviceBaseUrl = defaultServiceBaseUrl } = {}) {
  chromeApi.runtime.onInstalled.addListener(() => {
    chromeApi.action.setBadgeText({ text: "" });
  });

  chromeApi.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message?.type === "POST_CAPTURED_PAGE") {
      postCapturedPage({
        capturedPage: message.capturedPage,
        fetchImpl,
        storage: chromeApi.storage.local,
        serviceBaseUrl
      })
        .then((summary) => sendResponse({ ok: true, summary }))
        .catch((error) => sendResponse({ ok: false, error: error instanceof Error ? error.message : String(error) }));
      return true;
    }

    if (message?.type === "RUN_GPTSDD_IMAGE") {
      runGptsddImageAutomation({
        chromeApi,
        prompt: message.prompt,
        productName: message.productName
      })
        .then((result) => sendResponse({ ok: true, result }))
        .catch((error) => sendResponse({ ok: false, error: error instanceof Error ? error.message : String(error) }));
      return true;
    }

    if (message?.type === "POST_TIKTOK_VIRAL_SCAN") {
      postTikTokViralScan({
        scan: message.scan,
        fetchImpl,
        storage: chromeApi.storage.local,
        serviceBaseUrl
      })
        .then((result) => sendResponse({ ok: true, result }))
        .catch((error) => sendResponse({ ok: false, error: error instanceof Error ? error.message : String(error) }));
      return true;
    }

    if (message?.type === "GPTSDD_DOWNLOAD_IMAGE") {
      downloadGptsddImage({ chromeApi, src: message.src, filename: message.filename })
        .then((downloadId) => sendResponse({ ok: true, downloadId }))
        .catch((error) => sendResponse({ ok: false, error: error instanceof Error ? error.message : String(error) }));
      return true;
    }

    if (message?.type === "OPEN_CAPTURE_UI") {
      openCaptureUi(chromeApi)
        .then((result) => sendResponse({ ok: true, ...result }))
        .catch((error) => sendResponse({ ok: false, error: error instanceof Error ? error.message : String(error) }));
      return true;
    }

    if (message?.type === "OPEN_REMAKE_WORKSPACE") {
      openRemakeWorkspace(chromeApi, message.url)
        .then((result) => sendResponse({ ok: true, ...result }))
        .catch((error) => sendResponse({ ok: false, error: error instanceof Error ? error.message : String(error) }));
      return true;
    }

    return false;
  });
}

export async function openRemakeWorkspace(chromeApi = chrome, url) {
  const targetUrl = String(url || "");
  const runtimeUrl = chromeApi.runtime?.getURL ? chromeApi.runtime.getURL("src/workspace.html") : "src/workspace.html";
  let workspaceUrl = "";
  if (targetUrl.startsWith(runtimeUrl)) {
    workspaceUrl = targetUrl;
  } else if (targetUrl.startsWith(defaultServiceBaseUrl + "/remake")) {
    const sourceParams = new URL(targetUrl).searchParams;
    const workspaceParams = new URLSearchParams();
    for (const key of ["video", "brief", "author", "thumbnail"]) {
      const value = sourceParams.get(key);
      if (value) workspaceParams.set(key, value);
    }
    workspaceUrl = chromeApi.runtime?.getURL
      ? chromeApi.runtime.getURL(`src/workspace.html${workspaceParams.toString() ? `?${workspaceParams}` : ""}`)
      : `src/workspace.html${workspaceParams.toString() ? `?${workspaceParams}` : ""}`;
  } else {
    throw new Error("复刻页地址不正确");
  }
  if (!chromeApi.tabs?.create) {
    throw new Error("当前浏览器不支持打开复刻工作台");
  }
  const tab = await chromeApi.tabs.create({ url: workspaceUrl, active: true });
  return { opened: "tab", tabId: tab?.id };
}

export async function openCaptureUi(chromeApi = chrome) {
  if (chromeApi.action?.openPopup) {
    try {
      await chromeApi.action.openPopup();
      return { opened: "popup" };
    } catch {}
  }

  const url = chromeApi.runtime?.getURL ? chromeApi.runtime.getURL("src/workspace.html") : "src/workspace.html";
  if (!chromeApi.tabs?.create) {
    throw new Error("当前浏览器不支持从页面打开采集界面");
  }
  const tab = await chromeApi.tabs.create({ url, active: true });
  return { opened: "tab", tabId: tab?.id };
}

export async function runGptsddImageAutomation({ chromeApi = chrome, prompt, productName = "", url = gptsddImagePageUrl }) {
  if (!prompt || String(prompt).trim().length < 20) {
    throw new Error("提示词为空，先拆解复刻生成项目");
  }

  const tab = await openOrFocusGptsddTab(chromeApi, url);
  await waitForTabReady(chromeApi, tab.id);
  await ensureGptsddAutomationScript(chromeApi, tab.id);

  const response = await chromeApi.tabs.sendMessage(tab.id, {
    type: "GPTSDD_RUN_IMAGE",
    prompt,
    productName
  });

  if (!response?.ok) {
    throw new Error(response?.error || "GPTSDD 自动生成失败");
  }
  await chromeApi.storage?.local?.set?.({ lastGptsddAutomation: { at: new Date().toISOString(), result: response } });
  return response;
}

export async function downloadGptsddImage({ chromeApi = chrome, src, filename }) {
  if (!src) {
    throw new Error("没有可下载的图片地址");
  }
  if (String(src).startsWith("blob:")) {
    throw new Error("blob 图片地址只能由 GPTSDD 页面内下载");
  }
  if (!chromeApi.downloads?.download) {
    throw new Error("当前扩展没有下载能力");
  }
  return chromeApi.downloads.download({
    url: src,
    filename: filename || `commerce-video-storyboards/storyboard-${Date.now()}.png`,
    conflictAction: "uniquify",
    saveAs: false
  });
}

async function openOrFocusGptsddTab(chromeApi, url) {
  const existingTabs = await chromeApi.tabs.query({ url: "https://vip.gptsdd.com/user/*" });
  const tab = existingTabs?.[0];
  if (tab?.id) {
    await chromeApi.tabs.update(tab.id, { url, active: true });
    if (tab.windowId && chromeApi.windows?.update) {
      await chromeApi.windows.update(tab.windowId, { focused: true });
    }
    return { ...tab, url };
  }
  return chromeApi.tabs.create({ url, active: true });
}

async function ensureGptsddAutomationScript(chromeApi, tabId) {
  try {
    await chromeApi.scripting.executeScript({
      target: { tabId },
      files: ["src/gptsdd-automation.js"]
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (!message.includes("Cannot access") && !message.includes("No tab") && !message.includes("chrome://")) {
      throw error;
    }
    throw new Error(`无法注入 GPTSDD 自动化脚本：${message}`);
  }
}

async function waitForTabReady(chromeApi, tabId, timeoutMs = 60000) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    const tab = await chromeApi.tabs.get(tabId);
    if (tab?.status === "complete") return;
    await delay(500);
  }
  throw new Error("GPTSDD 页面打开超时");
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
