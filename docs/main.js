const architectureDetails = {
  ingest: {
    title: "CSV Ingestion Layer",
    description:
      "Validates CSV format, parses rows safely, and extracts column-level schema metadata.",
    inputs: "Raw CSV files",
    outputs: "Structured tabular records + schema snapshot",
    reliability: "Format checks and guarded parsing",
  },
  cleaning: {
    title: "Deterministic Cleaning Engine",
    description:
      "Applies repeatable transformations: header normalization, whitespace trimming, duplicate removal, null handling.",
    inputs: "Parsed records",
    outputs: "Cleaned dataset and normalized schema contract",
    reliability: "Rule-based pipeline with transparent step mapping",
  },
  notebook: {
    title: "Notebook Builder",
    description:
      "Generates guided notebook cells aligned with each cleaning and analysis phase.",
    inputs: "Cleaned dataset + template",
    outputs: "Executable notebook workflow",
    reliability: "Template-safe defaults and deterministic cell ordering",
  },
  runtime: {
    title: "Pyodide Runtime",
    description:
      "Executes Python in-browser for reproducibility without server-side compute dependencies.",
    inputs: "Notebook code cells",
    outputs: "Execution outputs, logs, and tracebacks",
    reliability: "Controlled cell execution and structured traceback capture",
  },
  auth: {
    title: "Firebase Authentication",
    description:
      "Provides account-scoped identity and secure access control for protected workflows.",
    inputs: "Credentials and session requests",
    outputs: "Authenticated user session",
    reliability: "Session token controls and verification checks",
  },
  storage: {
    title: "Workspace Storage",
    description:
      "Persists profile and workflow artifacts using cloud-backed state with continuity safeguards.",
    inputs: "Notebook and user artifacts",
    outputs: "Reloadable workspace state",
    reliability: "Cloud persistence with fallback continuity path",
  },
  dashboard: {
    title: "User Dashboard",
    description:
      "Surfaces saved work, project continuity controls, and profile management.",
    inputs: "User identity + stored artifacts",
    outputs: "Resumable data workflow interface",
    reliability: "State-aware UI with explicit status handling",
  },
  assistant: {
    title: "AI Runtime Repair Assistant",
    description:
      "Combines deterministic repair rules with local model fallback for unresolved runtime errors.",
    inputs: "Code cell + traceback context",
    outputs: "Repair proposals and rerun-ready code",
    reliability: "Rule-first repair policy and constrained fallback behavior",
  },
};

const buildStepDetails = {
  discovery: {
    title: "Step 1: Problem Discovery",
    description:
      "Identified recurring friction in manual CSV preparation across educational and operational scenarios.",
    goal: "Define a measurable target workflow from raw ingestion to validated analytics output.",
    built: "Pain-point map, failure taxonomy, and architecture requirements.",
    result: "Engineering plan grounded in reproducibility and usability.",
  },
  engine: {
    title: "Step 2: Data Cleaning Engine",
    description:
      "Implemented deterministic data preparation pipeline for repeatable transformations.",
    goal: "Eliminate repetitive manual cleanup and schema inconsistency.",
    built: "Parser integration, normalization rules, duplicate/null handling.",
    result: "Stable cleaned-data contract for downstream stages.",
  },
  notebook: {
    title: "Step 3: Notebook Orchestration",
    description:
      "Created guided notebook generation to preserve transparency and rerunability.",
    goal: "Expose each transformation stage as traceable executable cells.",
    built: "Template-linked notebook cell pipeline.",
    result: "Reproducible and inspectable workflow artifacts.",
  },
  platform: {
    title: "Step 4: Auth + Persistence",
    description:
      "Added identity and durable workspace continuity.",
    goal: "Move from prototype to production-use platform behavior.",
    built: "Firebase auth, profile state, and cloud-backed save/reload flow.",
    result: "Session continuity and account-scoped workflows.",
  },
  visuals: {
    title: "Step 5: Visual Analytics",
    description:
      "Integrated chart modules for quality diagnostics and performance comparison.",
    goal: "Convert processed data into immediate, interpretable insights.",
    built: "Trend, stage-time, radar, and scalability visual layers.",
    result: "Faster quality review and evidence-based decisions.",
  },
  reliability: {
    title: "Step 6: AI Reliability Layer",
    description:
      "Implemented runtime repair pipeline for common notebook execution failures.",
    goal: "Reduce debugging overhead and improve first-pass completion.",
    built: "Rule-based repair path plus local-model fallback.",
    result: "Improved runtime resilience and user confidence.",
  },
};

const buildStepOrder = ["discovery", "engine", "notebook", "platform", "visuals", "reliability"];

