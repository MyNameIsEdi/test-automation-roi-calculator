'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { 
  Plus, Save, Trash2, LogOut, TrendingUp, Code, Calendar, Rocket, 
  Download, Bug, Eye, RefreshCw, AlertCircle, ChevronDown, CheckCircle2
} from 'lucide-react';
import ROIChart from '@/components/ROIChart';
import { motion, AnimatePresence } from 'framer-motion';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const DEFAULT_SCENARIOS = [
  { name: "Core Regression Suite", manual_mins: 10, frequency: 90, dev_hours: 2, maint_hours: 0.5, is_flaky: false, is_visual: false },
  { name: "Smoke Test (PR Merges)", manual_mins: 5, frequency: 60, dev_hours: 4, maint_hours: 0.2, is_flaky: false, is_visual: false },
  { name: "API Validations", manual_mins: 30, frequency: 25, dev_hours: 5, maint_hours: 0.5, is_flaky: false, is_visual: false }
];

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [scenarios, setScenarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkUser = async () => {
      const isDemoMode = typeof window !== 'undefined' && localStorage.getItem('demo_mode') === 'true';
      
      if (isDemoMode) {
        const demoUserId = localStorage.getItem('user_id') || 'demo-user';
        setUser({ id: demoUserId, email: 'demo@example.com' });
        fetchScenariosDemo(demoUserId);
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/auth');
        return;
      }
      setUser(user);
      fetchScenarios(user.id);
    };
    checkUser();
  }, []);

  const fetchScenariosDemo = (userId) => {
    const savedScenarios = localStorage.getItem(`scenarios_${userId}`);
    if (savedScenarios) {
      setScenarios(JSON.parse(savedScenarios));
    } else {
      setScenarios(DEFAULT_SCENARIOS.map(s => ({ ...s, user_id: userId, id: Math.random() })));
    }
    setLoading(false);
  };

  const fetchScenarios = async (userId) => {
    const { data, error } = await supabase
      .from('scenarios')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error(error);
    } else if (data.length === 0) {
      setScenarios(DEFAULT_SCENARIOS.map(s => ({ ...s, user_id: userId })));
    } else {
      setScenarios(data);
    }
    setLoading(false);
  };

  const saveAll = async () => {
    setSaving(true);
    const isDemoMode = localStorage.getItem('demo_mode') === 'true';
    
    if (isDemoMode) {
      localStorage.setItem(`scenarios_${user.id}`, JSON.stringify(scenarios));
      setSaving(false);
      return;
    }

    // Delete existing and re-insert for simplicity in this version
    await supabase.from('scenarios').delete().eq('user_id', user.id);
    const { error } = await supabase.from('scenarios').insert(
      scenarios.map(({ id, created_at, ...s }) => ({ ...s, user_id: user.id }))
    );
    
    if (error) alert("Error saving data");
    setSaving(false);
  };

  const addRow = () => {
    setScenarios([...scenarios, { 
      name: "", manual_mins: 0, frequency: 0, dev_hours: 0, maint_hours: 0, 
      is_flaky: false, is_visual: false, user_id: user?.id 
    }]);
  };

  const updateRow = (index, field, value) => {
    const newScenarios = [...scenarios];
    newScenarios[index][field] = value;
    setScenarios(newScenarios);
  };

  const removeRow = (index) => {
    setScenarios(scenarios.filter((_, i) => i !== index));
  };

  const logout = async () => {
    const isDemoMode = localStorage.getItem('demo_mode') === 'true';
    if (isDemoMode) {
      localStorage.setItem('demo_mode', 'false');
      router.push('/auth');
      return;
    }
    await supabase.auth.signOut();
    router.push('/auth');
  };

  // Calculations
  const calcNetSavings = (s) => {
    const monthlyManualHours = (s.manual_mins * s.frequency) / 60;
    return (monthlyManualHours - (s.maint_hours || 0)).toFixed(1);
  };

  const calcROI = (s) => {
    const savings = parseFloat(calcNetSavings(s));
    if (savings <= 0) return Infinity;
    return (s.dev_hours / savings).toFixed(1);
  };

  const getRecommendation = (s) => {
    if (s.is_flaky || s.is_visual) return { text: 'High Risk', class: 'bg-rose-50 text-rose-700 border-rose-100' };
    const savings = parseFloat(calcNetSavings(s));
    if (savings <= 0) return { text: 'Keep Manual', class: 'bg-slate-50 text-slate-600 border-slate-200' };
    const roi = s.dev_hours / savings;
    if (roi <= 3) return { text: 'Automate', class: 'bg-emerald-50 text-emerald-700 border-emerald-100' };
    if (roi <= 6) return { text: 'Viable', class: 'bg-indigo-50 text-indigo-700 border-indigo-100' };
    return { text: 'Low Priority', class: 'bg-slate-50 text-slate-500 border-slate-200' };
  };

  const stats = {
    netSavings: scenarios.reduce((acc, s) => acc + Math.max(0, parseFloat(calcNetSavings(s))), 0).toFixed(1),
    totalInvestment: scenarios.reduce((acc, s) => acc + (parseFloat(s.dev_hours) || 0), 0).toFixed(1),
    viableCount: scenarios.filter(s => ['Automate', 'Viable'].includes(getRecommendation(s).text)).length,
    avgBreakEven: (() => {
      const valid = scenarios.filter(s => calcROI(s) !== Infinity);
      return valid.length ? (valid.reduce((acc, s) => acc + parseFloat(calcROI(s)), 0) / valid.length).toFixed(1) : '0';
    })()
  };

  const exportPDF = async () => {
    setExporting(true);
    const dashboard = document.getElementById('dashboard-content');
    const canvas = await html2canvas(dashboard, { scale: 2, useCORS: true });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('l', 'mm', 'a4');
    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(`ROI_Report_${new Date().toISOString().split('T')[0]}.pdf`);
    setExporting(false);
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <RefreshCw className="animate-spin text-indigo-600" size={32} />
    </div>
  );

  return (
    <div className="max-w-[90rem] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 text-[10px] font-bold tracking-widest uppercase rounded">Strategy Matrix</span>
            {localStorage.getItem('demo_mode') === 'true' && (
              <span className="px-2 py-0.5 bg-amber-50 text-amber-600 text-[10px] font-bold tracking-widest uppercase rounded">Demo Mode</span>
            )}
            <span className="text-slate-300">•</span>
            <span className="text-slate-400 text-xs font-medium">{user?.email}</span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Automation ROI Dashboard</h1>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={saveAll} disabled={saving} className="btn-secondary">
            {saving ? <RefreshCw size={18} className="animate-spin" /> : <Save size={18} />}
            Save
          </button>
          <button onClick={exportPDF} disabled={exporting} className="btn-primary">
            {exporting ? <RefreshCw size={18} className="animate-spin" /> : <Download size={18} />}
            Export PDF
          </button>
          <button onClick={logout} className="p-2.5 text-slate-400 hover:text-rose-600 transition-colors">
            <LogOut size={20} />
          </button>
        </div>
      </header>

      <div id="dashboard-content">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          <StatCard title="Net Monthly Savings" value={stats.netSavings} unit="hrs/mo" icon={TrendingUp} color="text-indigo-600" />
          <StatCard title="Total Upfront Hours" value={stats.totalInvestment} unit="dev hrs" icon={Code} color="text-slate-800" />
          <StatCard title="Avg Break-Even" value={stats.avgBreakEven} unit="months" icon={Calendar} color="text-amber-600" />
          <StatCard title="Viable Targets" value={stats.viableCount} unit={`of ${scenarios.length}`} icon={Rocket} color="text-emerald-600" />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Table Area */}
          <div className="xl:col-span-2 card p-0 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
              <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <AlertCircle size={16} className="text-indigo-500" />
                Assessment Parameters
              </h2>
              <button onClick={addRow} className="text-indigo-600 hover:text-indigo-700 text-xs font-bold flex items-center gap-1">
                <Plus size={16} /> New Scenario
              </button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-slate-500 text-[10px] font-bold uppercase tracking-widest border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-4">Scenario Description</th>
                    <th className="px-3 py-4 text-center">Manual Mins</th>
                    <th className="px-3 py-4 text-center">Runs/Mo</th>
                    <th className="px-3 py-4 text-center">Dev Hrs</th>
                    <th className="px-3 py-4 text-center">Maint Hrs</th>
                    <th className="px-4 py-4 text-center">Risk Flags</th>
                    <th className="px-4 py-4 bg-indigo-50/30 text-indigo-700 text-center">Break-Even</th>
                    <th className="px-4 py-4" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  <AnimatePresence>
                    {scenarios.map((s, i) => (
                      <motion.tr 
                        key={i}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="group hover:bg-slate-50/50 transition-colors"
                      >
                        <td className="px-4 py-2">
                          <input 
                            type="text" 
                            value={s.name} 
                            onChange={(e) => updateRow(i, 'name', e.target.value)}
                            placeholder="e.g. User Auth Flow"
                            className="w-full bg-transparent border-transparent hover:border-slate-200 focus:border-indigo-500 rounded-lg px-2 py-1.5 text-xs font-medium focus:outline-none transition-all"
                          />
                        </td>
                        <td className="px-2 py-2 w-20">
                          <input 
                            type="number" 
                            value={s.manual_mins} 
                            onChange={(e) => updateRow(i, 'manual_mins', parseFloat(e.target.value) || 0)}
                            className="w-full text-center bg-transparent border-transparent hover:border-slate-200 focus:border-indigo-500 rounded-lg py-1.5 text-xs font-semibold focus:outline-none"
                          />
                        </td>
                        <td className="px-2 py-2 w-20">
                          <input 
                            type="number" 
                            value={s.frequency} 
                            onChange={(e) => updateRow(i, 'frequency', parseFloat(e.target.value) || 0)}
                            className="w-full text-center bg-transparent border-transparent hover:border-slate-200 focus:border-indigo-500 rounded-lg py-1.5 text-xs font-semibold focus:outline-none"
                          />
                        </td>
                        <td className="px-2 py-2 w-20">
                          <input 
                            type="number" 
                            value={s.dev_hours} 
                            onChange={(e) => updateRow(i, 'dev_hours', parseFloat(e.target.value) || 0)}
                            className="w-full text-center bg-transparent border-transparent hover:border-slate-200 focus:border-indigo-500 rounded-lg py-1.5 text-xs font-semibold focus:outline-none"
                          />
                        </td>
                        <td className="px-2 py-2 w-20">
                          <input 
                            type="number" 
                            value={s.maint_hours} 
                            onChange={(e) => updateRow(i, 'maint_hours', parseFloat(e.target.value) || 0)}
                            className="w-full text-center bg-transparent border-transparent hover:border-slate-200 focus:border-indigo-500 rounded-lg py-1.5 text-xs font-semibold focus:outline-none"
                          />
                        </td>
                        <td className="px-4 py-2">
                          <div className="flex gap-1 justify-center">
                            <button 
                              onClick={() => updateRow(i, 'is_flaky', !s.is_flaky)}
                              className={`p-1.5 rounded-lg border transition-all ${s.is_flaky ? 'bg-rose-50 border-rose-200 text-rose-600' : 'bg-white border-slate-100 text-slate-300'}`}
                              title="Flaky/Unstable UI"
                            >
                              <Bug size={14} />
                            </button>
                            <button 
                              onClick={() => updateRow(i, 'is_visual', !s.is_visual)}
                              className={`p-1.5 rounded-lg border transition-all ${s.is_visual ? 'bg-amber-50 border-amber-200 text-amber-600' : 'bg-white border-slate-100 text-slate-300'}`}
                              title="Visual/Subjective Check"
                            >
                              <Eye size={14} />
                            </button>
                          </div>
                        </td>
                        <td className="px-4 py-2 bg-indigo-50/20 text-center">
                          <div className="flex flex-col items-center">
                            <span className={`font-bold ${calcROI(s) === Infinity ? 'text-rose-500' : 'text-slate-900'}`}>
                              {calcROI(s) === Infinity ? '∞' : `${calcROI(s)}m`}
                            </span>
                            <span className={`text-[9px] px-1.5 py-0.5 rounded uppercase font-bold border mt-1 ${getRecommendation(s).class}`}>
                              {getRecommendation(s).text}
                            </span>
                          </div>
                        </td>
                        <td className="px-3 py-2">
                          <button 
                            onClick={() => removeRow(i)} 
                            className="p-1.5 text-slate-300 hover:text-rose-600 transition-colors opacity-0 group-hover:opacity-100"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          </div>

          {/* Charts Area */}
          <div className="xl:col-span-1 space-y-6">
            <div className="card h-[400px] flex flex-col">
              <div className="flex items-center gap-2 mb-6">
                <TrendingUp size={18} className="text-indigo-600" />
                <h3 className="text-sm font-bold text-slate-800">Resource Vectors</h3>
              </div>
              <div className="grow relative min-h-0">
                <ROIChart scenarios={scenarios} />
              </div>
            </div>

            <div className="card bg-indigo-900 text-white border-0 shadow-lg shadow-indigo-200">
              <h4 className="text-xs font-bold text-indigo-300 uppercase tracking-widest mb-4">Strategic Insight</h4>
              <p className="text-sm leading-relaxed text-indigo-100">
                Based on your current matrix, you have <span className="font-bold text-white underline decoration-indigo-400 decoration-2 underline-offset-4">{stats.viableCount} high-impact targets</span>. 
                Focusing on these could reclaim <span className="font-bold text-white">{stats.netSavings} engineering hours</span> per month.
              </p>
              <div className="mt-6 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-indigo-800 flex items-center justify-center">
                  <CheckCircle2 size={20} className="text-emerald-400" />
                </div>
                <div className="text-xs">
                  <p className="font-bold">Next Milestone</p>
                  <p className="text-indigo-300">Achieve break-even on {scenarios[0]?.name || 'Top Scenario'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, unit, icon: Icon, color }) {
  return (
    <div className="card relative overflow-hidden group">
      <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
        <Icon size={64} />
      </div>
      <p className="text-[10px] font-bold tracking-widest text-slate-400 uppercase mb-2">{title}</p>
      <div className="flex items-baseline gap-1.5">
        <span className={`text-3xl font-extrabold tracking-tight ${color}`}>{value}</span>
        <span className="text-xs text-slate-500 font-medium">{unit}</span>
      </div>
    </div>
  );
}