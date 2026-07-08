export async function captureActiveTabPage(chromeApi, tab) {
  if (!tab?.id) {
    throw new Error("找不到当前标签页");
  }

  try {
    return await chromeApi.tabs.sendMessage(tab.id, { type: "CAPTURE_PAGE" });
  } catch (error) {
    if (!isMissingReceiverError(error)) {
      throw error;
    }
  }

    await chromeApi.scripting.executeScript({
      target: { tabId: tab.id },
      files: ["src/floating-capture-button.js", "src/content.js"]
    });
  return chromeApi.tabs.sendMessage(tab.id, { type: "CAPTURE_PAGE" });
}

export async function scanTikTokViralVideos(chromeApi, tab, options = {}) {
  if (!tab?.id) {
    throw new Error("找不到当前标签页");
  }

  try {
    return await chromeApi.tabs.sendMessage(tab.id, { type: "SCAN_TIKTOK_VIRAL_VIDEOS", options });
  } catch (error) {
    if (!isMissingReceiverError(error)) {
      throw error;
    }
  }

  await chromeApi.scripting.executeScript({
    target: { tabId: tab.id },
    files: ["src/tiktok-viral-scanner.js"]
  });
  return chromeApi.tabs.sendMessage(tab.id, { type: "SCAN_TIKTOK_VIRAL_VIDEOS", options });
}

export async function stopTikTokViralScan(chromeApi, tab) {
  if (!tab?.id) {
    throw new Error("找不到当前标签页");
  }
  return chromeApi.tabs.sendMessage(tab.id, { type: "STOP_TIKTOK_VIRAL_SCAN" });
}

function isMissingReceiverError(error) {
  const message = error instanceof Error ? error.message : String(error);
  return message.includes("Could not establish connection") || message.includes("Receiving end does not exist");
}
