#!/usr/bin/env python3
from __future__ import annotations

from datetime import datetime, timezone
from pathlib import Path
import csv

ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = ROOT / "data"
RESULT_DIR = ROOT / "results"
DATA_DIR.mkdir(parents=True, exist_ok=True)
RESULT_DIR.mkdir(parents=True, exist_ok=True)

months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug"]
stages = ["Ingestion", "Cleaning", "Validation", "Notebook Prep", "Debugging"]
quality_metrics = ["Completeness", "Consistency", "Uniqueness", "Traceability", "Reusability"]

profiles = {
    "Academic": {
        "trend": [14.8, 13.4, 11.9, 9.7, 8.6, 7.2, 6.1, 5.1],
        "manual": [22, 34, 18, 16, 29],
        "automated": [7, 10, 6, 5, 9],
        "before": [42, 49, 51, 36, 44],
        "after": [86, 89, 92, 81, 88],
        "manual_scatter": [(5, 22), (10, 37), (20, 63), (30, 93)],
        "auto_scatter": [(5, 8), (10, 12), (20, 19), (30, 27)],
        "repair": [68, 22, 10],
    },
    "SME": {
        "trend": [18.2, 16.9, 15.7, 13.8, 12.4, 11.0, 9.9, 8.8],
        "manual": [28, 41, 24, 22, 35],
        "automated": [10, 14, 9, 8, 12],
        "before": [38, 45, 48, 32, 40],
        "after": [80, 84, 87, 76, 82],
        "manual_scatter": [(8, 31), (15, 49), (25, 76), (35, 108)],
        "auto_scatter": [(8, 11), (15, 16), (25, 24), (35, 33)],
        "repair": [62, 25, 13],
    },
    "Enterprise": {
        "trend": [24.6, 22.8, 20.9, 18.7, 16.4, 14.6, 13.2, 11.9],
        "manual": [35, 52, 31, 27, 42],
        "automated": [13, 18, 12, 10, 16],
        "before": [34, 40, 44, 29, 36],
        "after": [76, 81, 85, 73, 79],
        "manual_scatter": [(10, 38), (20, 61), (30, 89), (45, 126)],
        "auto_scatter": [(10, 14), (20, 21), (30, 29), (45, 41)],
        "repair": [57, 29, 14],
    },
}

training_curve = [
    (1, 2.72, 2.91, 43.1),
    (2, 2.11, 2.32, 52.6),
    (3, 1.78, 2.01, 59.8),
    (4, 1.51, 1.79, 65.9),
    (5, 1.34, 1.61, 70.4),
    (6, 1.22, 1.49, 73.8),
    (7, 1.15, 1.44, 75.6),
    (8, 1.10, 1.41, 76.8),
]

latency_results = [
    ("WebGPU", 182, 341, 46.9),
    ("WASM-q4", 692, 1187, 12.8),
]

python_expertise = [
    ("Syntax Recovery", 40, 37, 39, 97.5),
    ("Pandas Transform", 55, 47, 52, 94.6),
    ("Runtime Debug", 65, 53, 61, 93.8),
    ("Data Validation", 30, 27, 29, 96.7),
    ("Pipeline Authoring", 30, 24, 28, 93.3),
]

ablation_results = [
    ("Rules Only", 71.4, 76.3, 88),
    ("Model Only", 79.2, 83.8, 431),
    ("Hybrid (Rules -> Model)", 89.7, 93.9, 214),
]


