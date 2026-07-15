import { createServer } from "node:http";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const runtimeDir = join(__dirname, "runtime");
const queuePath = join(runtimeDir, "video-batches.json");
const port = Number(process.env.PORT || 4328);
const host = process.env.HOST || "127.0.0.1";
const projectEnvCandidates = [
  "/Users/da/Documents/Codex/2026-06-16/users-da-documents-codex-2026-06/outputs/commerce-video-batch-tool/.env",
  "/Users/da/Documents/Codex/2026-06-16/users-da-documents-codex-2026-06/outputs/commerce-drama-remake-tool/.env"
];

await mkdir(runtimeDir, { recursive: true });
const fileEnv = await loadMergedEnv(projectEnvCandidates);
const config = mergeNonEmptyEnv(fileEnv, pickProcessEnv());
const isDirectRun = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];

const server = createServer(async (request, response) => {
  try {
    if (request.method === "OPTIONS") {
      return sendJson(response, 200, { ok: true });
    }

    if (request.method === "GET" && request.url === "/health") {
      const queue = await loadQueue();
      return sendJson(response, 200, {
        status: "ok",
        service: "feiyi-douyin-fuke-video-batch-service",
        queueSize: queue.batches.length,
        mode: config.PACKY_VIDEO_API_URL ? "proxy_ready" : "queue_only",
        hasTextApiKey: Boolean(config.TEXT_API_KEY),
        hasImageApiKey: Boolean(config.IMAGE_API_KEY || config.PACKY_API_KEY),
        hasGeminiKey: Boolean(getGeminiApiKey(config)),
        deepDistillSupported: Boolean(getGeminiApiKey(config)),
        geminiBaseUrl: maskUrl(getGeminiBaseUrl(config)),
        geminiModel: getGeminiModel(config),
        textBaseUrl: maskUrl(config.TEXT_API_BASE_URL),
        imageBaseUrl: maskUrl(config.IMAGE_API_BASE_URL)
      });
    }

    if (request.method === "GET" && request.url === "/api/video-batches") {
      const queue = await loadQueue();
      return sendJson(response, 200, queue);
    }

    if (request.method === "POST" && request.url === "/api/video-batches") {
      const body = await readJsonBody(request);
      const tasks = Array.isArray(body.tasks) ? body.tasks : [];
      if (tasks.length === 0) {
        return sendJson(response, 400, { message: "没有收到可入队的批量视频任务。" });
      }

      const queue = await loadQueue();
      const batchId = `batch-${Date.now()}`;
      const batch = {
        batchId,
        projectName: String(body.projectName || "未命名项目").trim(),
        submitMode: body.submitMode === "live" ? "live" : "queue_only",
        accountTemplate: sanitizeTemplate(body.accountTemplate),
        acceptedAt: new Date().toISOString(),
        tasks: tasks.map((task, index) => ({
          taskId: String(task.taskId || `${batchId}-task-${index + 1}`),
          taskTitle: String(task.taskTitle || `任务 ${index + 1}`),
          model: String(task.model || "veo-3-fast"),
          durationSeconds: Number(task.durationSeconds || 30),
          aspectRatio: String(task.aspectRatio || "9:16"),
          voiceLanguage: String(task.voiceLanguage || "英文"),
          prompt: String(task.prompt || "").trim(),
          imagePrompt: String(task.imagePrompt || "").trim(),
          sourceLinks: Array.isArray(task.sourceLinks) ? task.sourceLinks.map(String) : [],
          extraRules: String(task.extraRules || "").trim(),
          status: body.submitMode === "live" && config.PACKY_VIDEO_API_URL ? "待转发" : "已入队",
          upstreamTaskId: null
        }))
      };

      queue.batches.unshift(batch);
      await saveQueue(queue);

      return sendJson(response, 200, {
        ok: true,
        batchId,
        queuedTasks: batch.tasks.length,
        mode: config.PACKY_VIDEO_API_URL ? "proxy_ready" : "queue_only",
        message: config.PACKY_VIDEO_API_URL
          ? "任务已进入本地服务队列，后续可接真实 Packy 视频接口。"
          : "任务已进入本地服务队列；当前没有配置真实视频接口地址，暂不外发。"
      });
    }

    if (request.method === "POST" && request.url === "/api/deep-distill/analyze") {
      const body = await readJsonBody(request);
      const videos = Array.isArray(body.videos) ? body.videos : [];
      if (!videos.length) {
        return sendJson(response, 400, { message: "没有收到可分析的视频样本。" });
      }
      if (!getGeminiApiKey(config)) {
        return sendJson(response, 400, { message: "当前本地服务没有读到 GEMINI_API_KEY，暂时不能自动分析视频深蒸馏。" });
      }

      const results = [];
      for (const video of videos) {
        results.push(await analyzeDeepDistillVideo(video, config));
      }

      return sendJson(response, 200, {
        ok: true,
        provider: "packyapi-google-gemini",
        model: getGeminiModel(config),
        results
      });
    }

    if (request.method === "POST" && request.url === "/api/product-image-insights") {
      const body = await readJsonBody(request);
      if (!getGeminiApiKey(config)) {
        return sendJson(response, 400, { message: "当前本地服务没有读到 GEMINI_API_KEY，暂时不能自动分析商品图。" });
      }
      const result = await analyzeProductImage(body, config);
      return sendJson(response, 200, {
        ok: true,
        provider: "packyapi-google-gemini",
        model: getGeminiModel(config),
        result
      });
    }

    if (request.method === "POST" && request.url === "/api/storyboards") {
      const body = await readJsonBody(request);
      const result = await createStoryboardTask(body, config);
      return sendJson(response, 200, result);
    }

    if (request.method === "GET" && request.url.startsWith("/api/storyboards/")) {
      const route = request.url.split("/api/storyboards/")[1] || "";
      const [taskPart] = route.split("?");
      if (taskPart.endsWith("/image")) {
        const taskId = decodeURIComponent(taskPart.slice(0, -"/image".length) || "");
        const image = await downloadStoryboardImage(taskId, config);
        return sendBinary(response, 200, image.buffer, image.contentType, image.fileName);
      }
      const taskId = decodeURIComponent(taskPart || "");
      const result = await getStoryboardTask(taskId, config);
      return sendJson(response, 200, result);
    }

    sendJson(response, 404, { message: "接口不存在。" });
  } catch (error) {
    sendJson(response, 500, { message: error instanceof Error ? error.message : String(error) });
  }
});

