// Analysis generation for all visualization types
// Produces data-driven text summaries for each chart with domain-aware insights

import type { DistPlotData, ViolinGroupData, HeatMapData, PairPlotData, JointPlotData } from './advancedDataProcessors';
import { calculateStats, pearsonCorrelation } from './advancedDataProcessors';

export type VisualizationAnalysis = {
  dataset: string;
  datasetDescription: string;
  suitability: string;
  findings: string[];
};

// =========================================================================
// Domain-aware column knowledge base
// =========================================================================

type ColumnDomainInfo = {
  label: string;
  description: string;
  insight: (stats: { mean: number; median: number; std: number; min: number; max: number; q1: number; q3: number; skewness: number }) => string;
  pairInsight?: (otherCol: string, r: number) => string;
};

const HEART_COLUMN_KNOWLEDGE: Record<string, ColumnDomainInfo> = {
  age: {
    label: 'Patient Age',
    description: 'Age of the patient in years',
    insight: (s) => {
      const risk = s.mean > 55 ? 'elevated-risk age bracket (>55)' : 'moderate age range';
      return `Average patient age is ${s.mean} years (range: ${s.min}–${s.max}). The cohort falls in the ${risk}. Heart disease risk increases significantly after age 45 for men and 55 for women. ${s.skewness > 0.3 ? 'The right-skew suggests a higher concentration of younger patients with fewer elderly cases' : s.skewness < -0.3 ? 'The left-skew indicates more elderly patients in this dataset' : 'The balanced distribution shows a representative age range across the population'}`;
    },
    pairInsight: (other, r) => {
      if (other === 'thalachh') return `Age vs max heart rate shows r=${r}: ${r < -0.3 ? 'as expected, maximum heart rate declines with age — a well-established cardiovascular aging pattern' : 'weaker-than-expected age-heart rate relationship in this cohort'}`;
      if (other === 'chol') return `Age vs cholesterol (r=${r}): ${r > 0.2 ? 'positive trend — cholesterol tends to rise with age, increasing plaque buildup risk' : 'weaker age-cholesterol link than typically observed'}`;
      if (other === 'trtbps') return `Age vs resting blood pressure (r=${r}): ${r > 0.2 ? 'blood pressure rises with age, consistent with arterial stiffening' : 'modest relationship between age and blood pressure'}`;
      return `Age paired with ${other} (r=${r}) provides insight into age-dependent cardiac risk factors`;
    },
  },
  sex: {
    label: 'Sex (0=Female, 1=Male)',
    description: 'Biological sex of the patient',
    insight: (s) => {
      const maleRatio = s.mean * 100;
      return `Dataset is ${maleRatio.toFixed(0)}% male / ${(100 - maleRatio).toFixed(0)}% female. Men generally face higher heart disease risk at younger ages. ${maleRatio > 60 ? 'Male-dominated dataset — findings may underrepresent female-specific cardiac patterns' : maleRatio < 40 ? 'Female-dominated dataset — unusual for heart disease studies' : 'Reasonably balanced sex distribution for cardiovascular analysis'}`;
    },
  },
  cp: {
    label: 'Chest Pain Type',
    description: '0=Typical Angina, 1=Atypical Angina, 2=Non-anginal Pain, 3=Asymptomatic',
    insight: (s) => {
      return `Mean chest pain type: ${s.mean.toFixed(1)} across 4 categories (0–3). Type 0 (typical angina) is most classically associated with heart disease. ${s.mean > 1.5 ? 'Higher average suggests many patients present with atypical or no chest pain — critical for diagnosis as silent ischemia is often missed' : 'Lower average indicates more patients with typical angina presentation'}`;
    },
  },
  trtbps: {
    label: 'Resting Blood Pressure',
    description: 'Resting blood pressure in mm Hg on admission',
    insight: (s) => {
      const hypertension = s.mean > 140 ? 'hypertensive range (>140 mm Hg)' : s.mean > 120 ? 'pre-hypertensive range (120–140 mm Hg)' : 'normal range';
      return `Average resting BP: ${s.mean} mm Hg (range: ${s.min}–${s.max}). Population average falls in ${hypertension}. ${s.max > 180 ? `Extreme values up to ${s.max} mm Hg indicate stage 2 hypertension cases present in the data.` : ''} Sustained elevated BP is a primary modifiable risk factor for heart attack and stroke`;
    },
  },
  chol: {
    label: 'Serum Cholesterol',
    description: 'Serum cholesterol level in mg/dl',
    insight: (s) => {
      const level = s.mean > 240 ? 'high-risk (>240 mg/dl)' : s.mean > 200 ? 'borderline-high (200–240 mg/dl)' : 'desirable (<200 mg/dl)';
      return `Average cholesterol: ${s.mean} mg/dl (${level}). Range spans ${s.min}–${s.max} mg/dl. ${s.max > 400 ? `Extreme values above 400 mg/dl suggest familial hypercholesterolemia cases.` : ''} Total cholesterol above 200 mg/dl doubles heart attack risk compared to levels below 180`;
    },
  },
  fbs: {
    label: 'Fasting Blood Sugar',
    description: 'Fasting blood sugar > 120 mg/dl (1=True, 0=False)',
    insight: (s) => {
      const diabeticPct = (s.mean * 100).toFixed(0);
      return `${diabeticPct}% of patients have fasting blood sugar >120 mg/dl (indicative of diabetes). Diabetes is a major independent risk factor for coronary artery disease, increasing risk 2–4x. ${parseFloat(diabeticPct) > 30 ? 'High prevalence of elevated blood sugar in this cohort suggests significant diabetic comorbidity' : 'Moderate diabetic prevalence — typical of cardiac study populations'}`;
    },
  },
  restecg: {
    label: 'Resting ECG Results',
    description: '0=Normal, 1=ST-T wave abnormality, 2=Left ventricular hypertrophy',
    insight: (s) => {
      return `Average ECG result: ${s.mean.toFixed(1)} (0=Normal, 1=ST-T abnormality, 2=LV hypertrophy). ST-T wave abnormalities can indicate myocardial ischemia. ${s.mean > 0.5 ? 'Significant proportion of patients show ECG abnormalities, suggesting underlying cardiac stress' : 'Many patients show normal resting ECG — note that normal ECG does not rule out heart disease'}`;
    },
  },
  thalachh: {
    label: 'Maximum Heart Rate Achieved',
    description: 'Maximum heart rate achieved during exercise testing',
    insight: (s) => {
      return `Average max HR: ${s.mean} bpm (range: ${s.min}–${s.max}). ${s.mean < 150 ? 'Below-average peak HR may indicate chronotropic incompetence — inability to achieve target HR is a significant predictor of cardiac events' : 'Adequate average peak HR suggests most patients could achieve reasonable exercise tolerance'}. The age-predicted max HR formula (220−age) serves as a benchmark; failure to reach 85% of predicted max is clinically significant`;
    },
  },
  exng: {
    label: 'Exercise-Induced Angina',
    description: '1=Yes, 0=No — chest pain triggered by exercise',
    insight: (s) => {
      const pct = (s.mean * 100).toFixed(0);
      return `${pct}% of patients experienced exercise-induced angina. Exercise-triggered chest pain is a hallmark sign of coronary artery disease — it occurs when narrowed arteries cannot supply adequate blood during exertion. ${parseFloat(pct) > 40 ? 'High prevalence indicates a cohort with significant coronary artery narrowing' : 'Moderate prevalence of exercise-induced angina in this population'}`;
    },
  },
  oldpeak: {
    label: 'ST Depression (Exercise)',
    description: 'ST depression induced by exercise relative to rest',
    insight: (s) => {
      return `Average ST depression: ${s.mean} (range: ${s.min}–${s.max}). ST depression >1.0 mm during exercise is a strong indicator of myocardial ischemia. ${s.mean > 1.0 ? 'Elevated average suggests significant ischemia prevalence in this cohort' : 'Moderate average ST depression — individual high values warrant close attention'}. Combined with chest pain type and exercise angina, this forms the core of exercise stress test interpretation`;
    },
  },
  slp: {
    label: 'Slope of Peak Exercise ST',
    description: '0=Downsloping, 1=Flat, 2=Upsloping',
    insight: (s) => {
      return `Average ST slope: ${s.mean.toFixed(1)} (0=Downsloping, 1=Flat, 2=Upsloping). Downsloping ST segment is the most ominous pattern, strongly associated with severe multi-vessel coronary disease. ${s.mean < 1.0 ? 'Lower average suggests more patients with concerning downsloping patterns' : 'Higher average indicates more upsloping/flat patterns — generally more favorable'}`;
    },
  },
  caa: {
    label: 'Number of Major Vessels',
    description: 'Number of major vessels colored by fluoroscopy (0–3)',
    insight: (s) => {
      return `Average vessels colored: ${s.mean.toFixed(1)} (range: 0–3). This represents the number of major coronary arteries with >50% narrowing visible on fluoroscopy. ${s.mean > 1.0 ? 'Higher average indicates multi-vessel disease prevalence — associated with poorer prognosis' : 'Lower average suggests many patients have limited vessel involvement'}. 0 vessels is normal; 3 indicates triple-vessel disease requiring urgent intervention`;
    },
  },
  thall: {
    label: 'Thalassemia',
    description: '1=Fixed defect, 2=Normal, 3=Reversible defect',
    insight: (s) => {
      return `Average thallium scan result: ${s.mean.toFixed(1)} (1=Fixed defect, 2=Normal, 3=Reversible defect). Reversible defects (3) indicate exercise-induced ischemia — tissue that is alive but underperfused. Fixed defects (1) suggest prior infarction with scarred tissue. ${s.mean > 2.0 ? 'Higher average suggests more reversible defects — patients who may benefit from revascularization' : 'Lower average indicates more fixed defects or normal results'}`;
    },
  },
  output: {
    label: 'Heart Attack Risk',
    description: '1=Higher risk of heart attack, 0=Lower risk',
    insight: (s) => {
      const riskPct = (s.mean * 100).toFixed(0);
      return `${riskPct}% of patients classified as higher heart attack risk (output=1). ${parseFloat(riskPct) > 50 ? 'Majority of patients are in the higher-risk group — dataset is slightly imbalanced toward positive cases' : parseFloat(riskPct) < 40 ? 'Lower prevalence of positive cases — class imbalance may affect model training' : 'Reasonably balanced outcome distribution for predictive modeling'}. This binary outcome is the target variable for heart attack prediction models`;
    },
  },
};

