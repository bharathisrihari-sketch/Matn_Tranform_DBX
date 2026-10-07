import React, { useState } from 'react';
import { X, UploadCloud, FileText, AlertCircle, CheckCircle, Archive, ArrowRight } from 'lucide-react';
import JSZip from 'jszip';
import { MatillionJob } from '../types/matillion';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportJob: (job: MatillionJob) => void;
}

export const UploadModal: React.FC<UploadModalProps> = ({
  isOpen,
  onClose,
  onImportJob
}) => {
  const [jsonText, setJsonText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isProcessingZip, setIsProcessingZip] = useState(false);
  const [extractedZipJobs, setExtractedZipJobs] = useState<MatillionJob[]>([]);

  if (!isOpen) return null;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setExtractedZipJobs([]);

    // Check if it's a ZIP archive
    if (file.name.toLowerCase().endsWith('.zip')) {
      setIsProcessingZip(true);
      try {
        const zip = await JSZip.loadAsync(file);
        const discovered: MatillionJob[] = [];

        for (const [path, entry] of Object.entries(zip.files)) {
          if (!entry.dir && path.toLowerCase().endsWith('.json') && !path.includes('manifest.json')) {
            try {
              const text = await entry.async('string');
              const parsed = JSON.parse(text);
              if (parsed.components && Array.isArray(parsed.components)) {
                discovered.push({
                  id: parsed.id || `zip-${Date.now()}-${discovered.length}`,
                  name: parsed.name || path.replace(/^.*[\\/]/, '').replace('.json', ''),
                  jobType: parsed.jobType || (parsed.name?.toLowerCase().includes('orch') ? 'Orchestration' : 'Transformation'),
                  description: parsed.description || `Extracted from ${path}`,
                  targetPlatform: parsed.targetPlatform || 'Snowflake',
                  variables: parsed.variables || [],
                  components: parsed.components,
                  links: parsed.links || []
                });
              } else if (parsed.objects && Array.isArray(parsed.objects)) {
                const comps = parsed.objects
                  .filter((o: any) => o.type === 'component')
                  .map((o: any, idx: number) => ({
                    id: o.id || `c-${idx}`,
                    name: o.name || `Component_${idx}`,
                    type: o.componentType || 'Calculator',
                    category: 'Transform' as const,
                    parameters: o.configuration || {},
                    x: 100 + (idx % 4) * 220,
                    y: 100 + Math.floor(idx / 4) * 160
                  }));
                const links = parsed.objects
                  .filter((o: any) => o.type === 'link')
                  .map((o: any, idx: number) => ({
                    id: o.id || `l-${idx}`,
                    fromId: o.sourceComponentId,
                    toId: o.targetComponentId,
                    condition: o.condition || 'AUTO'
                  }));

                discovered.push({
                  id: `native-${Date.now()}-${discovered.length}`,
                  name: parsed.name || path.replace(/^.*[\\/]/, '').replace('.json', ''),
                  jobType: parsed.jobType || 'Transformation',
                  description: parsed.description || 'Imported Matillion project object',
                  variables: [],
                  components: comps,
                  links: links
                });
              }
            } catch (jsonErr) {
              console.warn(`Could not parse ${path} in ZIP`, jsonErr);
            }
          }
        }

        if (discovered.length === 0) {
          throw new Error('No valid Matillion JSON files found inside the uploaded ZIP folder.');
        }

        if (discovered.length === 1) {
          onImportJob(discovered[0]);
          onClose();
          return;
        }

        setExtractedZipJobs(discovered);
      } catch (zipErr: any) {
        setError(zipErr.message || 'Failed to unpack ZIP archive.');
      } finally {
        setIsProcessingZip(false);
      }
      return;
    }

    // Standard JSON file
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        setJsonText(content);
        setError(null);
      } catch (err: any) {
        setError('Failed to read file content.');
      }
    };
    reader.readAsText(file);
  };

  const handleProcessImport = () => {
    try {
      if (!jsonText.trim()) {
        setError('Please paste or upload a JSON export.');
        return;
      }

      const parsed = JSON.parse(jsonText);
      
      // Adapt Matillion native export structure or custom format
      let formattedJob: MatillionJob;

      if (parsed.components && Array.isArray(parsed.components)) {
        // Already structured or our format
        formattedJob = {
          id: parsed.id || `custom-${Date.now()}`,
          name: parsed.name || 'Imported_Matillion_Job',
          jobType: parsed.jobType || (parsed.name?.toLowerCase().includes('orch') ? 'Orchestration' : 'Transformation'),
          description: parsed.description || 'Imported Matillion ETL workflow',
          targetPlatform: parsed.targetPlatform || 'Snowflake',
          variables: parsed.variables || [],
          components: parsed.components.map((c: any, i: number) => ({
            id: c.id || `comp-${i + 1}`,
            name: c.name || `Component_${i + 1}`,
            type: c.type || 'Calculator',
            category: c.category || 'Transform',
            parameters: c.parameters || {},
            x: c.x ?? (100 + (i % 4) * 220),
            y: c.y ?? (100 + Math.floor(i / 4) * 160)
          })),
          links: parsed.links || []
        };
      } else if (parsed.objects && Array.isArray(parsed.objects)) {
        // Matillion native export object bundle
        const compList: any[] = [];
        const linkList: any[] = [];
        
        parsed.objects.forEach((obj: any, idx: number) => {
          if (obj.type === 'component') {
            compList.push({
              id: obj.id || `c-${idx}`,
              name: obj.name || `Step_${idx}`,
              type: obj.componentType || 'Calculator',
              category: 'Transform',
              parameters: obj.configuration || {},
              x: 100 + (idx % 4) * 220,
              y: 100 + Math.floor(idx / 4) * 160
            });
          } else if (obj.type === 'link') {
            linkList.push({
              id: obj.id || `l-${idx}`,
              fromId: obj.sourceComponentId,
              toId: obj.targetComponentId,
              condition: obj.condition || 'AUTO'
            });
          }
        });

        formattedJob = {
          id: `imported-${Date.now()}`,
          name: parsed.name || 'Matillion_Export_Job',
          jobType: parsed.jobType || 'Transformation',
          description: parsed.description || 'Native Matillion export parsed successfully',
          variables: [],
          components: compList.length > 0 ? compList : [
            {
              id: 'comp-1',
              name: 'source_table',
              type: 'Table Input',
              category: 'Read',
              parameters: { targetTable: 'raw_source' }
            }
          ],
          links: linkList
        };
      } else {
        throw new Error('Unrecognized Matillion JSON format. Expected "components" or "objects" array.');
      }

      onImportJob(formattedJob);
      onClose();
    } catch (err: any) {
      setError(`Invalid JSON: ${err.message}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-orange-500/10 border border-orange-500/30 flex items-center justify-center">
              <UploadCloud className="w-4 h-4 text-orange-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Import Matillion Job JSON</h2>
              <p className="text-xs text-slate-400">Load your exported Matillion orchestration or transformation job</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-5 space-y-4">
          
          {/* File drag/drop upload input */}
          <label className="border-2 border-dashed border-slate-800 hover:border-orange-500/50 bg-slate-950/60 hover:bg-slate-950 rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer transition-all group">
            <UploadCloud className="w-8 h-8 text-slate-500 group-hover:text-orange-400 transition-colors mb-2" />
            <span className="text-xs font-semibold text-slate-300 group-hover:text-white">
              Click to browse or drop .json or .zip folder here
            </span>
            <span className="text-[11px] text-slate-500 mt-1">Accepts single Matillion .json job or .zip folder archive</span>
            <input
              type="file"
              accept=".json,.txt,.zip"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>

          {isProcessingZip && (
            <div className="p-3 bg-orange-500/10 border border-orange-500/20 rounded-xl text-xs text-orange-300 text-center animate-pulse flex items-center justify-center gap-2">
              <Archive className="w-4 h-4 animate-spin" />
              <span>Unpacking ZIP archive & parsing JSON jobs...</span>
            </div>
          )}

          {extractedZipJobs.length > 0 && (
            <div className="space-y-2">
              <span className="text-xs font-semibold text-slate-300">
                Found {extractedZipJobs.length} Jobs in ZIP Archive:
              </span>
              <div className="bg-slate-950 border border-slate-800 rounded-xl divide-y divide-slate-800/80 max-h-48 overflow-y-auto">
                {extractedZipJobs.map((j, i) => (
                  <div key={i} className="p-2.5 flex items-center justify-between gap-3 text-xs">
                    <div>
                      <span className="font-semibold text-white block">{j.name}</span>
                      <span className="text-[10px] text-slate-500">{j.jobType} &bull; {j.components.length} components</span>
                    </div>
                    <button
                      onClick={() => {
                        onImportJob(j);
                        onClose();
                      }}
                      className="px-2.5 py-1 rounded-md bg-orange-500 hover:bg-orange-600 text-white font-medium text-[11px] flex items-center gap-1 transition-colors"
                    >
                      <span>Load</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center gap-2 text-xs text-slate-500 justify-center">
            <span className="w-12 h-px bg-slate-800"></span>
            <span>OR PASTE JSON DIRECTLY</span>
            <span className="w-12 h-px bg-slate-800"></span>
          </div>

          {/* Raw Textarea */}
          <div>
            <textarea
              rows={8}
              value={jsonText}
              onChange={(e) => {
                setJsonText(e.target.value);
                setError(null);
              }}
              placeholder='{\n  "name": "My_Matillion_Transformation",\n  "jobType": "Transformation",\n  "components": [...],\n  "links": [...]\n}'
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 font-mono text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-orange-500"
            />
          </div>

          {error && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleProcessImport}
            className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white text-xs font-bold shadow-md shadow-orange-500/25 transition-all"
          >
            Transpile to PySpark
          </button>
        </div>

      </div>
    </div>
  );
};
