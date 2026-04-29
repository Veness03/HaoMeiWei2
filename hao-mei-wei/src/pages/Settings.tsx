import React from 'react';
import { Database, ShieldAlert, BookOpen, Bug } from 'lucide-react';
import { useAuth } from '@/src/contexts/AuthContext';
import { useLanguage } from '@/src/contexts/LanguageContext';
import { supabase } from '@/src/lib/supabase';

export default function Settings() {
  const { profile } = useAuth();
  const { t } = useLanguage();

  const handleTestConnection = async () => {
    console.log("=== SUPABASE DEBUG INFO ===");
    console.log("Supabase URL:", import.meta.env.VITE_SUPABASE_URL || "MISSING");
    console.log("Supabase Key defined?", !!import.meta.env.VITE_SUPABASE_ANON_KEY);
    
    try {
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        console.error("Supabase connection error:", error.message);
        alert(`Connection Error: ${error.message}`);
      } else {
        console.log("Supabase session data:", data);
        alert("Connection successful! Check console for details.");
      }
    } catch (err: any) {
      console.error("Fetch failed:", err);
      alert(`Fetch Failed: ${err.message}`);
    }
    console.log("===========================");
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-serif font-bold text-stone-200">{t('settings.title')}</h1>
          <p className="text-xs font-medium uppercase tracking-widest text-stone-500">{t('settings.subtitle')}</p>
        </div>
        <button 
          onClick={handleTestConnection}
          className="bg-stone-800 hover:bg-stone-700 text-stone-300 font-bold px-4 py-2 rounded-xl transition-colors flex items-center gap-2 border border-stone-700 uppercase tracking-widest text-xs"
        >
          <Bug size={16} />
          Debug Connection
        </button>
      </div>

      <div className="glass-card p-6 border-l-4 border-amber-500">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-stone-400 flex items-center gap-2 mb-4">
          <Database size={16} className="text-amber-500" />
          {t('settings.dbSetup')}
        </h2>
        <p className="text-stone-400 mb-4 text-sm leading-relaxed">
          {t('settings.dbDesc1')} <strong className="bg-[#111] px-1.5 py-0.5 border border-stone-800 rounded font-mono text-stone-300">/supabase/schema.sql</strong>.
        </p>
        <ol className="list-decimal list-inside space-y-2 text-sm text-stone-400">
          <li>{t('settings.dbStep1')}</li>
          <li>{t('settings.dbStep2')}</li>
          <li>{t('settings.dbStep3')} <code className="bg-[#111] px-1 border border-stone-800 rounded text-amber-500 font-mono">schema.sql</code> {t('settings.dbStep3_1')}</li>
          <li>{t('settings.dbStep4')}</li>
          <li>{t('settings.dbStep5')} <code className="bg-[#111] px-1 border border-stone-800 rounded text-amber-500 font-mono">'admin'</code> {t('settings.dbStep5_1')} <code className="bg-[#111] px-1 border border-stone-800 rounded text-amber-500 font-mono">'owner'</code> {t('settings.dbStep5_2')}</li>
        </ol>
      </div>

      <div className="glass-card p-6">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-stone-400 flex items-center gap-2 mb-4">
          <ShieldAlert size={16} className="text-rose-500" />
          {t('settings.roles')}
        </h2>
        <div className="space-y-4 text-sm text-stone-400 bg-stone-900/50 border border-stone-800 p-4 rounded-xl">
           <p><strong className="text-stone-200">{t('settings.roleAdmin')}</strong> {t('settings.roleAdminDesc')}</p>
           <p><strong className="text-stone-200">{t('settings.roleCashier')}</strong> {t('settings.roleCashierDesc')}</p>
           <p><strong className="text-stone-200">{t('settings.roleStaff')}</strong> {t('settings.roleStaffDesc')}</p>
        </div>
      </div>
      
      <div className="glass-card p-6">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-stone-400 flex items-center gap-2 mb-4">
          <BookOpen size={16} className="text-emerald-500" />
          {t('settings.profile')}
        </h2>
        <div className="text-sm text-stone-400 space-y-3">
            <p><strong className="text-stone-200">{t('settings.email')}</strong> {profile?.email || 'N/A'}</p>
            <p><strong className="text-stone-200">{t('settings.role')}</strong> <span className="uppercase text-[10px] tracking-widest bg-stone-800 text-stone-300 px-2 py-1 rounded ml-2 font-bold">{profile?.role || 'N/A'}</span></p>
        </div>
      </div>
    </div>
  );
}