function getColumnDomainInsight(columnName: string, stats: { mean: number; median: number; std: number; min: number; max: number; q1: number; q3: number; skewness: number }): string | null {
  const key = columnName.toLowerCase();
  const info = HEART_COLUMN_KNOWLEDGE[key];
  if (!info) return null;
  return info.insight(stats);
}

function getColumnLabel(columnName: string): string {
  const key = columnName.toLowerCase();
  return HEART_COLUMN_KNOWLEDGE[key]?.label || columnName;
}

function getColumnDescription(columnName: string): string {
  const key = columnName.toLowerCase();
  return HEART_COLUMN_KNOWLEDGE[key]?.description || '';
}

function getPairDomainInsight(col1: string, col2: string, r: number): string | null {
  const k1 = col1.toLowerCase();
  const k2 = col2.toLowerCase();
  const info1 = HEART_COLUMN_KNOWLEDGE[k1];
  const info2 = HEART_COLUMN_KNOWLEDGE[k2];
  if (info1?.pairInsight) return info1.pairInsight(col2, r);
  if (info2?.pairInsight) return info2.pairInsight(col1, r);
  return null;
}

// =========================================================================
// New visualization analysis generators
// =========================================================================

export function generateDistPlotAnalysis(
  data: DistPlotData,
  datasetName: string,
  datasetDescription: string
): VisualizationAnalysis {
  const { stats } = data;
  const totalCount = data.histogram.reduce((sum, b) => sum + b.count, 0);
  const findings: string[] = [];

  // Domain-aware insight takes priority
  const domainInsight = getColumnDomainInsight(data.columnName, stats);
  if (domainInsight) {
    findings.push(domainInsight);
  }

  if (stats.skewness > 0.5) {
    findings.push(`The distribution is right-skewed (skewness: ${stats.skewness}), with a concentration of lower values and a tail extending toward higher values`);
  } else if (stats.skewness < -0.5) {
    findings.push(`The distribution is left-skewed (skewness: ${stats.skewness}), with a concentration of higher values and a tail toward lower values`);
  } else {
    findings.push(`The distribution is approximately symmetric (skewness: ${stats.skewness}), suggesting a balanced spread around the center`);
  }

  findings.push(`Central tendency: mean = ${stats.mean}, median = ${stats.median}. ${Math.abs(stats.mean - stats.median) > stats.std * 0.3 ? 'The gap between mean and median confirms the skew' : 'Mean and median are close, indicating symmetry'}`);
  findings.push(`Data spans from ${stats.min} to ${stats.max} (range: ${Math.round((stats.max - stats.min) * 100) / 100}) with std dev = ${stats.std}. IQR: [${stats.q1}, ${stats.q3}]`);

  const colLabel = getColumnLabel(data.columnName);
  const colDesc = getColumnDescription(data.columnName);

  return {
    dataset: datasetName,
    datasetDescription,
    suitability: colDesc
      ? `${colLabel} (${colDesc}) — ${totalCount} observations analyzed for distribution patterns`
      : `The ${data.columnName} column provides continuous numeric data with ${totalCount} observations and meaningful variation, ideal for distribution analysis`,
    findings,
  };
}

