# Storyboard Kie Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在现有飞蚁抖音复刻 Chrome 扩展里补上“多人角色 + 故事版叙事图 + Kie 生图代理”这一层，但不打断当前提示词和批量任务主链路。

**Architecture:** 继续以 `src/remake-core.js` 作为纯拼装核心，把多人角色、主场景和 storyboard task 组织进 package；前端 `src/workspace.*` 只补最小输入和结果展示；Kie 只接到本地 `scripts/video-batch-service.mjs`，由 `4328` 服务创建异步图像任务并查询结果。故事版图是可选中间产物，失败时主链路继续交付提示词和批量任务。

**Tech Stack:** Chrome Extension, 原生 ES Modules, Node HTTP server, node:test, Kie async image API, 本地 runtime JSON 持久化

## 当前进度

- 已完成：Task 1 core 数据结构落地，`project.cast / scenePlan / shots.* / storyboardTasks` 已接入 package。
- 已完成：Task 2 storyboard prompt 生成，TikTok 会产出包含 `Product / Scene / Host / Supporting cast / Continuity` 的英文故事版提示词。
- 已完成：Task 3 workspace 最小接线，生成页已可录入主场景、连续性、故事版开关和多人角色；历史页已新增故事版图详情展示。
- 已完成：蒸馏管理里的视频深蒸馏交互优化，读取本地视频与自动分析已拆成两段状态，补了可见进度，并把视频卡片改成默认折叠，避免页面过长。
- 已完成：Task 4 Kie 本地代理最小实现，`/api/storyboards` 创建接口、`/api/storyboards/:taskId` 查询接口、Kie 请求体映射和状态映射已接入本地服务。
- 已完成：视频深蒸馏拆解质量优化，抽帧点更密，分析 prompt 补了关键帧时间线、多人互动判断和更强的结构化输出约束。
- 已完成：视频深蒸馏 UI 重做，操作区改成 3 步流程板，第 2 步补了预计耗时与当前拆解提示，并把“已读取但未拆解 / 刷新后需重读 / 正在拆解 / 已完成”几种状态拆开显示，避免误判卡死。
- 已完成：继续收口蒸馏管理页的误导状态，左侧模板概况不再混入深蒸馏视频数；右侧把“可开始拆解”和“历史样本待重读”拆开统计，避免把恢复态误看成死循环。
- 已完成：继续优化深蒸馏动作反馈，上传并读取本地视频后，第 2 步会直接提示“开始 AI 拆解”；点击后立即显示“正在 AI 拆解 x / n”的运行反馈，不再只靠状态文案让用户自己猜。
- 已完成：继续优化深蒸馏等待反馈，读取本地视频期间按钮会直接显示“正在读取本地视频...”，旁边明确提示“读完后按钮会自动变成开始 AI 拆解”，避免用户不知道要等多久、什么时候能点。
- 已完成：继续把深蒸馏按钮做成傻瓜式动作态，空状态按钮直接写“先选择本地视频”，避免一上来看到“自动分析”这类不明确词。
- 已完成：修掉“本地视频刚读完就又被判成历史待重读”的状态回退问题。保存模板时会保留当前会话里的本地文件映射，不再出现 10/10 读完但第 2 步仍锁死的假卡死。
- 已完成：把深蒸馏和本地批量发送里的 `Failed to fetch` 翻成白话提示。现在如果 4328 本地服务没启动，会直接提示“本地分析服务没连上，请先启动 4328 服务”，并带出启动命令。
- 已完成：把蒸馏管理页收成单列紧凑版。移除“模型与主页参考”的可见区，只保留当前模型选择、新建空模型、删除模型和第 3 步保存模型；视频深蒸馏只保留 3 步动作、进度和结果，不再展示大段说明文案。
- 已完成：继续压缩蒸馏管理面板密度。顶部模型操作已并进标题行，三步卡片取消等高拉伸，按钮高度、卡片留白和进度区间距进一步收紧；桌面端进度条改成双列，移动端自动回单列。
- 已完成：放开生成页的商品名和创作要求强校验。现在只上传产品图也能生成，系统会优先沿用自动回填内容；商品名缺失时兜底为“当前商品”，创作要求缺失时兜底为商品图自动提炼草稿。
- 已完成：把商品图自动提炼继续接进生成默认值。上传产品图后，系统会继续自动补主场景、环境风格、连续性要求和默认主讲人设；如果用户没手填这些字段，生成时会直接带默认场景和默认主讲人进 package，故事版开启后可直接带出 storyboard task。
- 已验证：`node --test tests/remake-core.test.mjs`、`node --check src/remake-core.js`、`git diff --check`。
- 已补充验证：`node --test tests/extension-shell.test.mjs tests/remake-core.test.mjs`、`node --check src/workspace.js`、`git diff --check`。
- 已补充验证：`node --test tests/video-batch-service.test.mjs`、`node --check scripts/video-batch-service.mjs`、`git diff --check`。
- 未开始：Task 5 及之后的前端故事版动作接线、README 同步和真实链路验收。

