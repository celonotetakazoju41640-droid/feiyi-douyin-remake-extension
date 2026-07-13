# 故事版叙事图与 Kie 生图接入设计

## 用户原始目标

在现有飞蚁抖音复刻 Chrome 扩展里，补一层“导演级中间层”：

1. 把当前蒸馏结果继续拆成更可执行的故事版叙事图 / Unit 级镜头计划。
2. 支持单人带货，也把“主讲人 + 配角/群演烘托”这一类多人互动正式纳入数据结构。
3. 故事版图只作为可选中间产物，不阻断现有提示词和批量任务主链路。
4. 故事版图生图走 Kie 官方 API，并优先使用 GPT Image 路线。
5. Kie API Key 不进入前端，继续复用现有本地 `127.0.0.1:4328` 服务做代理。

## 我对本次任务的理解

这次不是重做整条视频生产链，也不是把现有“生成 -> 历史记录 -> 提交生成”链路推翻。

本次是给现有链路补一层更稳定的中间表示：

- 以前：蒸馏结果 -> 镜头表 / prompt / batch task
- 现在：蒸馏结果 -> 故事版叙事图结构 -> 故事版图任务（可选） -> 镜头 prompt / 视频 prompt / batch task

这层中间表示的价值主要有 4 个：

1. 更稳地约束人物、商品、场景和节奏连续性。
2. 让单人带货和多人烘托都能落到结构化镜头任务，而不是全靠长 prompt 自由发挥。
3. 让“故事版图失败但文字 prompt 成功”这种部分成功状态变成正式支持场景。
4. 为后续接更多 provider、更多多角色玩法预留稳定数据结构。

## 当前已确认事实

1. 当前前端主工作台在 `src/workspace.js`，核心 prompt / package 拼装逻辑在 `src/remake-core.js`。
2. 当前项目已存在本地服务入口，前端默认请求 `http://127.0.0.1:4328`。
3. 当前本地服务脚本在 `scripts/video-batch-service.mjs`，已经承担本地代理职责。
4. Kie 官方文档明确使用 Bearer Token 认证，官方不建议把 API Key 暴露在前端。
5. Kie 任务是异步模式：先创建任务，再根据 taskId 查状态和结果。
6. 当前 `buildRemakePackage()` 产物仍建立在“单商品 + 单场景 + 单主线人物假设”上，尚未正式支持角色层。
7. 当前主链路已经支持：项目摘要、蒸馏摘要、镜头表、候选版本、批量视频任务、历史记录、提交生成。

## 设计目标

### 必须做到

1. 继续保留现有主链路可用。
2. 故事版图为可选中间产物，不是强依赖。
3. 支持主讲人 + 配角/群演烘托的数据结构。
4. 前端不保存、不透出 Kie API Key。
5. Kie 生图任务失败时，不影响视频 prompt 和 batch task 的产出。
6. 历史记录可看到故事版图任务状态、结果和失败原因。

### 明确不做

1. 本轮不替换现有视频生成 provider。
2. 本轮不把故事版图变成视频 prompt 的唯一前置条件。
3. 本轮不做真正的“双主角平行叙事”复杂编排，只做结构预留。
4. 本轮不重做整个 UI，不引入大规模新页面。
5. 本轮不把 Kie 单价、成本规则写死在前端文案里。

## 方案对比

### 方案 A：只给 shot 增加文本备注

做法：
- 在现有 `shot` 上追加 `peopleNote`、`interactionNote`、`storyboardPrompt` 等大文本字段。

优点：
- 改动小。
- 上线快。

缺点：
- 多角色职责不结构化。
- 后续故事版图、角色一致性、多人扩展都容易失控。
- 很快会演变成“把更多长 prompt 塞进同一个字段”。

结论：不推荐。

### 方案 B：角色结构化 + 故事版任务化

做法：
- 在 `project` 增加角色列表和场景计划。
- 在 `shot` 增加角色分工和故事版目标。
- 在 `package` 增加故事版任务与状态。
- 本地服务新增 Kie 任务创建 / 查询 / 状态映射。

优点：
- 兼容当前主链路。
- 适合后续接单人 / 多人。
- 可持续扩展。
- 更适合 TDD。

缺点：
- 需要补数据结构、前端显示和服务代理。

结论：推荐。

### 方案 C：一步到位做完整导演板系统

做法：
- 一次性引入角色弧线、镜头语法、转场板、场景分层、多人关系图等完整系统。

优点：
- 理论上最完整。

缺点：
- 第一版范围过大。
- 高概率拖慢现有主链路和交付节奏。

结论：当前不适合。

## 选定方案

采用方案 B：角色结构化 + 故事版任务化。

## 总体架构

### 1. 核心层：`src/remake-core.js`

负责把用户输入、模板蒸馏和视频深蒸馏结果继续组织成：