export function generatePieChartAnalysis(
  data: { label: string; count: number }[],
  datasetName: string,
  datasetDescription: string,
  columnName: string
): VisualizationAnalysis {
  const total = data.reduce((sum, d) => sum + d.count, 0);
  const findings: string[] = [];

  // Domain-aware insight for categorical columns
  const colKey = columnName.toLowerCase();
  const colInfo = HEART_COLUMN_KNOWLEDGE[colKey];
  if (colInfo) {
    const meanVal = data.reduce((sum, d, i) => sum + i * d.count, 0) / total;
    const domainInsight = colInfo.insight({ mean: meanVal, median: meanVal, std: 0, min: 0, max: data.length - 1, q1: 0, q3: 0, skewness: 0 });
    findings.push(domainInsight);
  }

  const dominant = data[0];
  findings.push(`"${dominant.label}" is the dominant category at ${((dominant.count / total) * 100).toFixed(1)}% (${dominant.count} of ${total} records)`);

  const breakdown = data.slice(0, 5).map(d => `${d.label}: ${((d.count / total) * 100).toFixed(1)}%`).join(', ');
  findings.push(`Breakdown: ${breakdown}${data.length > 5 ? ` (+${data.length - 5} more)` : ''}`);

  const colLabel = getColumnLabel(columnName);
  const colDesc = getColumnDescription(columnName);

  return {
    dataset: datasetName,
    datasetDescription,
    suitability: colDesc
      ? `${colLabel} (${colDesc}) — ${data.length} categories across ${total} records`
      : `The ${columnName} column has ${data.length} distinct categories, well-suited for proportional analysis via pie chart`,
    findings,
  };
}

