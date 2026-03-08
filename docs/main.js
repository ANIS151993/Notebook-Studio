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

const buildStepDetails = {
  discovery: {
    title: "Step 1: Problem Discovery",
    description:
      "The first goal was to understand why CSV workflows are slow and frustrating for many users.",
    goal: "Map real pain points from students, researchers, and SME teams.",
    built: "A practical workflow blueprint and requirements baseline.",
    result: "A focused app plan centered on ease of use and reproducibility.",
  },
  foundation: {
    title: "Step 2: Core Data Engine",
    description:
      "Built the ingestion and cleaning backbone to make raw datasets analysis-ready.",
    goal: "Automate repetitive cleaning tasks with predictable output.",
    built: "CSV parser, schema normalization, duplicate removal, and missing-value handling.",
    result: "Reliable cleaned data contract for downstream notebooks and charts.",
  },
  notebook: {
    title: "Step 3: Notebook Layer",
    description:
      "Created guided Python notebooks so users can see and rerun each processing step.",
    goal: "Make automation transparent instead of a black box.",
    built: "Template-driven notebook cells linked to cleaned dataset metadata.",
    result: "Reproducible notebook workflow for learning and operations.",
  },
  platform: {
    title: "Step 4: User Platform",
    description:
      "Added account system and persistence so work is protected across sessions.",
    goal: "Turn a prototype into a practical daily-use product.",
    built: "Firebase authentication, profile storage, and resumable workspace state.",
    result: "User continuity with cloud save and local fallback safety.",
  },
  analytics: {
    title: "Step 5: Visual Analytics",
    description:
      "Integrated chart modules to help users inspect quality and performance quickly.",
    goal: "Convert cleaned data into understandable insights.",
    built: "Interactive trend, bar, radar, and scatter visual dashboards.",
    result: "Faster diagnosis of data quality and pipeline efficiency.",
  },
  ai: {
    title: "Step 6: AI Reliability",
    description:
      "Added automated repair support for notebook runtime failures.",
    goal: "Reduce debugging time and improve user confidence.",
    built: "Hybrid repair flow: deterministic rules first, local model fallback second.",
    result: "Higher first-pass recovery and smoother iteration loop.",
  },
};

const buildStepOrder = [
  "discovery",
  "foundation",
  "notebook",
  "platform",
  "analytics",
  "ai",
];

function initArchitectureMap() {
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
}

function initBuildStepExplorer() {
  const tabs = Array.from(document.querySelectorAll(".build-tab"));
  const detail = document.getElementById("buildDetail");
  const fill = document.getElementById("buildProgressFill");
  if (tabs.length === 0 || !detail) return;

  function renderStep(stepKey) {
    const step = buildStepDetails[stepKey];
    if (!step) return;

    detail.innerHTML = `
      <h3>${step.title}</h3>
      <p>${step.description}</p>
      <ul>
        <li><strong>Goal:</strong> ${step.goal}</li>
        <li><strong>Built:</strong> ${step.built}</li>
        <li><strong>Result:</strong> ${step.result}</li>
      </ul>
    `;

    tabs.forEach((tab) => {
      tab.classList.toggle("active", tab.getAttribute("data-step") === stepKey);
    });

    if (fill) {
      const stepIndex = buildStepOrder.indexOf(stepKey);
      const width = ((stepIndex + 1) / buildStepOrder.length) * 100;
      fill.style.width = `${Math.max(8, width)}%`;
    }
  }

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      renderStep(tab.getAttribute("data-step") || "discovery");
    });
  });

  renderStep(tabs[0].getAttribute("data-step") || "discovery");
}

function initKpiCounters() {
  const counters = document.querySelectorAll(".kpi-value");
  if (counters.length === 0) return;

  const animateCounter = (counter) => {
    const target = Number(counter.getAttribute("data-target") || "0");
    const suffix = counter.getAttribute("data-suffix") || "";
    const duration = 1000;
    const start = performance.now();

    function tick(now) {
      const progress = Math.min(1, (now - start) / duration);
      const value = Math.round(progress * target);
      counter.textContent = `${value}${suffix}`;
      if (progress < 1) {
        window.requestAnimationFrame(tick);
      }
    }

    window.requestAnimationFrame(tick);
  };

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        animateCounter(entry.target);
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.4 }
  );

  counters.forEach((counter) => observer.observe(counter));
}

