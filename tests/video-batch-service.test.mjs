import test from "node:test";
import assert from "node:assert/strict";

import {
  buildKieStoryboardTaskRequest,
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