- 项目级故事版计划
- 角色结构
- 镜头级角色分工
- 故事版图 prompt
- 视频 prompt
- 批量任务

它仍然是“纯拼装核心”，不直接发网络请求。

### 2. 前端层：`src/workspace.js` + `src/workspace.html`

负责：

- 收集最小必要的新输入
- 显示多人角色结构
- 显示故事版图任务状态
- 触发本地服务去跑 Kie
- 保持历史记录和当前项目同步

### 3. 服务层：`scripts/video-batch-service.mjs`

负责：

- 读取本地环境变量中的 Kie Key
- 向 Kie 创建故事版图任务
- 根据 taskId 查询任务状态
- 统一把任务结果映射成前端能理解的状态
- 不把 API Key 回传给扩展

## 数据结构设计

### 项目级新增字段

在 `project` 上新增：

```js
{
  storyboardMode: "optional",
  scenePlan: {
    primaryLocation: "",
    environmentStyle: "",
    continuityRule: ""
  },
  cast: [
    {
      id: "host-1",
      roleType: "host",
      label: "主讲人",
      presenceRule: "always",
      appearanceLock: "",
      behaviorRule: "负责讲解、展示商品、推动主线",
      voiceRule: "primary"
    },
    {
      id: "support-1",
      roleType: "supporting",
      label: "配角A",
      presenceRule: "selective",
      appearanceLock: "",
      behaviorRule: "负责反应、见证、烘托结果",
      voiceRule: "silent"
    }
  ]
}
```

### 镜头级新增字段

在 `shot` 上新增：

```js
{
  scenePurpose: "",
  primaryCastId: "host-1",
  supportingCastIds: ["support-1"],
  castBeats: [
    {
      castId: "host-1",
      beat: "拿出商品并完成主说明"
    },
    {
      castId: "support-1",
      beat: "给出惊讶或认可反应"
    }
  ],
  storyboardFrameGoal: "锁住这个镜头最关键的连续性信息",
  storyboardPrompt: "",
  continuityNotes: "人物外观、商品外观、主场景保持一致"
}
```

### 故事版任务结构

在 `package` 上新增：

```js
{
  storyboardTasks: [
    {
      unitId: "unit-01",
      shotRange: [1, 6],
      provider: "kie-gpt-image",
      status: "idle",
      prompt: "",
      taskId: "",
      imageUrl: "",
      errorMessage: "",
      createdAt: "",
      updatedAt: ""
    }
  ]
}
```

### 状态枚举

故事版图任务状态统一为：

- `idle`：未开始
- `queued`：已提交 Kie，等待处理中
- `running`：Kie 正在生成
- `succeeded`：成功返回故事版图
- `failed`：失败

## Prompt 生成逻辑

### 核心变化

当前 `buildShotDefinitions()` 主要围绕“镜头任务 + 商品任务 + 口播意图”生成。新版本在此基础上补两层：

1. 角色层：谁负责推进、谁负责烘托。
2. 故事版层：这个镜头的画面冻结目标是什么。

### 单人 / 多人统一策略

第一版的统一规则：

- 永远只有一个 `primaryCastId`
- 可以有 0-N 个 `supportingCastIds`
- 多人镜头仍然默认“主讲人驱动主线，配角只烘托，不接管主叙事”

这样能兼容单人：
- 单人就是 `supportingCastIds = []`

也兼容多人：
- 主讲人负责说和卖
- 配角负责反应、对照、见证、陪衬

### 故事版图 prompt 策略

每个 storyboard task 不直接对应一个 shot，而是对应一组 shot 的故事版板图。

第一版建议：
- 每个 Unit 对应 1 张故事版图
- 每张故事版图内固定是 `6 格或 9 格竖版关键帧`
- 由 shot range 拼成一张高信息密度板图

故事版 prompt 内容应固定包含：

- 整板用途
- Product / Unit / Time Range / Duration
- 主场景统一描述
- 角色统一描述
- 商品一致性要求
- 每格 shot 任务
- 每格角色任务
- 连续性要求
- 英文信息栏要求
- 负面约束

### 视频 prompt 策略

视频 prompt 继续沿用现有逻辑，但多补两类信息：

- 角色职责推进
- 对应故事版图中的关键冻结点

## Kie 接入设计

### 接入位置

只在 `scripts/video-batch-service.mjs` 中接入 Kie。

原因：

1. 现有前端已经走 `4328` 本地服务。
2. Kie key 不应进扩展前端。
3. Kie 是异步任务制，服务层更适合做任务管理。

### 环境变量

新增：

- `KIE_API_KEY`
- `KIE_API_BASE_URL`（默认 `https://api.kie.ai/api/v1` 或按官方文档实际值）
- `KIE_GPT_IMAGE_MODEL`（默认先配成文档中对应的 GPT Image 文生图模型）

### 服务端新增接口

建议新增：

1. `POST /api/storyboards`
   - 输入：项目摘要、storyboard task prompt、尺寸、模型配置
   - 输出：本地映射后的 task record

