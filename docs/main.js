const nodeDetails = {
  upload: {
    title: "CSV Upload",
    description:
      "Receives raw CSV files, validates file format, and hands structured rows to the cleaning engine.",
    inputs: "Raw CSV files from user",
    outputs: "Parsed tabular records",
    failure: "Invalid file guard + schema-safe parsing",
  },
  cleaning: {
    title: "Cleaning Engine",
    description:
      "Normalizes headers, trims whitespace, removes duplicates/empty rows, and prepares a stable DataFrame contract.",
    inputs: "Parsed CSV records",
    outputs: "Cleaned CSV + schema metadata",
    failure: "Rule-based cleanup + fallback diagnostics",
  },
  notebook: {
    title: "Notebook Builder",
    description:
      "Creates an interactive notebook sequence and maps each cleaning step to executable Python cells.",
    inputs: "Cleaned dataset + template",
    outputs: "Guided notebook cells",
    failure: "Template fallback and safe defaults",
  },
  pyodide: {
    title: "Pyodide Runtime",
    description:
      "Runs Python directly in-browser for reproducible execution without server compute.",
    inputs: "Python code cells",
    outputs: "Execution outputs/errors",
    failure: "Error tracing + auto-repair loop",
  },
  auth: {
    title: "Firebase Auth",
    description:
      "Provides secure sign-up/sign-in with verification and session-scoped account identity.",
    inputs: "Email/password credentials",
    outputs: "User session token",
    failure: "Verified-email checks + guarded flows",
  },
  storage: {
    title: "Firestore + Local Cache",
    description:
      "Persists user profiles and work snapshots in cloud; local browser fallback keeps continuity during sync failures.",
    inputs: "User work artifacts",
    outputs: "Saved/reloadable workspace",
    failure: "Cloud/local dual-path persistence",
  },
  dashboard: {
    title: "User Dashboard",
    description:
      "Exposes profile controls, saved work management, and continuity features across sessions.",
    inputs: "Account + saved artifacts",
    outputs: "Resumable user workflow",
    failure: "Transparent state/status messaging",
  },
  assistant: {
    title: "Local AI Assistant",
    description:
      "Combines deterministic repair with local neural fallback to resolve common Python runtime failures.",
    inputs: "Cell code + traceback",
    outputs: "Auto-corrected code suggestions/repairs",
    failure: "Rule-first + model fallback with safety checks",
  },
};

const nodes = document.querySelectorAll(".arch-node");
const lines = document.querySelectorAll(".arch-line");
const archDetail = document.getElementById("archDetail");

function renderNode(nodeKey, flows) {
  const details = nodeDetails[nodeKey];
  if (!details || !archDetail) return;

  archDetail.innerHTML = `
    <h3>${details.title}</h3>
    <p>${details.description}</p>
    <ul>
      <li><strong>Inputs:</strong> ${details.inputs}</li>
      <li><strong>Outputs:</strong> ${details.outputs}</li>
      <li><strong>Failure Handling:</strong> ${details.failure}</li>
    </ul>
  `;

  lines.forEach((line) => {
    const flow = line.getAttribute("data-flow") || "";
    line.classList.toggle("active", flows.includes(flow));
  });

  nodes.forEach((node) => {
    const key = node.getAttribute("data-node");
    node.classList.toggle("active", key === nodeKey);
  });
}

nodes.forEach((node) => {
  node.addEventListener("click", () => {
    const nodeKey = node.getAttribute("data-node") || "";
    const flows = (node.getAttribute("data-flows") || "")
      .split(" ")
      .filter(Boolean);
    renderNode(nodeKey, flows);
  });
});

if (nodes.length > 0) {
  const firstNode = nodes[0];
  const key = firstNode.getAttribute("data-node") || "";
  const flows = (firstNode.getAttribute("data-flows") || "")
    .split(" ")
    .filter(Boolean);
  renderNode(key, flows);
}

const chartInstances = new Map();
let chartsInitialized = false;
let resizeTimerId = null;

function enforceCanvasFrameSize(canvasId) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const frame = canvas.closest(".chart-frame");
  if (!frame) return;

  const width = Math.max(1, Math.floor(frame.clientWidth));
  const height = Math.max(1, Math.floor(frame.clientHeight));
  canvas.width = width;
  canvas.height = height;
}

function createOrReplaceChart(canvasId, config) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;

  const existing = chartInstances.get(canvasId);
  if (existing) {
    existing.destroy();
  }

  enforceCanvasFrameSize(canvasId);
  const chart = new Chart(canvas, config);
  chartInstances.set(canvasId, chart);
}