export function generateViolinAnalysis(
  violinData: ViolinGroupData[],
  datasetName: string,
  datasetDescription: string,
  numericColumn: string,
  categoryColumn: string
): VisualizationAnalysis {
  const findings: string[] = [];
  const numLabel = getColumnLabel(numericColumn);
  const catLabel = getColumnLabel(categoryColumn);
  const numDesc = getColumnDescription(numericColumn);
  const catDesc = getColumnDescription(categoryColumn);

  // Domain-aware group comparison
  if (HEART_COLUMN_KNOWLEDGE[categoryColumn.toLowerCase()] && HEART_COLUMN_KNOWLEDGE[numericColumn.toLowerCase()]) {
    const sortedByMedian = [...violinData].sort((a, b) => b.median - a.median);
    if (categoryColumn.toLowerCase() === 'sex' || categoryColumn.toLowerCase() === 'output' || categoryColumn.toLowerCase() === 'exng') {
      const groupDescriptions = violinData.map(v => {
        const catKey = categoryColumn.toLowerCase();
        let groupLabel = v.category;
        if (catKey === 'sex') groupLabel = v.category === '1' || v.category === 'Male' ? 'Male' : 'Female';
        if (catKey === 'output') groupLabel = v.category === '1' ? 'Higher Risk' : 'Lower Risk';
        if (catKey === 'exng') groupLabel = v.category === '1' ? 'Exercise Angina' : 'No Exercise Angina';
        return `${groupLabel} (n=${v.count}): median ${numericColumn}=${v.median}, IQR [${v.q1}, ${v.q3}]`;
      });
      findings.push(`${numLabel} distribution by ${catLabel}: ${groupDescriptions.join(' | ')}`);
      const diff = Math.abs(sortedByMedian[0].median - sortedByMedian[sortedByMedian.length - 1].median);
      findings.push(`Median difference between groups: ${diff.toFixed(1)} — ${diff > sortedByMedian[0].median * 0.1 ? 'clinically meaningful separation that could aid in risk stratification' : 'modest difference — this feature alone may not strongly differentiate groups'}`);
    }
  }

  const sortedByMedian = [...violinData].sort((a, b) => b.median - a.median);
  findings.push(`"${sortedByMedian[0].category}" has the highest median (${sortedByMedian[0].median}) while "${sortedByMedian[sortedByMedian.length - 1].category}" has the lowest (${sortedByMedian[sortedByMedian.length - 1].median})`);

  violinData.forEach(v => {
    const iqr = v.q3 - v.q1;
    const range = v.max - v.min;
    const ratio = range > 0 ? (iqr / range).toFixed(2) : '0';
    findings.push(`"${v.category}" (n=${v.count}): range [${v.min}, ${v.max}], IQR [${v.q1}, ${v.q3}] — ${parseFloat(ratio) > 0.5 ? 'tightly concentrated' : 'widely spread'}`);
  });

  return {
    dataset: datasetName,
    datasetDescription,
    suitability: numDesc && catDesc
      ? `${numLabel} (${numDesc}) grouped by ${catLabel} (${catDesc}) — revealing within-group distribution shapes`
      : `Pairing numeric (${numericColumn}) with categorical (${categoryColumn}) data enables violin plots to reveal within-group distribution shapes that summary statistics alone would miss`,
    findings,
  };
}

