'use client';
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import {
  Plus, Save, Trash2, LogOut, TrendingUp, Code, Calendar, Rocket,
  Download, Bug, Eye, RefreshCw, AlertCircle, CheckCircle2,
  Copy, FileDown, AlertTriangle, Zap, Gauge,
} from 'lucide-react';
import ROIChart from '@/components/ROIChart';
import RecommendationChart from '@/components/RecommendationChart';
import { motion, AnimatePresence } from 'framer-motion';
import { calcNetSavings, calcBreakEven, getRecommendation, calcStats } from '@/lib/calc';

const DEFAULT_SCENARIOS = [
  { name: 'Core Regression Suite', manual_mins: 10, frequency: 90, dev_hours: 2,  maint_hours: 0.5, is_flaky: false, is_visual: false },
  { name: 'Smoke Test (PR Merges)', manual_mins: 5,  frequency: 60, dev_hours: 4,  maint_hours: 0.2, is_flaky: false, is_visual: false },
  { name: 'API Validations',        manual_mins: 30, frequency: 25, dev_hours: 5,  maint_hours: 0.5, is_flaky: false, is_visual: false },
];

/* ─── Loading screen ─────────────────────────────────────────────────── */
function LoadingScreen() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-5">
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-xl shadow-indigo-200">
        <TrendingUp size={30} className="text-white" />
      </div>
      <div className="flex gap-1.5">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>
      <p className="text-sm text-slate-400 font-medium">Loading your dashboard…</p>
    </div>
  );
}

/* ─── KPI Stat Card ──────────────────────────────────────────────────── */
const GRADIENTS = {
  indigo:  'from-indigo-500  to-indigo-600',
  slate:   'from-slate-500   to-slate-600',
  amber:   'from-amber-400   to-orange-500',
  emerald: 'from-emerald-400 to-teal-500',
};