2. `GET /api/storyboards/:taskId`
   - 查询单个任务最新状态

3. `POST /api/storyboards/:taskId/refresh`
   - 主动刷新一次状态

### 服务内部流程

1. 前端提交某个 storyboard task 的 prompt
2. 本地服务创建 Kie 任务
3. 本地服务记录本地 task 状态
4. 前端定时刷新或手动刷新
5. 本地服务查询 Kie 状态并映射成：`queued/running/succeeded/failed`
6. 如果成功，把图片 URL 返给前端
7. 图片 URL 与任务状态一起存入本地 runtime 记录

### 状态映射原则

必须做到：
- Kie 的原始状态和错误信息保留在服务日志或本地状态里
- 前端只吃项目内统一状态，不直接依赖 Kie 原始字段名

## 前端 UI 最小改动

### 生成页新增

第一版只补最小输入：

1. `主场景说明`
   - 例如：现代厨房 / 客厅沙发区 / 办公桌场景

2. `角色结构`
   - 默认提供：
     - 主讲人
     - 配角A（可删）
   - 每个角色最少可填：
     - 名称
     - 角色类型
     - 外观锁定
     - 主要职责

3. `故事版图开关`
   - 默认开，但可关闭
   - 关闭后不创建 storyboard task，只继续走原有 prompt 主链路

### 历史记录新增

在现有结果详情里新增一个 tab：

- `故事版图`

内容显示：
- 每个 Unit 的故事版任务状态
- 故事版图预览（成功时）
- 故事版图失败原因（失败时）
- 复制故事版 prompt
- 重新发起该 Unit 故事版图

### 明确不改

- 不新增独立新页面
- 不重做左侧栏目结构
- 不改变当前生成 -> history 自动跳转行为

## 容错与失败策略

### 必须支持部分成功

如果故事版图失败：
- `batchVideoTasks` 仍然生成
- `prompts.videoShots` 仍然生成
- `prompts.keyframes` 仍然生成
- 历史记录里清楚显示：故事版图失败，但文字提示词已交付

### 必须避免前端死锁

即使 Kie 接口不可用：
- 前端主生成链路也不能卡死
- 故事版图模块应降级为“失败但可重试”

## 测试策略

### 核心层测试：`tests/remake-core.test.mjs`

新增最小断言：

1. 单人项目仍可生成旧结构兼容结果
2. 多人项目会生成 `cast`
3. 多人项目的 shot 会带 `primaryCastId`、`supportingCastIds`、`castBeats`
4. 故事版开关开启时会生成 `storyboardTasks`
5. 故事版开关关闭时不会生成 `storyboardTasks`
6. 故事版失败不影响视频 prompt / batch task 生成

### 服务层测试

建议新增：

- `tests/video-batch-service.test.mjs`

最小覆盖：
1. 创建 storyboard task 请求体正确
2. Kie 状态能映射成项目统一状态
3. Kie 返回失败时，错误信息能保留
4. 查询不到 taskId 时返回明确错误

## 验收标准

### 代码层

1. 单人项目生成链路不回归。
2. 多人角色结构能进入 package。
3. 每个 Unit 都能生成故事版 prompt。
4. Kie 任务通过本地服务创建与查询。
5. Kie key 不进入前端代码。
6. 故事版失败不阻断原视频 prompt 主链路。

### 页面层

1. 生成页能录入主场景和角色结构。
2. 历史记录能看到故事版图任务状态。
3. 成功时可看到故事版图预览。
4. 失败时能看到明确失败原因且可重试。

### 业务层

1. 项目从“只会吐 prompt”升级为“会先组织导演级中间层”。
2. 单人带货和主讲人 + 配角烘托都能挂在统一结构上。
3. 后续若接双主角 / 多角色接力推进，不需要推翻第一版结构。

## 风险

1. `src/remake-core.js` 当前已较大，继续堆逻辑会更难维护。
2. 故事版图 prompt 很长，若全部硬塞一个函数，后续会再次失控。
3. Kie 结果 URL 可能有过期策略，需要在历史记录里接受“可失效但任务状态保留”。
4. 多人结构第一版若 UI 放太多字段，会破坏当前生成页的简洁度。

## 风险应对

1. 允许在实现阶段把故事版 prompt 拼装拆到更小 helper，但只在与本次目标直接相关范围内进行。
2. 第一版 UI 只暴露最少字段，不把双主角复杂玩法提到前台。
3. 本地服务只代理故事版图，不动现有视频任务提交 provider。
4. 保留“故事版图关闭”开关，保证生产可降级。

## 下一步

这份 spec 确认后，再进入 implementation plan：

- 先写 failing tests
- 再补 `remake-core` 结构
- 再补 `workspace` 最小 UI
- 再补 `video-batch-service` 的 Kie 代理
- 最后跑最小链路验证