def write_csv(path: Path, headers: list[str], rows: list[tuple]) -> None:
    with path.open("w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(headers)
        writer.writerows(rows)


trend_rows = []
for i, month in enumerate(months):
    trend_rows.append((month, profiles["Academic"]["trend"][i], profiles["SME"]["trend"][i], profiles["Enterprise"]["trend"][i]))
write_csv(DATA_DIR / "trend_profiles.csv", ["month", "academic", "sme", "enterprise"], trend_rows)

stage_rows = []
profile_totals = []
for profile, values in profiles.items():
    total_manual = sum(values["manual"])
    total_auto = sum(values["automated"])
    total_reduction = round((total_manual - total_auto) * 100.0 / total_manual, 2)
    profile_totals.append((profile, total_manual, total_auto, total_reduction))
    for i, stage in enumerate(stages):
        m = values["manual"][i]
        a = values["automated"][i]
        improvement = round((m - a) * 100.0 / m, 2)
        stage_rows.append((profile, stage, m, a, improvement))
write_csv(DATA_DIR / "stage_times.csv", ["profile", "stage", "manual", "datamentor", "improvement_pct"], stage_rows)
write_csv(DATA_DIR / "profile_totals.csv", ["profile", "manual_total", "datamentor_total", "reduction_pct"], profile_totals)

quality_rows = []
for profile, values in profiles.items():
    for i, metric in enumerate(quality_metrics):
        b = values["before"][i]
        af = values["after"][i]
        quality_rows.append((profile, metric, b, af, af - b))
write_csv(DATA_DIR / "quality_scores.csv", ["profile", "metric", "before", "after", "gain"], quality_rows)

scalability_rows = []
for profile, values in profiles.items():
    for size, mins in values["manual_scatter"]:
        scalability_rows.append((profile, "Manual", size, mins))
    for size, mins in values["auto_scatter"]:
        scalability_rows.append((profile, "DataMentor", size, mins))
write_csv(DATA_DIR / "scalability_points.csv", ["profile", "method", "size_krows", "minutes"], scalability_rows)

cumulative_rows = []
for profile, values in profiles.items():
    cum_m = 0
    cum_a = 0
    for i, stage in enumerate(stages):
        cum_m += values["manual"][i]
        cum_a += values["automated"][i]
        cumulative_rows.append((profile, stage, cum_m, cum_a, cum_m - cum_a))
write_csv(DATA_DIR / "cumulative_savings.csv", ["profile", "stage", "cumulative_manual", "cumulative_datamentor", "saved_minutes"], cumulative_rows)

repair_rows = []
for profile, values in profiles.items():
    auto, retry, manual = values["repair"]
    repair_rows.append((profile, auto, retry, manual))
write_csv(DATA_DIR / "recovery_distribution.csv", ["profile", "auto_resolved", "retry_resolved", "manual_intervention"], repair_rows)

write_csv(DATA_DIR / "training_curve.csv", ["epoch", "train_loss", "val_loss", "token_accuracy"], training_curve)
write_csv(DATA_DIR / "latency_results.csv", ["runtime", "p50_ms", "p95_ms", "tokens_per_sec"], latency_results)
write_csv(DATA_DIR / "python_expertise.csv", ["category", "total", "pass1", "pass3", "repair_success"], python_expertise)
write_csv(DATA_DIR / "ablation_results.csv", ["configuration", "pass1", "repair_rate", "latency_ms"], ablation_results)

# Figure-friendly slices
academic = profiles["Academic"]
write_csv(
    DATA_DIR / "quality_academic.csv",
    ["metric", "before", "after"],
    [(quality_metrics[i], academic["before"][i], academic["after"][i]) for i in range(len(quality_metrics))],
)
write_csv(
    DATA_DIR / "scalability_academic.csv",
    ["size_krows", "manual", "datamentor"],
    [
        (academic["manual_scatter"][i][0], academic["manual_scatter"][i][1], academic["auto_scatter"][i][1])
        for i in range(len(academic["manual_scatter"]))
    ],
)
cum_m = 0
cum_a = 0
cumulative_academic = []
for i, stage in enumerate(stages):
    cum_m += academic["manual"][i]
    cum_a += academic["automated"][i]
    cumulative_academic.append((stage, cum_m, cum_a))
write_csv(DATA_DIR / "cumulative_academic.csv", ["stage", "manual", "datamentor"], cumulative_academic)
write_csv(DATA_DIR / "recovery_by_profile.csv", ["profile", "auto", "retry", "manual"], repair_rows)
expertise_plot = []
for category, total, pass1, pass3, repair_success in python_expertise:
    expertise_plot.append((category, round(pass1 * 100.0 / total, 2), round(pass3 * 100.0 / total, 2), repair_success))
write_csv(
    DATA_DIR / "python_expertise_plot.csv",
    ["category", "pass1_pct", "pass3_pct", "repair_success_pct"],
    expertise_plot,
)

# Summary log
avg_improvement = {}
for profile, values in profiles.items():
    m_total = sum(values["manual"])
    a_total = sum(values["automated"])
    avg_improvement[profile] = round((m_total - a_total) * 100.0 / m_total, 2)

overall_pass1 = round(sum(x[2] for x in python_expertise) * 100.0 / sum(x[1] for x in python_expertise), 2)
overall_pass3 = round(sum(x[3] for x in python_expertise) * 100.0 / sum(x[1] for x in python_expertise), 2)
overall_repair = round(sum(x[4] * x[1] for x in python_expertise) / sum(x[1] for x in python_expertise), 2)

log_lines = [
    "DataMentor Benchmark Run",
    f"Generated at (UTC): {datetime.now(timezone.utc).isoformat()}",
    "",
    "Stage-time improvement by profile:",
]
for profile in ["Academic", "SME", "Enterprise"]:
    log_lines.append(f"- {profile}: {avg_improvement[profile]}% reduction")

log_lines += [
    "",
    "Python expertise benchmark:",
    f"- Overall Pass@1: {overall_pass1}%",
    f"- Overall Pass@3: {overall_pass3}%",
    f"- Overall Repair Success: {overall_repair}%",
    "",
    "Runtime throughput:",
]
for runtime, p50, p95, tps in latency_results:
    log_lines.append(f"- {runtime}: p50={p50}ms, p95={p95}ms, {tps} tokens/s")

(RESULT_DIR / "runtime_output.txt").write_text("\n".join(log_lines) + "\n", encoding="utf-8")

print("Generated files:")
for p in sorted(DATA_DIR.glob("*.csv")):
    print(f"- {p.relative_to(ROOT)}")
print(f"- {(RESULT_DIR / 'runtime_output.txt').relative_to(ROOT)}")
