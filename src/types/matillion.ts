export type JobType = 'Transformation' | 'Orchestration';

export interface MatillionVariable {
  name: string;
  datatype: 'Text' | 'Numeric' | 'DateTime' | 'Boolean' | 'List';
  defaultValue: string;
  description?: string;
  scope?: 'Copied' | 'Shared';
}

export type ComponentCategory = 
  | 'Read' 
  | 'Transform' 
  | 'Join' 
  | 'Filter' 
  | 'Aggregate' 
  | 'Write' 
  | 'Control' 
  | 'Script' 
  | 'Orchestration';

export interface MatillionComponent {
  id: string;
  name: string;
  type: string; // e.g. "Table Input", "Calculator", "Join", "Filter", "Aggregate", "Table Output", "S3 Load", "Python Script"
  category: ComponentCategory;
  parameters: Record<string, any>;
  x?: number;
  y?: number;
}

export interface MatillionLink {
  id: string;
  fromId: string;
  toId: string;
  condition?: 'SUCCESS' | 'FAILURE' | 'AUTO' | 'UNCONDITIONAL';
}

export interface MatillionJob {
  id: string;
  name: string;
  jobType: JobType;
  description: string;
  version?: string;
  targetPlatform?: 'Snowflake' | 'Redshift' | 'Synapse' | 'Delta Lake' | 'Generic';
  variables: MatillionVariable[];
  components: MatillionComponent[];
  links: MatillionLink[];
}

export interface ConversionOptions {
  outputFormat: 'notebook' | 'script' | 'dlt' | 'workflow';
  useUnityCatalog: boolean;
  catalogName: string;
  schemaName: string;
  deltaWriteMode: 'merge' | 'overwrite' | 'append';
  useLiquidClustering: boolean;
  clusterByColumns: string[];
  zOrderColumns: string[];
  variableStrategy: 'widgets' | 'task_values' | 'cli_args';
  includeSparkInit: boolean;
  includeTypeHints: boolean;
  includeDataQualityChecks: boolean;
  runtimeVersion: '15.4' | '14.3' | '13.3';
}

export interface ConvertedOutput {
  notebookCode: string;
  scriptCode: string;
  dltCode: string;
  workflowJson: string;
  stats: {
    totalComponents: number;
    translatedComponents: number;
    unsupportedComponents: number;
    estimatedSparkOptimizations: string[];
    complexityScore: 'Low' | 'Medium' | 'High';
    warnings: string[];
  };
}