if (isDirectRun) {
  server.listen(port, host, () => {
    console.log(`[feiyi-video-batch-service] listening on http://${host}:${port}`);
  });
}

export function buildKieStoryboardTaskRequest({ model, prompt, aspectRatio }) {
  return {
    model: String(model || "").trim(),
    callBackUrl: "",
    input: {
      prompt: String(prompt || "").trim(),
      aspect_ratio: String(aspectRatio || "9:16").trim() || "9:16"
    }
  };
}

export function mapKieStoryboardStatus(raw = "") {
  const value = String(raw || "").trim().toLowerCase();
  if (["queued", "submitted", "pending"].includes(value)) return "queued";
  if (["running", "processing", "in_progress"].includes(value)) return "running";
  if (["success", "succeeded", "completed"].includes(value)) return "succeeded";
  if (["failed", "error", "cancelled"].includes(value)) return "failed";
  return "queued";
}

export function buildStoryboardImageDownloadMeta(taskId, imageUrl = "", contentType = "") {
  const normalizedTaskId = String(taskId || "").trim() || "storyboard";
  const normalizedContentType = String(contentType || "").trim().toLowerCase();
  const urlWithoutQuery = String(imageUrl || "").split("?")[0];
  const urlExt = urlWithoutQuery.includes(".") ? urlWithoutQuery.split(".").pop().trim().toLowerCase() : "";
  const extFromType = normalizedContentType.startsWith("image/")
    ? normalizedContentType.split("/")[1].split(";")[0].trim().toLowerCase()
    : "";
  const ext = extFromType || urlExt || "png";

  return {
    fileName: `storyboard-${normalizedTaskId}.${ext}`,
    contentType: normalizedContentType || `image/${ext}`
  };
}

