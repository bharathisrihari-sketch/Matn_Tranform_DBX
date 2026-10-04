import React, { useState } from 'react';
import { X, Search, BookOpen, ExternalLink, Copy, Check } from 'lucide-react';
import { FUNCTION_MAPPINGS } from '../services/functionMapper';

interface CheatSheetModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CheatSheetModal: React.FC<CheatSheetModalProps> = ({ isOpen, onClose }) => {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  if (!isOpen) return null;

  const categories = ['All', ...new Set(FUNCTION_MAPPINGS.map(m => m.category))];

  const filtered = FUNCTION_MAPPINGS.filter(m => {
    const matchCat = selectedCategory === 'All' || m.category === selectedCategory;
    const matchSearch = search === '' || 
      m.matillionOrSql.toLowerCase().includes(search.toLowerCase()) ||
      m.pysparkEquivalent.toLowerCase().includes(search.toLowerCase()) ||
      m.notes.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const copyToClipboard = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-cyan-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Matillion SQL &rarr; PySpark Function Cheat Sheet</h2>
              <p className="text-xs text-slate-400">Direct function equivalents for Snowflake, Redshift, and Matillion expressions</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filters */}
        <div className="p-4 border-b border-slate-800 bg-slate-900/60 flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search functions (e.g. NVL, DATEADD)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto scrollbar-none">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium whitespace-nowrap transition-colors ${
                  selectedCategory === cat
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Table / List */}
        <div className="flex-1 overflow-auto p-4 space-y-3">
          {filtered.map((item, idx) => (
            <div
              key={idx}
              className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 hover:border-slate-700 transition-colors space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                  {item.category}
                </span>
                <span className="text-[11px] text-slate-500">{item.notes}</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                {/* Matillion side */}
                <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                  <span className="text-[10px] uppercase font-bold text-amber-400 block mb-1">
                    Matillion / Snowflake SQL
                  </span>
                  <div className="font-mono text-xs text-slate-200">{item.matillionOrSql}</div>
                  <div className="text-[11px] font-mono text-slate-400 mt-1 bg-slate-950/60 p-1.5 rounded">
                    {item.exampleMatillion}
                  </div>
                </div>

                {/* PySpark side */}
                <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800 relative group">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] uppercase font-bold text-cyan-400">
                      Databricks PySpark Equivalent
                    </span>
                    <button
                      onClick={() => copyToClipboard(item.pysparkEquivalent, idx)}
                      className="text-slate-500 hover:text-slate-300 transition-colors"
                      title="Copy PySpark code"
                    >
                      {copiedIdx === idx ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <div className="font-mono text-xs text-cyan-300">{item.pysparkEquivalent}</div>
                  <div className="text-[11px] font-mono text-emerald-400/90 mt-1 bg-slate-950/60 p-1.5 rounded">
                    {item.examplePySpark}
                  </div>
                </div>
              </div>
            </div>
          ))}

          {filtered.length === 0 && (
            <div className="text-center py-12 text-slate-500 text-xs">
              No matching functions found for "{search}".
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>Covers PySpark 3.5+ & Databricks Runtime (DBR) 14.x / 15.x</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium transition-colors"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
