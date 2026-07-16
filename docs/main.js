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
  viz: {
    title: "Visualization Engine",
    description:
      "Renders 10 universal chart types (DistPlot, Pie, Violin, HeatMap, PairPlot, JointPlot, Bar, Histogram, Scatter, Line) with dynamic column selectors in both STANDARD and CUSTOM modes.",
    inputs: "Cleaned dataset + user column selections",
    outputs: "Interactive Chart.js visualizations with responsive scaling",
    reliability: "Column type filtering, smart defaults, and adaptive PairPlot grid scaling",
  },
  analysis: {
    title: "Domain-Aware Analysis Engine",
    description:
      "Knowledge-base system that generates contextual data insights based on recognized column names from medical, financial, and scientific domains.",
    inputs: "Selected columns + computed statistics",
    outputs: "Statistical insights, domain context, pair-wise relationships, suitability assessments",
    reliability: "Real-time recomputation via useMemo on every column selection change",
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
    title: "Step 5: Universal Visualizations",
    description:
      "Built 10 universal chart types with dynamic column selectors replacing hardcoded industry charts.",
    goal: "Allow any CSV to be visualized without data-specific assumptions.",
    built: "DistPlot, Pie, Violin, HeatMap, PairPlot, JointPlot, Bar, Histogram, Scatter, Line — each with column dropdowns and smart defaults.",
    result: "Fully data-agnostic visualization system with responsive PairPlot scaling.",
  },
  analysis: {
    title: "Step 6: Domain-Aware Analysis",
    description:
      "Created a knowledge-base engine for generating contextual data insights.",
    goal: "Go beyond generic chart labels to domain-specific medical, financial, and scientific context.",
    built: "Column knowledge base, per-chart analysis generators, real-time useMemo recomputation.",
    result: "Dynamic AI-powered analysis that updates on every column selection change.",
  },
  notebookViz: {
    title: "Step 7: Notebook Visualizations",
    description:
      "Added 6 matplotlib visualization cells to the interactive Python notebook.",
    goal: "Enable publication-quality plots directly in the browser via Pyodide.",
    built: "DistPlot, Pie, Violin, HeatMap, PairPlot, JointPlot cells with AGG backend → BytesIO → base64 inline rendering.",
    result: "14 complete notebook cells covering exploration through advanced visualizations.",
  },
  reliability: {
    title: "Step 8: AI Reliability Layer",
    description:
      "Implemented runtime repair pipeline for common notebook execution failures.",
    goal: "Reduce debugging overhead and improve first-pass completion.",
    built: "Rule-based repair path plus local-model fallback.",
    result: "Improved runtime resilience and user confidence.",
  },
  workspace: {
    title: "Step 9: Account Workspace",
    description:
      "Added cloud persistence with save, load, and delete operations for CSV works.",
    goal: "Enable users to manage their analysis workspaces across sessions.",
    built: "Firebase Firestore save/load/delete, localStorage fallback, confirmation dialogs, auto-refresh.",
    result: "Complete account-scoped workspace management with both cloud and offline support.",
  },
};

const buildStepOrder = ["discovery", "engine", "notebook", "platform", "visuals", "analysis", "notebookViz", "reliability", "workspace"];

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
  const hireCard = document.getElementById("hireCard");
  if (options.length === 0 || !summary || !requestLink) return;

  const issueBase = "https://github.com/ANIS151993/Notebook-Studio/issues/new";

  function setService(service, theme = "automation") {
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
    summary.textContent = service;
    requestLink.setAttribute("href", url);
    if (hireCard) {
      hireCard.setAttribute("data-service-theme", theme);
    }
  }

  options.forEach((option) => {
    option.addEventListener("click", () => {
      const service = option.getAttribute("data-service") || "Data Workflow Automation";
      const theme = option.getAttribute("data-theme") || "automation";
      options.forEach((item) => {
        const isActive = item === option;
        item.classList.toggle("active", isActive);
        item.setAttribute("aria-pressed", isActive ? "true" : "false");
      });
      setService(service, theme);
    });
  });

  const defaultOption = options.find((option) => option.classList.contains("active")) || options[0];
  setService(
    defaultOption.getAttribute("data-service") || "Data Workflow Automation",
    defaultOption.getAttribute("data-theme") || "automation"
  );
}

async function sha256Hex(text) {
  const data = new TextEncoder().encode(text);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((value) => value.toString(16).padStart(2, "0"))
    .join("");
}