export function generateHeatMapAnalysis(
  heatMapData: HeatMapData,
  datasetName: string,
  datasetDescription: string
): VisualizationAnalysis {
  const { columns, matrix } = heatMapData;
  const findings: string[] = [];

  let strongestPos = { r: 0, pair: '', col1: '', col2: '' };
  let strongestNeg = { r: 0, pair: '', col1: '', col2: '' };
  let weakest = { r: 1, pair: '' };

  for (let i = 0; i < columns.length; i++) {
    for (let j = i + 1; j < columns.length; j++) {
      const r = matrix[i][j];
      if (r > strongestPos.r) strongestPos = { r, pair: `${getColumnLabel(columns[i])} & ${getColumnLabel(columns[j])}`, col1: columns[i], col2: columns[j] };
      if (r < strongestNeg.r) strongestNeg = { r, pair: `${getColumnLabel(columns[i])} & ${getColumnLabel(columns[j])}`, col1: columns[i], col2: columns[j] };
      if (Math.abs(r) < Math.abs(weakest.r)) weakest = { r, pair: `${getColumnLabel(columns[i])} & ${getColumnLabel(columns[j])}` };
    }
  }

  if (strongestPos.r > 0.3) {
    const domainInsight = getPairDomainInsight(strongestPos.col1, strongestPos.col2, strongestPos.r);
    findings.push(`Strongest positive correlation: ${strongestPos.pair} (r = ${strongestPos.r})${domainInsight ? ` — ${domainInsight}` : ' — these features increase together'}`);
  }
  if (strongestNeg.r < -0.2) {
    const domainInsight = getPairDomainInsight(strongestNeg.col1, strongestNeg.col2, strongestNeg.r);
    findings.push(`Strongest negative correlation: ${strongestNeg.pair} (r = ${strongestNeg.r})${domainInsight ? ` — ${domainInsight}` : ' — inverse relationship'}`);
  }
  findings.push(`Weakest correlation: ${weakest.pair} (r = ${weakest.r}) — largely independent features`);

  const offDiag = matrix.flatMap((row, i) => row.filter((_, j) => i !== j).map(Math.abs));
  const avgAbsCorr = offDiag.reduce((a, b) => a + b, 0) / offDiag.length;
  findings.push(`Average |r| across all pairs: ${avgAbsCorr.toFixed(2)} — ${avgAbsCorr > 0.5 ? 'substantial interdependence among cardiac risk factors' : avgAbsCorr > 0.3 ? 'moderate relationships between features' : 'mostly independent features — each contributes unique information for prediction'}`);

  // Check if these are heart columns and add clinical context
  const heartCols = columns.filter(c => HEART_COLUMN_KNOWLEDGE[c.toLowerCase()]);
  if (heartCols.length >= columns.length * 0.5) {
    findings.push(`Clinical note: In cardiac datasets, moderate feature independence is desirable for predictive models — it means each variable captures a different aspect of cardiovascular health`);
  }

  return {
    dataset: datasetName,
    datasetDescription,
    suitability: `${columns.length} features (${columns.map(c => getColumnLabel(c)).join(', ')}) analyzed for pairwise correlations`,
    findings,
  };
}