function makeCharts() {
  if (typeof Chart === "undefined" || chartsInitialized) return;
  chartsInitialized = true;

  Chart.defaults.animation = false;
  Chart.defaults.responsive = true;
  Chart.defaults.maintainAspectRatio = false;

  const baseGrid = "rgba(171, 192, 210, 0.25)";
  const baseTicks = "#d5e0eb";

  createOrReplaceChart("trendChart", {
    type: "line",
    data: {
      labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug"],
      datasets: [
        {
          label: "Avg Processing Time (minutes)",
          data: [14.8, 13.5, 11.9, 9.8, 8.6, 7.3, 6.1, 5.2],
          borderColor: "#36c7a0",
          backgroundColor: "rgba(54, 199, 160, 0.18)",
          fill: true,
          tension: 0.28,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
      resizeDelay: 200,
      plugins: { legend: { labels: { color: baseTicks } } },
      scales: {
        x: { ticks: { color: baseTicks }, grid: { color: baseGrid } },
        y: { ticks: { color: baseTicks }, grid: { color: baseGrid } },
      },
    },
  });

  createOrReplaceChart("barChart", {
    type: "bar",
    data: {
      labels: ["Ingestion", "Cleaning", "Validation", "Notebook Prep", "Debug"],
      datasets: [
        {
          label: "Manual Baseline",
          data: [22, 34, 18, 16, 29],
          backgroundColor: "rgba(243, 166, 74, 0.8)",
        },
        {
          label: "Notebook Studio",
          data: [7, 10, 6, 5, 9],
          backgroundColor: "rgba(54, 199, 160, 0.85)",
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
      resizeDelay: 200,
      plugins: { legend: { labels: { color: baseTicks } } },
      scales: {
        x: { ticks: { color: baseTicks }, grid: { color: baseGrid } },
        y: { ticks: { color: baseTicks }, grid: { color: baseGrid } },
      },
    },
  });

  createOrReplaceChart("radarChart", {
    type: "radar",
    data: {
      labels: ["Completeness", "Consistency", "Uniqueness", "Traceability", "Reusability"],
      datasets: [
        {
          label: "Before",
          data: [42, 48, 51, 35, 44],
          borderColor: "#f3a64a",
          backgroundColor: "rgba(243, 166, 74, 0.2)",
        },
        {
          label: "After",
          data: [86, 89, 92, 80, 88],
          borderColor: "#36c7a0",
          backgroundColor: "rgba(54, 199, 160, 0.2)",
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
      resizeDelay: 200,
      plugins: { legend: { labels: { color: baseTicks } } },
      scales: {
        r: {
          angleLines: { color: baseGrid },
          grid: { color: baseGrid },
          pointLabels: { color: baseTicks },
          ticks: { color: baseTicks, backdropColor: "transparent" },
        },
      },
    },
  });

  createOrReplaceChart("scatterChart", {
    type: "scatter",
    data: {
      datasets: [
        {
          label: "Manual Process",
          data: [
            { x: 5, y: 21 },
            { x: 10, y: 37 },
            { x: 20, y: 61 },
            { x: 30, y: 92 },
          ],
          backgroundColor: "#ff6b6b",
        },
        {
          label: "Notebook Studio",
          data: [
            { x: 5, y: 8 },
            { x: 10, y: 12 },
            { x: 20, y: 19 },
            { x: 30, y: 27 },
          ],
          backgroundColor: "#36c7a0",
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
      resizeDelay: 200,
      plugins: { legend: { labels: { color: baseTicks } } },
      scales: {
        x: {
          title: { display: true, text: "Dataset Size (x1000 rows)", color: baseTicks },
          ticks: { color: baseTicks },
          grid: { color: baseGrid },
        },
        y: {
          title: { display: true, text: "Processing Time (minutes)", color: baseTicks },
          ticks: { color: baseTicks },
          grid: { color: baseGrid },
        },
      },
    },
  });
}

window.addEventListener("resize", () => {
  if (chartInstances.size === 0) return;
  clearTimeout(resizeTimerId);
  resizeTimerId = window.setTimeout(() => {
    chartInstances.forEach((chart, canvasId) => {
      enforceCanvasFrameSize(canvasId);
      chart.resize();
    });
  }, 180);
});

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", makeCharts, { once: true });
} else {
  makeCharts();
}
