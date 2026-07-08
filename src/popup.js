import { buildSafeClipcatPrompt, getPlatformLabel } from "./remake-core.js";

const workbenchUrl = new URL("./workspace.html", window.location.href).href;
const storageKey = "feiyi-douyin-fuke-projects";

const nodes = {
  status: document.querySelector("#status"),
  result: document.querySelector("#result"),
  taskState: document.querySelector("#taskState"),
  taskSummary: document.querySelector("#taskSummary"),
  openRemakeButton: document.querySelector("#openRemakeButton"),
  openProjectsButton: document.querySelector("#openProjectsButton"),
  runSyButton: document.querySelector("#runSyButton"),
  openDirButton: document.querySelector("#openDirButton"),
  projectCount: document.querySelector("#projectCount"),
  projectList: document.querySelector("#projectList"),
  copySummaryButton: document.querySelector("#copySummaryButton"),
  copyClipcatButton: document.querySelector("#copyClipcatButton")
};

let projects = [];
let selectedProjectIndex = 0;

init();

function init() {
  nodes.status.textContent = "本地可用";
  projects = loadProjects();
  if (projects.length > 0) {
    const latest = getSelectedPackage();
    nodes.taskState.textContent = "已生成";
    nodes.taskSummary.textContent = `${latest.project.projectName}，共 ${latest.shots.length} 个镜头。`;
    nodes.runSyButton.disabled = false;
    nodes.openDirButton.disabled = false;
    nodes.copySummaryButton.disabled = false;
    nodes.copyClipcatButton.disabled = false;
    renderResult(latest);
  } else {
    nodes.result.textContent = "还没有本地复刻项目。点击“打开复刻工作台”开始。";
  }
  renderProjectList();

  nodes.openRemakeButton.addEventListener("click", () => window.open(workbenchUrl, "_blank"));
  nodes.openProjectsButton.addEventListener("click", () => window.open(workbenchUrl, "_blank"));
  nodes.runSyButton.addEventListener("click", () => window.open(workbenchUrl, "_blank"));
  nodes.openDirButton.addEventListener("click", () => {
    nodes.result.textContent = `工作台文件位置：\n${workbenchUrl}`;
  });
  nodes.copySummaryButton.addEventListener("click", copySelectedSummary);
  nodes.copyClipcatButton.addEventListener("click", copySelectedClipcatPrompt);
}

function loadProjects() {
  try {
    return JSON.parse(localStorage.getItem(storageKey) || "[]");
  } catch {
    return [];
  }
}

function renderProjectList() {
  nodes.projectCount.textContent = `${projects.length} 个`;
  if (projects.length === 0) {
    nodes.projectList.innerHTML = `<p class="emptyState">还没有本地项目。</p>`;
    return;
  }

  nodes.projectList.innerHTML = projects
    .slice(0, 5)
    .map((item, index) => {
      const pkg = item.package;
      const selectedClass = index === selectedProjectIndex ? " is-active" : "";
      return `
        <button class="projectCard${selectedClass}" type="button" data-project-index="${index}">
          <strong>${escapeHtml(pkg.project.projectName)}</strong>
          <span>${escapeHtml(pkg.project.productName || "未填写商品")}</span>
          <small>${pkg.shots.length} 个镜头 / ${escapeHtml(pkg.project.hookStyle || "未填写风格")}</small>
        </button>
      `;
    })
    .join("");

  nodes.projectList.querySelectorAll("[data-project-index]").forEach((button) => {
    button.addEventListener("click", () => {
      selectedProjectIndex = Number(button.dataset.projectIndex);
      const pkg = getSelectedPackage();
      nodes.taskState.textContent = "已生成";
      nodes.taskSummary.textContent = `${pkg.project.projectName}，共 ${pkg.shots.length} 个镜头。`;
      renderProjectList();
      renderResult(pkg);
    });
  });
}

function getSelectedPackage() {
  return projects[selectedProjectIndex]?.package || projects[0]?.package;
}

function renderResult(pkg) {
  const referencePlatform = getPlatformLabel(pkg.project.clipcatConfig?.referencePlatform);
  nodes.result.textContent = [
    `最近项目：${pkg.project.projectName}`,
    `商品：${pkg.project.productName || "未填写"}`,
    `卖点：${(pkg.project.sellingPoints || []).join(" / ") || "未填写"}`,
    `时长：${pkg.project.durationSeconds || 0} 秒`,
    `参考平台：${referencePlatform}`,
    `参考短视频链接：${pkg.project.clipcatConfig?.tiktokUrl || "未填写"}`
  ].join("\n");
}

async function copySelectedSummary() {
  const pkg = getSelectedPackage();
  if (!pkg) return;
  const text = [
    `项目：${pkg.project.projectName}`,
    `参考摘要：${pkg.project.referenceSummary || "未填写"}`,
    `商品：${pkg.project.productName || "未填写"}`,
    `卖点：${(pkg.project.sellingPoints || []).join(" / ") || "未填写"}`,
    `钩子风格：${pkg.project.hookStyle || "未填写"}`,
    `视觉风格：${pkg.project.visualStyle || "未填写"}`
  ].join("\n");
  await navigator.clipboard.writeText(text);
  nodes.result.textContent = `已复制项目摘要：\n${text}`;
}

async function copySelectedClipcatPrompt() {
  const pkg = getSelectedPackage();
  if (!pkg) return;
  const clipcatConfig = pkg.project.clipcatConfig || {};
  const text = buildSafeClipcatPrompt({
    productName: pkg.project.productName || "当前商品",
    productImageCount: clipcatConfig.productImageCount || 1,
    tiktokUrl: clipcatConfig.tiktokUrl || "",
    referencePlatform: clipcatConfig.referencePlatform || "tiktok",
    durationSeconds: pkg.project.durationSeconds || 15,
    voiceLanguage: clipcatConfig.voiceLanguage || "英文",
    extraRules: clipcatConfig.extraRules || "不要字幕，保留强钩子。"
  });
  await navigator.clipboard.writeText(text);
  nodes.result.textContent = `已复制 Clipcat 指令：\n${text}`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}
