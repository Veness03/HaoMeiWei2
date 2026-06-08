import React, { useEffect, useState } from 'react';
import { supabase } from '@/src/lib/supabase';
import { Users, Plus, X, ShieldAlert, Check, Ban } from 'lucide-react';
import toast from 'react-hot-toast';
import { useLanguage } from '@/src/contexts/LanguageContext';
import { formatDate } from '@/src/lib/dateUtils';

interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: string;
  is_active: boolean;
  created_at: string;
}

export default function HRManagement() {
  const { t, language } = useLanguage();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    full_name: '',
    role: 'staff'
  });

  useEffect(() => {
    fetchProfiles();
  }, []);

  const fetchProfiles = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProfiles(data || []);
    } catch (error: any) {
      console.error('Error fetching profiles:', error);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    try {
      setSaving(true);
      
      const { data: { session } } = await supabase.auth.getSession();
      
      const res = await fetch('/api/create-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify(formData)
      });
      
      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Server error: API returned non-JSON response');
      }
      
      const result = await res.json();
      
      if (!res.ok) {
        throw new Error(result.error || t('hr.failCreate'));
      }

      toast.success(t('hr.successCreate'));
      setIsModalOpen(false);
      setFormData({ email: '', password: '', full_name: '', role: 'staff' });
      fetchProfiles();
    } catch (error: any) {
      console.error('Error creating user:', error);
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateRole = async (id: string, newRole: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const res = await fetch(`/api/update-user`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({ id, role: newRole })
      });
      
      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Server error: API returned non-JSON response');
      }

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || t('hr.failUpdate'));
      
      toast.success(t('hr.successUpdate'));
      fetchProfiles();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const res = await fetch(`/api/update-user`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({ id, is_active: !currentStatus })
      });
      
      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Server error: API returned non-JSON response');
      }

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || t('hr.failUpdate'));
      
      toast.success(t('hr.successUpdate'));
      fetchProfiles();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-serif font-bold text-stone-200">{t('hr.title')}</h1>
          <p className="text-xs font-medium uppercase tracking-widest text-stone-500">{t('hr.subtitle')}</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-amber-600 text-stone-950 font-bold px-4 py-2 rounded-xl hover:bg-amber-500 transition-colors flex items-center gap-2 text-sm uppercase tracking-widest"
        >
          <Plus size={16} />
          {t('hr.createUser')}
        </button>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#0f0f0f] border-b border-stone-800 text-stone-400">
              <tr>
                <th className="p-4 font-semibold">{t('hr.fullName')}</th>
                <th className="p-4 font-semibold">{t('hr.email')}</th>
                <th className="p-4 font-semibold">{t('hr.role')}</th>
                <th className="p-4 font-semibold">{t('hr.status')}</th>
                <th className="p-4 font-semibold">{t('hr.created')}</th>
                <th className="p-4 font-semibold text-right">{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-800 bg-[#161616]">
              {loading ? (
                <tr><td colSpan={6} className="p-8 text-center text-stone-500">{t('common.loading')}</td></tr>
              ) : profiles.length === 0 ? (
                <tr><td colSpan={6} className="p-8 text-center text-stone-500">No users found.</td></tr>
              ) : (
                profiles.map(p => (
                  <tr key={p.id} className="hover:bg-stone-800/20 transition-colors">
                    <td className="p-4 font-medium text-stone-200">{p.full_name}</td>
                    <td className="p-4 text-stone-400">{p.email}</td>
                    <td className="p-4">
                      <select 
                        value={p.role} 
                        onChange={(e) => handleUpdateRole(p.id, e.target.value)}
                        className="bg-stone-900 border border-stone-700 text-stone-300 text-xs rounded px-2 py-1 outline-none focus:border-amber-500"
                      >
                        <option value="admin">{t('hr.admin')}</option>
                        <option value="owner">Owner</option>
                        <option value="cashier">{t('hr.cashier')}</option>
                        <option value="staff">{t('hr.staff')}</option>
                      </select>
                    </td>
                    <td className="p-4">
                      {p.is_active || p.is_active === undefined ? (
                        <span className="inline-flex items-center gap-1 text-emerald-500 text-xs font-bold uppercase tracking-widest bg-emerald-500/10 px-2 py-1 rounded">
                          <Check size={12} /> {t('hr.active')}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-rose-500 text-xs font-bold uppercase tracking-widest bg-rose-500/10 px-2 py-1 rounded">
                          <Ban size={12} /> {t('hr.disabled')}
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-stone-500 text-xs">
                      {formatDate(p.created_at, language)}
                    </td>
                    <td className="p-4 text-right">
                      <button 
                        onClick={() => handleToggleActive(p.id, p.is_active !== false)}
                        className={`text-xs font-bold uppercase tracking-widest hover:underline ${p.is_active !== false ? 'text-rose-500' : 'text-emerald-500'}`}
                      >
                        {p.is_active !== false ? t('hr.deactivate') : t('hr.activate')}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#161616] border border-stone-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-stone-800 flex justify-between items-center bg-stone-900/50">
              <h2 className="text-lg font-serif font-bold text-stone-200">{t('hr.createUser')}</h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-stone-400 hover:text-stone-200"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCreateUser} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold tracking-widest uppercase text-stone-400 mb-1">{t('hr.email')}</label>
                <input 
                  required
                  type="email" 
                  value={formData.email}
                  onChange={e => setFormData({...formData, email: e.target.value})}
                  className="w-full bg-[#111] border border-stone-800 rounded-lg px-4 py-2.5 text-stone-200 focus:outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold tracking-widest uppercase text-stone-400 mb-1">{t('hr.password')}</label>
                <input 
                  required
                  type="password" 
                  minLength={6}
                  value={formData.password}
                  onChange={e => setFormData({...formData, password: e.target.value})}
                  className="w-full bg-[#111] border border-stone-800 rounded-lg px-4 py-2.5 text-stone-200 focus:outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold tracking-widest uppercase text-stone-400 mb-1">{t('hr.fullName')}</label>
                <input 
                  required
                  type="text" 
                  value={formData.full_name}
                  onChange={e => setFormData({...formData, full_name: e.target.value})}
                  className="w-full bg-[#111] border border-stone-800 rounded-lg px-4 py-2.5 text-stone-200 focus:outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold tracking-widest uppercase text-stone-400 mb-1">{t('hr.role')}</label>
                <select 
                  value={formData.role}
                  onChange={e => setFormData({...formData, role: e.target.value})}
                  className="w-full bg-[#111] border border-stone-800 rounded-lg px-4 py-2.5 text-stone-200 focus:outline-none focus:border-amber-500"
                >
                  <option value="staff">{t('hr.staff')}</option>
                  <option value="cashier">{t('hr.cashier')}</option>
                  <option value="admin">{t('hr.admin')}</option>
                </select>
              </div>
              
              <div className="pt-4 flex gap-3">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-2.5 border border-stone-700 text-stone-400 rounded-xl font-bold uppercase tracking-widest text-[10px] hover:bg-stone-800 transition-colors"
                >
                  {t('common.cancel')}
                </button>
                <button 
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-amber-600 text-stone-950 px-4 py-2.5 rounded-xl font-bold uppercase tracking-widest text-[10px] hover:bg-amber-500 transition-colors disabled:opacity-50"
                >
                  {saving ? t('common.loading') : t('hr.createUser')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