function StatCard({ title, value, unit, icon: Icon, accent, sub, delay = 0 }) {
  const g = GRADIENTS[accent];
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.35, ease: 'easeOut' }}
      className="card-hover overflow-hidden"
    >
      <div className={`h-1 -mx-6 -mt-6 mb-5 bg-gradient-to-r ${g}`} />
      <div className="flex items-start justify-between">
        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${g} flex items-center justify-center shadow-md mb-3`}>
          <Icon size={18} className="text-white" />
        </div>
      </div>
      <div className="flex items-baseline gap-1.5">
        <span className="text-3xl font-extrabold tracking-tight text-slate-900 tabular-nums">{value}</span>
        <span className="text-sm text-slate-400 font-medium">{unit}</span>
      </div>
      <p className="text-[10px] font-bold tracking-widest text-slate-400 uppercase mt-1">{title}</p>
      {sub && <p className="text-xs text-slate-400 mt-2 leading-relaxed border-t border-slate-100 pt-2">{sub}</p>}
    </motion.div>
  );
}

/* ─── Dashboard ──────────────────────────────────────────────────────── */
export default function Dashboard() {
  const [user,       setUser]       = useState(null);
  const [scenarios,  setScenarios]  = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [saving,     setSaving]     = useState(false);
  const [exporting,  setExporting]  = useState(false);
  const [isDirty,    setIsDirty]    = useState(false);
  const [toast,      setToast]      = useState(null);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const router = useRouter();

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  useEffect(() => {
    const init = async () => {
      const demo = typeof window !== 'undefined' && localStorage.getItem('demo_mode') === 'true';
      setIsDemoMode(demo);
      if (demo) {
        const uid = localStorage.getItem('user_id') || 'demo-user';
        setUser({ id: uid, email: 'demo@example.com' });
        const saved = localStorage.getItem(`scenarios_${uid}`);
        setScenarios(
          saved ? JSON.parse(saved)
                : DEFAULT_SCENARIOS.map((s) => ({ ...s, user_id: uid, id: Math.random() }))
        );
        setLoading(false);
        return;
      }
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/auth'); return; }
      setUser(user);
      const { data, error } = await supabase.from('scenarios').select('*')
        .eq('user_id', user.id).order('created_at', { ascending: true });
      if (!error)
        setScenarios(data.length ? data : DEFAULT_SCENARIOS.map((s) => ({ ...s, user_id: user.id })));
      setLoading(false);
    };
    init();
  }, []);

  const saveAll = async () => {
    setSaving(true);
    if (isDemoMode) {
      localStorage.setItem(`scenarios_${user.id}`, JSON.stringify(scenarios));
      setIsDirty(false); setSaving(false);
      showToast('Saved to local storage');
      return;
    }
    await supabase.from('scenarios').delete().eq('user_id', user.id);
    const { error } = await supabase.from('scenarios').insert(
      scenarios.map(({ id, created_at, ...s }) => ({ ...s, user_id: user.id }))
    );
    setSaving(false);
    if (error) showToast('Error saving data', 'error');
    else { setIsDirty(false); showToast('All scenarios saved'); }
  };

  const mutate = (fn) => { setScenarios((p) => fn(p)); setIsDirty(true); };
  const addRow = () => mutate((s) => [...s, { name: '', manual_mins: 0, frequency: 0, dev_hours: 0, maint_hours: 0, is_flaky: false, is_visual: false, user_id: user?.id }]);
  const updateRow = (i, f, v) => mutate((s) => s.map((r, idx) => idx === i ? { ...r, [f]: v } : r));
  const removeRow = (i) => mutate((s) => s.filter((_, idx) => idx !== i));
  const duplicateRow = (i) => mutate((s) => {
    const copy = { ...s[i], name: `${s[i].name} (copy)`, id: Math.random() };
    return [...s.slice(0, i + 1), copy, ...s.slice(i + 1)];
  });

  const exportCSV = () => {
    const headers = ['Scenario','Manual Mins','Runs/Mo','Dev Hours','Maint Hours','Flaky','Visual','Net Savings (hrs)','Break-Even (mo)','Recommendation'];
    const rows = scenarios.map((s) => [
      `"${s.name}"`, s.manual_mins, s.frequency, s.dev_hours, s.maint_hours,
      s.is_flaky, s.is_visual,
      Math.max(0, calcNetSavings(s)),
      calcBreakEven(s) === Infinity ? '∞' : calcBreakEven(s),
      getRecommendation(s).text,
    ]);
    const csv = [headers, ...rows].map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = `ROI_Scenarios_${new Date().toISOString().split('T')[0]}.csv`;
    a.click(); URL.revokeObjectURL(url);
    showToast('CSV exported');
  };

  const exportPDF = async () => {
    setExporting(true);
    const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
      import('html2canvas'), import('jspdf'),
    ]);
    const canvas  = await html2canvas(document.getElementById('dashboard-content'), { scale: 2, useCORS: true });
    const pdf     = new jsPDF('l', 'mm', 'a4');
    const w       = pdf.internal.pageSize.getWidth();
    pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, w, (canvas.height * w) / canvas.width);
    pdf.save(`ROI_Report_${new Date().toISOString().split('T')[0]}.pdf`);
    setExporting(false);
    showToast('PDF exported');
  };

  const logout = async () => {
    if (isDemoMode) localStorage.setItem('demo_mode', 'false');
    else await supabase.auth.signOut();
    router.push('/auth');
  };

  if (loading) return <LoadingScreen />;

  const stats = calcStats(scenarios);

  return (
    <div className="min-h-screen">
      {/* ── Toast ───────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0,   scale: 1 }}
            exit={{   opacity: 0, y: -20,  scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className={`fixed top-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-xl text-sm font-semibold backdrop-blur-sm ${
              toast.type === 'error' ? 'bg-rose-600 text-white' : 'bg-slate-900/95 text-white'
            }`}
          >
            {toast.type === 'error'
              ? <AlertTriangle size={15} />
              : <CheckCircle2 size={15} className="text-emerald-400" />}
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Top navigation bar ─────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200/80 shadow-sm shadow-slate-100/50">
        <div className="max-w-[92rem] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Brand */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-md shadow-indigo-200 shrink-0">
              <TrendingUp size={18} className="text-white" />
            </div>
            <div className="hidden sm:block min-w-0">
              <h1 className="text-base font-extrabold text-slate-900 leading-none tracking-tight">
                ROI Intelligence
              </h1>
              <p className="text-[11px] text-slate-400 mt-0.5 font-medium">Automation Strategy Dashboard</p>
            </div>
          </div>

          {/* Status chips */}
          <div className="hidden md:flex items-center gap-2 flex-1 justify-center">
            {isDemoMode && (
              <span className="badge bg-amber-50 text-amber-600 border-amber-200 flex items-center gap-1">
                <Zap size={9} /> Demo Mode
              </span>
            )}
            {isDirty && (
              <span className="badge bg-orange-50 text-orange-500 border-orange-200">
                ● Unsaved changes
              </span>
            )}
            <span className="text-xs text-slate-400 font-medium">{user?.email}</span>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 shrink-0">
            <button onClick={exportCSV} className="btn-secondary !px-3 !py-2 !text-xs hidden sm:flex">
              <FileDown size={14} /> CSV
            </button>
            <button onClick={saveAll} disabled={saving} className="btn-secondary !px-3 !py-2 !text-xs">
              {saving ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
              <span className="hidden sm:inline">Save</span>
            </button>
            <button onClick={exportPDF} disabled={exporting} className="btn-primary !px-3 !py-2 !text-xs">
              {exporting ? <RefreshCw size={14} className="animate-spin" /> : <Download size={14} />}
              <span className="hidden sm:inline">PDF</span>
            </button>
            <div className="w-px h-6 bg-slate-200 mx-1 hidden sm:block" />
            <button
              onClick={logout}
              className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
              title="Sign out"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </header>

      {/* ── Main content ─────────────────────────────────────────────────── */}
      <main className="max-w-[92rem] mx-auto px-4 sm:px-6 lg:px-8 py-8" id="dashboard-content">

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard title="Net Monthly Savings"     value={stats.netSavings}     unit="hrs/mo"            icon={TrendingUp} accent="indigo"  delay={0}    sub={`from ${stats.totalManualHours} manual hrs`} />
          <StatCard title="Total Upfront Investment" value={stats.totalInvestment} unit="dev hrs"           icon={Code}       accent="slate"   delay={0.06} sub="one-time automation cost" />
          <StatCard title="Avg Break-Even"           value={stats.avgBreakEven}   unit="months"            icon={Calendar}   accent="amber"   delay={0.12} sub={stats.highRiskCount > 0 ? `${stats.highRiskCount} high-risk flagged` : 'no risk flags'} />
          <StatCard title="Viable Targets"           value={stats.viableCount}    unit={`of ${scenarios.length}`} icon={Rocket} accent="emerald" delay={0.18} sub={`${stats.automateCount} ready to automate`} />
        </div>

        {/* Main grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

          {/* ── Scenario table ─────────────────────────────────────────── */}
          <div className="xl:col-span-2 bg-white border border-slate-200/70 rounded-2xl shadow-sm shadow-slate-100 overflow-hidden">
            {/* Table header bar */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center">
                  <Gauge size={13} className="text-white" />
                </div>
                <h2 className="text-sm font-bold text-slate-800">Assessment Parameters</h2>
                <span className="ml-1 px-1.5 py-0.5 bg-slate-100 text-slate-500 text-[10px] font-bold rounded-md">
                  {scenarios.length}
                </span>
              </div>
              <button
                onClick={addRow}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
              >
                <Plus size={13} /> New Scenario
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/40">
                    <th className="px-5 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest w-52">Scenario</th>
                    <th className="px-2 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center w-16">Mins</th>
                    <th className="px-2 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center w-20">Runs/Mo</th>
                    <th className="px-2 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center w-16">Dev Hrs</th>
                    <th className="px-2 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center w-16">Maint</th>
                    <th className="px-2 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center w-20">Risk</th>
                    <th className="px-3 py-3 text-[10px] font-bold text-emerald-500 uppercase tracking-widest text-center w-20">Saves</th>
                    <th className="px-3 py-3 text-[10px] font-bold text-indigo-500 uppercase tracking-widest text-center w-28 bg-indigo-50/40">Decision</th>
                    <th className="w-16" />
                  </tr>
                </thead>
                <tbody>
                  <AnimatePresence>
                    {scenarios.map((s, i) => {
                      const rec      = getRecommendation(s);
                      const savings  = calcNetSavings(s);
                      const breakEven = calcBreakEven(s);
                      return (
                        <motion.tr
                          key={s.id ?? i}
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{   opacity: 0, x: -16 }}
                          transition={{ duration: 0.2 }}
                          className="group border-b border-slate-50 hover:bg-slate-50/70 transition-colors"
                        >
                          {/* Accent bar on first cell */}
                          <td
                            className="px-4 py-2.5 min-w-[160px]"
                            style={{ boxShadow: `inset 3px 0 0 ${rec.accent}` }}
                          >
                            <input
                              type="text"
                              value={s.name}
                              onChange={(e) => updateRow(i, 'name', e.target.value)}
                              placeholder="e.g. User Auth Flow"
                              className="table-input-name"
                            />
                          </td>
                          {['manual_mins', 'frequency', 'dev_hours', 'maint_hours'].map((field) => (
                            <td key={field} className="px-1 py-2.5">
                              <input
                                type="number"
                                value={s[field]}
                                onChange={(e) => updateRow(i, field, parseFloat(e.target.value) || 0)}
                                className="table-input"
                              />
                            </td>
                          ))}
                          {/* Risk flags */}
                          <td className="px-2 py-2.5">
                            <div className="flex gap-1 justify-center">
                              <button
                                onClick={() => updateRow(i, 'is_flaky', !s.is_flaky)}
                                title="Flaky / Unstable"
                                className={`p-1.5 rounded-lg border transition-all ${
                                  s.is_flaky
                                    ? 'bg-rose-100 border-rose-300 text-rose-600 shadow-sm shadow-rose-100'
                                    : 'bg-white border-slate-200 text-slate-300 hover:border-rose-200 hover:text-rose-400'
                                }`}
                              >
                                <Bug size={12} />
                              </button>
                              <button
                                onClick={() => updateRow(i, 'is_visual', !s.is_visual)}
                                title="Visual / Subjective"
                                className={`p-1.5 rounded-lg border transition-all ${
                                  s.is_visual
                                    ? 'bg-amber-100 border-amber-300 text-amber-600 shadow-sm shadow-amber-100'
                                    : 'bg-white border-slate-200 text-slate-300 hover:border-amber-200 hover:text-amber-400'
                                }`}
                              >
                                <Eye size={12} />
                              </button>
                            </div>
                          </td>
                          {/* Net savings */}
                          <td className="px-3 py-2.5 text-center">
                            <span className={`text-xs font-bold tabular-nums ${savings > 0 ? 'text-emerald-600' : 'text-rose-400'}`}>
                              {savings > 0 ? `+${savings}h` : `${savings}h`}
                            </span>
                          </td>
                          {/* Decision */}
                          <td className="px-3 py-2.5 bg-indigo-50/20 text-center">
                            <div className="flex flex-col items-center gap-1">
                              <span className={`text-xs font-extrabold tabular-nums ${breakEven === Infinity ? 'text-rose-500' : 'text-slate-800'}`}>
                                {breakEven === Infinity ? '∞' : `${breakEven}m`}
                              </span>
                              <span className={`badge text-[9px] ${rec.class}`}>{rec.text}</span>
                            </div>
                          </td>
                          {/* Row actions */}
                          <td className="px-2 py-2.5">
                            <div className="flex gap-0.5 justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => duplicateRow(i)}
                                title="Duplicate"
                                className="p-1.5 rounded-lg text-slate-300 hover:text-indigo-500 hover:bg-indigo-50 transition-all"
                              >
                                <Copy size={13} />
                              </button>
                              <button
                                onClick={() => removeRow(i)}
                                title="Remove"
                                className="p-1.5 rounded-lg text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition-all"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </td>
                        </motion.tr>
                      );
                    })}
                  </AnimatePresence>
                  {scenarios.length === 0 && (
                    <tr>
                      <td colSpan={9} className="px-6 py-16 text-center">
                        <div className="flex flex-col items-center gap-3 text-slate-400">
                          <AlertCircle size={28} className="opacity-40" />
                          <p className="text-sm font-medium">No scenarios yet</p>
                          <button onClick={addRow} className="btn-primary !py-2 !px-4 !text-xs mt-1">
                            <Plus size={14} /> Add your first scenario
                          </button>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* ── Right panel ────────────────────────────────────────────── */}
          <div className="xl:col-span-1 flex flex-col gap-5">

            {/* Combo chart */}
            <div className="card h-[260px] flex flex-col">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center">
                  <TrendingUp size={12} className="text-white" />
                </div>
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-widest">Effort vs. Savings</h3>
              </div>
              <div className="grow relative min-h-0">
                <ROIChart scenarios={scenarios} />
              </div>
            </div>

            {/* Donut chart */}
            <div className="card h-[240px] flex flex-col">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center">
                  <Rocket size={11} className="text-white" />
                </div>
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-widest">Recommendation Mix</h3>
              </div>
              <div className="grow relative min-h-0">
                <RecommendationChart scenarios={scenarios} />
              </div>
            </div>

            {/* Strategic insight */}
            <div className="relative overflow-hidden rounded-2xl p-6 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white shadow-xl shadow-indigo-900/20">
              {/* Decorative glow */}
              <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-indigo-500/10 blur-2xl pointer-events-none" />
              <div className="absolute -bottom-10 -left-10 w-32 h-32 rounded-full bg-purple-500/10 blur-2xl pointer-events-none" />

              <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-3">Strategic Insight</p>

              <p className="text-sm leading-relaxed text-slate-300">
                You have{' '}
                <span className="font-bold text-white">{stats.viableCount} viable targets</span>{' '}
                that could reclaim{' '}
                <span className="font-bold text-emerald-400">{stats.netSavings} hrs/mo</span>{' '}
                once automated.
              </p>

              {stats.highRiskCount > 0 && (
                <div className="mt-3 flex items-start gap-2 p-2.5 bg-rose-500/10 rounded-xl border border-rose-500/20">
                  <AlertTriangle size={13} className="text-rose-400 mt-0.5 shrink-0" />
                  <p className="text-xs text-rose-300 leading-relaxed">
                    {stats.highRiskCount} scenario{stats.highRiskCount > 1 ? 's' : ''} flagged high-risk — fix flakiness first.
                  </p>
                </div>
              )}

              <div className="mt-5 pt-4 border-t border-white/10 flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-md shrink-0">
                  <CheckCircle2 size={15} className="text-white" />
                </div>
                <div className="text-xs min-w-0">
                  <p className="font-bold text-white">Next milestone</p>
                  <p className="text-indigo-400 truncate">
                    Break-even on {scenarios.find((s) => getRecommendation(s).text === 'Automate')?.name || scenarios[0]?.name || '—'}
                  </p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}