export function buildProductImageInsightsPrompt(input = {}) {
  const fileName = String(input.fileName || "").trim() || "未命名商品图";
  const fileNames = Array.isArray(input.fileNames)
    ? input.fileNames.map((item) => String(item || "").trim()).filter(Boolean)
    : [];
  const productName = String(input.productName || "").trim();
  const template = input.template || {};
  const platform = String(template.platform || "").trim().toLowerCase() === "douyin" ? "抖音" : "TikTok";
  const fileSummary = fileNames.length ? fileNames.join(" / ") : fileName;

  return [
    "你是电商短视频投放策划，任务是根据商品图，提炼出可直接用于短视频生成的商品理解，不要只做图像描述。",
    "先判断这是什么商品、可能卖什么、最适合放进什么生活场景，再给出短视频复刻所需的结构化结果。",
    "不要泛泛讲审美，不要堆行业黑话，要尽量让结果能直接回填到生成表单里。",
    "",
    `当前平台：${platform}`,
    `当前商品图文件名：${fileName}`,
    `当前共上传 ${Math.max(1, fileNames.length || 1)} 张商品图：${fileSummary}`,
    `用户已填写商品名：${productName || "未填写"}`,
    `当前模板：${String(template.name || "").trim() || "未填写"}`,
    `模板内容定位：${String(template.contentPositioning || "").trim() || "未填写"}`,
    "",
    "如果收到多张商品图，需要综合多张图片判断同一商品的外观、使用方式、卖点和最适合的场景，不要只盯第一张。",
    "请严格只返回一个 JSON 对象，不要带 markdown，不要带解释，不要带代码块。",
    "字段要求：",
    "- productName: 结合图片内容推断的商品名，尽量短，适合直接放进表单。",
    "- sellingPoints: 数组，3 到 4 条，写成可直接用于短视频卖点的短句。",
    "- suggestedPrompt: 一条可直接当创作要求草稿的短视频方向说明。",
    "- scenePlan: 对象，包含 primaryLocation、environmentStyle、continuityRule。",
    "- cast: 数组，至少 1 个角色对象。字段包含 roleType、label、appearanceLock、behaviorRule、voiceRule、presenceRule。",
    "",
    "输出必须更偏‘投放可执行’，不是纯视觉描述。"
  ].join("\n");
}

