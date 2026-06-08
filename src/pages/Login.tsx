import React, { useState, useEffect } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { UtensilsCrossed, Lock, Mail, AlertCircle, Globe } from 'lucide-react';
import { supabase } from '@/src/lib/supabase';
import { useAuth } from '@/src/contexts/AuthContext';
import { useLanguage } from '@/src/contexts/LanguageContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { session } = useAuth();
  const { t, language, setLanguage } = useLanguage();

  if (session) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      navigate('/dashboard');
    }
  };

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'zh' : 'en');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0A0A0A] p-4 text-stone-200">
      <div className="absolute top-4 right-4 w-fit">
        <button 
          onClick={toggleLanguage}
          className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-stone-900 border border-stone-800 text-stone-400 hover:text-stone-200 transition-colors text-xs font-bold uppercase tracking-widest"
        >
          <Globe size={14} />
          {language === 'en' ? '中文' : 'ENGLISH'}
        </button>
      </div>
      <div className="w-full max-w-md glass-card p-8 bg-[#161616]">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-amber-600/20 text-amber-500 border border-amber-500/50 rounded-full flex items-center justify-center mb-4">
            <UtensilsCrossed size={32} />
          </div>
          <h1 className="text-2xl font-serif font-bold text-amber-500 tracking-tight">{t('login.title')}</h1>
          <p className="text-[10px] uppercase tracking-[0.2em] text-stone-500 mt-2 text-center text-sm">
            {t('login.subtitle')}
          </p>
        </div>

        {error && (
          <div className="mb-6 bg-red-950/40 text-red-400 border border-red-900 p-4 rounded-lg flex items-start gap-3 text-sm font-medium">
            <AlertCircle size={20} className="shrink-0 pt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold tracking-widest uppercase text-stone-400 mb-1">
              {t('login.email')}
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-500">
                <Mail size={18} />
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full pl-10 pr-3 py-2.5 border border-stone-800 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all bg-[#111] text-stone-200"
                placeholder="admin@example.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold tracking-widest uppercase text-stone-400 mb-1">
              {t('login.password')}
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-500">
                <Lock size={18} />
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full pl-10 pr-3 py-2.5 border border-stone-800 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all bg-[#111] text-stone-200"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold py-3 rounded-lg transition-colors flex justify-center items-center mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-stone-950/30 border-t-stone-950 rounded-full animate-spin" />
            ) : (
              t('login.signIn')
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