export function generatePairPlotAnalysis(
  pairData: PairPlotData,
  datasetName: string,
  datasetDescription: string
): VisualizationAnalysis {
  const findings: string[] = [];
  const numPairs = pairData.columns.length * (pairData.columns.length - 1) / 2;
  const colLabels = pairData.columns.map(c => getColumnLabel(c));

  findings.push(`Visualizing ${numPairs} pairwise scatter relationships and ${pairData.columns.length} univariate distributions across: ${colLabels.join(', ')}`);

  if (pairData.groups.length > 1 && pairData.groups[0] !== 'all') {
    const groupLabel = getColumnLabel(pairData.groupColumn || '');
    const heartCols = pairData.columns.filter(c => HEART_COLUMN_KNOWLEDGE[c.toLowerCase()]);
    if (heartCols.length > 0 && (pairData.groupColumn?.toLowerCase() === 'output' || pairData.groupColumn?.toLowerCase() === 'sex')) {
      const groupDesc = pairData.groupColumn?.toLowerCase() === 'output'
        ? 'heart attack risk (0=lower, 1=higher)'
        : 'sex (0=female, 1=male)';
      findings.push(`Color-coded by ${groupLabel} (${groupDesc}) — scatter panels with clear cluster separation identify the strongest discriminative features for cardiac risk prediction`);
    } else {
      findings.push(`Color-coded by ${groupLabel} (${pairData.groups.join(', ')}) — revealing which feature combinations best separate the groups`);
    }
  }

  findings.push(`Diagonal histograms show each feature's marginal distribution; off-diagonal scatter plots expose correlations, clusters, and non-linear relationships`);

  // Domain-specific pair insights for heart data
  const heartCols = pairData.columns.filter(c => HEART_COLUMN_KNOWLEDGE[c.toLowerCase()]);
  if (heartCols.length >= 2) {
    findings.push(`Clinical pairs to examine: age vs thalachh (exercise capacity decline), chol vs trtbps (metabolic syndrome indicators), oldpeak vs exng (ischemia markers)`);
  }

  return {
    dataset: datasetName,
    datasetDescription,
    suitability: `${pairData.columns.length} features (${colLabels.join(', ')}) ${pairData.groupColumn ? `grouped by ${getColumnLabel(pairData.groupColumn)} ` : ''}enable comprehensive pairwise cardiac feature exploration`,
    findings,
  };
}

export function generateJointPlotAnalysis(
  jointData: JointPlotData,
  datasetName: string,
  datasetDescription: string
): VisualizationAnalysis {
  const findings: string[] = [];
  const r = jointData.correlation;
  const strength = Math.abs(r) > 0.7 ? 'strong' : Math.abs(r) > 0.4 ? 'moderate' : 'weak';
  const direction = r > 0 ? 'positive' : r < 0 ? 'negative' : 'no';
  const xLabel = getColumnLabel(jointData.xColumn);
  const yLabel = getColumnLabel(jointData.yColumn);

  // Domain-aware pair insight
  const pairInsight = getPairDomainInsight(jointData.xColumn, jointData.yColumn, r);
  if (pairInsight) {
    findings.push(pairInsight);
  } else {
    findings.push(`Pearson correlation r = ${r} — a ${strength} ${direction} linear relationship between ${xLabel} and ${yLabel}`);
  }

  // Domain-aware individual stats
  const xDomainInsight = getColumnDomainInsight(jointData.xColumn, jointData.xStats);
  const yDomainInsight = getColumnDomainInsight(jointData.yColumn, jointData.yStats);
  if (xDomainInsight) {
    findings.push(xDomainInsight);
  } else {
    findings.push(`${xLabel}: mean = ${jointData.xStats.mean}, std = ${jointData.xStats.std}, range [${jointData.xStats.min}, ${jointData.xStats.max}]`);
  }
  if (yDomainInsight) {
    findings.push(yDomainInsight);
  } else {
    findings.push(`${yLabel}: mean = ${jointData.yStats.mean}, std = ${jointData.yStats.std}, range [${jointData.yStats.min}, ${jointData.yStats.max}]`);
  }

  return {
    dataset: datasetName,
    datasetDescription,
    suitability: `${xLabel} vs ${yLabel} — joint distribution analysis combining scatter, marginal histograms, and density views`,
    findings,
  };
}

// =========================================================================
// Basic chart analysis generators (for existing chart types in CUSTOM mode)
// =========================================================================

export function generateBarAnalysis(
  data: { label: string; count: number }[],
  datasetName: string,
  datasetDescription: string,
  columnName: string
): VisualizationAnalysis {
  const total = data.reduce((sum, d) => sum + d.count, 0);
  const colLabel = getColumnLabel(columnName);
  const colDesc = getColumnDescription(columnName);
  const findings: string[] = [];

  // Domain insight
  const colInfo = HEART_COLUMN_KNOWLEDGE[columnName.toLowerCase()];
  if (colInfo) {
    const meanVal = data.reduce((sum, d) => sum + parseFloat(d.label) * d.count, 0) / total;
    if (!isNaN(meanVal)) {
      findings.push(colInfo.insight({ mean: Math.round(meanVal * 100) / 100, median: meanVal, std: 0, min: parseFloat(data[0]?.label) || 0, max: parseFloat(data[data.length - 1]?.label) || 0, q1: 0, q3: 0, skewness: 0 }));
    }
  }

  findings.push(`Most frequent: "${data[0]?.label}" with ${data[0]?.count} occurrences (${((data[0]?.count / total) * 100).toFixed(1)}%)`);
  findings.push(`Least frequent shown: "${data[data.length - 1]?.label}" with ${data[data.length - 1]?.count} occurrences (${((data[data.length - 1]?.count / total) * 100).toFixed(1)}%)`);
  findings.push(`${total} total records across ${data.length} categories${data.length > 15 ? ' (showing top 15)' : ''}`);

  return {
    dataset: datasetName,
    datasetDescription,
    suitability: colDesc
      ? `${colLabel} (${colDesc}) — ${data.length} categories compared`
      : `The ${columnName} column contains ${data.length} distinct categorical values suitable for bar chart comparison`,
    findings,
  };
}

