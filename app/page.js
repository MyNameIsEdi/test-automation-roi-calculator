'use client';
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import {
  Plus, Save, Trash2, LogOut, TrendingUp, Code, Calendar, Rocket,
  Download, Bug, Eye, RefreshCw, AlertCircle, CheckCircle2,
  Copy, FileDown, AlertTriangle, Zap,
} from 'lucide-react';
import ROIChart from '@/components/ROIChart';
import RecommendationChart from '@/components/RecommendationChart';
import { motion, AnimatePresence } from 'framer-motion';
import {
  calcNetSavings, calcBreakEven, getRecommendation, calcStats,
} from '@/lib/calc';

const DEFAULT_SCENARIOS = [
  { name: 'Core Regression Suite', manual_mins: 10, frequency: 90, dev_hours: 2, maint_hours: 0.5, is_flaky: false, is_visual: false },
  { name: 'Smoke Test (PR Merges)', manual_mins: 5, frequency: 60, dev_hours: 4, maint_hours: 0.2, is_flaky: false, is_visual: false },
  { name: 'API Validations', manual_mins: 30, frequency: 25, dev_hours: 5, maint_hours: 0.5, is_flaky: false, is_visual: false },
];

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [scenarios, setScenarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [toast, setToast] = useState(null);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const router = useRouter();

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  useEffect(() => {
    const checkUser = async () => {
      const demo = typeof window !== 'undefined' && localStorage.getItem('demo_mode') === 'true';
      setIsDemoMode(demo);

      if (demo) {
        const demoUserId = localStorage.getItem('user_id') || 'demo-user';
        setUser({ id: demoUserId, email: 'demo@example.com' });
        const saved = localStorage.getItem(`scenarios_${demoUserId}`);
        setScenarios(
          saved
            ? JSON.parse(saved)
            : DEFAULT_SCENARIOS.map((s) => ({ ...s, user_id: demoUserId, id: Math.random() }))
        );
        setLoading(false);
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/auth'); return; }
      setUser(user);

      const { data, error } = await supabase
        .from('scenarios')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (!error) {
        setScenarios(
          data.length ? data : DEFAULT_SCENARIOS.map((s) => ({ ...s, user_id: user.id }))
        );
      }
      setLoading(false);
    };
    checkUser();
  }, []);

  const saveAll = async () => {
    setSaving(true);
    if (isDemoMode) {
      localStorage.setItem(`scenarios_${user.id}`, JSON.stringify(scenarios));
      setIsDirty(false);
      setSaving(false);
      showToast('Saved to local storage');
      return;
    }
    await supabase.from('scenarios').delete().eq('user_id', user.id);
    const { error } = await supabase.from('scenarios').insert(
      scenarios.map(({ id, created_at, ...s }) => ({ ...s, user_id: user.id }))
    );
    setSaving(false);
    if (error) {
      showToast('Error saving data', 'error');
    } else {
      setIsDirty(false);
      showToast('All scenarios saved');
    }
  };

  const mutate = (fn) => {
    setScenarios((prev) => fn(prev));
    setIsDirty(true);
  };

  const addRow = () => mutate((s) => [
    ...s,
    { name: '', manual_mins: 0, frequency: 0, dev_hours: 0, maint_hours: 0, is_flaky: false, is_visual: false, user_id: user?.id },
  ]);

  const updateRow = (index, field, value) =>
    mutate((s) => s.map((row, i) => (i === index ? { ...row, [field]: value } : row)));

  const removeRow = (index) => mutate((s) => s.filter((_, i) => i !== index));

  const duplicateRow = (index) =>
    mutate((s) => {
      const copy = { ...s[index], name: `${s[index].name} (copy)`, id: Math.random() };
      return [...s.slice(0, index + 1), copy, ...s.slice(index + 1)];
    });

  const exportCSV = () => {
    const headers = ['Scenario', 'Manual Mins', 'Runs/Mo', 'Dev Hours', 'Maint Hours', 'Flaky', 'Visual', 'Net Savings (hrs)', 'Break-Even (mo)', 'Recommendation'];
    const rows = scenarios.map((s) => [
      `"${s.name}"`, s.manual_mins, s.frequency, s.dev_hours, s.maint_hours,
      s.is_flaky, s.is_visual,
      Math.max(0, calcNetSavings(s)),
      calcBreakEven(s) === Infinity ? '∞' : calcBreakEven(s),
      getRecommendation(s).text,
    ]);
    const csv = [headers, ...rows].map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ROI_Scenarios_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('CSV exported');
  };

  const exportPDF = async () => {
    setExporting(true);
    const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
      import('html2canvas'),
      import('jspdf'),
    ]);
    const el = document.getElementById('dashboard-content');
    const canvas = await html2canvas(el, { scale: 2, useCORS: true });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('l', 'mm', 'a4');
    const w = pdf.internal.pageSize.getWidth();
    const h = (canvas.height * w) / canvas.width;
    pdf.addImage(imgData, 'PNG', 0, 0, w, h);
    pdf.save(`ROI_Report_${new Date().toISOString().split('T')[0]}.pdf`);
    setExporting(false);
    showToast('PDF exported');
  };

  const logout = async () => {
    if (isDemoMode) {
      localStorage.setItem('demo_mode', 'false');
    } else {
      await supabase.auth.signOut();
    }
    router.push('/auth');
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <RefreshCw className="animate-spin text-indigo-500" size={28} />
    </div>
  );

  const stats = calcStats(scenarios);

  return (
    <div className="max-w-[92rem] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            className={`fixed top-5 right-5 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-semibold ${
              toast.type === 'error'
                ? 'bg-rose-600 text-white'
                : 'bg-slate-900 text-white'
            }`}
          >
            {toast.type === 'error'
              ? <AlertTriangle size={16} />
              : <CheckCircle2 size={16} className="text-emerald-400" />}
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 text-[10px] font-bold tracking-widest uppercase rounded-md border border-indigo-100">
              Strategy Matrix
            </span>
            {isDemoMode && (
              <span className="px-2 py-0.5 bg-amber-50 text-amber-600 text-[10px] font-bold tracking-widest uppercase rounded-md border border-amber-200 flex items-center gap-1">
                <Zap size={10} /> Demo
              </span>
            )}
            {isDirty && (
              <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-[10px] font-bold tracking-widest uppercase rounded-md border border-slate-200">
                Unsaved
              </span>
            )}
            <span className="text-slate-300 text-xs">•</span>
            <span className="text-slate-400 text-xs font-medium">{user?.email}</span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Automation ROI Dashboard
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={exportCSV} className="btn-secondary text-xs px-3 py-2">
            <FileDown size={16} /> CSV
          </button>
          <button onClick={saveAll} disabled={saving} className="btn-secondary">
            {saving ? <RefreshCw size={16} className="animate-spin" /> : <Save size={16} />}
            Save
          </button>
          <button onClick={exportPDF} disabled={exporting} className="btn-primary">
            {exporting ? <RefreshCw size={16} className="animate-spin" /> : <Download size={16} />}
            Export PDF
          </button>
          <button onClick={logout} className="p-2.5 text-slate-400 hover:text-rose-500 transition-colors rounded-lg hover:bg-rose-50">
            <LogOut size={18} />
          </button>
        </div>
      </header>

      <div id="dashboard-content">
        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard
            title="Net Monthly Savings"
            value={stats.netSavings}
            unit="hrs/mo"
            icon={TrendingUp}
            accent="indigo"
            sub={`${stats.totalManualHours} manual hrs eliminated`}
          />
          <StatCard
            title="Total Upfront Investment"
            value={stats.totalInvestment}
            unit="dev hrs"
            icon={Code}
            accent="slate"
            sub="one-time automation cost"
          />
          <StatCard
            title="Avg Break-Even"
            value={stats.avgBreakEven}
            unit="months"
            icon={Calendar}
            accent="amber"
            sub={stats.highRiskCount > 0 ? `${stats.highRiskCount} high-risk flagged` : 'no risk flags'}
          />
          <StatCard
            title="Viable Targets"
            value={stats.viableCount}
            unit={`of ${scenarios.length}`}
            icon={Rocket}
            accent="emerald"
            sub={`${stats.automateCount} ready to automate now`}
          />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Scenario Table */}
          <div className="xl:col-span-2 card p-0 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
              <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <AlertCircle size={15} className="text-indigo-500" />
                Assessment Parameters
              </h2>
              <button onClick={addRow} className="text-indigo-600 hover:text-indigo-700 text-xs font-bold flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-indigo-50 transition-colors">
                <Plus size={15} /> New Scenario
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-slate-400 text-[10px] font-bold uppercase tracking-widest border-b border-slate-100">
                  <tr>
                    <th className="px-5 py-3.5">Scenario</th>
                    <th className="px-2 py-3.5 text-center">Mins</th>
                    <th className="px-2 py-3.5 text-center">Runs/Mo</th>
                    <th className="px-2 py-3.5 text-center">Dev Hrs</th>
                    <th className="px-2 py-3.5 text-center">Maint</th>
                    <th className="px-2 py-3.5 text-center">Risk</th>
                    <th className="px-3 py-3.5 text-center text-emerald-600">Saves</th>
                    <th className="px-3 py-3.5 text-center text-indigo-600 bg-indigo-50/30">Break-Even</th>
                    <th className="px-2 py-3.5" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  <AnimatePresence>
                    {scenarios.map((s, i) => {
                      const rec = getRecommendation(s);
                      const savings = calcNetSavings(s);
                      const breakEven = calcBreakEven(s);
                      return (
                        <motion.tr
                          key={s.id ?? i}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, x: -16 }}
                          className="group hover:bg-slate-50/60 transition-colors"
                        >
                          <td className="px-4 py-2 min-w-[160px]">
                            <input
                              type="text"
                              value={s.name}
                              onChange={(e) => updateRow(i, 'name', e.target.value)}
                              placeholder="e.g. User Auth Flow"
                              className="w-full bg-transparent border border-transparent hover:border-slate-200 focus:border-indigo-400 rounded-lg px-2 py-1.5 text-xs font-medium focus:outline-none transition-all"
                            />
                          </td>
                          {['manual_mins', 'frequency', 'dev_hours', 'maint_hours'].map((field) => (
                            <td key={field} className="px-1 py-2 w-16">
                              <input
                                type="number"
                                value={s[field]}
                                onChange={(e) => updateRow(i, field, parseFloat(e.target.value) || 0)}
                                className="w-full text-center bg-transparent border border-transparent hover:border-slate-200 focus:border-indigo-400 rounded-lg py-1.5 text-xs font-semibold focus:outline-none transition-all"
                              />
                            </td>
                          ))}
                          <td className="px-2 py-2">
                            <div className="flex gap-1 justify-center">
                              <button
                                onClick={() => updateRow(i, 'is_flaky', !s.is_flaky)}
                                title="Flaky / Unstable"
                                className={`p-1.5 rounded-lg border transition-all ${s.is_flaky ? 'bg-rose-50 border-rose-200 text-rose-600' : 'bg-white border-slate-100 text-slate-300 hover:border-slate-200'}`}
                              >
                                <Bug size={13} />
                              </button>
                              <button
                                onClick={() => updateRow(i, 'is_visual', !s.is_visual)}
                                title="Visual / Subjective"
                                className={`p-1.5 rounded-lg border transition-all ${s.is_visual ? 'bg-amber-50 border-amber-200 text-amber-600' : 'bg-white border-slate-100 text-slate-300 hover:border-slate-200'}`}
                              >
                                <Eye size={13} />
                              </button>
                            </div>
                          </td>
                          <td className="px-3 py-2 text-center">
                            <span className={`text-xs font-bold ${savings > 0 ? 'text-emerald-600' : 'text-slate-400'}`}>
                              {savings > 0 ? `+${savings}h` : `${savings}h`}
                            </span>
                          </td>
                          <td className="px-3 py-2 bg-indigo-50/20 text-center">
                            <div className="flex flex-col items-center gap-0.5">
                              <span className={`text-xs font-bold ${breakEven === Infinity ? 'text-rose-500' : 'text-slate-800'}`}>
                                {breakEven === Infinity ? '∞' : `${breakEven}m`}
                              </span>
                              <span className={`text-[9px] px-1.5 py-0.5 rounded-md uppercase font-bold border ${rec.class}`}>
                                {rec.text}
                              </span>
                            </div>
                          </td>
                          <td className="px-2 py-2">
                            <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => duplicateRow(i)}
                                className="p-1.5 text-slate-300 hover:text-indigo-500 transition-colors"
                                title="Duplicate"
                              >
                                <Copy size={14} />
                              </button>
                              <button
                                onClick={() => removeRow(i)}
                                className="p-1.5 text-slate-300 hover:text-rose-500 transition-colors"
                                title="Remove"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </motion.tr>
                      );
                    })}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          </div>

          {/* Right panel */}
          <div className="xl:col-span-1 flex flex-col gap-5">
            {/* Combo bar chart */}
            <div className="card h-[260px] flex flex-col">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-widest mb-4 flex items-center gap-2">
                <TrendingUp size={14} className="text-indigo-500" />
                Effort vs. Savings
              </h3>
              <div className="grow relative min-h-0">
                <ROIChart scenarios={scenarios} />
              </div>
            </div>

            {/* Donut chart */}
            <div className="card h-[240px] flex flex-col">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-widest mb-3 flex items-center gap-2">
                <Rocket size={14} className="text-emerald-500" />
                Recommendation Mix
              </h3>
              <div className="grow relative min-h-0">
                <RecommendationChart scenarios={scenarios} />
              </div>
            </div>

            {/* Strategic Insight */}
            <div className="card bg-gradient-to-br from-indigo-900 to-indigo-800 text-white border-0 shadow-lg shadow-indigo-200/40">
              <h4 className="text-[10px] font-bold text-indigo-300 uppercase tracking-widest mb-3">
                Strategic Insight
              </h4>
              <p className="text-sm leading-relaxed text-indigo-100">
                You have{' '}
                <span className="font-bold text-white underline decoration-indigo-400 decoration-2 underline-offset-2">
                  {stats.viableCount} viable targets
                </span>{' '}
                that could reclaim{' '}
                <span className="font-bold text-white">{stats.netSavings} hrs/mo</span> once automated.
              </p>
              {stats.highRiskCount > 0 && (
                <div className="mt-3 flex items-start gap-2 p-2.5 bg-rose-500/20 rounded-lg border border-rose-400/20">
                  <AlertTriangle size={14} className="text-rose-300 mt-0.5 shrink-0" />
                  <p className="text-xs text-rose-200">
                    {stats.highRiskCount} scenario{stats.highRiskCount > 1 ? 's are' : ' is'} flagged as high-risk. Address flakiness before automating.
                  </p>
                </div>
              )}
              <div className="mt-4 flex items-center gap-3 pt-4 border-t border-indigo-700/50">
                <div className="w-8 h-8 rounded-full bg-indigo-700 flex items-center justify-center shrink-0">
                  <CheckCircle2 size={16} className="text-emerald-400" />
                </div>
                <div className="text-xs">
                  <p className="font-bold">Next milestone</p>
                  <p className="text-indigo-300 truncate max-w-[180px]">
                    Break-even on {scenarios.find(s => getRecommendation(s).text === 'Automate')?.name || scenarios[0]?.name || '—'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, unit, icon: Icon, accent, sub }) {
  const accentMap = {
    indigo: 'border-indigo-500 text-indigo-600',
    slate: 'border-slate-400 text-slate-800',
    amber: 'border-amber-400 text-amber-600',
    emerald: 'border-emerald-500 text-emerald-600',
  };
  const [border, color] = accentMap[accent].split(' ');

  return (
    <div className={`card relative overflow-hidden border-l-4 ${border} py-5`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[10px] font-bold tracking-widest text-slate-400 uppercase mb-2">{title}</p>
          <div className="flex items-baseline gap-1.5">
            <span className={`text-3xl font-extrabold tracking-tight ${color}`}>{value}</span>
            <span className="text-xs text-slate-400 font-medium">{unit}</span>
          </div>
          {sub && <p className="text-[11px] text-slate-400 mt-1.5">{sub}</p>}
        </div>
        <Icon size={28} className={`${color} opacity-15`} />
      </div>
    </div>
  );
}
