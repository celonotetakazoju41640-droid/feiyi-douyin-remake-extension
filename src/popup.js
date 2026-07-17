import { buildDeliveryPackageText, getPlatformLabel } from "./remake-core.js";

const workbenchUrl = new URL("./workspace.html", window.location.href).href;
const storageKey = "feiyi-douyin-fuke-projects";

const nodes = {
  status: document.querySelector("#status"),
  popupHeroSummary: document.querySelector("#popupHeroSummary"),
  result: document.querySelector("#result"),
  taskState: document.querySelector("#taskState"),
  taskSummary: document.querySelector("#taskSummary"),
  latestProjectSnapshot: document.querySelector("#latestProjectSnapshot"),
  openWorkspaceButton: document.querySelector("#openWorkspaceButton"),
  openLatestProjectButton: document.querySelector("#openLatestProjectButton"),
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
  renderPopupHeroSummary();
  renderLatestProjectPanel();
  renderProjectList();

  nodes.openWorkspaceButton?.addEventListener("click", () => window.open(workbenchUrl, "_blank"));
  nodes.openLatestProjectButton?.addEventListener("click", () => {
    window.open(workbenchUrl, "_blank");
  });
  nodes.copySummaryButton?.addEventListener("click", copySelectedSummary);
  nodes.copyClipcatButton?.addEventListener("click", copySelectedDeliverySummary);
}

function loadProjects() {
  try {
    return JSON.parse(localStorage.getItem(storageKey) || "[]");
  } catch {
    return [];
  }
}

function getSelectedPackage() {
  return projects[selectedProjectIndex]?.package || projects[0]?.package || null;
}

function getPopupPrimaryActionLabel(pkg) {
  if (!pkg) return "打开生成工作台";
  const deliverySummary = String(pkg.workflowStatus?.deliveryStatusSummary || "").trim();
  if (/^一键带走完成/.test(deliverySummary)) return "查看最近结果";
  if (/^一键带走部分完成/.test(deliverySummary)) return "继续带走结果";
  return "继续这轮生成";
}

function renderPopupHeroSummary() {
  const pkg = getSelectedPackage();
  if (!nodes.popupHeroSummary) return;
  if (!pkg) {
    nodes.popupHeroSummary.textContent = "先选蒸馏模型，再传商品图，剩下交给系统自动往下走。";
    return;
  }
  const templateName = pkg.project.accountTemplate?.name || "当前模型";
  const productName = pkg.project.productName || "当前商品";
  nodes.popupHeroSummary.textContent = `最近一轮按“${templateName} / ${productName}”在跑。点进去继续识别、补提示词和带走结果。`;
}

function renderLatestProjectPanel() {
  const pkg = getSelectedPackage();
  if (!pkg) {
    nodes.taskState.textContent = "未开始";
    nodes.taskSummary.textContent = "还没有最近项目，先打开生成工作台跑第一轮。";
    nodes.latestProjectSnapshot.innerHTML = '<p class="emptyState">生成完成后，这里会直接显示模板、卖点、任务数和下一步。</p>';
    nodes.copySummaryButton.disabled = true;
    nodes.copyClipcatButton.disabled = true;
    nodes.openLatestProjectButton.textContent = "查看最近结果";
    nodes.result.textContent = "还没有本地项目。点击“打开生成工作台”开始。";
    return;
  }

  const taskCount = pkg.batchVideoTasks?.length || 0;
  const storyboardCount = pkg.storyboardTasks?.length || 0;
  const firstSellingPoint = pkg.project.sellingPoints?.[0] || "等待系统按当前商品图自动提炼";
  const deliverySummary = String(pkg.workflowStatus?.deliveryStatusSummary || "").trim() || "结果还没带走";
  const templateName = pkg.project.accountTemplate?.name || "未命名模型";
  const productName = pkg.project.productName || "未填写商品";
  nodes.taskState.textContent = storyboardCount || taskCount ? "进行中" : "已生成";
  nodes.taskSummary.textContent = `${productName}，${taskCount} 条任务，${storyboardCount} 张故事版。`;
  nodes.latestProjectSnapshot.innerHTML = `
    <div class="projectSnapshotGrid">
      <span class="snapshotChip">模板：${escapeHtml(templateName)}</span>
      <span class="snapshotChip">商品：${escapeHtml(productName)}</span>
      <span class="snapshotChip">主卖点：${escapeHtml(firstSellingPoint)}</span>
      <span class="snapshotChip">当前阶段：${escapeHtml(deliverySummary)}</span>
    </div>
  `;
  nodes.copySummaryButton.disabled = false;
  nodes.copyClipcatButton.disabled = false;
  nodes.openLatestProjectButton.textContent = getPopupPrimaryActionLabel(pkg);
  nodes.result.textContent = [
    `最近项目：${pkg.project.projectName}`,
    `模板：${templateName}`,
    `商品：${productName}`,
    `卖点：${(pkg.project.sellingPoints || []).join(" / ") || "未填写"}`,
    `参考平台：${getPlatformLabel(pkg.project.clipcatConfig?.referencePlatform)}`,
    `当前阶段：${deliverySummary}`
  ].join("\n");
}

function renderProjectList() {
  nodes.projectCount.textContent = `${projects.length} 个`;
  if (!projects.length) {
    nodes.projectList.innerHTML = '<p class="emptyState">还没有本地项目。</p>';
    return;
  }
  nodes.projectList.innerHTML = projects
    .slice(0, 4)
    .map((item, index) => {
      const pkg = item.package;
      const isActive = index === selectedProjectIndex ? " is-active" : "";
      return `
        <button class="projectCard${isActive}" type="button" data-project-index="${index}">
          <strong>${escapeHtml(pkg.project.projectName)}</strong>
          <span>${escapeHtml(pkg.project.productName || "未填写商品")}</span>
          <small>${pkg.batchVideoTasks?.length || 0} 条任务 / ${escapeHtml(pkg.project.accountTemplate?.name || "未命名模型")}</small>
        </button>
      `;
    })
    .join("");

  nodes.projectList.querySelectorAll("[data-project-index]").forEach((button) => {
    button.addEventListener("click", () => {
      selectedProjectIndex = Number(button.dataset.projectIndex || 0);
      renderPopupHeroSummary();
      renderLatestProjectPanel();
      renderProjectList();
    });
  });
}

async function copySelectedSummary() {
  const pkg = getSelectedPackage();
  if (!pkg) return;
  const text = [
    `项目：${pkg.project.projectName}`,
    `商品：${pkg.project.productName || "未填写"}`,
    `卖点：${(pkg.project.sellingPoints || []).join(" / ") || "未填写"}`,
    `提示词草稿：${pkg.project.referenceSummary || "未填写"}`
  ].join("\n");
  await navigator.clipboard.writeText(text);
  nodes.result.textContent = `已复制提示词草稿：\n${text}`;
}

async function copySelectedDeliverySummary() {
  const pkg = getSelectedPackage();
  if (!pkg) return;
  const text = buildDeliveryPackageText(pkg);
  await navigator.clipboard.writeText(text);
  nodes.result.textContent = `已复制结果包摘要：\n${text}`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}
