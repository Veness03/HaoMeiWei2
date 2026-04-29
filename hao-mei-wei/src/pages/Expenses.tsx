import React, { useEffect, useState } from 'react';
import { supabase } from '@/src/lib/supabase';
import { format } from 'date-fns';
import { Plus, TrendingDown, Calendar, Search, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { useLanguage } from '@/src/contexts/LanguageContext';

interface Expense {
  id: string;
  title: string;
  category: string;
  amount: number;
  expense_date: string;
  notes: string;
}

export default function Expenses() {
  const { t } = useLanguage();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [monthFilter, setMonthFilter] = useState(format(new Date(), 'yyyy-MM'));

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    category: 'Utilities',
    amount: '',
    expense_date: format(new Date(), 'yyyy-MM-dd'),
    notes: ''
  });

  useEffect(() => {
    fetchExpenses();
  }, [monthFilter]);

  async function fetchExpenses() {
    setLoading(true);
    try {
      const startDate = `${monthFilter}-01`;
      
      const year = parseInt(monthFilter.split('-')[0]);
      const month = parseInt(monthFilter.split('-')[1]);
      const lastDay = new Date(year, month, 0).getDate();
      const endDate = `${monthFilter}-${lastDay}`;

      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .gte('expense_date', startDate)
        .lte('expense_date', endDate)
        .order('expense_date', { ascending: false });
      
      if (error) throw error;
      setExpenses(data || []);
    } catch (error: any) {
      console.error('Error fetching expenses:', error);
      toast.error('Failed to fetch expenses');
    } finally {
      setLoading(false);
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Expense Add form submitted', formData);
    try {
      setSaving(true);
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        toast.error('You must be logged in');
        return;
      }

      const { error } = await supabase.from('expenses').insert([{
        title: formData.title,
        category: formData.category,
        amount: parseFloat(formData.amount),
        expense_date: formData.expense_date,
        notes: formData.notes
      }]);

      if (error) throw error;
      
      toast.success(t('expenses.successAdd'));
      setFormData({ 
        title: '', 
        category: 'Utilities', 
        amount: '', 
        expense_date: format(new Date(), 'yyyy-MM-dd'), 
        notes: '' 
      });
      setIsModalOpen(false);
      fetchExpenses();
    } catch (error: any) {
      console.error('Error saving expense:', error);
      toast.error(error.message || t('expenses.failAdd'));
    } finally {
      setSaving(false);
    }
  };

  const totalExpenses = expenses.reduce((sum, exp) => sum + Number(exp.amount), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-stone-200">{t('expenses.title')}</h1>
          <p className="text-xs font-medium uppercase tracking-widest text-stone-500">{t('expenses.subtitle')}</p>
        </div>
        <div className="flex items-center gap-3">
          <input 
            type="month"
            value={monthFilter}
            onChange={(e) => setMonthFilter(e.target.value)}
            className="px-4 py-2 border border-stone-800 rounded-lg outline-none focus:ring-2 focus:ring-amber-500 bg-[#111] text-stone-200"
          />
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-amber-600 text-stone-950 px-4 py-2 rounded-xl font-bold hover:bg-amber-500 flex items-center gap-2"
          >
            <Plus size={20} />
            <span className="hidden sm:inline uppercase text-[10px] tracking-widest">{t('expenses.addExpense')}</span>
          </button>
        </div>
      </div>

      <div className="glass-card p-6 border-l-4 border-rose-500">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-rose-950/40 text-rose-500 border border-rose-900/50 rounded-xl flex items-center justify-center">
            <TrendingDown size={24} />
          </div>
          <div>
            <p className="text-xs font-medium text-stone-500 uppercase tracking-widest">{t('expenses.totalExpenses')} {format(new Date(monthFilter + '-01'), 'MMMM yyyy')}</p>
            <p className="text-3xl font-serif text-stone-100">RM {totalExpenses.toFixed(2)}</p>
          </div>
        </div>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#111] border-b border-stone-800 text-stone-500 text-[10px] uppercase font-bold tracking-widest">
                <th className="p-4">{t('expenses.date')}</th>
                <th className="p-4">{t('expenses.description')}</th>
                <th className="p-4">{t('expenses.category')}</th>
                <th className="p-4 text-right">{t('expenses.amount')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-800 bg-[#161616]">
              {loading ? (
                <tr><td colSpan={4} className="p-8 text-center text-stone-500">{t('common.loading')}</td></tr>
              ) : expenses.length === 0 ? (
                <tr><td colSpan={4} className="p-12 text-center text-stone-500">{t('expenses.noExpenses')}</td></tr>
              ) : (
                expenses.map(expense => (
                  <tr key={expense.id} className="hover:bg-stone-800/30 transition-colors">
                    <td className="p-4 text-stone-400">
                      {format(new Date(expense.expense_date), 'dd MMM yyyy')}
                    </td>
                    <td className="p-4">
                      <p className="font-medium text-stone-200">{expense.title}</p>
                      {expense.notes && <p className="text-xs text-stone-500 mt-1 truncate max-w-xs">{expense.notes}</p>}
                    </td>
                    <td className="p-4">
                      <span className="bg-stone-800 text-stone-300 px-2 py-1 border border-stone-700 rounded text-xs font-medium uppercase tracking-wider">
                        {expense.category}
                      </span>
                    </td>
                    <td className="p-4 text-right font-bold text-stone-200">
                      {Number(expense.amount).toFixed(2)}
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
              <h2 className="text-lg font-serif font-bold text-stone-200">{t('expenses.addTitle')}</h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-stone-400 hover:text-stone-200"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold tracking-widest uppercase text-stone-400 mb-1">{t('expenses.description')}</label>
                <input 
                  required
                  type="text" 
                  value={formData.title}
                  onChange={e => setFormData({...formData, title: e.target.value})}
                  className="w-full bg-[#111] border border-stone-800 rounded-lg px-4 py-2.5 text-stone-200 focus:outline-none focus:border-amber-500"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold tracking-widest uppercase text-stone-400 mb-1">{t('expenses.amount')}</label>
                  <input 
                    required
                    type="number" 
                    step="0.01"
                    min="0"
                    value={formData.amount}
                    onChange={e => setFormData({...formData, amount: e.target.value})}
                    className="w-full bg-[#111] border border-stone-800 rounded-lg px-4 py-2.5 text-stone-200 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold tracking-widest uppercase text-stone-400 mb-1">{t('expenses.date')}</label>
                  <input 
                    required
                    type="date" 
                    value={formData.expense_date}
                    onChange={e => setFormData({...formData, expense_date: e.target.value})}
                    className="w-full bg-[#111] border border-stone-800 rounded-lg px-4 py-2.5 text-stone-200 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold tracking-widest uppercase text-stone-400 mb-1">{t('expenses.category')}</label>
                <select 
                  value={formData.category}
                  onChange={e => setFormData({...formData, category: e.target.value})}
                  className="w-full bg-[#111] border border-stone-800 rounded-lg px-4 py-2.5 text-stone-200 focus:outline-none focus:border-amber-500"
                >
                  <option value="Utilities">{t('expenses.catUtilities')}</option>
                  <option value="Rent">{t('expenses.catRent')}</option>
                  <option value="Maintenance">{t('expenses.catMaintenance')}</option>
                  <option value="Salaries">{t('expenses.catSalary')}</option>
                  <option value="Marketing">{t('expenses.catMarketing')}</option>
                  <option value="Other">{t('expenses.catOther')}</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold tracking-widest uppercase text-stone-400 mb-1">Notes (Optional)</label>
                <textarea 
                  rows={3}
                  value={formData.notes}
                  onChange={e => setFormData({...formData, notes: e.target.value})}
                  className="w-full bg-[#111] border border-stone-800 rounded-lg px-4 py-2.5 text-stone-200 focus:outline-none focus:border-amber-500"
                ></textarea>
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
                  {saving ? t('expenses.saving') : t('expenses.saveExpense')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