function initArchitectureExplorer() {
  const nodeButtons = Array.from(document.querySelectorAll(".arch-node"));
  const detail = document.getElementById("archDetail");
  if (nodeButtons.length === 0 || !detail) return;

  function renderNode(nodeKey) {
    const node = architectureDetails[nodeKey];
    if (!node) return;

    detail.innerHTML = `
      <h3>${node.title}</h3>
      <p>${node.description}</p>
      <ul>
        <li><strong>Inputs:</strong> ${node.inputs}</li>
        <li><strong>Outputs:</strong> ${node.outputs}</li>
        <li><strong>Reliability Strategy:</strong> ${node.reliability}</li>
      </ul>
    `;

    nodeButtons.forEach((button) => {
      button.classList.toggle("active", button.getAttribute("data-node") === nodeKey);
    });
  }

  nodeButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const key = button.getAttribute("data-node") || "ingest";
      renderNode(key);
    });
  });

  const firstKey = nodeButtons[0].getAttribute("data-node") || "ingest";
  renderNode(firstKey);
}

function initBuildStepExplorer() {
  const tabs = Array.from(document.querySelectorAll(".build-tab"));
  const detail = document.getElementById("buildDetail");
  const progressFill = document.getElementById("buildProgressFill");
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

    if (progressFill) {
      const index = buildStepOrder.indexOf(stepKey);
      const width = ((index + 1) / buildStepOrder.length) * 100;
      progressFill.style.width = `${Math.max(8, width)}%`;
    }
  }

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      const key = tab.getAttribute("data-step") || "discovery";
      renderStep(key);
    });
  });

  renderStep(tabs[0].getAttribute("data-step") || "discovery");
}

function initKpiCounters() {
  const counters = document.querySelectorAll(".kpi-value");
  if (counters.length === 0) return;

  function animateCounter(el) {
    const target = Number(el.getAttribute("data-target") || "0");
    const suffix = el.getAttribute("data-suffix") || "";
    const startTime = performance.now();
    const durationMs = 1000;

    function tick(now) {
      const progress = Math.min(1, (now - startTime) / durationMs);
      const value = Math.round(progress * target);
      el.textContent = `${value}${suffix}`;
      if (progress < 1) {
        window.requestAnimationFrame(tick);
      }
    }

    window.requestAnimationFrame(tick);
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        animateCounter(entry.target);
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.35 }
  );

  counters.forEach((counter) => observer.observe(counter));
}

function initRevealAnimations() {
  const revealItems = document.querySelectorAll(".reveal");
  if (revealItems.length === 0) return;

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

  revealItems.forEach((item) => observer.observe(item));
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
      const activeId = `#${visible.target.id}`;

      links.forEach((link) => {
        link.classList.toggle("active", link.getAttribute("href") === activeId);
      });
    },
    { threshold: 0.4 }
  );

  sections.forEach((section) => observer.observe(section));
}

function initHireRequestBuilder() {
  const options = Array.from(document.querySelectorAll(".service-option"));
  const summary = document.getElementById("hireSummary");
  const requestLink = document.getElementById("hireRequestLink");
  if (options.length === 0 || !summary || !requestLink) return;

  const issueBase = "https://github.com/ANIS151993/Notebook-Studio/issues/new";

  function setService(service) {
    const issueTitle = `Collaboration Request: ${service}`;
    const issueBody = [
      "Hello Md Anisur Rahman Chowdhury,",
      "",
      `I want to collaborate on: ${service}`,
      "",
      "Project scope:",
      "-",
      "",
      "Timeline:",
      "-",
      "",
      "Budget range:",
      "-",
      "",
      "Contact details:",
      "-",
    ].join("\n");

    const url = `${issueBase}?title=${encodeURIComponent(issueTitle)}&body=${encodeURIComponent(issueBody)}`;
    summary.textContent = `Selected service: ${service}`;
    requestLink.setAttribute("href", url);
  }

  options.forEach((option) => {
    option.addEventListener("click", () => {
      const service = option.getAttribute("data-service") || "Data Workflow Automation";
      options.forEach((item) => item.classList.toggle("active", item === option));
      setService(service);
    });
  });

  const defaultOption = options.find((option) => option.classList.contains("active")) || options[0];
  setService(defaultOption.getAttribute("data-service") || "Data Workflow Automation");
}

