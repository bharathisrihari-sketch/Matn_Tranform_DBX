import { MatillionJob, MatillionComponent } from '../types/matillion';

export interface ComplexityBreakdown {
  score: number; // 0 to 100
  rating: 'Low' | 'Medium' | 'High';
  ratingColor: string;
  ratingBg: string;
  ratingBorder: string;
  summary: string;
  factors: {
    totalComponents: number;
    uniqueTypesCount: number;
    inputCount: number;
    calcAndFilterCount: number;
    joinCount: number;
    aggregateCount: number;
    windowCount: number;
    mergeAndScdCount: number;
    loopOrScriptCount: number;
    dagDepth: number;
  };
  componentScores: {
    basePoints: number;
    typeDiversityPoints: number;
    joinAndAggPoints: number;
    windowAndAnalyticsPoints: number;
    scdAndMergePoints: number;
    dagDepthPoints: number;
  };
  recommendations: string[];
  automatedFeasibilityPercent: number;
  estimatedMigrationTime: string;
}

export function calculateJobComplexity(job: MatillionJob): ComplexityBreakdown {
  const components = job.components || [];
  const links = job.links || [];

  // Count types
  let inputCount = 0;
  let calcAndFilterCount = 0;
  let joinCount = 0;
  let aggregateCount = 0;
  let windowCount = 0;
  let mergeAndScdCount = 0;
  let loopOrScriptCount = 0;

  const typeSet = new Set<string>();

  components.forEach(c => {
    typeSet.add(c.type);
    const writeMode = c.parameters?.writeMode;

    if (c.type === 'Table Input' || c.type === 'S3 Load' || c.type === 'File Exists') {
      inputCount++;
    } else if (c.type === 'Calculator' || c.type === 'Filter' || c.type === 'Flatten' || c.type === 'Deduplicate') {
      calcAndFilterCount++;
    } else if (c.type === 'Join') {
      joinCount++;
    } else if (c.type === 'Aggregate') {
      aggregateCount++;
    } else if (c.type === 'Rank / Window') {
      windowCount++;
    } else if (c.type === 'Table Output') {
      if (writeMode === 'SCD2_MERGE') {
        mergeAndScdCount += 2; // Extra weight for SCD2
      } else if (writeMode === 'MERGE') {
        mergeAndScdCount++;
      }
    } else if (c.type === 'Table Iterator' || c.type === 'SQL Script' || c.type.includes('Script') || c.type === 'Run Transformation') {
      loopOrScriptCount++;
    }
  });

  // Calculate DAG depth (longest path in links)
  const inDegree = new Map<string, number>();
  const adj = new Map<string, string[]>();
  components.forEach(c => {
    inDegree.set(c.id, 0);
    adj.set(c.id, []);
  });
  links.forEach(l => {
    if (inDegree.has(l.toId)) inDegree.set(l.toId, (inDegree.get(l.toId) || 0) + 1);
    if (adj.has(l.fromId)) adj.get(l.fromId)!.push(l.toId);
  });

  const dist = new Map<string, number>();
  components.forEach(c => dist.set(c.id, 1));
  const queue: string[] = [];
  inDegree.forEach((deg, id) => {
    if (deg === 0) queue.push(id);
  });

  while (queue.length > 0) {
    const cur = queue.shift()!;
    const curDist = dist.get(cur) || 1;
    (adj.get(cur) || []).forEach(next => {
      const nextDist = Math.max(dist.get(next) || 1, curDist + 1);
      dist.set(next, nextDist);
      const d = (inDegree.get(next) || 1) - 1;
      inDegree.set(next, d);
      if (d === 0) queue.push(next);
    });
  }

  const dagDepth = components.length > 0 ? Math.max(...Array.from(dist.values())) : 1;

  // Compute weighted scores
  const basePoints = Math.min(components.length * 2.5, 20);
  const typeDiversityPoints = Math.min(typeSet.size * 3.5, 18);
  const joinAndAggPoints = Math.min((joinCount * 7) + (aggregateCount * 5), 24);
  const windowAndAnalyticsPoints = Math.min(windowCount * 8, 16);
  const scdAndMergePoints = Math.min(mergeAndScdCount * 9, 18);
  const dagDepthPoints = Math.min((dagDepth - 1) * 2.5, 12);
  const loopScriptPoints = Math.min(loopOrScriptCount * 5, 12);

  const rawScore = Math.round(
    10 +
    basePoints + 
    typeDiversityPoints + 
    joinAndAggPoints + 
    windowAndAnalyticsPoints + 
    scdAndMergePoints + 
    dagDepthPoints +
    loopScriptPoints
  );

  const score = Math.min(Math.max(rawScore, 12), 98);

  let rating: 'Low' | 'Medium' | 'High' = 'Low';
  let ratingColor = 'text-emerald-400';
  let ratingBg = 'bg-emerald-500/10';
  let ratingBorder = 'border-emerald-500/30';
  let summary = 'Standard linear pipeline with straightforward ETL operations.';
  let automatedFeasibilityPercent = 99;
  let estimatedMigrationTime = '< 5 minutes (Instant Automated)';

  if (score >= 68) {
    rating = 'High';
    ratingColor = 'text-rose-400';
    ratingBg = 'bg-rose-500/10';
    ratingBorder = 'border-rose-500/30';
    summary = 'Complex pipeline containing multi-way joins, window ranking, or SCD Type 2 merge logic.';
    automatedFeasibilityPercent = 94;
    estimatedMigrationTime = '15 - 30 minutes (Review merge conditions & keys)';
  } else if (score >= 38) {
    rating = 'Medium';
    ratingColor = 'text-amber-400';
    ratingBg = 'bg-amber-500/10';
    ratingBorder = 'border-amber-500/30';
    summary = 'Moderate complexity pipeline featuring multi-table joins, grouped aggregations, and filtered branches.';
    automatedFeasibilityPercent = 97.5;
    estimatedMigrationTime = '5 - 10 minutes (Automated with spot-checks)';
  }

  // Recommendations
  const recommendations: string[] = [];
  if (joinCount > 1) {
    recommendations.push('Multiple joins detected: Spark Adaptive Query Execution (AQE) dynamically manages broadcast join thresholds.');
  }
  if (mergeAndScdCount > 0) {
    recommendations.push('ACID Merge operations detected: Target Delta tables configured with DeltaTable.merge() and Liquid Clustering.');
  }
  if (windowCount > 0) {
    recommendations.push('Window ranking detected: PySpark Window specifications generate cluster-wide partition distributions.');
  }
  if (dagDepth > 4) {
    recommendations.push(`Deep DAG lineage (depth ${dagDepth}): Modular stage functions prevent Catalyst query plan explosion.`);
  }

  return {
    score,
    rating,
    ratingColor,
    ratingBg,
    ratingBorder,
    summary,
    factors: {
      totalComponents: components.length,
      uniqueTypesCount: typeSet.size,
      inputCount,
      calcAndFilterCount,
      joinCount,
      aggregateCount,
      windowCount,
      mergeAndScdCount,
      loopOrScriptCount,
      dagDepth
    },
    componentScores: {
      basePoints: Math.round(basePoints),
      typeDiversityPoints: Math.round(typeDiversityPoints),
      joinAndAggPoints: Math.round(joinAndAggPoints),
      windowAndAnalyticsPoints: Math.round(windowAndAnalyticsPoints),
      scdAndMergePoints: Math.round(scdAndMergePoints),
      dagDepthPoints: Math.round(dagDepthPoints)
    },
    recommendations,
    automatedFeasibilityPercent,
    estimatedMigrationTime
  };
}