function initRevealAnimations() {
  const revealBlocks = document.querySelectorAll(".reveal");
  if (revealBlocks.length === 0) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("visible");
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.14 }
  );

  revealBlocks.forEach((item) => observer.observe(item));
}

function initSectionLinkHighlighting() {
  const links = Array.from(document.querySelectorAll('.topnav a[href^="#"]'));
  const sections = links
    .map((link) => {
      const id = link.getAttribute("href") || "";
      return document.querySelector(id);
    })
    .filter(Boolean);

  if (links.length === 0 || sections.length === 0) return;

  const observer = new IntersectionObserver(
    (entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

      if (!visible) return;
      const visibleId = `#${visible.target.id}`;

      links.forEach((link) => {
        link.classList.toggle("active", link.getAttribute("href") === visibleId);
      });
    },
    { threshold: 0.35 }
  );

  sections.forEach((section) => observer.observe(section));
}

function initHireRequestBuilder() {
  const options = Array.from(document.querySelectorAll(".service-option"));
  const summary = document.getElementById("hireSummary");
  const link = document.getElementById("hireRequestLink");
  if (options.length === 0 || !summary || !link) return;

  const repoIssueBase = "https://github.com/ANIS151993/Notebook-Studio/issues/new";

  function setService(serviceName) {
    const title = `Collaboration Request: ${serviceName}`;
    const body = [
      "Hello Anis,",
      "",
      `I am interested in: ${serviceName}`,
      "",
      "Project goals:",
      "-",
      "",
      "Expected timeline:",
      "-",
      "",
      "Budget range:",
      "-",
      "",
      "Preferred contact method:",
      "-",
    ].join("\n");

    const url = `${repoIssueBase}?title=${encodeURIComponent(title)}&body=${encodeURIComponent(body)}`;

    summary.textContent = `Selected service: ${serviceName}`;
    link.setAttribute("href", url);
  }

  options.forEach((option) => {
    option.addEventListener("click", () => {
      const service = option.getAttribute("data-service") || "Data Workflow Automation";
      options.forEach((item) => item.classList.toggle("active", item === option));
      setService(service);
    });
  });

  const activeOption = options.find((option) => option.classList.contains("active")) || options[0];
  const defaultService = activeOption.getAttribute("data-service") || "Data Workflow Automation";
  setService(defaultService);
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
  if (!canvas || typeof Chart === "undefined") return;

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

  Chart.defaults.responsive = true;
  Chart.defaults.maintainAspectRatio = false;
  Chart.defaults.animation = {
    duration: 750,
    easing: "easeOutQuart",
  };

  const baseGrid = "rgba(177, 198, 217, 0.24)";
  const baseTicks = "#d8e5f2";

  createOrReplaceChart("trendChart", {
    type: "line",
    data: {
      labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug"],
      datasets: [
        {
          label: "Avg Processing Time (minutes)",
          data: [14.8, 13.5, 11.9, 9.8, 8.6, 7.3, 6.1, 5.2],
          borderColor: "#46d2ad",
          backgroundColor: "rgba(70, 210, 173, 0.2)",
          fill: true,
          tension: 0.3,
          borderWidth: 2.3,
        },
      ],
    },
    options: {
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
          backgroundColor: "rgba(250, 173, 84, 0.84)",
          borderRadius: 8,
        },
        {
          label: "Notebook Studio",
          data: [7, 10, 6, 5, 9],
          backgroundColor: "rgba(70, 210, 173, 0.9)",
          borderRadius: 8,
        },
      ],
    },
    options: {
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
          backgroundColor: "rgba(243, 166, 74, 0.23)",
          pointBackgroundColor: "#f3a64a",
        },
        {
          label: "After",
          data: [86, 89, 92, 80, 88],
          borderColor: "#46d2ad",
          backgroundColor: "rgba(70, 210, 173, 0.18)",
          pointBackgroundColor: "#46d2ad",
        },
      ],
    },
    options: {
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
          backgroundColor: "#46d2ad",
        },
      ],
    },
    options: {
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
  window.clearTimeout(resizeTimerId);
  resizeTimerId = window.setTimeout(() => {
    chartInstances.forEach((chart, canvasId) => {
      enforceCanvasFrameSize(canvasId);
      chart.resize();
    });
  }, 180);
});

function initPage() {
  initArchitectureMap();
  initBuildStepExplorer();
  initKpiCounters();
  initRevealAnimations();
  initSectionLinkHighlighting();
  initHireRequestBuilder();
  makeCharts();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initPage, { once: true });
} else {
  initPage();
}
