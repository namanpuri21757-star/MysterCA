import React, { useState, useEffect } from 'react';
import { 
  Database, 
  Terminal, 
  FileText, 
  GitBranch, 
  ShieldCheck, 
  Plus,
  Search,
  Loader2,
  CheckCircle2,
  AlertCircle,
  History,
  ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

type Report = {
  artifact_id: string;
  lineage: Array<{
    run_metadata: {
      run_id: string;
      description: string;
      created_at: string;
      code_version: string;
    };
    upstream_inputs: string[];
  }>;
  scraping_signals: Array<{
    dataset_id: string;
    domain: string;
    fetched_at: string;
    has_robots_txt: boolean;
    has_llms_txt: boolean;
    robots_txt_preview: string;
    llms_txt_preview: string;
  }>;
};

export default function App() {
  const [activeTab, setActiveTab] = useState<'snapshot' | 'run' | 'report'>('snapshot');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  
  // Form States
  const [snapshotForm, setSnapshotForm] = useState({ datasetId: '', url: '' });
  const [runForm, setRunForm] = useState({ 
    runId: '', 
    description: '', 
    codeVersion: '', 
    inputs: '', 
    outputs: '', 
    modelIds: '' 
  });
  const [reportId, setReportId] = useState('');
  const [report, setReport] = useState<Report | null>(null);

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  const handleInitDb = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/init-db', { method: 'POST' });
      const data = await res.json();
      if (res.ok) showMessage('success', 'Database initialized successfully');
      else showMessage('error', data.error);
    } catch (e: any) {
      showMessage('error', e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSnapshot = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/snapshot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(snapshotForm)
      });
      const data = await res.json();
      if (res.ok) {
        showMessage('success', `Snapshot recorded for ${snapshotForm.datasetId}`);
        setSnapshotForm({ datasetId: '', url: '' });
      } else showMessage('error', data.error);
    } catch (e: any) {
      showMessage('error', e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRun = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        ...runForm,
        inputs: runForm.inputs.split(',').map(s => s.trim()).filter(Boolean),
        outputs: runForm.outputs.split(',').map(s => s.trim()).filter(Boolean),
        modelIds: runForm.modelIds.split(',').map(s => s.trim()).filter(Boolean),
      };
      const res = await fetch('/api/create-run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (res.ok) {
        showMessage('success', `Run ${runForm.runId} recorded successfully`);
        setRunForm({ runId: '', description: '', codeVersion: '', inputs: '', outputs: '', modelIds: '' });
      } else showMessage('error', data.error);
    } catch (e: any) {
      showMessage('error', e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGetReport = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setReport(null);
    try {
      const res = await fetch(`/api/report/${reportId}`);
      const data = await res.json();
      if (res.ok) {
        setReport(data);
      } else showMessage('error', data.error);
    } catch (e: any) {
      showMessage('error', e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-zinc-900 font-sans">
      {/* Navigation */}
      <header className="bg-white border-b border-zinc-200 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-zinc-900 rounded-xl flex items-center justify-center text-white shadow-lg shadow-zinc-200">
              <ShieldCheck size={22} />
            </div>
            <div>
              <h1 className="font-bold text-lg tracking-tight">Provenance Dashboard</h1>
              <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">v0.1.0 Beta</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={handleInitDb}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50 rounded-lg transition-all flex items-center gap-2"
            >
              <Database size={16} />
              Init DB
            </button>
            <div className="w-px h-6 bg-zinc-200 mx-2" />
            <nav className="flex bg-zinc-100 p-1 rounded-xl">
              {(['snapshot', 'run', 'report'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    activeTab === tab 
                      ? 'bg-white text-zinc-900 shadow-sm' 
                      : 'text-zinc-500 hover:text-zinc-700'
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-12">
        {/* Notifications */}
        <AnimatePresence>
          {message && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`mb-8 p-4 rounded-2xl flex items-center gap-3 border ${
                message.type === 'success' 
                  ? 'bg-emerald-50 border-emerald-100 text-emerald-800' 
                  : 'bg-red-50 border-red-100 text-red-800'
              }`}
            >
              {message.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
              <p className="text-sm font-medium">{message.text}</p>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          {activeTab === 'snapshot' && (
            <motion.div
              key="snapshot"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-white rounded-3xl border border-zinc-200 shadow-sm p-8"
            >
              <div className="mb-8">
                <h2 className="text-2xl font-bold mb-2">Capture Scraping Signals</h2>
                <p className="text-zinc-500">Record point-in-time robots.txt and llms.txt for a dataset.</p>
              </div>
              
              <form onSubmit={handleSnapshot} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-zinc-400">Dataset ID</label>
                    <input 
                      required
                      placeholder="e.g. raw_scraped_v1"
                      className="w-full px-4 py-3 rounded-xl bg-zinc-50 border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-zinc-900/5 focus:border-zinc-900 transition-all"
                      value={snapshotForm.datasetId}
                      onChange={e => setSnapshotForm({ ...snapshotForm, datasetId: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-zinc-400">Target URL</label>
                    <input 
                      required
                      type="url"
                      placeholder="https://example.com"
                      className="w-full px-4 py-3 rounded-xl bg-zinc-50 border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-zinc-900/5 focus:border-zinc-900 transition-all"
                      value={snapshotForm.url}
                      onChange={e => setSnapshotForm({ ...snapshotForm, url: e.target.value })}
                    />
                  </div>
                </div>
                <button 
                  disabled={loading}
                  className="w-full py-4 bg-zinc-900 text-white rounded-2xl font-bold hover:bg-zinc-800 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading ? <Loader2 className="animate-spin" size={20} /> : <Plus size={20} />}
                  Record Snapshot
                </button>
              </form>
            </motion.div>
          )}

          {activeTab === 'run' && (
            <motion.div
              key="run"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-white rounded-3xl border border-zinc-200 shadow-sm p-8"
            >
              <div className="mb-8">
                <h2 className="text-2xl font-bold mb-2">Log Transformation Run</h2>
                <p className="text-zinc-500">Link input datasets to output artifacts to build the provenance graph.</p>
              </div>
              
              <form onSubmit={handleCreateRun} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-zinc-400">Run ID</label>
                    <input 
                      required
                      placeholder="e.g. cleaning_job_001"
                      className="w-full px-4 py-3 rounded-xl bg-zinc-50 border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-zinc-900/5 focus:border-zinc-900 transition-all"
                      value={runForm.runId}
                      onChange={e => setRunForm({ ...runForm, runId: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-zinc-400">Code Version</label>
                    <input 
                      placeholder="e.g. git hash or v1.0"
                      className="w-full px-4 py-3 rounded-xl bg-zinc-50 border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-zinc-900/5 focus:border-zinc-900 transition-all"
                      value={runForm.codeVersion}
                      onChange={e => setRunForm({ ...runForm, codeVersion: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-zinc-400">Description</label>
                  <input 
                    required
                    placeholder="What happened in this run?"
                    className="w-full px-4 py-3 rounded-xl bg-zinc-50 border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-zinc-900/5 focus:border-zinc-900 transition-all"
                    value={runForm.description}
                    onChange={e => setRunForm({ ...runForm, description: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-zinc-400">Inputs (comma separated)</label>
                    <input 
                      placeholder="ds1, ds2"
                      className="w-full px-4 py-3 rounded-xl bg-zinc-50 border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-zinc-900/5 focus:border-zinc-900 transition-all"
                      value={runForm.inputs}
                      onChange={e => setRunForm({ ...runForm, inputs: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-zinc-400">Outputs (comma separated)</label>
                    <input 
                      placeholder="clean_ds1"
                      className="w-full px-4 py-3 rounded-xl bg-zinc-50 border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-zinc-900/5 focus:border-zinc-900 transition-all"
                      value={runForm.outputs}
                      onChange={e => setRunForm({ ...runForm, outputs: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-zinc-400">Models (comma separated)</label>
                    <input 
                      placeholder="model_v1"
                      className="w-full px-4 py-3 rounded-xl bg-zinc-50 border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-zinc-900/5 focus:border-zinc-900 transition-all"
                      value={runForm.modelIds}
                      onChange={e => setRunForm({ ...runForm, modelIds: e.target.value })}
                    />
                  </div>
                </div>
                <button 
                  disabled={loading}
                  className="w-full py-4 bg-zinc-900 text-white rounded-2xl font-bold hover:bg-zinc-800 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading ? <Loader2 className="animate-spin" size={20} /> : <GitBranch size={20} />}
                  Record Run
                </button>
              </form>
            </motion.div>
          )}

          {activeTab === 'report' && (
            <motion.div
              key="report"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <div className="bg-white rounded-3xl border border-zinc-200 shadow-sm p-8">
                <div className="mb-8">
                  <h2 className="text-2xl font-bold mb-2">Provenance Explorer</h2>
                  <p className="text-zinc-500">Trace the lineage and scraping signals for any artifact.</p>
                </div>
                
                <form onSubmit={handleGetReport} className="flex gap-4">
                  <input 
                    required
                    placeholder="Enter Artifact ID (e.g. model_v1)"
                    className="flex-1 px-4 py-3 rounded-xl bg-zinc-50 border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-zinc-900/5 focus:border-zinc-900 transition-all"
                    value={reportId}
                    onChange={e => setReportId(e.target.value)}
                  />
                  <button 
                    disabled={loading}
                    className="px-8 bg-zinc-900 text-white rounded-xl font-bold hover:bg-zinc-800 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {loading ? <Loader2 className="animate-spin" size={20} /> : <Search size={20} />}
                    Trace
                  </button>
                </form>
              </div>

              {report && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  {/* Lineage Section */}
                  <div className="bg-white rounded-3xl border border-zinc-200 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-zinc-100 bg-zinc-50/50 flex items-center gap-2">
                      <History size={18} className="text-zinc-400" />
                      <h3 className="font-bold">Lineage Graph</h3>
                    </div>
                    <div className="p-6 space-y-6">
                      {report.lineage.length === 0 ? (
                        <p className="text-zinc-400 text-sm italic">No upstream lineage found for this artifact.</p>
                      ) : (
                        report.lineage.map((run, i) => (
                          <div key={i} className="flex gap-6">
                            <div className="flex flex-col items-center">
                              <div className="w-10 h-10 rounded-full bg-zinc-900 text-white flex items-center justify-center shadow-md">
                                <GitBranch size={18} />
                              </div>
                              {i < report.lineage.length - 1 && <div className="w-px flex-1 bg-zinc-200 my-2" />}
                            </div>
                            <div className="flex-1 pb-8">
                              <div className="flex items-center justify-between mb-2">
                                <h4 className="font-bold text-lg">{run.run_metadata.run_id}</h4>
                                <span className="text-[10px] font-mono bg-zinc-100 px-2 py-1 rounded text-zinc-500">{run.run_metadata.code_version}</span>
                              </div>
                              <p className="text-zinc-500 text-sm mb-4">{run.run_metadata.description}</p>
                              <div className="flex flex-wrap gap-2">
                                {run.upstream_inputs.map(input => (
                                  <div key={input} className="flex items-center gap-1.5 px-3 py-1 bg-zinc-50 border border-zinc-100 rounded-lg text-xs font-medium text-zinc-600">
                                    <Database size={12} />
                                    {input}
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Scraping Signals Section */}
                  <div className="bg-white rounded-3xl border border-zinc-200 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-zinc-100 bg-zinc-50/50 flex items-center gap-2">
                      <ShieldCheck size={18} className="text-zinc-400" />
                      <h3 className="font-bold">Point-in-Time Scraping Signals</h3>
                    </div>
                    <div className="divide-y divide-zinc-100">
                      {report.scraping_signals.length === 0 ? (
                        <div className="p-6 text-zinc-400 text-sm italic">No scraping signals found in the upstream lineage.</div>
                      ) : (
                        report.scraping_signals.map((signal, i) => (
                          <div key={i} className="p-6 space-y-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                                  <ShieldCheck size={18} />
                                </div>
                                <div>
                                  <h4 className="font-bold text-sm">{signal.domain}</h4>
                                  <p className="text-[10px] text-zinc-400 font-medium uppercase tracking-wider">Linked to: {signal.dataset_id}</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Captured At</p>
                                <p className="text-xs font-mono text-zinc-600">{new Date(signal.fetched_at).toLocaleString()}</p>
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                              <div className={`p-3 rounded-xl border flex items-center justify-between ${signal.has_robots_txt ? 'bg-emerald-50/50 border-emerald-100 text-emerald-700' : 'bg-red-50/50 border-red-100 text-red-700'}`}>
                                <span className="text-xs font-bold uppercase tracking-wider">robots.txt</span>
                                {signal.has_robots_txt ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                              </div>
                              <div className={`p-3 rounded-xl border flex items-center justify-between ${signal.has_llms_txt ? 'bg-emerald-50/50 border-emerald-100 text-emerald-700' : 'bg-red-50/50 border-red-100 text-red-700'}`}>
                                <span className="text-xs font-bold uppercase tracking-wider">llms.txt</span>
                                {signal.has_llms_txt ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                              </div>
                            </div>

                            {(signal.robots_txt_preview || signal.llms_txt_preview) && (
                              <div className="p-4 bg-zinc-900 rounded-2xl">
                                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Snapshot Preview</p>
                                <pre className="text-[10px] font-mono text-zinc-400 overflow-x-auto whitespace-pre-wrap">
                                  {signal.robots_txt_preview || signal.llms_txt_preview}
                                </pre>
                              </div>
                            )}
                          </div>
                        )
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="max-w-4xl mx-auto px-6 py-12 border-t border-zinc-200 text-center">
        <p className="text-zinc-400 text-xs font-medium">
          © 2024 AI Data Provenance Tool. Built for verifiable data integrity.
        </p>
      </footer>
    </div>
  );
}
