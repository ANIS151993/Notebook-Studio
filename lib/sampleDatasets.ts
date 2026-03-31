// Built-in sample datasets for advanced visualizations (STANDARD mode)
// Uses seeded PRNG to generate reproducible data matching real dataset distributions

export type IrisRow = {
  [key: string]: string | number;
  sepal_length: number;
  sepal_width: number;
  petal_length: number;
  petal_width: number;
  species: string;
};

export type TipsRow = {
  [key: string]: string | number;
  total_bill: number;
  tip: number;
  sex: string;
  smoker: string;
  day: string;
  time: string;
  size: number;
};

// Simple seeded LCG PRNG
function createRng(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

// Box-Muller transform for normal distribution
function normalRandom(rng: () => number, mean: number, std: number): number {
  const u1 = rng() || 0.0001;
  const u2 = rng();
  const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  return Math.round((mean + std * z) * 10) / 10;
}

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

// Generate Iris dataset (150 rows, 3 species × 50)
// Distributions match Fisher's real Iris dataset
function generateIris(): IrisRow[] {
  const rng = createRng(42);
  const rows: IrisRow[] = [];

  const params: Record<string, Record<string, { mean: number; std: number }>> = {
    setosa: {
      sepal_length: { mean: 5.006, std: 0.352 },
      sepal_width: { mean: 3.428, std: 0.379 },
      petal_length: { mean: 1.462, std: 0.174 },
      petal_width: { mean: 0.246, std: 0.105 },
    },
    versicolor: {
      sepal_length: { mean: 5.936, std: 0.516 },
      sepal_width: { mean: 2.770, std: 0.314 },
      petal_length: { mean: 4.260, std: 0.470 },
      petal_width: { mean: 1.326, std: 0.198 },
    },
    virginica: {
      sepal_length: { mean: 6.588, std: 0.636 },
      sepal_width: { mean: 2.974, std: 0.322 },
      petal_length: { mean: 5.552, std: 0.552 },
      petal_width: { mean: 2.026, std: 0.275 },
    },
  };

  for (const species of ['setosa', 'versicolor', 'virginica']) {
    const p = params[species];
    for (let i = 0; i < 50; i++) {
      rows.push({
        sepal_length: clamp(normalRandom(rng, p.sepal_length.mean, p.sepal_length.std), 4.0, 8.5),
        sepal_width: clamp(normalRandom(rng, p.sepal_width.mean, p.sepal_width.std), 1.8, 4.5),
        petal_length: clamp(normalRandom(rng, p.petal_length.mean, p.petal_length.std), 0.8, 7.0),
        petal_width: clamp(normalRandom(rng, p.petal_width.mean, p.petal_width.std), 0.1, 2.8),
        species,
      });
    }
  }

  return rows;
}

// Generate Tips dataset (200 rows)
// Distributions match the Seaborn tips dataset
function generateTips(): TipsRow[] {
  const rng = createRng(123);
  const rows: TipsRow[] = [];

  const days = ['Thur', 'Fri', 'Sat', 'Sun'];
  const dayWeights = [0.16, 0.08, 0.38, 0.38];

  for (let i = 0; i < 200; i++) {
    // Party size (1-6, weighted)
    const sizeRoll = rng();
    const size =
      sizeRoll < 0.04 ? 1 :
      sizeRoll < 0.43 ? 2 :
      sizeRoll < 0.66 ? 3 :
      sizeRoll < 0.85 ? 4 :
      sizeRoll < 0.93 ? 5 : 6;

    // Total bill (correlated with size)
    const baseBill = 8 + size * 4;
    const totalBill = clamp(
      Math.round((baseBill + normalRandom(rng, 0, 4)) * 100) / 100,
      3.07, 50.81
    );

    // Tip (correlated with total_bill)
    const tip = clamp(
      Math.round((totalBill * (0.12 + rng() * 0.10) + normalRandom(rng, 0, 0.5)) * 100) / 100,
      1.0, 10.0
    );

    // Day (weighted)
    let dayRoll = rng();
    let dayIndex = 0;
    for (let d = 0; d < dayWeights.length; d++) {
      dayRoll -= dayWeights[d];
      if (dayRoll <= 0) { dayIndex = d; break; }
    }

    const day = days[dayIndex];
    const time = (day === 'Sat' || day === 'Sun')
      ? (rng() < 0.85 ? 'Dinner' : 'Lunch')
      : (rng() < 0.55 ? 'Lunch' : 'Dinner');

    rows.push({
      total_bill: totalBill,
      tip,
      sex: rng() < 0.64 ? 'Male' : 'Female',
      smoker: rng() < 0.62 ? 'No' : 'Yes',
      day,
      time,
      size,
    });
  }

  return rows;
}

// Cached instances (lazy-loaded)
let irisCache: IrisRow[] | null = null;
let tipsCache: TipsRow[] | null = null;

export function getIrisDataset(): IrisRow[] {
  if (!irisCache) irisCache = generateIris();
  return irisCache;
}

export function getTipsDataset(): TipsRow[] {
  if (!tipsCache) tipsCache = generateTips();
  return tipsCache;
}

export const DATASET_INFO = {
  iris: {
    name: 'Iris',
    fullName: "Fisher's Iris Flower Dataset",
    description: 'Contains measurements of 150 iris flowers across 3 species (setosa, versicolor, virginica) with 4 continuous features: sepal length, sepal width, petal length, and petal width.',
    numericColumns: ['sepal_length', 'sepal_width', 'petal_length', 'petal_width'],
    categoricalColumns: ['species'],
    rowCount: 150,
  },
  tips: {
    name: 'Tips',
    fullName: 'Restaurant Tipping Dataset',
    description: 'Contains 200 records of restaurant transactions including total bill, tip amount, and customer demographics (sex, smoker status, day, time, party size).',
    numericColumns: ['total_bill', 'tip', 'size'],
    categoricalColumns: ['sex', 'smoker', 'day', 'time'],
    rowCount: 200,
  },
} as const;
