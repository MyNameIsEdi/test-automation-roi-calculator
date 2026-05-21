'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { LogIn, UserPlus, ArrowRight, Loader2, Zap } from 'lucide-react';
import Link from 'next/link';

export default function AuthPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState(null);
  const router = useRouter();

  const handleDemoMode = () => {
    // Set demo mode flag in localStorage
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
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-indigo-600 text-white mb-4">
            <LogIn size={24} />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">ROI Intelligence</h1>
          <p className="text-slate-500 text-sm mt-2">Manage your test automation strategy</p>
        </div>

        <div className="card shadow-xl shadow-slate-200/50">
          <form onSubmit={handleAuth} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Email Address</label>
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
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Password</label>
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
              <div className="p-3 bg-rose-50 border border-rose-100 text-rose-600 text-xs rounded-lg">
                {error}
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full py-3 mt-2">
              {loading ? <Loader2 className="animate-spin" size={18} /> : (isSignUp ? 'Create Account' : 'Sign In')}
              {!loading && <ArrowRight size={18} />}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-100 space-y-4">
            <button 
              onClick={() => setIsSignUp(!isSignUp)}
              className="w-full text-sm text-indigo-600 font-semibold hover:text-indigo-700"
            >
              {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
            </button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200"></div>
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-2 bg-white text-slate-500">or</span>
              </div>
            </div>

            <button 
              type="button"
              onClick={handleDemoMode}
              className="w-full py-2 px-4 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-lg font-semibold text-amber-700 hover:from-amber-100 hover:to-orange-100 transition flex items-center justify-center gap-2"
            >
              <Zap size={18} />
              Try Demo Mode
            </button>
            <p className="text-xs text-slate-500 text-center">Demo mode uses local storage - your data won't persist</p>
          </div>
        </div>
      </div>
    </div>
  );
}