export function generateHistogramAnalysis(
  data: { range: string; count: number }[],
  datasetName: string,
  datasetDescription: string,
  columnName: string
): VisualizationAnalysis {
  const total = data.reduce((sum, d) => sum + d.count, 0);
  const peakBin = data.reduce((best, d) => d.count > best.count ? d : best, data[0]);
  const colLabel = getColumnLabel(columnName);
  const colDesc = getColumnDescription(columnName);
  const findings: string[] = [];

  // Domain insight
  const colInfo = HEART_COLUMN_KNOWLEDGE[columnName.toLowerCase()];
  if (colInfo) {
    // Extract approximate stats from bin ranges
    const firstRange = data[0]?.range || '';
    const lastRange = data[data.length - 1]?.range || '';
    const minVal = parseFloat(firstRange.split('–')[0]) || 0;
    const maxVal = parseFloat(lastRange.split('–')[1]) || parseFloat(lastRange.split('–')[0]) || 0;
    const approxMean = (minVal + maxVal) / 2;
    findings.push(colInfo.insight({ mean: approxMean, median: approxMean, std: 0, min: minVal, max: maxVal, q1: 0, q3: 0, skewness: 0 }));
  }

  findings.push(`Peak frequency at bin ${peakBin.range} with ${peakBin.count} observations (${((peakBin.count / total) * 100).toFixed(1)}% of total)`);
  findings.push(`${total} total data points distributed across ${data.length} bins`);

  return {
    dataset: datasetName,
    datasetDescription,
    suitability: colDesc
      ? `${colLabel} (${colDesc}) — ${total} observations across ${data.length} bins`
      : `The ${columnName} column provides continuous numeric data across ${data.length} bins for frequency distribution analysis`,
    findings,
  };
}

export function generateScatterAnalysis(
  data: { x: number; y: number }[],
  datasetName: string,
  datasetDescription: string,
  xCol: string,
  yCol: string
): VisualizationAnalysis {
  const xVals = data.map(d => d.x);
  const yVals = data.map(d => d.y);
  const r = pearsonCorrelation(xVals, yVals);
  const xStats = calculateStats(xVals);
  const yStats = calculateStats(yVals);
  const strength = Math.abs(r) > 0.7 ? 'strong' : Math.abs(r) > 0.4 ? 'moderate' : 'weak';
  const xLabel = getColumnLabel(xCol);
  const yLabel = getColumnLabel(yCol);
  const findings: string[] = [];

  // Domain-aware pair insight
  const pairInsight = getPairDomainInsight(xCol, yCol, r);
  if (pairInsight) {
    findings.push(pairInsight);
  }

  findings.push(`Correlation: r = ${r} (${strength} ${r >= 0 ? 'positive' : 'negative'} relationship)`);

  // Domain-aware individual column insights
  const xInsight = getColumnDomainInsight(xCol, xStats);
  const yInsight = getColumnDomainInsight(yCol, yStats);
  findings.push(xInsight || `${xLabel} range: [${xStats.min}, ${xStats.max}], mean = ${xStats.mean}`);
  findings.push(yInsight || `${yLabel} range: [${yStats.min}, ${yStats.max}], mean = ${yStats.mean}`);
  findings.push(`${data.length} data points plotted — look for clusters, outliers, and non-linear patterns`);

  return {
    dataset: datasetName,
    datasetDescription,
    suitability: `${xLabel} vs ${yLabel} — ${data.length} data points analyzed for relationship patterns`,
    findings,
  };
}

export function generateLineAnalysis(
  data: { date: string; value: number }[],
  datasetName: string,
  datasetDescription: string,
  dateCol: string,
  valueCol: string
): VisualizationAnalysis {
  const values = data.map(d => d.value);
  const stats = calculateStats(values);
  const trend = values.length > 1 ? (values[values.length - 1] > values[0] ? 'upward' : 'downward') : 'flat';
  const valLabel = getColumnLabel(valueCol);
  const findings: string[] = [];

  const domainInsight = getColumnDomainInsight(valueCol, stats);
  if (domainInsight) findings.push(domainInsight);

  findings.push(`Overall ${trend} trend from ${data[0]?.date} to ${data[data.length - 1]?.date}`);
  findings.push(`${valLabel}: mean = ${stats.mean}, range [${stats.min}, ${stats.max}]`);
  findings.push(`${data.length} time points plotted showing the evolution of ${valLabel} over ${dateCol}`);

  return {
    dataset: datasetName,
    datasetDescription,
    suitability: `${dateCol} vs ${valLabel} — ${data.length} data points for temporal trend analysis`,
    findings,
  };
}

