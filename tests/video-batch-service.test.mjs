import test from "node:test";
import assert from "node:assert/strict";

import {
  buildKieStoryboardTaskRequest,
  buildDeepDistillPrompt,
  mapKieStoryboardStatus
} from "../scripts/video-batch-service.mjs";

test("buildKieStoryboardTaskRequest creates bearer-auth image task payload", () => {
  const payload = buildKieStoryboardTaskRequest({
    model: "gpt-image/1.5-text-to-image",
    prompt: "Create a storyboard board",
    aspectRatio: "9:16"
  });

  assert.equal(payload.model, "gpt-image/1.5-text-to-image");
  assert.equal(payload.input.prompt, "Create a storyboard board");
  assert.equal(payload.input.aspect_ratio, "9:16");
});

test("mapKieStoryboardStatus normalizes provider states", () => {
  assert.equal(mapKieStoryboardStatus("pending"), "queued");
  assert.equal(mapKieStoryboardStatus("processing"), "running");
  assert.equal(mapKieStoryboardStatus("completed"), "succeeded");
  assert.equal(mapKieStoryboardStatus("error"), "failed");
  assert.equal(mapKieStoryboardStatus("unknown"), "queued");
});

test("buildDeepDistillPrompt asks for timeline-based structure analysis instead of generic summary", () => {
  const prompt = buildDeepDistillPrompt({
    fileName: "demo.mp4",
    relativePath: "folder/demo.mp4",
    durationSeconds: 28,
    frames: [
      { label: "开场首帧", second: 0 },
      { label: "商品首次强露出", second: 8.4 }
    ]
  });

  assert.match(prompt, /关键帧时间线/);
  assert.match(prompt, /多人互动|配角反应|见证式对照/);
  assert.match(prompt, /sceneProgression 必须按时间顺序描述/);
  assert.match(prompt, /summary 必须写成一条能直接指导复刻的结构总结/);
});
