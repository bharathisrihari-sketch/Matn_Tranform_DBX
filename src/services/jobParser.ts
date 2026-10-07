import { MatillionJob, MatillionComponent, MatillionVariable, MatillionLink } from '../types/matillion';

export interface ParseResult {
  success: boolean;
  job?: MatillionJob;
  error?: string;
  format?: 'JSON' | 'YAML' | 'Unknown';
}

/**
 * Parses raw text or files containing Matillion job definitions (JSON or YAML).
 * If format is not recognized, returns clear error message without guessing.
 */
export function parseMatillionDefinition(content: string, filename: string = 'pasted_job.json'): ParseResult {
  const trimmed = content.trim();
  if (!trimmed) {
    return {
      success: false,
      error: 'Input content is empty. Please upload or paste a valid Matillion job export.',
      format: 'Unknown'
    };
  }

  // Attempt JSON parsing
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    try {
      const parsed = JSON.parse(trimmed);
      const job = normalizeMatillionObject(parsed, filename);
      if (job) {
        return { success: true, job, format: 'JSON' };
      }
    } catch (e: any) {
      return {
        success: false,
        error: `Invalid JSON syntax: ${e.message}. If uploading YAML, ensure valid YAML structure without syntax errors. Do not guess file contents.`,
        format: 'JSON'
      };
    }
  }

  // Attempt YAML parsing (basic key-value YAML structure standard in Matillion Git exports)
  if (trimmed.includes(':') && (trimmed.includes('components') || trimmed.includes('objects') || trimmed.includes('name:'))) {
    try {
      const yamlParsed = parseSimpleYaml(trimmed);
      const job = normalizeMatillionObject(yamlParsed, filename);
      if (job) {
        return { success: true, job, format: 'YAML' };
      }
    } catch (e: any) {
      // Fall through to unknown
    }
  }

  // If format is not recognized:
  return {
    success: false,
    error: 'Unrecognized file format: Could not identify valid Matillion Transformation or Orchestration job schema (missing components/objects arrays or valid DAG structure). Strict verification active — format contents not guessed.',
    format: 'Unknown'
  };
}

function normalizeMatillionObject(raw: any, filename: string): MatillionJob | null {
  const data = Array.isArray(raw) ? raw[0] : raw;
  if (!data || typeof data !== 'object') return null;

  // Schema 1: Native Matillion v1.x / Modern JSON format
  if (data.components && Array.isArray(data.components)) {
    return {
      id: data.id || `job-${Date.now()}`,
      name: data.name || filename.replace(/\.[^/.]+$/, ''),
      jobType: data.jobType || (data.name?.toLowerCase().includes('orch') ? 'Orchestration' : 'Transformation'),
      description: data.description || 'Imported Matillion job definition',
      targetPlatform: data.targetPlatform || 'Snowflake',
      variables: (data.variables || []).map((v: any) => ({
        name: v.name || 'var',
        datatype: v.datatype || 'Text',
        defaultValue: v.defaultValue !== undefined ? String(v.defaultValue) : '',
        description: v.description
      })),
      components: data.components.map((c: any, idx: number) => ({
        id: c.id || `comp-${idx}`,
        name: c.name || `Component_${idx}`,
        type: c.type || 'Calculator',
        category: c.category || inferCategoryFromType(c.type || ''),
        parameters: c.parameters || {},
        x: c.x !== undefined ? c.x : 100 + (idx % 4) * 220,
        y: c.y !== undefined ? c.y : 100 + Math.floor(idx / 4) * 140
      })),
      links: (data.links || []).map((l: any, idx: number) => ({
        id: l.id || `link-${idx}`,
        fromId: l.fromId || l.sourceId,
        toId: l.toId || l.targetId,
        condition: l.condition || 'AUTO'
      }))
    };
  }

  // Schema 2: Matillion Enterprise Project Objects Export (objects with type: component / link)
  if (data.objects && Array.isArray(data.objects)) {
    const components = data.objects
      .filter((o: any) => o.type === 'component' || o.componentType)
      .map((o: any, idx: number) => ({
        id: o.id || `comp-${idx}`,
        name: o.name || `Component_${idx}`,
        type: o.componentType || o.type || 'Calculator',
        category: inferCategoryFromType(o.componentType || o.type || ''),
        parameters: o.configuration || o.parameters || {},
        x: 100 + (idx % 4) * 220,
        y: 100 + Math.floor(idx / 4) * 140
      }));

    const links = data.objects
      .filter((o: any) => o.type === 'link' || (o.sourceComponentId && o.targetComponentId))
      .map((o: any, idx: number) => ({
        id: o.id || `link-${idx}`,
        fromId: o.sourceComponentId || o.fromId,
        toId: o.targetComponentId || o.toId,
        condition: o.condition || 'AUTO'
      }));

    return {
      id: data.id || `job-${Date.now()}`,
      name: data.name || filename.replace(/\.[^/.]+$/, ''),
      jobType: data.jobType || (data.name?.toLowerCase().includes('orch') ? 'Orchestration' : 'Transformation'),
      description: data.description || 'Imported Matillion project export',
      targetPlatform: 'Snowflake',
      variables: [],
      components,
      links
    };
  }

  return null;
}

function inferCategoryFromType(type: string): any {
  if (type.includes('Input') || type.includes('Load') || type.includes('Extract') || type.includes('Read')) return 'Read';
  if (type.includes('Output') || type.includes('Save') || type.includes('Write') || type.includes('Rewrite')) return 'Write';
  if (type.includes('Join')) return 'Join';
  if (type.includes('Filter')) return 'Filter';
  if (type.includes('Aggregate')) return 'Aggregate';
  if (type.includes('Script') || type.includes('Python') || type.includes('Bash')) return 'Script';
  return 'Transform';
}

function parseSimpleYaml(yamlStr: string): any {
  const result: any = { components: [], links: [], variables: [] };
  const lines = yamlStr.split('\n');
  let currentKey = '';

  for (let line of lines) {
    line = line.trim();
    if (!line || line.startsWith('#')) continue;

    if (line.startsWith('name:')) {
      result.name = line.replace('name:', '').trim().replace(/^['"]|['"]$/g, '');
    } else if (line.startsWith('description:')) {
      result.description = line.replace('description:', '').trim().replace(/^['"]|['"]$/g, '');
    } else if (line.startsWith('jobType:')) {
      result.jobType = line.replace('jobType:', '').trim().replace(/^['"]|['"]$/g, '');
    }
  }

  return result;
}