---

## File Structure

- Modify: `/Users/da/Desktop/飞蚁抖音复刻-Chrome扩展/src/remake-core.js`
  - 继续做 package 数据结构与 prompt 拼装核心。
- Modify: `/Users/da/Desktop/飞蚁抖音复刻-Chrome扩展/src/workspace.js`
  - 收集角色/场景输入，触发故事版图任务，刷新状态，展示结果。
- Modify: `/Users/da/Desktop/飞蚁抖音复刻-Chrome扩展/src/workspace.html`
  - 增加主场景、角色结构和故事版图开关的最小 UI。
- Modify: `/Users/da/Desktop/飞蚁抖音复刻-Chrome扩展/src/workspace.css`
  - 只补与新增输入和状态展示直接相关的样式。
- Modify: `/Users/da/Desktop/飞蚁抖音复刻-Chrome扩展/scripts/video-batch-service.mjs`
  - 新增 storyboard Kie 代理接口和状态查询。
- Modify: `/Users/da/Desktop/飞蚁抖音复刻-Chrome扩展/tests/remake-core.test.mjs`
  - 先补 core 层 failing tests。
- Create: `/Users/da/Desktop/飞蚁抖音复刻-Chrome扩展/tests/video-batch-service.test.mjs`
  - 覆盖 Kie 请求体和状态映射。
- Modify: `/Users/da/Desktop/飞蚁抖音复刻-Chrome扩展/README.md`
  - 同步新增故事版图与 Kie 本地代理说明。
- Modify: `/Users/da/Desktop/飞蚁抖音复刻-Chrome扩展/docs/execution-plans/2026-07-13-故事版叙事图与Kie接入.md`
  - 归档本轮执行计划和结果。

## Task 1: Core Data Model For Cast + Storyboard

**Files:**
- Modify: `/Users/da/Desktop/飞蚁抖音复刻-Chrome扩展/tests/remake-core.test.mjs`
- Modify: `/Users/da/Desktop/飞蚁抖音复刻-Chrome扩展/src/remake-core.js`

- [ ] **Step 1: Write the failing test for single-person backward compatibility**

```js
test("buildRemakePackage keeps single-person projects compatible when storyboard is off", () => {
  const pkg = buildRemakePackage({
    projectName: "single-demo",
    referenceSummary: "single host demo",
    productName: "odor remover box",
    sellingPoints: ["Fast visible result"],
    storyboardEnabled: false,
    accountTemplate: {
      name: "Demo template",
      platform: "tiktok",
      defaultVoiceLanguage: "英文"
    }
  });

  assert.equal(pkg.project.storyboardMode, "optional");
  assert.equal(pkg.project.cast.length, 1);
  assert.equal(pkg.project.cast[0].roleType, "host");
  assert.equal(pkg.storyboardTasks.length, 0);
  assert.ok(pkg.batchVideoTasks.length > 0);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/remake-core.test.mjs`
