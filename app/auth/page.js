'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { ArrowRight, Loader2, Zap, TrendingUp, ShieldCheck } from 'lucide-react';

export default function AuthPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState(null);
  const router = useRouter();

  const handleDemoMode = () => {
    localStorage.setItem('demo_mode', 'true');
    localStorage.setItem('user_id', 'demo-user-' + Date.now());
    router.push('/');
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error } = isSignUp
      ? await supabase.auth.signUp({ email, password })
      : await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      localStorage.setItem('demo_mode', 'false');
      router.push('/');
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* Left panel — branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-indigo-900 via-indigo-800 to-purple-900 flex-col justify-between p-12 text-white">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
            <TrendingUp size={18} className="text-white" />
          </div>
          <span className="font-bold text-sm tracking-wide">ROI Intelligence</span>
        </div>

        <div>
          <h2 className="text-4xl font-extrabold leading-tight mb-4">
            Stop guessing.<br />Start automating<br />smarter.
          </h2>
          <p className="text-indigo-300 text-sm leading-relaxed max-w-xs">
            Calculate break-even timelines, flag high-risk scenarios, and justify your automation investment with data.
          </p>

          <div className="mt-10 space-y-4">
            {[
              { icon: TrendingUp, label: 'Break-even analysis per scenario' },
              { icon: ShieldCheck, label: 'Risk flagging for flaky & visual tests' },
              { icon: Zap, label: 'Live ROI calculations as you type' },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-3 text-sm text-indigo-200">
                <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
                  <Icon size={14} className="text-indigo-300" />
                </div>
                {label}
              </div>
            ))}
          </div>
        </div>

        <p className="text-indigo-500 text-xs">Test Automation ROI Platform</p>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
              <TrendingUp size={16} className="text-white" />
            </div>
            <span className="font-bold text-slate-800">ROI Intelligence</span>
          </div>

          <h1 className="text-2xl font-extrabold text-slate-900 mb-1">
            {isSignUp ? 'Create your account' : 'Welcome back'}
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
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field"
                placeholder="name@company.com"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field"
                placeholder="••••••••"
                required
              />
            </div>

            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-600 text-xs rounded-xl">
                {error}
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full py-3">
              {loading
                ? <Loader2 className="animate-spin" size={17} />
                : <>{isSignUp ? 'Create Account' : 'Sign In'} <ArrowRight size={17} /></>}
            </button>
          </form>

          <button
            onClick={() => { setIsSignUp(!isSignUp); setError(null); }}
            className="w-full mt-4 text-sm text-indigo-600 font-semibold hover:text-indigo-700 py-1"
          >
            {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
          </button>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center">
              <span className="px-3 bg-slate-50 text-slate-400 text-xs">or</span>
            </div>
          </div>

          <button
            onClick={handleDemoMode}
            className="w-full py-3 px-4 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl font-semibold text-amber-700 hover:from-amber-100 hover:to-orange-100 transition-all flex items-center justify-center gap-2 text-sm"
          >
            <Zap size={16} />
            Try Demo Mode — no account needed
          </button>
          <p className="text-xs text-slate-400 text-center mt-2">
            Data stored locally in your browser only.
          </p>
        </div>
      </div>
    </div>
  );
}