async function createStoryboardTask(body, config) {
  if (!config.KIE_API_KEY) {
    throw new Error("当前本地服务没有读到 KIE_API_KEY，暂时不能生成故事版图。");
  }

  const prompt = String(body.prompt || "").trim();
  if (!prompt) {
    throw new Error("没有收到故事版提示词，暂时不能创建故事版图任务。");
  }

  const payload = buildKieStoryboardTaskRequest({
    model: body.model || config.KIE_GPT_IMAGE_MODEL || "gpt-image/1.5-text-to-image",
    prompt,
    aspectRatio: String(body.aspectRatio || "9:16").trim()
  });

  const response = await fetch(`${getKieBaseUrl(config)}/jobs/createTask`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${config.KIE_API_KEY}`
    },
    body: JSON.stringify(payload)
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(readKieError(data) || `${response.status} ${response.statusText}`);
  }

  return {
    ok: true,
    provider: "kie-gpt-image",
    taskId: String(data.data?.taskId || data.taskId || "").trim(),
    status: "queued",
    imageUrl: "",
    errorMessage: ""
  };
}

async function getStoryboardTask(taskId, config) {
  const normalizedTaskId = String(taskId || "").trim();
  if (!normalizedTaskId) {
    throw new Error("没有收到故事版任务 ID。");
  }
  if (!config.KIE_API_KEY) {
    throw new Error("当前本地服务没有读到 KIE_API_KEY，暂时不能查询故事版图任务。");
  }

  const response = await fetch(`${getKieBaseUrl(config)}/jobs/recordInfo?taskId=${encodeURIComponent(normalizedTaskId)}`, {
    method: "GET",
    headers: {
      authorization: `Bearer ${config.KIE_API_KEY}`
    }
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(readKieError(data) || `${response.status} ${response.statusText}`);
  }

  const record = data.data || data.record || data;
  const imageUrl = String(
    record?.response?.resultUrls?.[0]
      || record?.response?.resultUrl
      || record?.resultUrls?.[0]
      || record?.resultUrl
      || ""
  ).trim();

  return {
    ok: true,
    provider: "kie-gpt-image",
    taskId: normalizedTaskId,
    status: mapKieStoryboardStatus(record?.status || data.status || ""),
    imageUrl,
    errorMessage: String(record?.errorMessage || data.errorMessage || "").trim()
  };
}

async function downloadStoryboardImage(taskId, config) {
  const task = await getStoryboardTask(taskId, config);
  if (!task.imageUrl) {
    throw new Error("当前故事版任务还没有可下载的图片。");
  }

  const imageResponse = await fetch(task.imageUrl);
  if (!imageResponse.ok) {
    throw new Error(`故事版图片下载失败：${imageResponse.status} ${imageResponse.statusText}`);
  }

  const buffer = Buffer.from(await imageResponse.arrayBuffer());
  const meta = buildStoryboardImageDownloadMeta(
    task.taskId,
    task.imageUrl,
    imageResponse.headers.get("content-type") || ""
  );

  return {
    ...meta,
    buffer
  };
}

async function analyzeDeepDistillVideo(video, config) {
  const prompt = buildDeepDistillPrompt(video);
  const contents = [
    {
      role: "user",
      parts: [
        { text: prompt },
        ...buildFrameParts(video.frames),
        {
          text:
            "请严格只返回一个 JSON 对象，不要带 markdown，不要带解释，不要带代码块。字段缺失时返回空字符串，isZeroFrameProductHook 只能返回“是”“否”或“待判断”。"
        }
      ]
    }
  ];

  const response = await fetch(
    `${getGeminiBaseUrl(config).replace(/\/$/, "")}/v1beta/models/${encodeURIComponent(getGeminiModel(config))}:generateContent`,
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-goog-api-key": getGeminiApiKey(config),
        ...(getGeminiTokenGroup(config) ? { "x-token-group": getGeminiTokenGroup(config) } : {})
      },
      body: JSON.stringify({
        contents,
        generationConfig: {
          temperature: 0.2,
          responseMimeType: "application/json"
        }
      })
    }
  );

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(readGeminiError(data) || `${response.status} ${response.statusText}`);
  }

  const text = extractGeminiText(data);
  const parsed = parseLooseJson(text);
  if (!parsed || typeof parsed !== "object") {
    throw new Error(`视觉模型返回内容不可解析：${text.slice(0, 120) || "空结果"}`);
  }

  return {
    id: String(video.id || "").trim(),
    fileName: String(video.fileName || "").trim(),
    relativePath: String(video.relativePath || "").trim(),
    analysis: normalizeDeepDistillAnalysis(parsed)
  };
}

async function analyzeProductImage(input, config) {
  const imageInputs = Array.isArray(input.imageDataUrls) ? input.imageDataUrls : [];
  const images = imageInputs
    .map((item) => parseDataUrlImage(String(item || "").trim()))
    .filter(Boolean);
  if (!images.length) {
    const singleImage = parseDataUrlImage(String(input.imageDataUrl || "").trim());
    if (singleImage) {
      images.push(singleImage);
    }
  }
  if (!images.length) {
    throw new Error("没有收到可分析的商品图片数据。");
  }

  const prompt = buildProductImageInsightsPrompt(input);
  const response = await fetch(
    `${getGeminiBaseUrl(config).replace(/\/$/, "")}/v1beta/models/${encodeURIComponent(getGeminiModel(config))}:generateContent`,
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-goog-api-key": getGeminiApiKey(config),
        ...(getGeminiTokenGroup(config) ? { "x-token-group": getGeminiTokenGroup(config) } : {})
      },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [
              { text: prompt },
              ...images.map((image) => ({
                inlineData: {
                  mimeType: image.mimeType,
                  data: image.base64
                }
              }))
            ]
          }
        ],
        generationConfig: {
          temperature: 0.2,
          responseMimeType: "application/json"
        }
      })
    }
  );

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(readGeminiError(data) || `${response.status} ${response.statusText}`);
  }

  const text = extractGeminiText(data);
  const parsed = parseLooseJson(text);
  if (!parsed || typeof parsed !== "object") {
    throw new Error(`商品图视觉分析结果不可解析：${text.slice(0, 120) || "空结果"}`);
  }

  return normalizeProductImageInsightsResult(parsed);
}

export function buildDeepDistillPrompt(video) {
  const durationSeconds = Number(video.durationSeconds || 0);
  const frames = Array.isArray(video.frames) ? video.frames : [];
  const frameCount = frames.length;
  const frameTimeline = frames.length
    ? frames
        .map((frame, index) => {
          const label = String(frame.label || `帧 ${index + 1}`).trim();
          const second = Number(frame.second || 0);
          return `${index + 1}. ${label}（约第 ${second} 秒）`;
        })
        .join("；")
    : "未提供关键帧时间线";
  return [
    "你是短视频复刻分析师，任务是根据同一条短视频的多张关键帧，反推出这条视频最值得复刻的结构骨架。",
    "不要泛泛而谈，不要复述商品行业常识，要尽量根据时间线判断镜头推进和叙事动作。",
    "分析重点不是文案，而是：",
    "1. 是否 0 帧商品起手，还是人物/问题/冲突先起手",
    "2. 商品第一次强露出大概在第几秒，露出方式是什么",
    "3. 前 3 秒钩子更像哪一类：问题、误会、冲突、结果先看、人物反应、多人互动",
    "4. 画面情绪曲线怎么走，前后段有没有明显抬升或释放",
    "5. 镜头节奏是快切、停留、推进、对比证明，还是多人对照烘托",
    "6. 卖点证明方式是什么，要写具体动作，不要只写“展示卖点”",
    "7. 结尾收口方式是什么，是否回到商品定格、结果复述、轻 CTA 或情绪落点",
    "8. 画面是如何从开场推进到结果的，要按时间顺序写清楚",
    "9. 这条视频的视觉 DNA 是什么，要写镜头距离、构图、人物关系、商品露出方式",
    "10. 如果关键帧里能看出多人互动、配角反应、见证式对照，也要明确写出来",
    "",
    `当前视频名：${String(video.fileName || "未命名视频").trim()}`,
    `相对路径：${String(video.relativePath || "").trim() || "未提供"}`,
    `时长：${durationSeconds > 0 ? `${durationSeconds} 秒` : "未知"}`,
    `抽样帧数：${frameCount} 张`,
    `关键帧时间线：${frameTimeline}`,
    "",
    "输出要求：",
    "- 每个字段尽量写具体、短句、可执行，不要空话。",
    "- sceneProgression 必须按时间顺序描述，至少写出开场 -> 推进 -> 证明 -> 收口。",
    "- summary 必须写成一条能直接指导复刻的结构总结，不超过 60 个字。",
    "- 如果证据不足，可以写“待判断”，但不要乱猜。",
    "",
    "请按以下 JSON 结构返回：",
    JSON.stringify(
      {
        isZeroFrameProductHook: "是 / 否 / 待判断",
        firstStrongProductSecond: "",
        hookType: "",
        emotionCurve: "",
        shotRhythm: "",
        proofStyle: "",
        ctaStyle: "",
        sceneProgression: "",
        visualDna: "",
        summary: ""
      },
      null,
      2
    )
  ].join("\n");
}

function normalizeProductImageInsightsResult(raw = {}) {
  const scenePlan = raw.scenePlan && typeof raw.scenePlan === "object" ? raw.scenePlan : {};
  const cast = Array.isArray(raw.cast) ? raw.cast : [];
  const sellingPoints = Array.isArray(raw.sellingPoints)
    ? raw.sellingPoints.map((item) => String(item || "").trim()).filter(Boolean).slice(0, 4)
    : [];

  const normalizedCast = cast.length
    ? cast.map((member, index) => ({
        roleType: String(member.roleType || (index === 0 ? "host" : "supporting")).trim() || (index === 0 ? "host" : "supporting"),
        label: String(member.label || (index === 0 ? "主讲人" : `配角${index}`)).trim() || (index === 0 ? "主讲人" : `配角${index}`),
        appearanceLock: String(member.appearanceLock || "").trim(),
        behaviorRule: String(member.behaviorRule || "").trim(),
        voiceRule: String(member.voiceRule || (index === 0 ? "primary" : "silent")).trim() || (index === 0 ? "primary" : "silent"),
        presenceRule: String(member.presenceRule || "always").trim() || "always"
      }))
    : [];

  return {
    productName: String(raw.productName || "").trim(),
    sellingPoints,
    suggestedPrompt: String(raw.suggestedPrompt || "").trim(),
    scenePlan: {
      primaryLocation: String(scenePlan.primaryLocation || "").trim(),
      environmentStyle: String(scenePlan.environmentStyle || "").trim(),
      continuityRule: String(scenePlan.continuityRule || "").trim()
    },
    cast: normalizedCast
  };
}

function parseDataUrlImage(dataUrl = "") {
  const match = String(dataUrl || "").match(/^data:(image\/[a-z0-9.+-]+);base64,(.+)$/i);
  if (!match) return null;
  return {
    mimeType: match[1],
    base64: match[2]
  };
}

function buildFrameParts(frames) {
  return (Array.isArray(frames) ? frames : [])
    .slice(0, 8)
    .flatMap((frame, index) => {
      const label = String(frame.label || `帧 ${index + 1}`).trim();
      const second = Number(frame.second || 0);
      const data = String(frame.data || "").trim();
      if (!data) return [];
      return [
        { text: `${label}，约第 ${second} 秒。` },
        {
          inlineData: {
            mimeType: String(frame.mimeType || "image/jpeg").trim(),
            data
          }
        }
      ];
    });
}

function normalizeDeepDistillAnalysis(raw = {}) {
  return {
    isZeroFrameProductHook: normalizeChoice(raw.isZeroFrameProductHook),
    firstStrongProductSecond: String(raw.firstStrongProductSecond || "").trim(),
    hookType: String(raw.hookType || "").trim(),
    emotionCurve: String(raw.emotionCurve || "").trim(),
    shotRhythm: String(raw.shotRhythm || "").trim(),
    proofStyle: String(raw.proofStyle || "").trim(),
    ctaStyle: String(raw.ctaStyle || "").trim(),
    sceneProgression: String(raw.sceneProgression || "").trim(),
    visualDna: String(raw.visualDna || "").trim(),
    summary: String(raw.summary || "").trim()
  };
}

function normalizeChoice(value) {
  const text = String(value || "").trim();
  if (text === "是" || /^yes$/i.test(text)) return "是";
  if (text === "否" || /^no$/i.test(text)) return "否";
  return "待判断";
}

function extractGeminiText(payload = {}) {
  return (payload.candidates || [])
    .flatMap((candidate) => candidate?.content?.parts || [])
    .map((part) => String(part?.text || ""))
    .join("\n")
    .trim();
}

function parseLooseJson(text) {
  const normalized = String(text || "").trim();
  if (!normalized) return null;
  try {
    return JSON.parse(normalized);
  } catch {}
  const match = normalized.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    return JSON.parse(match[0]);
  } catch {
    return null;
  }
}

function readGeminiError(payload = {}) {
  return String(payload?.error?.message || payload?.message || "").trim();
}

function getGeminiBaseUrl(config) {
  return (
    config.GEMINI_API_BASE_URL ||
    config.GOOGLE_GEMINI_BASE_URL ||
    config.GEMINI_BASE_URL ||
    config.PACKY_GEMINI_BASE_URL ||
    "https://www.packyapi.com"
  );
}

function getGeminiModel(config) {
  return config.GEMINI_VISION_MODEL || config.GEMINI_MODEL || "gemini-2.5-flash";
}

function getGeminiApiKey(config) {
  if (config.GEMINI_API_KEY) return config.GEMINI_API_KEY;
  if (isPackyApiUrl(getGeminiBaseUrl(config)) && config.TEXT_API_KEY) return config.TEXT_API_KEY;
  return "";
}

function getGeminiTokenGroup(config) {
  return config.GEMINI_TOKEN_GROUP || "";
}

function getKieBaseUrl(config) {
  return String(config.KIE_API_BASE_URL || "https://api.kie.ai/api/v1").replace(/\/$/, "");
}

function readKieError(payload = {}) {
  return String(payload?.message || payload?.error?.message || "").trim();
}

function sendBinary(response, status, buffer, contentType, fileName = "download.bin") {
  response.writeHead(status, {
    "content-type": contentType || "application/octet-stream",
    "content-disposition": `attachment; filename="${fileName}"`,
    "content-length": Buffer.byteLength(buffer)
  });
  response.end(buffer);
}

function pickProcessEnv() {
  const keys = [
    "TEXT_API_KEY",
    "IMAGE_API_KEY",
    "PACKY_API_KEY",
    "PACKY_VIDEO_API_URL",
    "TEXT_API_BASE_URL",
    "IMAGE_API_BASE_URL",
    "GEMINI_API_KEY",
    "GEMINI_API_BASE_URL",
    "GOOGLE_GEMINI_BASE_URL",
    "GEMINI_BASE_URL",
    "PACKY_GEMINI_BASE_URL",
    "GEMINI_MODEL",
    "GEMINI_VISION_MODEL",
    "TEXT_TOKEN_GROUP",
    "GEMINI_TOKEN_GROUP",
    "KIE_API_KEY",
    "KIE_API_BASE_URL",
    "KIE_GPT_IMAGE_MODEL"
  ];
  return Object.fromEntries(keys.map((key) => [key, process.env[key] || ""]));
}

function mergeNonEmptyEnv(...sources) {
  const merged = {};
  for (const source of sources) {
    for (const [key, value] of Object.entries(source || {})) {
      if (value !== undefined && value !== null && String(value).trim() !== "") {
        merged[key] = String(value);
      }
    }
  }
  return merged;
}

function isPackyApiUrl(url) {
  return /^https:\/\/(www\.)?packyapi\.com(?:\/|$)/i.test(String(url || "").trim());
}

async function loadMergedEnv(paths) {
  const merged = {};
  for (const path of paths) {
    try {
      const contents = await readFile(path, "utf8");
      Object.assign(merged, parseEnvFile(contents));
    } catch {}
  }
  return merged;
}

function parseEnvFile(contents) {
  const parsed = {};
  for (const rawLine of contents.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const separatorIndex = line.indexOf("=");
    if (separatorIndex <= 0) continue;
    const key = line.slice(0, separatorIndex).trim();
    let value = line.slice(separatorIndex + 1).trim();
    if ((value.startsWith("\"") && value.endsWith("\"")) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    parsed[key] = value;
  }
  return parsed;
}

async function loadQueue() {
  try {
    const text = await readFile(queuePath, "utf8");
    return JSON.parse(text);
  } catch {
    return { batches: [] };
  }
}

async function saveQueue(queue) {
  await writeFile(queuePath, JSON.stringify(queue, null, 2));
}

async function readJsonBody(request) {
  const chunks = [];
  for await (const chunk of request) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  const text = Buffer.concat(chunks).toString("utf8");
  return text ? JSON.parse(text) : {};
}

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, {
    "content-type": "application/json; charset=utf-8",
    "access-control-allow-origin": "*",
    "access-control-allow-methods": "GET,POST,OPTIONS",
    "access-control-allow-headers": "content-type"
  });
  response.end(JSON.stringify(payload));
}

function sanitizeTemplate(raw = {}) {
  return {
    id: String(raw.id || "").trim(),
    name: String(raw.name || "").trim(),
    accountHandle: String(raw.accountHandle || "").trim(),
    contentPositioning: String(raw.contentPositioning || "").trim(),
    hookStyle: String(raw.hookStyle || "").trim(),
    rhythm: String(raw.rhythm || "").trim(),
    structure: String(raw.structure || "").trim(),
    rewriteRules: String(raw.rewriteRules || "").trim(),
    preferredModel: String(raw.preferredModel || "").trim()
  };
}

function maskUrl(value) {
  return value ? String(value).replace(/:\/\/[^/]+/, "://<configured>") : "";
}