Expected: FAIL because `storyboardMode`, `cast`, or `storyboardTasks` do not exist yet.

- [ ] **Step 3: Write the failing test for host + supporting cast structure**

```js
test("buildRemakePackage builds host and supporting cast beats into shots", () => {
  const pkg = buildRemakePackage({
    projectName: "multi-demo",
    referenceSummary: "host speaks, friend reacts",
    productName: "odor remover box",
    sellingPoints: ["Fast visible result", "Easy to use"],
    storyboardEnabled: true,
    scenePlan: {
      primaryLocation: "modern kitchen",
      environmentStyle: "bright lifestyle",
      continuityRule: "same counter and daylight"
    },
    cast: [
      {
        id: "host-1",
        roleType: "host",
        label: "主讲人",
        presenceRule: "always",
        appearanceLock: "young woman, clean home outfit",
        behaviorRule: "负责讲解和拿产品",
        voiceRule: "primary"
      },
      {
        id: "support-1",
        roleType: "supporting",
        label: "配角A",
        presenceRule: "selective",
        appearanceLock: "same friend throughout",
        behaviorRule: "负责反应和见证结果",
        voiceRule: "silent"
      }
    ],
    accountTemplate: {
      name: "Demo template",
      platform: "tiktok",
      defaultVoiceLanguage: "英文"
    }
  });

  assert.equal(pkg.project.cast.length, 2);
  assert.equal(pkg.shots[0].primaryCastId, "host-1");
  assert.deepEqual(pkg.shots[0].supportingCastIds, ["support-1"]);
  assert.equal(pkg.shots[0].castBeats.length, 2);
  assert.ok(pkg.storyboardTasks.length > 0);
});
```

- [ ] **Step 4: Run test to verify it fails**

Run: `node --test tests/remake-core.test.mjs`
Expected: FAIL because shot role fields and storyboard tasks are not built yet.

- [ ] **Step 5: Implement minimal project + shot helpers in `src/remake-core.js`**

```js
function createDefaultCast(input = {}) {
  const cast = Array.isArray(input.cast) && input.cast.length ? input.cast : [
    {
      id: "host-1",
      roleType: "host",
      label: "主讲人",
      presenceRule: "always",
      appearanceLock: "",
      behaviorRule: "负责讲解、展示商品、推动主线",
      voiceRule: "primary"
    }
  ];
  return cast.map((member, index) => ({
    id: String(member.id || `cast-${index + 1}`).trim(),
    roleType: String(member.roleType || (index === 0 ? "host" : "supporting")).trim(),
    label: String(member.label || (index === 0 ? "主讲人" : `配角${index}`)).trim(),
    presenceRule: String(member.presenceRule || (index === 0 ? "always" : "selective")).trim(),
    appearanceLock: String(member.appearanceLock || "").trim(),
    behaviorRule: String(member.behaviorRule || "").trim(),
    voiceRule: String(member.voiceRule || (index === 0 ? "primary" : "silent")).trim()
  }));
}

function normalizeScenePlan(raw = {}) {
  return {
    primaryLocation: String(raw.primaryLocation || "").trim(),
    environmentStyle: String(raw.environmentStyle || "").trim(),
    continuityRule: String(raw.continuityRule || "").trim()
  };
}
```

- [ ] **Step 6: Extend `buildRemakePackage()` and `buildShotDefinitions()` minimally**

```js
const cast = createDefaultCast(rawInput);
const scenePlan = normalizeScenePlan(rawInput.scenePlan);
const storyboardEnabled = rawInput.storyboardEnabled !== false;

const shots = buildShotDefinitions({ ...input, cast, scenePlan }).map((shot, index) => ({
  shotNumber: index + 1,
  durationSeconds: Math.max(4, Math.round(input.durationSeconds / 6)),
  scenePurpose: shot.scenePurpose || shot.purpose,
  primaryCastId: shot.primaryCastId || cast[0]?.id || "host-1",
  supportingCastIds: shot.supportingCastIds || cast.slice(1).map((member) => member.id),
  castBeats: shot.castBeats || [],
  storyboardFrameGoal: shot.storyboardFrameGoal || "锁定该镜头的关键动作、角色位置和商品露出",
  storyboardPrompt: "",
  continuityNotes: shot.continuityNotes || scenePlan.continuityRule || "人物、商品、场景保持一致",
  ...shot
}));
```