function initVideoOverview() {
  const launch = document.getElementById("videoLaunch");
  const frameShell = document.getElementById("videoFrameShell");
  if (!launch || !frameShell) return;

  let loaded = false;

  function loadVideo() {
    if (loaded) return;
    const videoId = launch.getAttribute("data-video-id");
    if (!videoId) return;

    const iframe = document.createElement("iframe");
    iframe.className = "video-embed";
    iframe.title = "DataMentor Video Overview";
    iframe.loading = "lazy";
    iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
    iframe.allowFullscreen = true;
    iframe.referrerPolicy = "strict-origin-when-cross-origin";
    iframe.src = `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1&playsinline=1`;

    frameShell.replaceChildren(iframe);
    frameShell.classList.add("playing");
    loaded = true;
  }

  launch.addEventListener("click", loadVideo);
}

const chartInstances = new Map();
let chartsInitialized = false;
let resizeTimer = null;
let activeChartProfile = "academic";

const chartProfiles = {
  academic: {
    trend: [14.8, 13.4, 11.9, 9.7, 8.6, 7.2, 6.1, 5.1],
    stageManual: [22, 34, 18, 16, 29],
    stageAuto: [7, 10, 6, 5, 9],
    radarBefore: [42, 49, 51, 36, 44],
    radarAfter: [86, 89, 92, 81, 88],
    scatterManual: [
      { x: 5, y: 22 },
      { x: 10, y: 37 },
      { x: 20, y: 63 },
      { x: 30, y: 93 },
    ],
    scatterAuto: [
      { x: 5, y: 8 },
      { x: 10, y: 12 },
      { x: 20, y: 19 },
      { x: 30, y: 27 },
    ],
    cumulativeManual: [22, 56, 74, 90, 119],
    cumulativeAuto: [7, 17, 23, 28, 37],
    recoveryDistribution: [68, 22, 10],
  },
  sme: {
    trend: [18.2, 16.9, 15.7, 13.8, 12.4, 11.0, 9.9, 8.8],
    stageManual: [28, 41, 24, 22, 35],
    stageAuto: [10, 14, 9, 8, 12],
    radarBefore: [38, 45, 48, 32, 40],
    radarAfter: [80, 84, 87, 76, 82],
    scatterManual: [
      { x: 8, y: 31 },
      { x: 15, y: 49 },
      { x: 25, y: 76 },
      { x: 35, y: 108 },
    ],
    scatterAuto: [
      { x: 8, y: 11 },
      { x: 15, y: 16 },
      { x: 25, y: 24 },
      { x: 35, y: 33 },
    ],
    cumulativeManual: [28, 69, 93, 115, 150],
    cumulativeAuto: [10, 24, 33, 41, 53],
    recoveryDistribution: [62, 25, 13],
  },
  enterprise: {
    trend: [24.6, 22.8, 20.9, 18.7, 16.4, 14.6, 13.2, 11.9],
    stageManual: [35, 52, 31, 27, 42],
    stageAuto: [13, 18, 12, 10, 16],
    radarBefore: [34, 40, 44, 29, 36],
    radarAfter: [76, 81, 85, 73, 79],
    scatterManual: [
      { x: 10, y: 38 },
      { x: 20, y: 61 },
      { x: 30, y: 89 },
      { x: 45, y: 126 },
    ],
    scatterAuto: [
      { x: 10, y: 14 },
      { x: 20, y: 21 },
      { x: 30, y: 29 },
      { x: 45, y: 41 },
    ],
    cumulativeManual: [35, 87, 118, 145, 187],
    cumulativeAuto: [13, 31, 43, 53, 69],
    recoveryDistribution: [57, 29, 14],
  },
};

function enforceCanvasFrameSize(canvasId) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;

  const frame = canvas.closest(".chart-frame");
  if (!frame) return;

  canvas.width = Math.max(1, Math.floor(frame.clientWidth));
  canvas.height = Math.max(1, Math.floor(frame.clientHeight));
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

