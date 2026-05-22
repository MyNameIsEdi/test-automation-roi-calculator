'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { ArrowRight, Loader2, Zap, TrendingUp, ShieldCheck, BarChart3 } from 'lucide-react';

const FEATURES = [
  { icon: BarChart3,   label: 'Live break-even analysis per scenario' },
  { icon: ShieldCheck, label: 'Risk flagging for flaky & visual tests'  },
  { icon: TrendingUp,  label: 'Real-time ROI calculations as you type'  },
  { icon: Zap,         label: 'CSV & PDF export in one click'           },
];

export default function AuthPage() {
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [loading,  setLoading]  = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [error,    setError]    = useState(null);
  const router = useRouter();

  const handleDemoMode = () => {
    localStorage.setItem('demo_mode', 'true');
    localStorage.setItem('user_id', 'demo-user-' + Date.now());
    router.push('/');
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true); setError(null);
    const { error } = isSignUp
      ? await supabase.auth.signUp({ email, password })
      : await supabase.auth.signInWithPassword({ email, password });
    if (error) { setError(error.message); setLoading(false); }
    else { localStorage.setItem('demo_mode', 'false'); router.push('/'); }
  };

  return (
    <div className="min-h-screen flex bg-slate-50" style={{ backgroundImage: 'none' }}>

      {/* Left — branding panel */}
      <div className="hidden lg:flex lg:w-[46%] relative overflow-hidden flex-col justify-between p-12"
           style={{ background: 'linear-gradient(145deg, #1e1b4b 0%, #312e81 40%, #4338ca 70%, #6d28d9 100%)' }}>

        {/* Decorative circles */}
        <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-white/5 -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full bg-white/5 translate-y-1/2 -translate-x-1/2" />
        <div className="absolute top-1/2 left-1/2 w-96 h-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-br from-purple-500/10 to-transparent blur-3xl" />

        {/* Logo */}
        <div className="relative flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center border border-white/20">
            <TrendingUp size={20} className="text-white" />
          </div>
          <div>
            <p className="font-extrabold text-white text-base leading-none">ROI Intelligence</p>
            <p className="text-indigo-300 text-xs mt-0.5">Test Automation Platform</p>
          </div>
        </div>

        {/* Hero text */}
        <div className="relative">
          <p className="text-indigo-300 text-xs font-bold uppercase tracking-widest mb-4">Strategy Matrix</p>
          <h2 className="text-5xl font-extrabold text-white leading-[1.1] mb-5">
            Stop guessing.<br />Automate<br />smarter.
          </h2>
          <p className="text-indigo-200 text-sm leading-relaxed max-w-xs mb-10">
            Calculate break-even timelines, flag high-risk scenarios, and build the case for your automation investment.
          </p>

          <div className="space-y-3">
            {FEATURES.map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center border border-white/10 shrink-0">
                  <Icon size={14} className="text-indigo-300" />
                </div>
                <span className="text-sm text-indigo-200">{label}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="relative text-indigo-500 text-xs">© {new Date().getFullYear()} ROI Intelligence</p>
      </div>

      {/* Right — form panel */}
      <div className="flex-1 flex items-center justify-center p-6 bg-white">
        <div className="w-full max-w-sm">

          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2.5 mb-8">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <TrendingUp size={17} className="text-white" />
            </div>
            <span className="font-extrabold text-slate-900 text-base">ROI Intelligence</span>
          </div>

          <h1 className="text-2xl font-extrabold text-slate-900 mb-1">
            {isSignUp ? 'Create account' : 'Welcome back'}
          </h1>
          <p className="text-slate-400 text-sm mb-8">
            {isSignUp ? 'Start optimizing your automation strategy.' : 'Sign in to your dashboard.'}
          </p>

          <form onSubmit={handleAuth} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Email
              </label>
              <input
                type="email" value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field" placeholder="name@company.com" required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <input
                type="password" value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field" placeholder="••••••••" required
              />
            </div>

            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-600 text-xs rounded-xl leading-relaxed">
                {error}
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full py-3 mt-1">
              {loading
                ? <Loader2 className="animate-spin" size={16} />
                : <>{isSignUp ? 'Create Account' : 'Sign In'} <ArrowRight size={16} /></>}
            </button>
          </form>

          <button
            onClick={() => { setIsSignUp(!isSignUp); setError(null); }}
            className="w-full mt-4 py-2 text-sm text-indigo-600 font-semibold hover:text-indigo-700 transition-colors"
          >
            {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
          </button>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center">
              <span className="px-3 bg-white text-slate-400 text-xs font-medium">or continue without an account</span>
            </div>
          </div>

          <button
            onClick={handleDemoMode}
            className="w-full py-3 px-4 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2.5
                       bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 text-amber-700
                       hover:from-amber-100 hover:to-orange-100 hover:border-amber-300 hover:shadow-sm"
          >
            <div className="w-6 h-6 rounded-lg bg-amber-400/20 flex items-center justify-center">
              <Zap size={13} className="text-amber-600" />
            </div>
            Try Demo Mode — no account needed
          </button>
          <p className="text-xs text-slate-400 text-center mt-2.5">
            Demo data stays in your browser only. Nothing is synced.
          </p>
        </div>
      </div>
    </div>
  );
}