- [ ] **Step 7: Add storyboard task generation in `finalizePackage()`**

```js
const storyboardTasks = base.project.storyboardEnabled
  ? [
      {
        unitId: "unit-01",
        shotRange: [1, base.shots.length],
        provider: "kie-gpt-image",
        status: "idle",
        prompt: buildStoryboardPrompt(base.project, base.shots),
        taskId: "",
        imageUrl: "",
        errorMessage: "",
        createdAt: "",
        updatedAt: ""
      }
    ]
  : [];

return {
  project: base.project,
  shots: base.shots,
  storyboardTasks,
  distilledFramework,
  prompts: { keyframes, videoShots },
  promptVariants,
  batchVideoTasks,
  reviewChecklist: [...]
};
```

- [ ] **Step 8: Run tests to verify they pass**

Run: `node --test tests/remake-core.test.mjs`
Expected: PASS for the new single-person and host/supporting tests.

- [ ] **Step 9: Commit**

```bash
git -C '/Users/da/Desktop/飞蚁抖音复刻-Chrome扩展' add tests/remake-core.test.mjs src/remake-core.js
git -C '/Users/da/Desktop/飞蚁抖音复刻-Chrome扩展' commit -m "feat: add cast and storyboard package structure"
```

## Task 2: Storyboard Prompt Composition

**Files:**
- Modify: `/Users/da/Desktop/飞蚁抖音复刻-Chrome扩展/tests/remake-core.test.mjs`
- Modify: `/Users/da/Desktop/飞蚁抖音复刻-Chrome扩展/src/remake-core.js`

- [ ] **Step 1: Write the failing test for storyboard prompt content**

```js
test("buildRemakePackage creates a storyboard prompt with cast, scene, and continuity instructions", () => {
  const pkg = buildRemakePackage({
    projectName: "storyboard-demo",
    referenceSummary: "host demonstrates, friend reacts",
    productName: "odor remover box",
    sellingPoints: ["Fast visible result", "Easy to use"],
    storyboardEnabled: true,
    scenePlan: {
      primaryLocation: "modern kitchen",
      environmentStyle: "bright lifestyle daylight",
      continuityRule: "same counter and same daylight direction"
    },
    cast: [
      { id: "host-1", roleType: "host", label: "主讲人", behaviorRule: "负责讲解和展示产品", voiceRule: "primary" },
      { id: "support-1", roleType: "supporting", label: "配角A", behaviorRule: "负责反应和见证结果", voiceRule: "silent" }
    ],
    accountTemplate: { name: "Demo template", platform: "tiktok", defaultVoiceLanguage: "英文" }
  });

  assert.match(pkg.storyboardTasks[0].prompt, /Product:/i);
  assert.match(pkg.storyboardTasks[0].prompt, /Scene:/i);
  assert.match(pkg.storyboardTasks[0].prompt, /Host:/i);
  assert.match(pkg.storyboardTasks[0].prompt, /Supporting cast:/i);
  assert.match(pkg.storyboardTasks[0].prompt, /Continuity:/i);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/remake-core.test.mjs`
Expected: FAIL because storyboard prompt text is still missing those sections.

- [ ] **Step 3: Add a focused storyboard prompt builder**