function initResearchAccessPolicy() {
  const openGateButton = document.getElementById("policyOpenGateBtn");
  const modal = document.getElementById("policyGateModal");
  const closeButton = document.getElementById("policyGateCloseBtn");
  const step1 = document.getElementById("policyGateStep1");
  const step2 = document.getElementById("policyGateStep2");
  const step3 = document.getElementById("policyGateStep3");
  const unlocked = document.getElementById("policyGateUnlocked");
  const step1Github = document.getElementById("policyStep1Github");
  const step1Youtube = document.getElementById("policyStep1Youtube");
  const step1Next = document.getElementById("policyStep1Next");
  const emailTemplate = document.getElementById("policyEmailTemplate");
  const copyTemplate = document.getElementById("policyCopyTemplate");
  const step2Sent = document.getElementById("policyStep2Sent");
  const step2Next = document.getElementById("policyStep2Next");
  const passwordInput = document.getElementById("researchPasswordInput");
  const unlockButton = document.getElementById("researchUnlockBtn");
  const status = document.getElementById("researchAccessStatus");
  const downloadButton = document.getElementById("researchDownloadBtn");
  if (
    !openGateButton ||
    !modal ||
    !closeButton ||
    !step1 ||
    !step2 ||
    !step3 ||
    !unlocked ||
    !step1Github ||
    !step1Youtube ||
    !step1Next ||
    !emailTemplate ||
    !copyTemplate ||
    !step2Sent ||
    !step2Next ||
    !passwordInput ||
    !unlockButton ||
    !status ||
    !downloadButton
  ) {
    return;
  }

  const expectedHash = "5b484d8b2799daf74779ce686501847d4a08b5e917c1e8395e1da7f7e73bce0d";
  const encodedBundlePath = "Li9wYXBlcnMvZGF0YW1lbnRvcl9pZWVlL2RhdGFtZW50b3JfaWVlZS5wZGY=";
  const steps = [step1, step2, step3, unlocked];
  if (modal.parentElement !== document.body) {
    document.body.appendChild(modal);
  }

  function showStep(targetStep) {
    steps.forEach((step) => {
      step.hidden = step !== targetStep;
    });
  }

  function openModal() {
    resetFlow();
    // Document protection removed: downloads are openly accessible.
    downloadButton.setAttribute("href", atob(encodedBundlePath));
    showStep(unlocked);
    modal.hidden = false;
    document.body.classList.add("policy-modal-open");
    window.requestAnimationFrame(() => {
      modal.classList.add("visible");
    });
  }

  function closeModal() {
    modal.classList.remove("visible");
    modal.hidden = true;
    document.body.classList.remove("policy-modal-open");
  }

  function refreshStep1() {
    step1Next.disabled = !(step1Github.checked && step1Youtube.checked);
  }

  function refreshStep2() {
    step2Next.disabled = !step2Sent.checked;
  }

  function resetFlow() {
    step1Github.checked = false;
    step1Youtube.checked = false;
    step2Sent.checked = false;
    step1Next.disabled = true;
    step2Next.disabled = true;
    passwordInput.value = "";
    status.textContent = "";
    status.className = "policy-status";
    downloadButton.setAttribute("href", "#");
    showStep(step1);
  }

  async function copyTemplateText() {
    const text = (emailTemplate.textContent || "").trim();
    const previous = copyTemplate.textContent || "Copy email template";
    try {
      await navigator.clipboard.writeText(text);
      copyTemplate.textContent = "Copied";
    } catch (error) {
      copyTemplate.textContent = "Copy failed";
    } finally {
      window.setTimeout(() => {
        copyTemplate.textContent = previous;
      }, 1400);
    }
  }

  async function verifyPassword() {
    const password = passwordInput.value.trim();
    status.className = "policy-status";

    if (!password) {
      status.textContent = "Enter the archive password.";
      status.classList.add("error");
      return;
    }

    unlockButton.disabled = true;
    status.textContent = "Verifying password...";

    try {
      const providedHash = await sha256Hex(password);
      if (providedHash === expectedHash) {
        downloadButton.setAttribute("href", atob(encodedBundlePath));
        status.textContent = "";
        showStep(unlocked);
      } else {
        status.textContent = "Incorrect password. Request access from the author.";
        status.classList.add("error");
      }
    } catch (error) {
      status.textContent = "Verification failed in this browser. Please retry.";
      status.classList.add("error");
    } finally {
      unlockButton.disabled = false;
    }
  }

  unlockButton.addEventListener("click", verifyPassword);
  passwordInput.addEventListener("keydown", (event) => {
    if (event.key !== "Enter") return;
    event.preventDefault();
    verifyPassword();
  });

  openGateButton.addEventListener("click", openModal);
  closeButton.addEventListener("click", closeModal);
  modal.addEventListener("click", (event) => {
    if (event.target !== modal) return;
    closeModal();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape" || modal.hidden) return;
    closeModal();
  });

  step1Github.addEventListener("change", refreshStep1);
  step1Youtube.addEventListener("change", refreshStep1);
  step1Next.addEventListener("click", () => {
    showStep(step2);
    step2Sent.focus();
  });

  copyTemplate.addEventListener("click", copyTemplateText);
  step2Sent.addEventListener("change", refreshStep2);
  step2Next.addEventListener("click", () => {
    showStep(step3);
    passwordInput.focus();
  });

  resetFlow();
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

const skillBuilderSteps = {
  step1: {
    badge: "STEP 1",
    title: "Download the Skill File",
    body: `<p>The skill file <code>datamentor-skill.md</code> is the complete blueprint. It contains every instruction Claude needs to build the entire application.</p>
    <div class="skill-builder-instructions">
      <div class="skill-builder-instruction">
        <span class="skill-builder-instruction-marker">A</span>
        <div>
          <strong>Option A — Download from this page</strong>
          <p>Click the green "Download Skill File" button at the bottom of this section. You will be asked to star the GitHub profile first (takes 5 seconds).</p>
        </div>
      </div>
      <div class="skill-builder-instruction">
        <span class="skill-builder-instruction-marker">B</span>
        <div>
          <strong>Option B — Clone from GitHub</strong>
          <p>Run this command in your terminal to get the file directly:</p>
          <div class="skill-code-block"><code>git clone https://github.com/ANIS151993/Notebook-Studio.git<br>cd Notebook-Studio<br>ls datamentor-skill.md</code></div>
        </div>
      </div>
    </div>
    <div class="skill-builder-tip"><strong>Tip:</strong> Save the file somewhere easy to find, like your Desktop or Documents folder. You will reference this file in Step 3.</div>`,
  },
  step2: {
    badge: "STEP 2",
    title: "Create a New Project Folder",
    body: `<p>Open your terminal (Command Prompt on Windows, Terminal on Mac/Linux) and create a new empty folder for your project.</p>
    <div class="skill-builder-instructions">
      <div class="skill-builder-instruction">
        <span class="skill-builder-instruction-marker">1</span>
        <div>
          <strong>Create the project folder</strong>
          <p>Run these commands to create and enter your project directory:</p>
          <div class="skill-code-block"><code>mkdir my-datamentor<br>cd my-datamentor</code></div>
        </div>
      </div>
      <div class="skill-builder-instruction">
        <span class="skill-builder-instruction-marker">2</span>
        <div>
          <strong>Copy the skill file into this folder</strong>
          <p>Move or copy the <code>datamentor-skill.md</code> file you downloaded in Step 1 into this <code>my-datamentor</code> folder. This lets Claude read it directly.</p>
        </div>
      </div>
    </div>
    <div class="skill-builder-tip"><strong>Tip:</strong> If you are using Claude Desktop instead of Claude Code, you can skip creating a folder — just drag the skill file into the Claude Desktop chat window in Step 3.</div>`,
  },
  step3: {
    badge: "STEP 3",
    title: "Give the Skill File to Claude",
    body: `<p>Now launch Claude and provide the skill file so it can read the full blueprint and start building.</p>
    <div class="skill-builder-instructions">
      <div class="skill-builder-instruction">
        <span class="skill-builder-instruction-marker">A</span>
        <div>
          <strong>If using Claude Code (CLI)</strong>
          <p>Open your terminal inside the <code>my-datamentor</code> folder and run:</p>
          <div class="skill-code-block"><code>claude</code></div>
          <p>Then type this message to Claude:</p>
          <div class="skill-code-block"><code>Read datamentor-skill.md and build the entire DataMentor application following every step in the skill file. Start from Step 1 and go through all 11 steps.</code></div>
        </div>
      </div>
      <div class="skill-builder-instruction">
        <span class="skill-builder-instruction-marker">B</span>
        <div>
          <strong>If using Claude Desktop</strong>
          <p>Open Claude Desktop, start a new conversation, and drag-and-drop the <code>datamentor-skill.md</code> file into the chat. Then type the same message above.</p>
        </div>
      </div>
    </div>
    <div class="skill-builder-tip"><strong>Important:</strong> Claude will start creating files and writing code. Approve the file creation prompts when asked. This process builds the entire application automatically.</div>`,
  },
  step4: {
    badge: "STEP 4",
    title: "Let Claude Build — Key Commands",
    body: `<p>Claude will follow the skill file and execute these build steps automatically. Here is what happens behind the scenes:</p>
    <div class="skill-builder-instructions">
      <div class="skill-builder-instruction">
        <span class="skill-builder-instruction-marker">1</span>
        <div>
          <strong>Project initialization</strong>
          <p>Claude runs <code>npx create-next-app@latest</code> to scaffold a Next.js 16 project with TypeScript and Tailwind CSS.</p>
        </div>
      </div>
      <div class="skill-builder-instruction">
        <span class="skill-builder-instruction-marker">2</span>
        <div>
          <strong>Install dependencies</strong>
          <p>Claude installs all required packages:</p>
          <div class="skill-code-block"><code>npm install chart.js react-chartjs-2 chartjs-chart-matrix<br>npm install papaparse firebase react-syntax-highlighter<br>npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities</code></div>
        </div>
      </div>
      <div class="skill-builder-instruction">
        <span class="skill-builder-instruction-marker">3</span>
        <div>
          <strong>Create all components</strong>
          <p>Claude writes 20+ files including the CSV orchestrator, all 10 chart components, the notebook viewer, the AI assistant, and all library utilities.</p>
        </div>
      </div>
    </div>
    <div class="skill-builder-tip"><strong>Tip:</strong> If Claude pauses or asks a question, answer it and tell it to continue. You can also say "continue building from where you left off" if the conversation gets long.</div>`,
  },
  step5: {
    badge: "STEP 5",
    title: "Configure Firebase",
    body: `<p>The application uses Firebase for Google sign-in and cloud storage. You need to create a Firebase project and add your credentials.</p>
    <div class="skill-builder-instructions">
      <div class="skill-builder-instruction">
        <span class="skill-builder-instruction-marker">1</span>
        <div>
          <strong>Create a Firebase project</strong>
          <p>Go to <code>console.firebase.google.com</code>, click "Add project", and follow the setup wizard. Choose any project name.</p>
        </div>
      </div>
      <div class="skill-builder-instruction">
        <span class="skill-builder-instruction-marker">2</span>
        <div>
          <strong>Enable Authentication</strong>
          <p>In your Firebase project, go to Build > Authentication > Sign-in method, and enable "Google" as a sign-in provider.</p>
        </div>
      </div>
      <div class="skill-builder-instruction">
        <span class="skill-builder-instruction-marker">3</span>
        <div>
          <strong>Create Firestore Database</strong>
          <p>Go to Build > Firestore Database, click "Create database", and choose "Start in test mode" for development.</p>
        </div>
      </div>
      <div class="skill-builder-instruction">
        <span class="skill-builder-instruction-marker">4</span>
        <div>
          <strong>Add credentials to your project</strong>
          <p>In Project Settings > General > Your apps, click the web icon (&lt;/&gt;), register the app, and copy the config. Create a <code>.env.local</code> file in your project root:</p>
          <div class="skill-code-block"><code>NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key<br>NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com<br>NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id<br>NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com<br>NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id<br>NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id</code></div>
        </div>
      </div>
    </div>
    <div class="skill-builder-tip"><strong>Note:</strong> Firebase is optional for basic CSV analysis. The app works without it — you just won't have cloud save/load features. You can skip this step and add it later.</div>`,
  },
  step6: {
    badge: "STEP 6",
    title: "Launch Your App and Customize",
    body: `<p>Your DataMentor application is now built. Start the development server and see it in action.</p>
    <div class="skill-builder-instructions">
      <div class="skill-builder-instruction">
        <span class="skill-builder-instruction-marker">1</span>
        <div>
          <strong>Start the development server</strong>
          <div class="skill-code-block"><code>npm run dev</code></div>
          <p>Open your browser to <code>http://localhost:3000</code> to see your DataMentor app running.</p>
        </div>
      </div>
      <div class="skill-builder-instruction">
        <span class="skill-builder-instruction-marker">2</span>
        <div>
          <strong>Test with a CSV file</strong>
          <p>Upload any CSV file to verify the cleaning pipeline, visualizations, and notebook all work correctly. Try the built-in sample datasets first.</p>
        </div>
      </div>
      <div class="skill-builder-instruction">
        <span class="skill-builder-instruction-marker">3</span>
        <div>
          <strong>Customize to your needs</strong>
          <p>Ask Claude to help you modify the app. Example prompts you can try:</p>
          <div class="skill-code-block"><code>"Add a new BoxPlot chart type to the visualization system"<br>"Change the color theme to a blue/purple palette"<br>"Add medical column knowledge for blood_pressure and glucose"<br>"Deploy this app to Vercel"</code></div>
        </div>
      </div>
    </div>
    <div class="skill-builder-tip"><strong>Congratulations!</strong> You now have a fully working DataMentor web application. The entire codebase is yours to explore, modify, and deploy.</div>`,
  },
};

const skillBuilderStepOrder = ["step1", "step2", "step3", "step4", "step5", "step6"];

function initSkillBuilderSteps() {
  const tabs = Array.from(document.querySelectorAll(".skill-builder-tab"));
  const detail = document.getElementById("skillBuilderDetail");
  const progressFill = document.getElementById("skillBuilderProgressFill");
  const progressLabel = document.getElementById("skillBuilderProgressLabel");
  if (tabs.length === 0 || !detail) return;

  function renderStep(stepKey) {
    const step = skillBuilderSteps[stepKey];
    if (!step) return;

    detail.innerHTML = `
      <div class="skill-builder-detail-header">
        <span class="skill-builder-detail-badge">${step.badge}</span>
        <h4>${step.title}</h4>
      </div>
      <div class="skill-builder-detail-body">${step.body}</div>
    `;

    tabs.forEach(function (tab) {
      tab.classList.toggle("active", tab.getAttribute("data-skill-step") === stepKey);
    });

    var index = skillBuilderStepOrder.indexOf(stepKey);
    if (progressFill) {
      var width = ((index + 1) / skillBuilderStepOrder.length) * 100;
      progressFill.style.width = Math.max(8, width) + "%";
    }
    if (progressLabel) {
      progressLabel.textContent = "Step " + (index + 1) + " of " + skillBuilderStepOrder.length;
    }
  }

  tabs.forEach(function (tab) {
    tab.addEventListener("click", function () {
      var key = tab.getAttribute("data-skill-step") || "step1";
      renderStep(key);
    });
  });

  renderStep("step1");
}

function initSkillDownloadGate() {
  var openBtn = document.getElementById("skillGateOpenBtn");
  var modal = document.getElementById("skillGateModal");
  var closeBtn = document.getElementById("skillGateCloseBtn");
  var starConfirm = document.getElementById("skillStarConfirm");
  var downloadLink = document.getElementById("skillDownloadLink");
  if (!openBtn || !modal || !closeBtn || !starConfirm || !downloadLink) return;

  if (modal.parentElement !== document.body) {
    document.body.appendChild(modal);
  }

  function openModal() {
    starConfirm.checked = false;
    downloadLink.classList.add("disabled");
    modal.hidden = false;
    document.body.classList.add("policy-modal-open");
    window.requestAnimationFrame(function () {
      modal.classList.add("visible");
    });
  }

  function closeModal() {
    modal.classList.remove("visible");
    modal.hidden = true;
    document.body.classList.remove("policy-modal-open");
  }

  openBtn.addEventListener("click", openModal);
  closeBtn.addEventListener("click", closeModal);

  modal.addEventListener("click", function (e) {
    if (e.target === modal) closeModal();
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && !modal.hidden) closeModal();
  });

  starConfirm.addEventListener("change", function () {
    if (starConfirm.checked) {
      downloadLink.classList.remove("disabled");
    } else {
      downloadLink.classList.add("disabled");
    }
  });

  downloadLink.addEventListener("click", function () {
    if (downloadLink.classList.contains("disabled")) return;
    downloadLink.textContent = "Downloading...";
    fetch("https://raw.githubusercontent.com/ANIS151993/Notebook-Studio/main/datamentor-skill.md")
      .then(function (res) { return res.blob(); })
      .then(function (blob) {
        var url = URL.createObjectURL(blob);
        var a = document.createElement("a");
        a.href = url;
        a.download = "datamentor-skill.md";
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
        downloadLink.textContent = "Download datamentor-skill.md";
        window.setTimeout(closeModal, 600);
      })
      .catch(function () {
        downloadLink.textContent = "Download failed — try again";
        window.setTimeout(function () {
          downloadLink.textContent = "Download datamentor-skill.md";
        }, 2000);
      });
  });
}

function initPage() {
  initArchitectureExplorer();
  initBuildStepExplorer();
  initKpiCounters();
  initRevealAnimations();
  initSectionLinkHighlighting();
  initResearchAccessPolicy();
  initVideoOverview();
  initHireRequestBuilder();
  initSkillBuilderSteps();
  initSkillDownloadGate();
  makeCharts();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initPage, { once: true });
} else {
  initPage();
}