// =========================================================================
// Column suggestion for CUSTOM mode
// =========================================================================

type ColumnInfo = {
  name: string;
  type: 'numeric' | 'categorical' | 'boolean' | 'datetime';
  uniqueCount: number;
};

export function suggestColumnsForChartType(
  chartType: string,
  columns: ColumnInfo[]
): {
  suggestion: string;
  recommendedColumns: string[];
  recommendedCategoryColumn?: string;
  reason: string;
} {
  const numericCols = columns.filter(c => c.type === 'numeric');
  const categoricalCols = columns.filter(c => c.type === 'categorical' && c.uniqueCount > 1 && c.uniqueCount <= 20);
  const booleanCols = columns.filter(c => c.type === 'boolean');

  switch (chartType) {
    case 'distplot': {
      const best = [...numericCols].sort((a, b) => b.uniqueCount - a.uniqueCount)[0];
      return {
        suggestion: best
          ? `Recommended: "${best.name}" (${best.uniqueCount} unique values) — high variation ideal for distribution analysis`
          : 'No suitable numeric columns found',
        recommendedColumns: best ? [best.name] : [],
        reason: 'Distribution plots need continuous numeric data with meaningful variation to reveal shape',
      };
    }
    case 'pie': {
      const best = [...categoricalCols, ...booleanCols]
        .filter(c => c.uniqueCount >= 2 && c.uniqueCount <= 8)
        .sort((a, b) => a.uniqueCount - b.uniqueCount)[0];
      return {
        suggestion: best
          ? `Recommended: "${best.name}" (${best.uniqueCount} categories) — clean proportional breakdown`
          : 'No suitable columns with 2-8 categories found',
        recommendedColumns: best ? [best.name] : [],
        reason: 'Pie charts work best with 2-8 distinct categorical values for clear slices',
      };
    }
    case 'violin': {
      const bestNum = [...numericCols].sort((a, b) => b.uniqueCount - a.uniqueCount)[0];
      const bestCat = categoricalCols.filter(c => c.uniqueCount >= 2 && c.uniqueCount <= 10)
        .sort((a, b) => a.uniqueCount - b.uniqueCount)[0];
      return {
        suggestion: bestNum && bestCat
          ? `Recommended: "${bestNum.name}" grouped by "${bestCat.name}" (${bestCat.uniqueCount} groups)`
          : 'Need both a numeric and categorical column',
        recommendedColumns: bestNum ? [bestNum.name] : [],
        recommendedCategoryColumn: bestCat?.name,
        reason: 'Violin plots show distribution shape of a numeric variable across categories',
      };
    }
    case 'heatmap': {
      const recommended = numericCols.slice(0, 6).map(c => c.name);
      return {
        suggestion: recommended.length >= 2
          ? `Recommended: ${recommended.map(c => `"${c}"`).join(', ')} for correlation analysis`
          : 'Need at least 2 numeric columns',
        recommendedColumns: recommended,
        reason: 'Heatmaps visualize pairwise Pearson correlations between numeric features',
      };
    }
    case 'pairplot': {
      const recommended = numericCols.slice(0, 4).map(c => c.name);
      const groupCol = categoricalCols.filter(c => c.uniqueCount >= 2 && c.uniqueCount <= 6)[0];
      return {
        suggestion: recommended.length >= 2
          ? `Recommended: ${recommended.map(c => `"${c}"`).join(', ')}${groupCol ? ` colored by "${groupCol.name}"` : ''}`
          : 'Need at least 2 numeric columns',
        recommendedColumns: recommended,
        recommendedCategoryColumn: groupCol?.name,
        reason: 'Pair plots show all pairwise scatter plots and histograms, optionally colored by group',
      };
    }
    case 'jointplot': {
      const cols = numericCols.slice(0, 2);
      return {
        suggestion: cols.length >= 2
          ? `Recommended: "${cols[0].name}" vs "${cols[1].name}" for bivariate analysis`
          : 'Need at least 2 numeric columns',
        recommendedColumns: cols.map(c => c.name),
        reason: 'Joint plots combine scatter with marginal distributions for two numeric variables',
      };
    }
    default:
      return { suggestion: '', recommendedColumns: [], reason: '' };
  }
}