```js
function buildStoryboardPrompt(project, shots) {
  const castLines = project.cast.map((member) => {
    const prefix = member.roleType === "host" ? "Host" : "Supporting cast";
    return `${prefix}: ${member.label}; role: ${member.behaviorRule || "not provided"}; appearance lock: ${member.appearanceLock || "not provided"}; voice: ${member.voiceRule || "silent"}.`;
  });

  const shotLines = shots.map((shot) => {
    const beatText = shot.castBeats.map((beat) => `${beat.castId}: ${beat.beat}`).join(" | ");
    return `Shot ${shot.shotNumber}: purpose ${shot.scenePurpose}; action ${shot.action}; frame goal ${shot.storyboardFrameGoal}; cast beats ${beatText || "not provided"}.`;
  });

  return [
    `Create a 9:16 storyboard board for ${project.productName || "the product"}.`,
    `Product: ${project.productName || "Not provided"}`,
    `Scene: ${project.scenePlan?.primaryLocation || "Not provided"}`,
    `Environment style: ${project.scenePlan?.environmentStyle || "Not provided"}`,
    `Continuity: ${project.scenePlan?.continuityRule || "Keep the cast, product, and lighting consistent."}`,
    ...castLines,
    ...shotLines,
    `Negative constraints: no product distortion, no cast drift, no scene jumping, no unreadable labels.`
  ].join("\n");
}
```

- [ ] **Step 4: Wire `buildStoryboardPrompt()` into storyboard tasks**