function renderChartsForProfile(profileKey) {
  if (typeof Chart === "undefined") return;
  const profile = chartProfiles[profileKey] || chartProfiles.academic;
  const baseGrid = "rgba(179, 202, 225, 0.3)";
  const baseTicks = "#eaf4ff";

  createOrReplaceChart("trendChart", {
    type: "line",
    data: {
      labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug"],
      datasets: [
        {
          label: "Avg Processing Time (minutes)",
          data: profile.trend,
          borderColor: "#39d9b6",
          backgroundColor: "rgba(57, 217, 182, 0.24)",
          fill: true,
          tension: 0.28,
          borderWidth: 2.5,
          pointRadius: 2.8,
          pointHoverRadius: 4,
        },
      ],
    },
    options: {
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
      labels: ["Ingestion", "Cleaning", "Validation", "Notebook Prep", "Debugging"],
      datasets: [
        {
          label: "Manual Baseline",
          data: profile.stageManual,
          backgroundColor: "rgba(255, 161, 92, 0.88)",
          borderColor: "#ffc08a",
          borderWidth: 1,
          borderRadius: 8,
        },
        {
          label: "Notebook Studio",
          data: profile.stageAuto,
          backgroundColor: "rgba(45, 212, 186, 0.92)",
          borderColor: "#7cf0db",
          borderWidth: 1,
          borderRadius: 8,
        },
      ],
    },
    options: {
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
          label: "Before Automation",
          data: profile.radarBefore,
          borderColor: "#ffaf67",
          backgroundColor: "rgba(255, 175, 103, 0.22)",
          pointBackgroundColor: "#ffaf67",
          pointRadius: 3.2,
        },
        {
          label: "After Automation",
          data: profile.radarAfter,
          borderColor: "#33dbb8",
          backgroundColor: "rgba(51, 219, 184, 0.2)",
          pointBackgroundColor: "#33dbb8",
          pointRadius: 3.2,
        },
      ],
    },
    options: {
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
          data: profile.scatterManual,
          backgroundColor: "#ff7b7b",
          pointRadius: 4.5,
          pointHoverRadius: 5.2,
        },
        {
          label: "Notebook Studio",
          data: profile.scatterAuto,
          backgroundColor: "#33dbb8",
          pointRadius: 4.5,
          pointHoverRadius: 5.2,
        },
      ],
    },
    options: {
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

  createOrReplaceChart("areaChart", {
    type: "line",
    data: {
      labels: ["Ingestion", "Cleaning", "Validation", "Notebook Prep", "Debugging"],
      datasets: [
        {
          label: "Manual Cumulative Minutes",
          data: profile.cumulativeManual,
          borderColor: "#ff9e61",
          backgroundColor: "rgba(255, 158, 97, 0.2)",
          fill: true,
          tension: 0.24,
          borderWidth: 2.2,
          pointRadius: 2.6,
        },
        {
          label: "DataMentor Cumulative Minutes",
          data: profile.cumulativeAuto,
          borderColor: "#3de0bc",
          backgroundColor: "rgba(61, 224, 188, 0.24)",
          fill: true,
          tension: 0.24,
          borderWidth: 2.2,
          pointRadius: 2.6,
        },
      ],
    },
    options: {
      plugins: { legend: { labels: { color: baseTicks } } },
      scales: {
        x: { ticks: { color: baseTicks }, grid: { color: baseGrid } },
        y: { ticks: { color: baseTicks }, grid: { color: baseGrid } },
      },
    },
  });

  createOrReplaceChart("doughnutChart", {
    type: "doughnut",
    data: {
      labels: ["Auto-resolved", "Retry-resolved", "Manual intervention"],
      datasets: [
        {
          data: profile.recoveryDistribution,
          backgroundColor: ["#32ddb9", "#f5b25e", "#ff7d7d"],
          borderColor: "#081522",
          borderWidth: 2,
          hoverOffset: 7,
        },
      ],
    },
    options: {
      plugins: { legend: { labels: { color: baseTicks } } },
    },
  });
}

function initChartProfileControls() {
  const profileButtons = Array.from(document.querySelectorAll(".profile-btn"));
  if (profileButtons.length === 0) return;

  profileButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const profileKey = button.getAttribute("data-profile") || "academic";
      activeChartProfile = profileKey;
      profileButtons.forEach((item) => item.classList.toggle("active", item === button));
      renderChartsForProfile(activeChartProfile);
    });
  });
}

function makeCharts() {
  if (typeof Chart === "undefined" || chartsInitialized) return;
  chartsInitialized = true;

  Chart.defaults.responsive = true;
  Chart.defaults.maintainAspectRatio = false;
  Chart.defaults.animation = { duration: 720, easing: "easeOutQuart" };
  Chart.defaults.color = "#eaf4ff";
  Chart.defaults.font.family = "\"Space Grotesk\", sans-serif";
  Chart.defaults.plugins.legend.labels.usePointStyle = true;
  Chart.defaults.plugins.legend.labels.boxWidth = 10;
  Chart.defaults.plugins.legend.labels.padding = 14;

  initChartProfileControls();
  renderChartsForProfile(activeChartProfile);
}

window.addEventListener("resize", () => {
  if (chartInstances.size === 0) return;

  window.clearTimeout(resizeTimer);
  resizeTimer = window.setTimeout(() => {
    chartInstances.forEach((chart, canvasId) => {
      enforceCanvasFrameSize(canvasId);
      chart.resize();
    });
  }, 180);
});

function initPage() {
  initArchitectureExplorer();
  initBuildStepExplorer();
  initKpiCounters();
  initRevealAnimations();
  initSectionLinkHighlighting();
  initVideoOverview();
  initHireRequestBuilder();
  makeCharts();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initPage, { once: true });
} else {
  initPage();
}
