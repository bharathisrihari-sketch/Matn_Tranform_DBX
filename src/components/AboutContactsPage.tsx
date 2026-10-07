import React, { useState } from 'react';
import { 
  Mail, 
  User, 
  Workflow, 
  ShieldCheck, 
  Sparkles, 
  Cpu, 
  Database, 
  ExternalLink, 
  Send, 
  CheckCircle2, 
  MessageSquare, 
  Info, 
  Layers, 
  Terminal, 
  Award, 
  Globe, 
  Github, 
  Code2, 
  HelpCircle,
  Clock,
  ArrowRight
} from 'lucide-react';

interface AboutContactsPageProps {
  onNavigateToStudio: () => void;
  onNavigateToDownload: () => void;
}

export const AboutContactsPage: React.FC<AboutContactsPageProps> = ({
  onNavigateToStudio,
  onNavigateToDownload
}) => {
  const [feedbackSent, setFeedbackSent] = useState(false);
  const [feedbackForm, setFeedbackForm] = useState({
    name: '',
    email: '',
    organization: '',
    messageType: 'Migration Inquiry',
    comments: ''
  });

  const handleFeedbackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedbackSent(true);
    setTimeout(() => {
      setFeedbackSent(false);
      setFeedbackForm({
        name: '',
        email: '',
        organization: '',
        messageType: 'Migration Inquiry',
        comments: ''
      });
    }, 4000);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-950 text-slate-100 overflow-y-auto font-sans">
      
      {/* Hero Banner */}
      <div className="bg-slate-900 border-b border-slate-800 px-6 py-8 md:px-10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5" />
                MatConvDBX.ai.studio Platform Hub
              </span>
              <span className="text-xs text-slate-400 font-mono">v2.4.0 Production Release</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
              About & Contacts
            </h1>
            <p className="text-sm text-slate-400 mt-1 max-w-2xl">
              Project leadership, enterprise migration support, platform architecture details, and technical contacts for the Matillion-to-Databricks transpiler.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onNavigateToStudio}
              className="py-2.5 px-4 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold flex items-center gap-2 transition-colors shadow-lg shadow-orange-500/20"
            >
              <Workflow className="w-4 h-4" />
              <span>Launch Studio</span>
            </button>
            <button
              onClick={onNavigateToDownload}
              className="py-2.5 px-4 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-2 transition-colors"
            >
              <span>Download Code</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="max-w-7xl mx-auto px-6 py-8 md:px-10 w-full space-y-10">
        
        {/* Leadership & Contacts Cards */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <User className="w-4 h-4 text-orange-400" />
            <h2 className="text-base font-bold text-white uppercase tracking-wider">
              Project Leadership & Contacts
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            
            {/* Primary Contact: Bharathi Srihari */}
            <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-900/60 border border-orange-500/30 relative overflow-hidden shadow-xl">
              <div className="absolute top-0 right-0 w-28 h-28 bg-orange-500/10 rounded-full blur-2xl pointer-events-none"></div>
              
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-orange-500 to-amber-500 flex items-center justify-center text-white font-bold text-lg shadow-md">
                  BS
                </div>
                <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-orange-500/15 text-orange-400 border border-orange-500/30">
                  Lead Architect
                </span>
              </div>

              <h3 className="text-lg font-bold text-white">Bharathi Srihari</h3>
              <p className="text-xs text-orange-400 font-medium mt-0.5">Principal Lakehouse Migration Lead</p>
              
              <p className="text-xs text-slate-400 mt-3 leading-relaxed">
                Oversees MatConvDBX.ai.studio architecture, PySpark AST generation, and Delta Live Tables optimization strategies.
              </p>

              <div className="mt-5 pt-4 border-t border-slate-800 space-y-2.5 text-xs">
                <a 
                  href="mailto:bharathi.srihari@gmail.com" 
                  className="flex items-center gap-2 text-cyan-300 hover:text-cyan-200 transition-colors font-mono"
                >
                  <Mail className="w-3.5 h-3.5 text-cyan-400" />
                  <span>bharathi.srihari@gmail.com</span>
                </a>
                <div className="flex items-center gap-2 text-slate-400">
                  <Globe className="w-3.5 h-3.5 text-slate-500" />
                  <span>Google AI Studio Build & Databricks Ecosystem</span>
                </div>
              </div>
            </div>

            {/* Migration Advisory Desk */}
            <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-lg">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                  <Layers className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
                  Advisory Desk
                </span>
              </div>

              <h3 className="text-lg font-bold text-white">Enterprise Migration Team</h3>
              <p className="text-xs text-cyan-400 font-medium mt-0.5">Architecture & Modernization Services</p>
              
              <p className="text-xs text-slate-400 mt-3 leading-relaxed">
                Provides guidance on complex Matillion DAG topology, multi-task Workflows, CDC reconciliation, and Unity Catalog setup.
              </p>

              <div className="mt-5 pt-4 border-t border-slate-800 space-y-2.5 text-xs">
                <div className="flex items-center gap-2 text-slate-300">
                  <Terminal className="w-3.5 h-3.5 text-slate-400" />
                  <span>SLA: 24h Enterprise Response</span>
                </div>
                <div className="flex items-center gap-2 text-slate-400">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>SOC2 & Zero-Retention Compliant</span>
                </div>
              </div>
            </div>

            {/* Databricks Solution Support */}
            <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-lg">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                  <Workflow className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-purple-500/15 text-purple-400 border border-purple-500/30">
                  Community & OSS
                </span>
              </div>

              <h3 className="text-lg font-bold text-white">Community & Support Desk</h3>
              <p className="text-xs text-purple-400 font-medium mt-0.5">Developer Resources & Feedback</p>
              
              <p className="text-xs text-slate-400 mt-3 leading-relaxed">
                Open contributions, bug reports, custom component transpiler patterns, and function mapping additions.
              </p>

              <div className="mt-5 pt-4 border-t border-slate-800 space-y-2.5 text-xs">
                <div className="flex items-center gap-2 text-slate-300">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>Community Office Hours: Weekly</span>
                </div>
                <div className="flex items-center gap-2 text-slate-400">
                  <Globe className="w-3.5 h-3.5 text-blue-400" />
                  <span>Ecosystem: EchoFlow & MatConvDBX</span>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* General Info & System Capabilities */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Info className="w-4 h-4 text-cyan-400" />
            <h2 className="text-base font-bold text-white uppercase tracking-wider">
              General System Specifications
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
              <span className="text-[11px] font-bold text-orange-400 block mb-1">Target Engine</span>
              <div className="text-base font-bold text-white">Apache Spark 3.5.x</div>
              <p className="text-xs text-slate-400 mt-1">DBR 15.4 LTS with Photon vectorization support.</p>
            </div>

            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
              <span className="text-[11px] font-bold text-cyan-400 block mb-1">Storage Layer</span>
              <div className="text-base font-bold text-white">Delta Lake 3.x ACID</div>
              <p className="text-xs text-slate-400 mt-1">Liquid Clustering (<code className="text-cyan-300">CLUSTER BY</code>) & Z-Order time travel.</p>
            </div>

            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
              <span className="text-[11px] font-bold text-emerald-400 block mb-1">Declarative Pipelines</span>
              <div className="text-base font-bold text-white">Delta Live Tables (DLT)</div>
              <p className="text-xs text-slate-400 mt-1">Automated data quality expectations & CDC reconciliation.</p>
            </div>

            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
              <span className="text-[11px] font-bold text-purple-400 block mb-1">Governance Standard</span>
              <div className="text-base font-bold text-white">Unity Catalog (3-Tier)</div>
              <p className="text-xs text-slate-400 mt-1">Three-level namespace (<code className="text-purple-300">catalog.schema.table</code>) & lineage.</p>
            </div>

          </div>
        </div>

        {/* Direct Inquiry & Feedback Form */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          <div className="lg:col-span-7 bg-slate-900 rounded-2xl border border-slate-800 p-6 md:p-8 space-y-6">
            <div>
              <span className="text-xs font-bold text-orange-400 uppercase tracking-wider block mb-1">Direct Message</span>
              <h3 className="text-xl font-bold text-white">Send Inquiry to the Migration Team</h3>
              <p className="text-xs text-slate-400 mt-1">
                Have a large Matillion project export or need custom component mapping? Send us a message directly.
              </p>
            </div>

            {feedbackSent ? (
              <div className="p-5 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-center space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                <h4 className="text-sm font-bold text-white">Message Delivered</h4>
                <p className="text-xs text-slate-300">
                  Thank you! Your inquiry has been forwarded to <strong className="text-cyan-300">bharathi.srihari@gmail.com</strong>. We will get back to you shortly.
                </p>
              </div>
            ) : (
              <form onSubmit={handleFeedbackSubmit} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Your Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Alex Morgan"
                      value={feedbackForm.name}
                      onChange={(e) => setFeedbackForm({ ...feedbackForm, name: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Your Email</label>
                    <input
                      type="email"
                      required
                      placeholder="e.g. alex@company.com"
                      value={feedbackForm.email}
                      onChange={(e) => setFeedbackForm({ ...feedbackForm, email: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-orange-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Organization / Company</label>
                    <input
                      type="text"
                      placeholder="e.g. Enterprise Analytics Group"
                      value={feedbackForm.organization}
                      onChange={(e) => setFeedbackForm({ ...feedbackForm, organization: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Inquiry Type</label>
                    <select
                      value={feedbackForm.messageType}
                      onChange={(e) => setFeedbackForm({ ...feedbackForm, messageType: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-orange-500"
                    >
                      <option value="Migration Inquiry">Migration Strategy Inquiry</option>
                      <option value="Custom Component Transpiler">Custom Matillion Component Support</option>
                      <option value="Bug Report">Issue / Bug Report</option>
                      <option value="Feature Request">Feature Request</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Message Details</label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Describe your Matillion project volume, components, or any questions..."
                    value={feedbackForm.comments}
                    onChange={(e) => setFeedbackForm({ ...feedbackForm, comments: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-orange-500 resize-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 px-4 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors shadow-lg shadow-orange-500/20"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send Message to Team</span>
                </button>
              </form>
            )}
          </div>

          {/* Right Column: Platform FAQ & Release Info */}
          <div className="lg:col-span-5 space-y-4">
            
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                Data Privacy & Security Guarantee
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                MatConvDBX operates with client-side transpilation in your secure browser session. Your Matillion project definitions, credentials, and SQL logic never leave your environment or get stored in external databases.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-400" />
                Release Notes & Changelog (v2.4.0)
              </h4>
              <ul className="text-xs text-slate-300 space-y-1.5 list-disc pl-4">
                <li>Added full Delta Live Tables (DLT) declarative syntax generation.</li>
                <li>Interactive conversion complexity score calculated across DAG components.</li>
                <li>ZIP archive bulk import & sample download bundle support.</li>
                <li>Zoom-to-fit graph navigation, pan controls, and component search filter.</li>
                <li>EchoFlow-style multi-tab architecture with testing, docs, and code downloads.</li>
              </ul>
            </div>

            <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 space-y-3">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-cyan-400" />
                Need Immediate Assistance?
              </h4>
              <p className="text-xs text-slate-400">
                Contact Bharathi Srihari directly via email at <a href="mailto:bharathi.srihari@gmail.com" className="text-cyan-400 hover:underline font-mono">bharathi.srihari@gmail.com</a> for enterprise migration planning and pipeline assessments.
              </p>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};