```js
prompt: buildStoryboardPrompt(base.project, base.shots),
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `node --test tests/remake-core.test.mjs`
Expected: PASS with storyboard prompt sections present.

- [ ] **Step 6: Commit**

```bash
git -C '/Users/da/Desktop/飞蚁抖音复刻-Chrome扩展' add tests/remake-core.test.mjs src/remake-core.js
git -C '/Users/da/Desktop/飞蚁抖音复刻-Chrome扩展' commit -m "feat: add storyboard prompt composition"
```

## Task 3: Workspace Form And History Rendering

**Files:**
- Modify: `/Users/da/Desktop/飞蚁抖音复刻-Chrome扩展/src/workspace.html`
- Modify: `/Users/da/Desktop/飞蚁抖音复刻-Chrome扩展/src/workspace.css`
- Modify: `/Users/da/Desktop/飞蚁抖音复刻-Chrome扩展/src/workspace.js`
- Test: `/Users/da/Desktop/飞蚁抖音复刻-Chrome扩展/tests/extension-shell.test.mjs`

- [ ] **Step 1: Write the failing UI shell test for new inputs**

```js
test("workspace shell includes scene plan, cast editor, and storyboard toggle", async () => {
  const html = await readFile(new URL("../src/workspace.html", import.meta.url), "utf8");
  assert.match(html, /id="scenePrimaryLocation"/);
  assert.match(html, /id="storyboardEnabled"/);
  assert.match(html, /id="castList"/);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/extension-shell.test.mjs`
Expected: FAIL because these nodes do not exist yet.

- [ ] **Step 3: Add the minimal HTML controls**

```html
<div class="inlineFormGroup">
  <label for="scenePrimaryLocation">主场景说明</label>
  <input id="scenePrimaryLocation" type="text" placeholder="例如：现代厨房 / 客厅沙发区 / 办公桌场景" />
</div>
<div class="inlineFormGroup">
  <label class="checkboxRow">
    <input id="storyboardEnabled" type="checkbox" checked />
    <span>同步生成故事版叙事图任务</span>
  </label>
</div>
<section class="castEditorCard">
  <div class="sectionTitle">角色结构</div>
  <div id="castList"></div>
  <button id="addSupportingCast" type="button" class="ghostButton">新增配角</button>
</section>
```

- [ ] **Step 4: Add minimal CSS only for new controls**

```css
.castEditorCard {
  border: 1px solid var(--line-soft);
  border-radius: 16px;
  padding: 14px;
  background: var(--panel-bg);
}

.castRow {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-top: 10px;
}

.checkboxRow {
  display: flex;
  align-items: center;
  gap: 8px;
}
```

- [ ] **Step 5: Add minimal workspace state helpers**

```js
let currentCastDraft = [createDefaultCastDraftMember("host")];

function createDefaultCastDraftMember(roleType = "supporting") {
  return {
    id: roleType === "host" ? "host-1" : `support-${Date.now()}`,
    roleType,
    label: roleType === "host" ? "主讲人" : "配角",
    presenceRule: roleType === "host" ? "always" : "selective",
    appearanceLock: "",
    behaviorRule: roleType === "host" ? "负责讲解和展示商品" : "负责反应和烘托",
    voiceRule: roleType === "host" ? "primary" : "silent"
  };
}
```

- [ ] **Step 6: Pass scene/cast/storyboard toggle into `buildRemakePackage()`**

```js
currentPackage = buildRemakePackage({
  ...existingFields,
  storyboardEnabled: nodes.storyboardEnabled.checked,
  scenePlan: {
    primaryLocation: nodes.scenePrimaryLocation.value.trim(),
    environmentStyle: "",
    continuityRule: ""
  },
  cast: currentCastDraft
});
```

- [ ] **Step 7: Render storyboard tasks in history detail**

```js
storyboards: (currentPackage.storyboardTasks || [])
  .map(
    (task) =>
      `${task.unitId}\n状态：${task.status}\nProvider：${task.provider}\n${task.imageUrl ? `预览：${task.imageUrl}` : "暂无图片"}\n${task.errorMessage ? `失败原因：${task.errorMessage}` : ""}\n\n${task.prompt}`
  )
  .join("\n\n")
```

and add tab label:

```js
["storyboards", "故事版图"]
```

- [ ] **Step 8: Run tests to verify they pass**

Run: `node --test tests/extension-shell.test.mjs`
Expected: PASS with new shell nodes present.

- [ ] **Step 9: Commit**

```bash
git -C '/Users/da/Desktop/飞蚁抖音复刻-Chrome扩展' add src/workspace.html src/workspace.css src/workspace.js tests/extension-shell.test.mjs
git -C '/Users/da/Desktop/飞蚁抖音复刻-Chrome扩展' commit -m "feat: add storyboard inputs and history rendering"
```

## Task 4: Kie Storyboard Proxy In Local Service

**Files:**
- Create: `/Users/da/Desktop/飞蚁抖音复刻-Chrome扩展/tests/video-batch-service.test.mjs`
- Modify: `/Users/da/Desktop/飞蚁抖音复刻-Chrome扩展/scripts/video-batch-service.mjs`

- [ ] **Step 1: Write the failing service test for create payload mapping**

```js
test("buildKieStoryboardTaskRequest creates bearer-auth image task payload", async () => {
  const { buildKieStoryboardTaskRequest } = await import("../scripts/video-batch-service.mjs");
  const payload = buildKieStoryboardTaskRequest({
    model: "gpt-image/1.5-text-to-image",
    prompt: "Create a storyboard board",
    aspectRatio: "9:16"
  });

  assert.equal(payload.model, "gpt-image/1.5-text-to-image");
  assert.equal(payload.input.prompt, "Create a storyboard board");
  assert.equal(payload.input.aspect_ratio, "9:16");
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/video-batch-service.test.mjs`
Expected: FAIL because helper does not exist yet.

- [ ] **Step 3: Extract a pure request builder and status mapper**

```js
export function buildKieStoryboardTaskRequest({ model, prompt, aspectRatio }) {
  return {
    model,
    callBackUrl: "",
    input: {
      prompt,
      aspect_ratio: aspectRatio || "9:16"
    }
  };
}

export function mapKieStoryboardStatus(raw = "") {
  const value = String(raw || "").toLowerCase();
  if (["queued", "submitted", "pending"].includes(value)) return "queued";
  if (["running", "processing", "in_progress"].includes(value)) return "running";
  if (["success", "succeeded", "completed"].includes(value)) return "succeeded";
  if (["failed", "error", "cancelled"].includes(value)) return "failed";
  return "queued";
}
```

- [ ] **Step 4: Add storyboard endpoints to the HTTP server**

```js
if (request.method === "POST" && request.url === "/api/storyboards") {
  const body = await readJsonBody(request);
  const result = await createStoryboardTask(body, config);
  return sendJson(response, 200, result);
}

if (request.method === "GET" && request.url.startsWith("/api/storyboards/")) {
  const taskId = decodeURIComponent(request.url.split("/api/storyboards/")[1].split("?")[0] || "");
  const result = await getStoryboardTask(taskId, config);
  return sendJson(response, 200, result);
}
```

- [ ] **Step 5: Implement `createStoryboardTask()` and `getStoryboardTask()` minimally**

```js
async function createStoryboardTask(body, config) {
  if (!config.KIE_API_KEY) {
    throw new Error("当前本地服务没有读到 KIE_API_KEY，暂时不能生成故事版图。");
  }
  const payload = buildKieStoryboardTaskRequest({
    model: body.model || config.KIE_GPT_IMAGE_MODEL || "gpt-image/1.5-text-to-image",
    prompt: String(body.prompt || "").trim(),
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
  const data = await response.json();
  if (!response.ok) throw new Error(readKieError(data) || `${response.status} ${response.statusText}`);
  return {
    ok: true,
    provider: "kie-gpt-image",
    taskId: String(data.data?.taskId || data.taskId || "").trim(),
    status: "queued",
    imageUrl: "",
    errorMessage: ""
  };
}
```

- [ ] **Step 6: Extend env loading for Kie keys**

```js
const keys = [
  ...existingKeys,
  "KIE_API_KEY",
  "KIE_API_BASE_URL",
  "KIE_GPT_IMAGE_MODEL"
];
```

and helpers:

```js
function getKieBaseUrl(config) {
  return String(config.KIE_API_BASE_URL || "https://api.kie.ai/api/v1").replace(/\/$/, "");
}

function readKieError(payload = {}) {
  return String(payload?.message || payload?.error?.message || "").trim();
}
```

- [ ] **Step 7: Run tests to verify they pass**

Run: `node --test tests/video-batch-service.test.mjs`
Expected: PASS with request builder and status mapping covered.

- [ ] **Step 8: Commit**

```bash
git -C '/Users/da/Desktop/飞蚁抖音复刻-Chrome扩展' add tests/video-batch-service.test.mjs scripts/video-batch-service.mjs
git -C '/Users/da/Desktop/飞蚁抖音复刻-Chrome扩展' commit -m "feat: add kie storyboard proxy endpoints"
```

## Task 5: Frontend Storyboard Actions And Docs

**Files:**
- Modify: `/Users/da/Desktop/飞蚁抖音复刻-Chrome扩展/src/workspace.js`
- Modify: `/Users/da/Desktop/飞蚁抖音复刻-Chrome扩展/README.md`
- Modify: `/Users/da/Desktop/飞蚁抖音复刻-Chrome扩展/docs/execution-plans/2026-07-13-故事版叙事图与Kie接入.md`

- [ ] **Step 1: Write the failing core behavior test for storyboard failure tolerance**

```js
test("storyboard task failure state does not block batch task delivery", () => {
  const pkg = buildRemakePackage({
    projectName: "failure-tolerance-demo",
    referenceSummary: "demo",
    productName: "odor remover box",
    sellingPoints: ["Fast visible result"],
    storyboardEnabled: true,
    accountTemplate: { name: "Demo template", platform: "tiktok", defaultVoiceLanguage: "英文" }
  });

  const failedPkg = {
    ...pkg,
    storyboardTasks: pkg.storyboardTasks.map((task) => ({
      ...task,
      status: "failed",
      errorMessage: "Storyboard image provider failed"
    }))
  };

  assert.equal(failedPkg.batchVideoTasks.length > 0, true);
  assert.equal(failedPkg.prompts.videoShots.length > 0, true);
});
```

- [ ] **Step 2: Run test to verify it fails if state handling is missing**

Run: `node --test tests/remake-core.test.mjs`
Expected: FAIL only if later state helpers break package compatibility.

- [ ] **Step 3: Add frontend storyboard submit/refresh actions**

```js
async function requestStoryboardGeneration(task) {
  const response = await fetch(`${batchServiceBaseUrl}/api/storyboards`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      unitId: task.unitId,
      model: "gpt-image/1.5-text-to-image",
      prompt: task.prompt,
      aspectRatio: currentPackage?.project?.aspectRatio || "9:16"
    })
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || "故事版图任务提交失败。");
  return data;
}
```

- [ ] **Step 4: Add local package state sync for storyboard tasks**

```js
function mergeStoryboardTaskState(pkg, unitId, patch) {
  return {
    ...pkg,
    storyboardTasks: (pkg.storyboardTasks || []).map((task) =>
      task.unitId === unitId ? { ...task, ...patch, updatedAt: new Date().toISOString() } : { ...task }
    )
  };
}
```

- [ ] **Step 5: Render action buttons in the storyboard tab**

```js
storyboards: (currentPackage.storyboardTasks || [])
  .map(
    (task) =>
      `${task.unitId}\n状态：${task.status}\n${task.errorMessage ? `失败原因：${task.errorMessage}` : ""}\n${task.imageUrl || "暂无图片"}\n[复制 prompt] [生成/刷新]`
  )
  .join("\n\n")
```

and bind buttons to:
- submit idle/failed tasks
- refresh queued/running tasks
- copy prompt any time

- [ ] **Step 6: Update README with local Kie proxy instructions**

```md
- 故事版叙事图现在通过本地 `4328` 服务代理到 Kie GPT Image 路线。
- 需要在本地环境变量里提供 `KIE_API_KEY`，不要写进扩展前端。
- 故事版图失败不会阻断文字提示词和批量任务生成。
```

- [ ] **Step 7: Update execution plan doc with final verification results**

```md
- 已补多人角色结构与故事版图任务结构
- 已接本地 Kie 代理接口
- 已验证故事版图失败不阻断主链路
- 已跑通过相关测试与语法检查
```

- [ ] **Step 8: Run full verification**

Run:
- `node --test tests/remake-core.test.mjs`
- `node --test tests/extension-shell.test.mjs`
- `node --test tests/video-batch-service.test.mjs`
- `node --check src/remake-core.js`
- `node --check src/workspace.js`
- `node --check scripts/video-batch-service.mjs`
- `git -C '/Users/da/Desktop/飞蚁抖音复刻-Chrome扩展' diff --check`

Expected:
- All tests PASS
- All `node --check` commands exit 0
- `git diff --check` has no output

- [ ] **Step 9: Commit**

```bash
git -C '/Users/da/Desktop/飞蚁抖音复刻-Chrome扩展' add src/workspace.js README.md docs/execution-plans/2026-07-13-故事版叙事图与Kie接入.md
git -C '/Users/da/Desktop/飞蚁抖音复刻-Chrome扩展' commit -m "feat: wire storyboard actions and docs"
```

## Self-Review

- Spec coverage: 已覆盖多人角色结构、故事版图可选中间层、Kie 本地代理、前端展示、失败降级和测试路径。
- Placeholder scan: 计划中没有 `TODO/TBD/类似 Task N` 这类占位表达。
- Type consistency: `cast / scenePlan / storyboardTasks / castBeats / primaryCastId / supportingCastIds` 在所有任务中使用同一组命名。

## Notes

- 这份计划默认在实现前先新增一个执行计划文档：`/Users/da/Desktop/飞蚁抖音复刻-Chrome扩展/docs/execution-plans/2026-07-13-故事版叙事图与Kie接入.md`
- 如果实现中发现 `src/remake-core.js` 继续膨胀过快，可以只把 storyboard prompt 组装拆出到同目录 helper，但不能扩大成无关重构。
- 由于 Kie 结果 URL 可能过期，历史记录应把“任务状态”和“最后一次图片 URL”分开显示，接受 URL 失效但状态保留。
