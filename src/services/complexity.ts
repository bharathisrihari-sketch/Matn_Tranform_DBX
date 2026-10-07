import { MatillionJob } from '../types/matillion';

export interface ComplexityFactor {
  name: string;
  count: number;
  weight: number;
  subtotal: number;
  description: string;
}

export interface ComplexityResult {
  score: number; // 0 - 100
  level: 'Low' | 'Moderate' | 'High' | 'Enterprise';
  color: string;
  badgeBg: string;
  borderColor: string;
  totalComponents: number;
  uniqueTypesCount: number;
  transformationTypes: { type: string; count: number; category: string; weight: number }[];
  factors: ComplexityFactor[];
  summary: string;
  recommendations: string[];
}

/**
 * Calculates the Conversion Complexity Score based on:
 * 1. Total number of components in the job
 * 2. Diversity and count of transformation types (Joins, Windows, Aggregates, Flatten, Calculators, etc.)
 * 3. Graph branching factor (links/edges)
 * 4. Job parameters and runtime variables
 */
export function calculateConversionComplexity(job: MatillionJob): ComplexityResult {
  const components = job.components || [];
  const links = job.links || [];
  const variables = job.variables || [];

  // Group components by type
  const typeMap = new Map<string, { count: number; category: string }>();
  components.forEach(comp => {
    const existing = typeMap.get(comp.type) || { count: 0, category: comp.category };
    typeMap.set(comp.type, { count: existing.count + 1, category: comp.category });
  });

  // Weights for different transformation types
  const typeWeights: Record<string, number> = {
    'Join': 12,              // Multi-parent distributed join, skew risk, AQE broadcast/sort-merge
    'Rank / Window': 10,     // Window specs, partition/order by, distributed shuffle
    'Flatten': 9,            // Semi-structured JSON arrays, explode, schema inference
    'Aggregate': 8,          // Hash aggregation, grouping sets, memory pressure
    'Table Output': 7,       // Delta merge / SCD Type 2 CDC reconciliation
    'S3 Load': 6,            // Cloud object store ingestion, Auto Loader
    'Calculator': 4,         // Multiple column expressions & SQL translation
    'Filter': 3,             // Predicate pushdown, DLT expectation policies
    'Table Input': 2,        // Direct Spark table scan
    'Run Transformation': 7, // Nested orchestrator pipeline execution
    'SQL Script': 8,         // Raw custom SQL transpilation
    'File Exists': 4,        // Orchestration flow control
    'Webhook Notification': 3// Alerting and external integrations
  };

  const defaultWeight = 5;

  const factors: ComplexityFactor[] = [];
  let rawScore = 0;

  // 1. Component volume factor
  const compCount = components.length;
  let compScore = 0;
  if (compCount <= 3) compScore = 10;
  else if (compCount <= 7) compScore = 20;
  else if (compCount <= 12) compScore = 32;
  else if (compCount <= 18) compScore = 44;
  else compScore = 55;

  factors.push({
    name: 'Component Volume',
    count: compCount,
    weight: 1,
    subtotal: compScore,
    description: `${compCount} components in workflow graph`
  });
  rawScore += compScore;

  // 2. Transformation type diversity factor
  const uniqueTypesCount = typeMap.size;
  const diversityScore = Math.min(uniqueTypesCount * 4, 25);
  factors.push({
    name: 'Transformation Variety',
    count: uniqueTypesCount,
    weight: 4,
    subtotal: diversityScore,
    description: `${uniqueTypesCount} distinct component types utilized`
  });
  rawScore += diversityScore;

  // 3. Transformation specific weights
  const transformationTypes: { type: string; count: number; category: string; weight: number }[] = [];
  let transformPoints = 0;

  typeMap.forEach(({ count, category }, type) => {
    const weight = typeWeights[type] ?? defaultWeight;
    const subtotal = count * weight;
    transformPoints += subtotal;
    transformationTypes.push({ type, count, category, weight });
  });

  // Scale transform points (normalized cap)
  const normalizedTransformPoints = Math.min(Math.round(transformPoints * 0.45), 35);
  factors.push({
    name: 'Advanced Operators',
    count: transformationTypes.reduce((acc, t) => acc + (t.weight >= 8 ? t.count : 0), 0),
    weight: 8,
    subtotal: normalizedTransformPoints,
    description: 'Weighted score for joins, analytical windows, aggregations & CDC'
  });
  rawScore += normalizedTransformPoints;

  // 4. DAG Topology (links & branching)
  const linkCount = links.length;
  const branchingScore = Math.min(Math.round(linkCount * 1.5), 15);
  factors.push({
    name: 'DAG Topology & Branching',
    count: linkCount,
    weight: 1.5,
    subtotal: branchingScore,
    description: `${linkCount} dependency connections across execution stages`
  });
  rawScore += branchingScore;

  // 5. Variables & Dynamic Parameters
  if (variables.length > 0) {
    const varScore = Math.min(variables.length * 2, 8);
    factors.push({
      name: 'Dynamic Job Variables',
      count: variables.length,
      weight: 2,
      subtotal: varScore,
      description: `${variables.length} runtime environment variables to parameterize`
    });
    rawScore += varScore;
  }

  // Final score normalized to 0-100 scale
  const finalScore = Math.min(Math.max(Math.round(rawScore * 0.72), 12), 98);

  let level: 'Low' | 'Moderate' | 'High' | 'Enterprise';
  let color = 'text-emerald-400';
  let badgeBg = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
  let borderColor = 'border-emerald-500/40';
  let summary = '';

  const recommendations: string[] = [];

  if (finalScore <= 38) {
    level = 'Low';
    color = 'text-emerald-400';
    badgeBg = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
    borderColor = 'border-emerald-500/40';
    summary = 'Straightforward linear ETL workflow. Easily transpiles 1:1 to PySpark or DLT with minimal cluster tuning.';
    recommendations.push('Run on single-node or standard small Databricks cluster (1-2 workers).');
    recommendations.push('Standard Delta Lake append/merge will execute with sub-minute latency.');
  } else if (finalScore <= 68) {
    level = 'Moderate';
    color = 'text-sky-400';
    badgeBg = 'bg-sky-500/10 text-sky-400 border-sky-500/30';
    borderColor = 'border-sky-500/40';
    summary = 'Moderate multi-step pipeline containing filtering, joins, and aggregations. Well suited for automated translation.';
    recommendations.push('Leverage Databricks AQE (Adaptive Query Execution) for dynamic join switching.');
    recommendations.push('Enable Liquid Clustering on join and filter columns.');
    recommendations.push('Consider Delta Live Tables (DLT) for automated DAG lineage and quality expectations.');
  } else if (finalScore <= 84) {
    level = 'High';
    color = 'text-amber-400';
    badgeBg = 'bg-amber-500/10 text-amber-400 border-amber-500/30';
    borderColor = 'border-amber-500/40';
    summary = 'Advanced analytical pipeline featuring complex window functions, multi-table joins, and nested data logic.';
    recommendations.push('Audit window partition keys to avoid single-executor data skew.');
    recommendations.push('Use Databricks Photon engine runtime for 3x faster vectorised aggregation.');
    recommendations.push('Deploy as DLT with `@dlt.expect_or_drop` to prevent data corruption in gold tier.');
  } else {
    level = 'Enterprise';
    color = 'text-rose-400';
    badgeBg = 'bg-rose-500/10 text-rose-400 border-rose-500/30';
    borderColor = 'border-rose-500/40';
    summary = 'High-complexity enterprise DAG with extensive dependencies, CDC/SCD2 merges, or semi-structured data parsing.';
    recommendations.push('Break into multi-task Databricks Workflows or modular bronze/silver/gold notebooks.');
    recommendations.push('Use native `dlt.apply_changes()` for high-throughput SCD Type 2 tracking.');
    recommendations.push('Set up memory-optimized worker instances (e.g., i3en or E-series).');
  }

  // Sort transformation types by count descending
  transformationTypes.sort((a, b) => b.count - a.count);

  return {
    score: finalScore,
    level,
    color,
    badgeBg,
    borderColor,
    totalComponents: compCount,
    uniqueTypesCount,
    transformationTypes,
    factors,
    summary,
    recommendations
  };
}
